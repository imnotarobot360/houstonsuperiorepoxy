import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { notFound } from 'next/navigation'
import {
  Byline,
  ComparisonTable,
  DefinedTerms,
  KeyTakeaways,
  QuickAnswer,
  RelatedProjects,
  SourcesAndTechnicalReferences,
} from '@/components/aeo'
import { Prose, RelatedLinks, Section } from '@/components/blocks'
import { CtaBand } from '@/components/cta-band'
import { JsonLd } from '@/components/json-ld'
import { PageHero } from '@/components/page-hero'
import { articleBySlug, articles } from '@/lib/content/resources'
import { crumbsFor, r, routes } from '@/lib/routes'
import { blogPostingNode, graph, webPageNode } from '@/lib/schema'

/* Fully static — a fixed set of hand-written guides. */
export const dynamicParams = false

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const article = articleBySlug(slug)
  if (!article) return {}

  const path = `/resources/${article.slug}/`
  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: path },
    openGraph: {
      title: article.title,
      description: article.description,
      url: path,
      type: 'article',
    },
  }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = articleBySlug(slug)
  if (!article) notFound()

  const path = `/resources/${article.slug}/`

  /* Other guides, for lateral crawl paths out of this article. */
  const others = articles
    .filter((a) => a.slug !== article.slug)
    .slice(0, 3)
    .map((a) => ({
      label: a.h1,
      href: `/resources/${a.slug}/`,
      blurb: a.kicker,
    }))

  return (
    <>
      <JsonLd
        data={graph(
          webPageNode({
            path,
            name: article.title,
            description: article.description,
          }),
          blogPostingNode({
            path,
            headline: article.h1,
            description: article.description,
            question: article.question,
            /*
              Dates come from the content source, not from this component and
              not hardcoded. Undefined here falls back to the batch defaults in
              authority.ts, so the schema always carries a parseable
              datePublished and dateModified.
            */
            published: article.published,
            reviewed: article.reviewed,
          }),
        )}
      />

      <PageHero
        h1={article.h1}
        eyebrow={article.kicker}
        intro={article.description}
        trail={[...crumbsFor('resources'), { label: routes.resources.label, href: r('resources') }]}
        current={article.h1}
        path={path}
      />

      {/*
        Byline sits directly under the H1 rather than at the foot of the page.
        Experience and review dates are only a trust signal if a reader sees
        them before deciding whether to trust the article.
      */}
      <Byline published={article.published} reviewed={article.reviewed} />

      {/*
        The opening answer. Deliberately the first content block, so the
        paragraph an answer engine is most likely to lift is also the first
        thing a human reads.
      */}
      <Section>
        <QuickAnswer question={article.question} answer={article.quickAnswer} />
        {/*
          Takeaways stay in the same Section as the quick answer: together they
          are the extractable summary of the article, and separating them with a
          section boundary would imply they belong to different arguments.
        */}
        {article.takeaways && article.takeaways.length > 0 && (
          <div className="mt-12">
            <KeyTakeaways items={article.takeaways} />
          </div>
        )}
      </Section>

      {/*
        The comparison table sits BEFORE the prose, not after.

        On a "X vs Y" article the table is the answer; the prose explains how we
        got there. A reader who only wants the verdict should not have to scroll
        past four sections of reasoning to find it.
      */}
      {article.comparison && (
        <Section bleed>
          <ComparisonTable
            caption={article.comparison.caption}
            columns={article.comparison.columns}
            rows={article.comparison.rows}
          />
        </Section>
      )}

      {/* Then the expert detail behind that answer. */}
      <Section bleed={!article.comparison}>
        <Prose sections={article.sections} />
      </Section>

      {article.terms && article.terms.length > 0 && (
        <Section>
          <DefinedTerms terms={article.terms} />
        </Section>
      )}

      {/*
        Required by the content brief: every article routes to a service page.
        Guaranteed present via `serviceLink` rather than left to `related`.
      */}
      <Section bleed>
        <div className="max-w-3xl">
          <h2 className="font-serif text-2xl tracking-tight text-foreground">
            The service this applies to
          </h2>
          <Link
            href={article.serviceLink.href}
            className="mt-6 inline-flex items-center gap-3 border border-border px-6 py-4 text-sm text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            {article.serviceLink.label}
            <ArrowUpRight size={16} aria-hidden="true" className="shrink-0 text-primary" />
          </Link>
        </div>
      </Section>

      {/* Renders the honest notice until real photographed jobs are published. */}
      <Section>
        <RelatedProjects />
      </Section>

      {article.showReferences && (
        <Section bleed>
          <SourcesAndTechnicalReferences />
        </Section>
      )}

      <CtaBand
        title="Want this applied to your own slab?"
        body="We inspect the concrete, moisture test it, and give you an itemized written quote. The visit is free."
      />

      <Section>
        <RelatedLinks heading="Related pages" links={article.related} />
      </Section>

      {others.length > 0 && (
        <Section bleed>
          <RelatedLinks heading="Other guides" links={others} />
          <p className="mt-10 text-sm text-muted-foreground">
            Back to{' '}
            <Link href={r('resources')} className="text-primary underline-offset-4 hover:underline">
              all guides
            </Link>
            .
          </p>
        </Section>
      )}
    </>
  )
}
