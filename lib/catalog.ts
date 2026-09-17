/*
  The FlakeColor mobile catalog.

  FLAKECOLOR_URL is deliberately NOT prefixed NEXT_PUBLIC_. The catalog address
  is only ever needed in two server-side places — the /app/ and /catalog/
  redirects in next.config.mjs, and the boolean below — so there is no reason to
  inline it into the client bundle.

  That has one consequence worth stating, because getting it wrong is silent:
  a CLIENT component cannot read this. Next replaces a non-public
  `process.env.*` with `undefined` in client code, so a component that checks it
  there would simply never render its link, with no error to explain why.
  components/floor-designer is a client component, so it receives this value as
  a prop from its server page. Keep it that way.
*/
export const catalogEnabled = Boolean(process.env.FLAKECOLOR_URL)
