"use client";
/**
 * `<Analytics project="…" />` for Next.js: in `app/layout.tsx` inside `<body>` (App Router), or in `pages/_app.tsx`
 * (Pages Router). A client component, so it can sit in a server layout; route changes are counted by the tag itself.
 */
export { Analytics, default, type AnalyticsProps } from "./react.js";
export { track, order, consent, identify, group, setPersonProperties, reset } from "./index.js";
