/**
 * The Vue plugin: `createApp(App).use(nextanalytica, { project: "…" })` in `src/main.ts`. It adds the tag in the
 * browser; Vue Router's navigation is counted by the tag itself.
 */
import { init, type Options } from "./index.js";

export type PluginOptions = Options & { project: string };

export const nextanalytica = {
  install(_app: unknown, o: PluginOptions) {
    if (!o?.project) throw new Error("nextanalytica: app.use(nextanalytica, { project }) needs your project key from Tracking.");
    const { project, ...rest } = o;
    init(project, rest);
  },
};

export default nextanalytica;
export { track, order, consent, identify, group, setPersonProperties, reset } from "./index.js";
