# @nextanalytica/tag

The [nextanalytica](https://nextanalytica.app) tag for JavaScript apps. One component per framework, and the same
external script underneath every one of them:

```html
<script async src="https://t.nextanalytica.app/t.js" data-project="na_…"></script>
```

The package doesn't bundle a tracker. It adds that line once and passes your calls to it, so your CSP needs only our
host, and the numbers are the same however the tag was installed. Page views on client-side navigation
(`pushState`, `replaceState`, `popstate`) are counted by the tag itself, with no router code.

Your project key (`na_…`) is in nextanalytica, under Tracking.

```sh
npm install @nextanalytica/tag
```

## Frameworks

**Next.js**: `app/layout.tsx` (App Router) or `pages/_app.tsx` (Pages Router)

```tsx
import { Analytics } from "@nextanalytica/tag/next";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics project="na_…" />
      </body>
    </html>
  );
}
```

**React, Remix, React Router**: once at the app's root (`app/root.tsx` in Remix and React Router)

```tsx
import { Analytics } from "@nextanalytica/tag/react";

<Analytics project="na_…" />
```

**Vue**: `src/main.ts`

```ts
import { nextanalytica } from "@nextanalytica/tag/vue";

createApp(App).use(nextanalytica, { project: "na_…" }).mount("#app");
```

**Nuxt**: `nuxt.config.ts`. The line goes in every page's server-rendered `<head>`.

```ts
export default defineNuxtConfig({
  modules: ["@nextanalytica/tag/nuxt"],
  nextanalytica: { project: "na_…" },
});
```

**SvelteKit**: `src/routes/+layout.svelte`

```svelte
<script>
  import { inject } from "@nextanalytica/tag/sveltekit";
  inject({ project: "na_…" });
</script>

<slot />
```

**Astro**: the base layout's `<head>`. It renders the line itself, so static pages need no client JavaScript.

```astro
---
import Analytics from "@nextanalytica/tag/astro";
---
<head><Analytics project="na_…" /></head>
```

**Gatsby**: `gatsby-config.js`

```js
module.exports = {
  plugins: [{ resolve: "@nextanalytica/tag/gatsby", options: { project: "na_…" } }],
};
```

**Any other app**

```ts
import nextanalytica from "@nextanalytica/tag";

nextanalytica.init("na_…");
```

## Your own events, consent and people

```ts
import { track, order, consent, identify, group, setPersonProperties, reset } from "@nextanalytica/tag";

track("signup", { plan: "pro" });
order({ ref: "A-1001", value: 49, currency: "EUR" });
consent(true);          // from your cookie banner; until a yes, no cookie and no id
identify("user_42");    // your own user id after sign-in, never an email
group("company", "acme", { plan: "pro" });
reset();                // on sign-out
```

Calls made before the tag has loaded wait and go in order. On the server they do nothing.

## Events from your servers

What only your servers know (a payment confirmed, a signup approved) goes straight to nextanalytica with a server key:
in nextanalytica, Tracking, Keys, "Server key". It's shown once; keep it on your servers, never in a page.

```sh
curl -X POST https://t.nextanalytica.app/s \
  -H "Authorization: Bearer nask_…" -H "Content-Type: application/json" \
  -d '{"events":[{"type":"order","user_id":"u_42","value":49,"currency":"EUR","ref":"A-1001"}]}'
```

Each event is `order` (with `value`, `currency`, `ref`) or `custom` (with `name` and up to 10 string `props`), and
`user_id` is your own user id, the same one you pass to `identify`. Up to 50 events a request. They belong to no visit:
your agent sees them as events, and as conversions under the channel "Server".

## Content Security Policy

The tag loads its scripts from `https://t.nextanalytica.app` and sends events back to the same host, so a site with a
CSP needs that host in two directives (each falls back to `default-src` when it isn't set):

```
script-src  https://t.nextanalytica.app
connect-src https://t.nextanalytica.app
```

With `'strict-dynamic'` in `script-src`, host sources are ignored: give our `<script>` tag the page's nonce instead.
Both the header and a `<meta http-equiv="Content-Security-Policy">` count; every policy must allow it. In
nextanalytica, Tracking's Check now reads your site's policy and names the lines it is missing.

## Options

Every component and `init` take the same options:

| Option | What it does |
|---|---|
| `consent: "granted"` | Your banner already said yes: ids are kept from the first page view |
| `cookieless: true` | Count without asking for consent, and keep nothing on the device |
| `vitals: "all"` | Measure Web Vitals on every page view instead of a sample |
| `search: ["q"]` | The URL parameters that hold your site search's query |
| `api_host` | Where `t.js` is served from, if not `https://t.nextanalytica.app` |

## Read your analytics with your agent

nextanalytica is web analytics built to be read by your own AI agent over MCP. Once the tag is on your site, connect
the remote MCP server and ask Claude, Cursor or Codex what changed and what to fix.

```sh
claude mcp add --transport http nextanalytica https://mcp.nextanalytica.app/mcp
```

Then run `/mcp` in Claude Code and sign in. In the Claude app: Settings, Connectors, Add custom connector, paste
`https://mcp.nextanalytica.app/mcp`. The server is listed in the official MCP Registry as `app.nextanalytica/mcp`.

Docs for people: [nextanalytica.app/docs](https://nextanalytica.app/docs). Docs for agents:
[nextanalytica.app/llms.txt](https://nextanalytica.app/llms.txt).

## License

MIT
