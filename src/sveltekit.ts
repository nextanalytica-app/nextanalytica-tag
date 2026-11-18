/**
 * SvelteKit: `inject({ project: "…" })` in `src/routes/+layout.svelte`. On the server it does nothing; in the browser it
 * adds the tag once, and the tag counts client-side navigation itself.
 */
import { init, type Options } from "./index.js";

export function inject(o: Options & { project: string }): void {
  const { project, ...rest } = o;
  init(project, rest);
}

export default inject;
export { track, order, consent, identify, group, setPersonProperties, reset } from "./index.js";
