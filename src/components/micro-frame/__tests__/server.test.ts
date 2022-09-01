import path from "path";
import assert from "assert";
import fixture from "../../../__tests__/fixture";

declare const scriptValues: unknown[];
declare const inlineScriptValues: unknown[];

describe("ssr only", fixture(path.join(__dirname, "fixtures/ssr-only")));
describe("csr only", fixture(path.join(__dirname, "fixtures/csr-only")));
describe(
  "ssr then csr",
  fixture(path.join(__dirname, "fixtures/ssr-then-csr"))
);

describe(
  "csr stream text",
  fixture(path.join(__dirname, "fixtures/csr-stream-text"))
);

describe(
  "ssr then toggle",
  fixture(path.join(__dirname, "fixtures/ssr-then-toggle"), [
    async (page) => await page.click("text=Toggle"),
    async (page) => await page.click("text=Toggle"),
    async (page) => await page.click("text=Toggle"),
  ])
);

describe(
  "csr then toggle",
  fixture(path.join(__dirname, "fixtures/csr-then-toggle"), [
    async (page) => await page.click("text=Toggle"),
    async (page) => await page.click("text=Toggle"),
    async (page) => await page.click("text=Toggle"),
  ])
);

describe(
  "csr blocking scripts",
  fixture(
    path.join(__dirname, "fixtures/csr-blocking-scripts"),
    async (page) => {
      assert.deepStrictEqual(
        await page.evaluate(() => ({
          inline: inlineScriptValues,
          external: scriptValues,
        })),
        {
          external: ["a", "b", "c"],
          inline: [0, "a", 1, "b", 2, "c"],
        }
      );
    }
  )
);

describe(
  "csr blocking styles",
  fixture(
    path.join(__dirname, "fixtures/csr-blocking-styles"),
    async (page) => {
      assert.deepStrictEqual(await page.evaluate(() => inlineScriptValues), [
        "rgb(255, 0, 0)",
        "rgb(0, 255, 0)",
        "rgb(0, 0, 255)",
      ]);
    }
  )
);

describe(
  "csr script preloads",
  fixture(
    path.join(__dirname, "fixtures/csr-script-preloads"),
    async (page) => {
      assert.deepStrictEqual(await page.evaluate(() => scriptValues), [
        "a",
        "b",
        "c",
        "e",
      ]);
    }
  )
);

describe(
  "csr link preloads",
  fixture(path.join(__dirname, "fixtures/csr-link-preloads"))
);

describe(
  "csr image preloads",
  fixture(path.join(__dirname, "fixtures/csr-image-preloads"))
);

describe(
  "csr cross origin & integrity preloads",
  fixture(
    path.join(__dirname, "fixtures/csr-crossorigin-and-integrity-preloads"),
    async (page) => {
      assert.deepStrictEqual(await page.evaluate(() => scriptValues), [
        "a",
        "b",
      ]);
    }
  )
);

describe(
  "csr stream loading",
  fixture(path.join(__dirname, "fixtures/csr-stream-loading"))
);

describe(
  "ssr stream loading",
  fixture(path.join(__dirname, "fixtures/ssr-stream-loading"))
);

describe("csr 404", fixture(path.join(__dirname, "fixtures/csr-404")));

describe("ssr 404", fixture(path.join(__dirname, "fixtures/ssr-404")));

describe(
  "csr custom fetch",
  fixture(path.join(__dirname, "fixtures/csr-custom-fetch"))
);

describe(
  "ssr custom fetch",
  fixture(path.join(__dirname, "fixtures/ssr-custom-fetch"))
);
