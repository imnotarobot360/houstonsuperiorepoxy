import { get } from '@vercel/blob'
import { sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { isAdminAuthed } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { estimateLeads } from '@/lib/db/schema'

/*
  Operator-only delivery route for estimate photos — the route lib/db/schema.ts
  refers to when it explains why only blob PATHNAMES are stored, never public
  URLs.

  These are photographs of the inside of customers' homes. Two rules:

  1. Requires an admin session. Checked here rather than relying on the page
     that links to it, because a route handler is directly reachable by URL.
  2. Only serves a pathname that genuinely belongs to a lead row. Without that
     check this becomes a confused-deputy: an authenticated request could pass
     any arbitrary pathname and read anything in the blob store, which is a much
     larger surface than "photos attached to leads".

  The signed URL is short-lived so a copied link stops working quickly.
*/
export async function GET(request: Request) {
  if (!(await isAdminAuthed())) {
    return new NextResponse('Not authorized', { status: 401 })
  }

  const pathname = new URL(request.url).searchParams.get('p')
  if (!pathname) return new NextResponse('Missing photo', { status: 400 })

  /*
    Confirm this pathname is actually referenced by a lead. jsonb `?` tests
    whether the array contains the string, parameterised so the value cannot
    break out of the query.
  */
  const [owner] = await db
    .select({ id: estimateLeads.id })
    .from(estimateLeads)
    .where(sql`${estimateLeads.photoPathnames} ? ${pathname}`)
    .limit(1)

  if (!owner) return new NextResponse('Unknown photo', { status: 404 })

  try {
    /*
      Streamed through this route rather than redirecting to a presigned URL.
      Slightly more work, but the photo never acquires a shareable URL at all —
      every byte is served only to a request carrying a valid admin session, and
      there is no link that keeps working once it leaves this page.
    */
    const result = await get(pathname, { access: 'private' })
    if (!result || !result.stream) return new NextResponse('Photo unavailable', { status: 404 })

    return new NextResponse(result.stream, {
      headers: {
        'Content-Type': result.blob.contentType ?? 'application/octet-stream',
        /*
          Inline so it opens in a tab instead of downloading. `private, no-store`
          keeps customer photos out of any shared or CDN cache.
        */
        'Content-Disposition': 'inline',
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error) {
    console.log('[v0] failed to read estimate photo:', error)
    return new NextResponse('Photo unavailable', { status: 502 })
  }
}
