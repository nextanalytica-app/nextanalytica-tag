import { afterEach, beforeEach, describe, expect, it } from "vitest";
import nextanalytica, { attributes, consent, hostOf, identify, init, scriptTag, track } from "../src/index.ts";
import inject from "../src/sveltekit.ts";
import vue from "../src/vue.ts";
import nuxtModule from "../src/nuxt.ts";

/** Just enough of a page: scripts added to <head>, found by their data-project, and their load event. */
type El = { tag: string; src: string; async: boolean; attrs: Record<string, string>; on: Record<string, () => void>;
  setAttribute(k: string, v: string): void; addEventListener(e: string, f: () => void): void };
function page() {
  const head: El[] = [];
  const el = (tag: string): El => ({ tag, src: "", async: false, attrs: {}, on: {}, setAttribute(k, v) { this.attrs[k] = v; }, addEventListener(e, f) { const was = this.on[e]; this.on[e] = () => { was?.(); f(); }; } });
  const document = { head: { appendChild: (e: El) => void head.push(e) }, documentElement: null, createElement: el,
    querySelector: (sel: string) => (sel === "script[data-project]" ? head.find(e => "data-project" in e.attrs) ?? null : null) };
  Object.assign(globalThis, { window: globalThis, document });
  return { head, el };
}
/** The real tag arriving: it replaces the stand-in, takes what waited in `__q` (as t.js does), then fires load. */
function tagLoads(s: El, got: unknown[][]) {
  const w = globalThis as unknown as { nextanalytica?: Record<string, unknown> & { __q?: [string, unknown[]][] } };
  const early = w.nextanalytica?.__q?.splice(0) ?? [];
  const real = Object.fromEntries(["consent", "track", "order", "identify", "group", "setPersonProperties", "reset"].map(m => [m, (...a: unknown[]) => void got.push([m, ...a])]));
  w.nextanalytica = real;
  for (const [m, a] of early) (real[m] as (...x: unknown[]) => void)(...a);
  s.on.load?.();
}

beforeEach(() => { delete (globalThis as { nextanalytica?: unknown }).nextanalytica; });
afterEach(() => { delete (globalThis as { document?: unknown }).document; delete (globalThis as { window?: unknown }).window; });

describe("@nextanalytica/tag", () => {
  it("adds the one external script line, once", () => {
    const { head } = page();
    init("na_abc123", { consent: "granted", search: ["q", "s"] });
    init("na_abc123");
    expect(head).toHaveLength(1);
    expect(head[0]).toMatchObject({ tag: "script", src: "https://t.nextanalytica.app/t.js", async: true, attrs: { "data-project": "na_abc123", "data-consent": "granted", "data-search": "q,s" } });
  });

  it("calls made before the tag loads wait and go in order; after, they go at once", () => {
    const { head } = page();
    track("early", { a: 1 });
    init("na_abc123");
    consent(true);
    const got: unknown[][] = [];
    tagLoads(head[0]!, got);
    identify("u_42");
    expect(got).toEqual([["track", "early", { a: 1 }, undefined], ["consent", true], ["identify", "u_42", undefined]]);
  });

  it("an older t.js that doesn't read the queue still gets the waiting calls, from the load event", () => {
    const { head } = page();
    init("na_abc123");
    track("early");
    const got: unknown[][] = [];
    (globalThis as unknown as { nextanalytica: unknown }).nextanalytica = { track: (...a: unknown[]) => void got.push(["track", ...a]) };
    head[0]!.on.load!();
    expect(got).toEqual([["track", "early", undefined, undefined]]);
  });

  it("a page that already has the line (pasted, or server-rendered) gets no second one", () => {
    const { head, el } = page();
    const pasted = el("script"); pasted.setAttribute("data-project", "na_abc123"); head.push(pasted);
    init("na_abc123");
    expect(head).toHaveLength(1);
  });

  it("does nothing on the server", () => {
    expect(() => { init("na_abc123"); track("x"); nextanalytica.reset(); }).not.toThrow();
  });

  it("refuses what isn't a key or a safe host, and says what to do", () => {
    page();
    expect(() => init("<script>")).toThrow(/isn't a project key\. Copy it from Tracking/);
    expect(() => hostOf("http://evil.example")).toThrow(/must be https/);
    expect(hostOf("http://localhost:8788/x")).toBe("http://localhost:8788");
    expect(hostOf("https://t.example.com/path")).toBe("https://t.example.com");
    expect(attributes("na_x", { cookieless: true, vitals: "all" })).toEqual({ "data-project": "na_x", "data-cookieless": "", "data-vitals": "all" });
    expect(attributes("na_x", { cookieless: false })).toEqual({ "data-project": "na_x", "data-cookieless": "off" }); // waits for consent
  });

  it("the framework entries: SvelteKit inject, the Vue plugin, the Nuxt module", async () => {
    const { head } = page();
    inject({ project: "na_svelte1" });
    expect(head[0]!.attrs["data-project"]).toBe("na_svelte1");
    head.length = 0;
    vue.install({}, { project: "na_vue123" });
    expect(head[0]!.attrs["data-project"]).toBe("na_vue123");
    expect(() => vue.install({}, {} as never)).toThrow(/needs your project key/);

    const nuxt = { options: { app: { head: { script: [{ src: "/other.js" }] } }, nextanalytica: { project: "na_nuxt123", cookieless: true } } };
    nuxtModule(undefined, nuxt);
    expect(nuxt.options.app.head.script).toEqual([{ src: "/other.js" }, { src: "https://t.nextanalytica.app/t.js", async: true, "data-project": "na_nuxt123", "data-cookieless": "" }]);
    expect(await nuxtModule.getMeta()).toEqual({ name: "@nextanalytica/tag/nuxt", configKey: "nextanalytica" });
    expect(() => nuxtModule(undefined, { options: { app: { head: {} } } })).toThrow(/nuxt\.config\.ts/);
  });

  it("the script line for server-rendered heads", () => {
    expect(scriptTag("na_abc123", { api_host: "https://t.example.com" })).toEqual({ src: "https://t.example.com/t.js", async: true, attributes: { "data-project": "na_abc123" } });
  });
});
