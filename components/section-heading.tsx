export function SectionHeading({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string
  title: string
  intro?: string
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-[0.7rem] font-medium uppercase tracking-[0.28em] text-primary">
        {eyebrow}
      </p>
      <h2 className="mt-5 font-serif text-3xl leading-tight tracking-tight text-balance sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {intro && <p className="mt-6 leading-relaxed text-muted-foreground text-pretty">{intro}</p>}
    </div>
  )
}
