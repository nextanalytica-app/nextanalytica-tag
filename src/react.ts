"use client";
/**
 * `<Analytics project="…" />` for React, Remix and React Router: put it once at the app's root. It renders nothing; it
 * adds the tag when the app first mounts in the browser. Client-side navigation is counted by the tag itself.
 */
import { useEffect } from "react";
import { init, type Options } from "./index.js";

export type AnalyticsProps = Options & { project: string };

export function Analytics({ project, ...o }: AnalyticsProps): null {
  const opts = JSON.stringify(o);
  useEffect(() => { init(project, JSON.parse(opts) as Options); }, [project, opts]);
  return null;
}

export default Analytics;
export { track, order, consent, identify, group, setPersonProperties, reset } from "./index.js";
