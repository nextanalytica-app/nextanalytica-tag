/**
 * The Nuxt module: `modules: ["@nextanalytica/tag/nuxt"]` and `nextanalytica: { project: "…" }` in `nuxt.config.ts`.
 * It puts the script line in every page's server-rendered `<head>`, so the tag starts with the first byte, not after
 * hydration. Written without `@nuxt/kit`: a module is a function Nuxt calls with its options and the Nuxt instance.
 */
import { scriptTag, type Options } from "./index.js";

export type ModuleOptions = Options & { project?: string };

type NuxtLike = { options: { app: { head: { script?: unknown[] } }; nextanalytica?: ModuleOptions } };

function nextanalyticaModule(inline: ModuleOptions | undefined, nuxt: NuxtLike) {
  const o = { ...nuxt.options.nextanalytica, ...inline };
  if (!o.project) throw new Error("nextanalytica: set nextanalytica: { project } in nuxt.config.ts, with your project key from Tracking.");
  const { project, ...rest } = o;
  const tag = scriptTag(project, rest);
  const head = nuxt.options.app.head;
  head.script = [...(head.script ?? []), { src: tag.src, async: true, ...tag.attributes }];
}

/** What Nuxt reads off a module: its name and the config key its options live under. */
nextanalyticaModule.getMeta = async () => ({ name: "@nextanalytica/tag/nuxt", configKey: "nextanalytica" });
nextanalyticaModule.getOptions = async (inline: ModuleOptions | undefined, nuxt: NuxtLike) => ({ ...nuxt.options.nextanalytica, ...inline });

export default nextanalyticaModule;
