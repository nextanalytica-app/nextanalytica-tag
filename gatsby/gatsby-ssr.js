/**
 * The Gatsby plugin: `plugins: [{ resolve: "@nextanalytica/tag/gatsby", options: { project: "…" } }]` in
 * gatsby-config.js. Every page's server-rendered <head> gets the script line; Gatsby's client navigation is counted by
 * the tag itself.
 */
const React = require("react");

const KEY = /^[A-Za-z0-9_-]{3,100}$/;

exports.onRenderBody = ({ setHeadComponents }, o = {}) => {
  if (!o.project || !KEY.test(o.project)) throw new Error("nextanalytica: the Gatsby plugin needs options: { project } with your project key from Tracking.");
  const host = o.api_host ? new URL(o.api_host).origin : "https://t.nextanalytica.app";
  const a = { key: "nextanalytica", async: true, src: `${host}/t.js`, "data-project": o.project };
  if (o.consent === "granted") a["data-consent"] = "granted";
  if (o.cookieless) a["data-cookieless"] = "";
  if (o.vitals === "all") a["data-vitals"] = "all";
  if (o.search && o.search.length) a["data-search"] = o.search.join(",");
  setHeadComponents([React.createElement("script", a)]);
};
