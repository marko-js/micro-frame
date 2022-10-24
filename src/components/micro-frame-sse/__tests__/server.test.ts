import path from "path";
import assert from "assert";
import fixture from "../../../__tests__/fixture";

declare const scriptValues: unknown[];
declare const inlineScriptValues: unknown[];

describe("micro-frame-sse", () => {
  describe("ssr only", fixture(path.join(__dirname, "fixtures/ssr-only")));
  describe("csr only", fixture(path.join(__dirname, "fixtures/csr-only")));
  describe(
    "ssr then csr",
    fixture(path.join(__dirname, "fixtures/ssr-then-csr"))
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
    "ssr then toggle slot",
    fixture(path.join(__dirname, "fixtures/ssr-then-toggle-slot"), [
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
    "csr then toggle slot",
    fixture(path.join(__dirname, "fixtures/csr-then-toggle-slot"), [
      async (page) => await page.click("text=Toggle"),
      async (page) => {
        await page.click("text=Toggle");
        await page.click("text=Open");
      },
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

  describe(
    "ssr slot done signal",
    fixture(path.join(__dirname, "fixtures/ssr-slot-done-signal"))
  );

  describe(
    "csr slot done signal",
    fixture(path.join(__dirname, "fixtures/csr-slot-done-signal"))
  );

  describe("csr 404", fixture(path.join(__dirname, "fixtures/csr-404")));

  describe("ssr 404", fixture(path.join(__dirname, "fixtures/ssr-404")));

  describe(
    "csr invalid sourcename",
    fixture(path.join(__dirname, "fixtures/csr-invalid-sourcename"))
  );

  describe(
    "ssr invalid sourcename",
    fixture(path.join(__dirname, "fixtures/ssr-invalid-sourcename"))
  );

  describe(
    "custom read",
    fixture(path.join(__dirname, "fixtures/custom-read"))
  );

  describe(
    "ssr custom fetch",
    fixture(path.join(__dirname, "fixtures/ssr-custom-fetch"))
  );

  describe(
    "csr custom fetch",
    fixture(path.join(__dirname, "fixtures/csr-custom-fetch"))
  );

  describe(
    "ssr delayed slot",
    fixture(path.join(__dirname, "fixtures/ssr-delayed-slot"))
  );

  describe(
    "csr delayed slot",
    fixture(path.join(__dirname, "fixtures/csr-delayed-slot"))
  );

  describe(
    "ssr client-reorder",
    fixture(path.join(__dirname, "fixtures/ssr-client-reorder"))
  );

  describe(
    "ssr client-reorder false",
    fixture(path.join(__dirname, "fixtures/ssr-client-reorder-false"))
  );

  describe(
    "ssr timeout",
    fixture(path.join(__dirname, "fixtures/ssr-timeout"))
  );
});
