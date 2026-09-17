'use server'

import { put } from '@vercel/blob'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { estimateLeads } from '@/lib/db/schema'
import { PHOTO_MAX_BYTES, PHOTO_MAX_COUNT, PHOTO_TYPES } from '@/lib/leads'

/*
  Attaches floor photos to an EXISTING lead, after it has already been captured.

  The estimator asks for photos only once the lead is safely stored (Phase 6:
  "optional floor-photo upload after the basic lead has been captured"). Doing
  this as a separate action — rather than re-submitting the whole form — avoids
  tripping the dedupe guard in submitEstimate, which would treat the second
  submission as a duplicate and silently drop the photos.

  Same guarantees as the main pipeline: private blob storage (these are photos
  of a customer's home), server-side type/size validation regardless of the
  input element, and a failed upload never throws — worst case the photos just
  are not attached, the lead is untouched.
*/
export async function attachEstimatePhotos(
  leadId: number,
  formData: FormData,
): Promise<{ ok: boolean; added: number }> {
  const files = formData
    .getAll('photos')
    .filter((f): f is File => f instanceof File && f.size > 0)
    .slice(0, PHOTO_MAX_COUNT)

  if (files.length === 0) return { ok: true, added: 0 }

  const added: string[] = []
  for (const file of files) {
    if (!PHOTO_TYPES.includes(file.type) || file.size > PHOTO_MAX_BYTES) continue
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80)
    try {
      const blob = await put(`estimates/${Date.now()}-${safeName}`, file, {
        access: 'private',
        addRandomSuffix: true,
      })
      added.push(blob.pathname)
    } catch (error) {
      console.log('[v0] estimator photo append failed:', error instanceof Error ? error.message : error)
    }
  }

  if (added.length === 0) return { ok: false, added: 0 }

  try {
    const rows = await db
      .select({ photoPathnames: estimateLeads.photoPathnames })
      .from(estimateLeads)
      .where(eq(estimateLeads.id, leadId))
      .limit(1)

    if (rows.length === 0) return { ok: false, added: 0 }

    const existing = rows[0].photoPathnames ?? []
    await db
      .update(estimateLeads)
      .set({ photoPathnames: [...existing, ...added].slice(0, PHOTO_MAX_COUNT) })
      .where(eq(estimateLeads.id, leadId))

    return { ok: true, added: added.length }
  } catch (error) {
    console.log('[v0] estimator photo row update failed:', error instanceof Error ? error.message : error)
    return { ok: false, added: 0 }
  }
}
