/**
 * `@nextanalytica/tag`: puts the nextanalytica tag on the page and passes calls to it (DATA-ARCHITECTURE §7.16, A30).
 *
 * It doesn't bundle a tracker. `init` adds the same external script every install ends with,
 * `<script async src="https://t.nextanalytica.app/t.js" data-project="…">`, once per page, so the site's CSP needs only
 * our host and the numbers match whichever way the tag was installed. The script counts page views on history changes
 * itself, so client-side navigation needs no router code.
 *
 * Calls made before the script has loaded wait on `window.nextanalytica` and go to it when it arrives. On the server
 * (no `document`) everything here does nothing.
 */

type Props = Record<string, unknown>;

/** The script's own global (packages/tracker `browser.ts`): what a site's banner and its own code call. */
export interface Tracker {
  consent(on: boolean): void;
  track(name: string, props?: Props, o?: { value?: number; currency?: string }): void;
  order(o: { ref?: string; value?: number; currency?: string }): void;
  identify(userId: string, props?: Props): void;
  group(type: string, key: string, props?: Props): void;
  setPersonProperties(props: Props): void;
  reset(): void;
}

export interface Options {
  /** Where `t.js` is served from. Default `https://t.nextanalytica.app`. */
  api_host?: string;
  /** The visitor already agreed (your banner said yes before the tag loads): ids are kept from the first page view. */
  consent?: "granted";
  /** Counting without consent, keeping nothing across visits (no cookie, no id), is the default; `false` waits for consent instead. */
  cookieless?: boolean;
  /** Measure Web Vitals on every page view instead of a sample. */
  vitals?: "all";
  /** The URL parameters that hold your site search's query, for example ["q", "s"]. */
  search?: string[];
}

declare global { interface Window { nextanalytica?: Tracker & { __q?: [keyof Tracker, unknown[]][] } } }

export const API_HOST = "https://t.nextanalytica.app";
const METHODS = ["consent", "track", "order", "identify", "group", "setPersonProperties", "reset"] as const;

/** The project key as Tracking shows it: `na_` and letters and digits. */
const KEY = /^[A-Za-z0-9_-]{3,100}$/;

const browser = () => typeof window !== "undefined" && typeof document !== "undefined";

/** The host `t.js` comes from: an https URL (http only on localhost), without a path. */
export function hostOf(apiHost: string | undefined): string {
  if (!apiHost) return API_HOST;
  const u = new URL(apiHost);
  const local = u.hostname === "localhost" || u.hostname === "127.0.0.1";
  if (u.protocol !== "https:" && !(local && u.protocol === "http:")) throw new Error(`nextanalytica: api_host must be https, got ${apiHost}`);
  return u.origin;
}

/** The attributes of the script line, as the tag reads them. */
export function attributes(project: string, o: Options = {}): Record<string, string> {
  const a: Record<string, string> = { "data-project": project };
  if (o.consent === "granted") a["data-consent"] = "granted";
  // cookieless counting is the default either way; true says so on the line, false waits for consent
  if (o.cookieless !== undefined) a["data-cookieless"] = o.cookieless ? "" : "off";
  if (o.vitals === "all") a["data-vitals"] = "all";
  if (o.search?.length) a["data-search"] = o.search.join(",");
  return a;
}

/** The script line itself, for server-rendered `<head>`s (Astro, Gatsby, Nuxt). */
export function scriptTag(project: string, o: Options = {}): { src: string; async: true; attributes: Record<string, string> } {
  if (!KEY.test(project)) throw new Error(`nextanalytica: "${project}" isn't a project key. Copy it from Tracking.`);
  return { src: `${hostOf(o.api_host)}/t.js`, async: true, attributes: attributes(project, o) };
}

/** Until the script has loaded: a stand-in that keeps the calls, in order. */
function standIn() {
  const w = window;
  if (w.nextanalytica) return w.nextanalytica;
  const q: [keyof Tracker, unknown[]][] = [];
  const s = { __q: q } as Tracker & { __q: typeof q };
  for (const m of METHODS) (s as unknown as Record<string, unknown>)[m] = (...args: unknown[]) => void q.push([m, args]);
  w.nextanalytica = s;
  return s;
}

/** The waiting calls go to the real tag, once it has replaced the stand-in. */
function drain(q: [keyof Tracker, unknown[]][]) {
  const real = window.nextanalytica;
  if (!real || real.__q === q) return;
  for (const [m, args] of q.splice(0)) (real[m] as (...a: unknown[]) => void)(...args);
}

/**
 * Put the tag on this page. Call it once, as early as you can; a second call, or a page that already has the line
 * (pasted, or rendered by a server component), changes nothing.
 */
export function init(project: string, o: Options = {}): void {
  if (!browser()) return;
  const tag = scriptTag(project, o);
  const q = standIn().__q;
  const there = document.querySelector<HTMLScriptElement>("script[data-project]");
  if (there) { if (q) there.addEventListener("load", () => drain(q)); return; }
  const el = document.createElement("script");
  el.src = tag.src;
  el.async = true;
  for (const [k, v] of Object.entries(tag.attributes)) el.setAttribute(k, v);
  if (q) el.addEventListener("load", () => drain(q));
  (document.head ?? document.documentElement).appendChild(el);
}

/** One of the tag's calls: now if it has loaded, else when it does. On the server, nothing. */
function call<M extends keyof Tracker>(m: M, ...args: Parameters<Tracker[M]>): void {
  if (!browser()) return;
  const t = window.nextanalytica ?? standIn();
  (t[m] as (...a: unknown[]) => void)(...args);
}

/** Your own event: `track("signup", { plan: "pro" })`, with an optional value. */
export const track = (name: string, props?: Props, o?: { value?: number; currency?: string }) => call("track", name, props, o);
/** A purchase: `order({ ref: "A-1001", value: 49, currency: "EUR" })`. */
export const order = (o: { ref?: string; value?: number; currency?: string }) => call("order", o);
/** The visitor's answer from your cookie banner. Until a yes, no cookie and no id. */
export const consent = (on: boolean) => call("consent", on);
/** Who this is, once they sign in (after consent): your own user id, never an email. */
export const identify = (userId: string, props?: Props) => call("identify", userId, props);
/** The company or team they belong to: `group("company", "acme", { plan: "pro" })`. */
export const group = (type: string, key: string, props?: Props) => call("group", type, key, props);
/** Properties of the signed-in person: `setPersonProperties({ plan: "pro" })`. */
export const setPersonProperties = (props: Props) => call("setPersonProperties", props);
/** On sign-out: forget the person on this device. */
export const reset = () => call("reset");

const nextanalytica = { init, track, order, consent, identify, group, setPersonProperties, reset };
export default nextanalytica;
