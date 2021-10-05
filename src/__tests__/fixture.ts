import fs from "fs";
import path from "path";
import crypto from "crypto";
import snap from "mocha-snap";
import { JSDOM } from "jsdom";
import * as playwright from "playwright";
import { defaultNormalizer, defaultSerializer } from "@marko/fixture-snapshots";
import { start } from "./start";

type Step = (page: playwright.Page) => Promise<unknown> | unknown;
declare const __track__: (html: string) => void;

let page: playwright.Page;
let browser: playwright.Browser | undefined;
let changes: string[] = [];

export default (dir: string, step?: Step[] | Step) => {
  const steps = step ? (Array.isArray(step) ? step : [step]) : [];
  return () => {
    it("renders", async function () {
      const app = await start(dir);

      try {
        await waitForPendingRequests(page, () => page.goto(app!.url));
        await forEachChange((html, i) => snap(html, `loading.${i}.html`));

        await page.pause();

        for (const [i, step] of steps.entries()) {
          await waitForPendingRequests(page, step);
          await forEachChange((html, j) => snap(html, `step-${i}.${j}.html`));
        }
      } finally {
        await app.close();
      }
    });
  };
};

// Starts the playwright instance and records mutation data.
before(async () => {
  browser = await playwright.chromium.launch();
  const context = await browser.newContext();
  /**
   * We add a mutation observer to track all mutations (batched)
   * Then we report the list of mutations in a normalized way and snapshot it.
   */
  await Promise.all([
    context.exposeFunction("__track__", (html: string) => {
      const formatted = defaultSerializer(
        defaultNormalizer(JSDOM.fragment(html))
      ).replace(/http:\/\/[^/]+/g, "");

      if (changes.at(-1) !== formatted) {
        changes.push(formatted);
      }
    }),
    context.addInitScript(() => {
      const observer = new MutationObserver(() => {
        if (document.body) {
          __track__(document.body.innerHTML);
          observer.disconnect();
          queueMicrotask(observe);
        }
      });

      observe();
      function observe() {
        observer.observe(document, {
          subtree: true,
          childList: true,
          attributes: true,
          characterData: true,
        });
      }
    }),
  ]);

  page = await context.newPage();
});

after(() => browser?.close());

if (process.env.NYC_CONFIG) {
  const NYC_CONFIG = JSON.parse(process.env.NYC_CONFIG) as {
    tempDir: string;
    cwd: string;
  };
  let report = 0;

  // Save coverage after each test.
  afterEach(async () => {
    const coverage = await page?.evaluate(() =>
      JSON.stringify((window as any).__coverage__)
    );

    if (coverage) {
      await fs.promises.writeFile(
        path.join(
          NYC_CONFIG.cwd,
          NYC_CONFIG.tempDir,
          `web-${report++}-${crypto.randomBytes(16).toString("hex")}.json`
        ),
        coverage
      );
    }
  });
}

/**
 * Utility to run a function against the current page and wait until every
 * in flight network request has completed before continuing.
 */
async function waitForPendingRequests(page: playwright.Page, step: Step) {
  let remaining = 0;
  let resolve!: () => void;
  const addOne = () => remaining++;
  const finishOne = async () => {
    // wait a tick to see if new requests start from this one.
    await page.evaluate(() => {});
    if (!--remaining) resolve();
  };
  const pending = new Promise<void>((_resolve) => (resolve = _resolve));

  page.on("request", addOne);
  page.on("requestfinished", finishOne);
  page.on("requestfailed", finishOne);

  try {
    addOne();
    await step(page);
    finishOne();
    await pending;
  } finally {
    page.off("request", addOne);
    page.off("requestfinished", finishOne);
    page.off("requestfailed", finishOne);
  }
}

/**
 * Applies changes currently and ensures no new changes come in while processing.
 */
async function forEachChange<F extends (html: string, i: number) => unknown>(
  fn: F
) {
  const len = changes.length;
  await Promise.all(changes.map(fn));

  if (len !== changes.length) {
    throw new Error("A mutation occurred when the page should have been idle.");
  }

  changes = [];
}
