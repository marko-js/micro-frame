import path from "path";
import assert from "assert";
import fixture from "../../../__tests__/fixture";

declare const scriptValues: unknown[];
declare const inlineScriptValues: unknown[];

fixture("ssr only", path.join(__dirname, "fixtures/ssr-only"));
fixture("csr only", path.join(__dirname, "fixtures/csr-only"));

fixture("ssr then csr", path.join(__dirname, "fixtures/ssr-then-csr"));

fixture(
  "ssr then csr with flush",
  path.join(__dirname, "fixtures/ssr-then-csr-with-flush")
);

fixture("csr stream text", path.join(__dirname, "fixtures/csr-stream-text"));

fixture("ssr then toggle", path.join(__dirname, "fixtures/ssr-then-toggle"), [
  async (page) => await page.click("text=Toggle"),
  async (page) => await page.click("text=Toggle"),
  async (page) => await page.click("text=Toggle"),
]);

fixture("csr then toggle", path.join(__dirname, "fixtures/csr-then-toggle"), [
  async (page) => await page.click("text=Toggle"),
  async (page) => await page.click("text=Toggle"),
  async (page) => await page.click("text=Toggle"),
]);

fixture(
  "csr blocking scripts",
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
);

fixture(
  "csr blocking styles",
  path.join(__dirname, "fixtures/csr-blocking-styles"),
  async (page) => {
    assert.deepStrictEqual(await page.evaluate(() => inlineScriptValues), [
      "rgb(255, 0, 0)",
      "rgb(0, 255, 0)",
      "rgb(0, 0, 255)",
    ]);
  }
);

fixture(
  "csr script preloads",
  path.join(__dirname, "fixtures/csr-script-preloads"),
  async (page) => {
    assert.deepStrictEqual(await page.evaluate(() => scriptValues), [
      "a",
      "b",
      "c",
      "e",
    ]);
  }
);

fixture(
  "csr link preloads",
  path.join(__dirname, "fixtures/csr-link-preloads")
);

fixture(
  "csr image preloads",
  path.join(__dirname, "fixtures/csr-image-preloads")
);

fixture(
  "csr cross origin & integrity preloads",
  path.join(__dirname, "fixtures/csr-crossorigin-and-integrity-preloads"),
  async (page) => {
    assert.deepStrictEqual(await page.evaluate(() => scriptValues), ["a", "b"]);
  }
);

fixture(
  "csr stream loading",
  path.join(__dirname, "fixtures/csr-stream-loading")
);

fixture(
  "ssr stream loading",
  path.join(__dirname, "fixtures/ssr-stream-loading")
);

fixture(
  "ssr client-reorder loading",
  path.join(__dirname, "fixtures/ssr-stream-client-reorder")
);

fixture("csr 404", path.join(__dirname, "fixtures/csr-404"));

fixture("ssr 404", path.join(__dirname, "fixtures/ssr-404"));

fixture("csr custom fetch", path.join(__dirname, "fixtures/csr-custom-fetch"));

fixture("ssr custom fetch", path.join(__dirname, "fixtures/ssr-custom-fetch"));

fixture(
  "ssr behind reorder",
  path.join(__dirname, "fixtures/ssr-behind-reorder")
);
