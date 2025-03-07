import path from "path";
import assert from "assert";
import fixture from "../../../__tests__/fixture";

declare const scriptValues: unknown[];
declare const inlineScriptValues: unknown[];

describe("micro-frame-sse", () => {
  fixture("ssr only", path.join(__dirname, "fixtures/ssr-only"));
  fixture("csr only", path.join(__dirname, "fixtures/csr-only"));
  fixture("ssr then csr", path.join(__dirname, "fixtures/ssr-then-csr"));

  fixture("ssr then toggle", path.join(__dirname, "fixtures/ssr-then-toggle"), [
    async (page) => await page.click("text=Toggle"),
    async (page) => await page.click("text=Toggle"),
    async (page) => await page.click("text=Toggle"),
  ]);

  fixture(
    "ssr then toggle slot",
    path.join(__dirname, "fixtures/ssr-then-toggle-slot"),
    [
      async (page) => await page.click("text=Toggle"),
      async (page) => await page.click("text=Toggle"),
      async (page) => await page.click("text=Toggle"),
    ]
  );

  fixture("csr then toggle", path.join(__dirname, "fixtures/csr-then-toggle"), [
    async (page) => await page.click("text=Toggle"),
    async (page) => await page.click("text=Toggle"),
    async (page) => await page.click("text=Toggle"),
  ]);

  fixture(
    "csr then change src",
    path.join(__dirname, "fixtures/csr-then-change-src"),
    [async (page) => await page.click("text=Change")]
  );

  fixture(
    "ssr then csr change src",
    path.join(__dirname, "fixtures/ssr-then-csr-change-src"),
    [async (page) => await page.click("text=Change")]
  );

  fixture(
    "ssr change src and name",
    path.join(__dirname, "fixtures/ssr-change-src-and-name"),
    [async (page) => await page.click("text=Change")]
  );

  fixture("ssr no refresh", path.join(__dirname, "fixtures/ssr-no-refresh"), [
    async (page) => await page.click("text=Change"),
  ]);

  fixture(
    "csr then toggle slot",
    path.join(__dirname, "fixtures/csr-then-toggle-slot"),
    [
      async (page) => await page.click("text=Toggle"),
      async (page) => {
        await page.click("text=Toggle");
        await page.click("text=Open");
      },
      async (page) => await page.click("text=Toggle"),
    ]
  );

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
      assert.deepStrictEqual(await page.evaluate(() => scriptValues), [
        "a",
        "b",
      ]);
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
    "ssr slot done signal",
    path.join(__dirname, "fixtures/ssr-slot-done-signal")
  );

  fixture(
    "csr slot done signal",
    path.join(__dirname, "fixtures/csr-slot-done-signal")
  );

  fixture(
    "csr slot done and error",
    path.join(__dirname, "fixtures/csr-slot-done-and-error"),
    [async (page) => await page.click("text=Load Slot1")]
  );

  fixture("csr 404", path.join(__dirname, "fixtures/csr-404"));

  fixture("ssr 404", path.join(__dirname, "fixtures/ssr-404"));

  fixture("custom read", path.join(__dirname, "fixtures/custom-read"));

  fixture(
    "ssr custom fetch",
    path.join(__dirname, "fixtures/ssr-custom-fetch")
  );

  fixture(
    "csr custom fetch",
    path.join(__dirname, "fixtures/csr-custom-fetch")
  );

  fixture(
    "ssr delayed slot",
    path.join(__dirname, "fixtures/ssr-delayed-slot")
  );

  fixture(
    "csr delayed slot",
    path.join(__dirname, "fixtures/csr-delayed-slot")
  );

  fixture(
    "ssr client-reorder",
    path.join(__dirname, "fixtures/ssr-client-reorder")
  );

  fixture(
    "ssr client-reorder false",
    path.join(__dirname, "fixtures/ssr-client-reorder-false")
  );

  fixture(
    "ssr reorder after first chunk",
    path.join(__dirname, "fixtures/ssr-reorder-after-first-chunk")
  );

  fixture("ssr timeout", path.join(__dirname, "fixtures/ssr-timeout"));

  fixture(
    "ssr behind reorder",
    path.join(__dirname, "fixtures/ssr-behind-reorder")
  );
});
