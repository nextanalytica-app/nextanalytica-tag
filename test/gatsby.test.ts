import { createRequire } from "node:module";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const ssr = require("../gatsby/gatsby-ssr.js") as { onRenderBody: (a: { setHeadComponents: (c: unknown[]) => void }, o?: object) => void };

describe("the Gatsby plugin", () => {
  it("puts the script line in every page's head", () => {
    let got: unknown[] = [];
    ssr.onRenderBody({ setHeadComponents: c => { got = c; } }, { project: "na_gatsby1", consent: "granted" });
    expect(renderToStaticMarkup(got[0] as never)).toBe('<script async="" src="https://t.nextanalytica.app/t.js" data-project="na_gatsby1" data-consent="granted"></script>');
  });
  it("says what's missing without a project", () => {
    expect(() => ssr.onRenderBody({ setHeadComponents: () => {} }, {})).toThrow(/options: \{ project \}/);
  });
});
