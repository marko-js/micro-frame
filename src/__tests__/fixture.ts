import fs from "fs";
import path from "path";
import crypto from "crypto";
import snap from "mocha-snap";
import * as playwright from "playwright";
import toDiffableHTML from "diffable-html";
import { start } from "./start";

type Step = (page: playwright.Page) => Promise<unknown> | unknown;
declare const __track__: (html: string) => void;

let page: playwright.Page;
let browser: playwright.Browser | undefined;
let changes: string[] = [];

export default (name: string, dir: string, step?: Step[] | Step) => {
  const steps = step ? (Array.isArray(step) ? step : [step]) : [];
  it(name, async function () {
    const app = await start(dir);
    const snapshots: string[] = [];
    try {
      await trackStep("Load", () => page.goto(app!.url));
      for (const [i, step] of steps.entries()) {
        await trackStep(`Step ${i}`, step);
      }
    } finally {
      await app.close();
    }

    await snap(snapshots.join("\n\n") + "\n", { ext: ".md" });

    async function trackStep(name: string, step: Step) {
      await waitForPendingRequests(page, step);
      await new Promise((r) => setTimeout(r, 500));
      if (changes.length) {
        snapshots.push(
          `# ${name}\n` +
            changes.map((html) => `\`\`\`html\n${html}\n\`\`\``).join("\n")
        );
        changes = [];
      }
    }
  });
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
      const formatted = toDiffableHTML(
        html.replace(/http:\/\/[^/]+/g, "")
      ).trim();

      if (changes.at(-1) !== formatted) {
        changes.push(formatted);
      }
    }),
    context.addInitScript(() => {
      const { port1, port2 } = new MessageChannel();
      port1.onmessage = () => {
        if (document.body.innerHTML) {
          __track__(document.body.innerHTML);
        }
        observe();
      };
      // Tracks all mutations in the dom.
      const observer = new MutationObserver(() => {
        if (document.body) {
          // throttle the observer so we only snapshot once per frame.
          observer.disconnect();
          requestAnimationFrame(() => port2.postMessage(0));
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
async function waitForPendingRequests(
  page: playwright.Page,
  action: (page: playwright.Page) => unknown
) {
  let remaining = 0;
  let resolve!: () => void;
  const addOne = () => remaining++;
  const finishOne = async () => {
    if (!--remaining) {
      // wait some time to see if new requests start from this one.
      await page.evaluate(() => {});
      await new Promise((r) => setTimeout(r, 200));
      if (!remaining) resolve();
    }
  };
  const pending = new Promise<void>((_resolve) => (resolve = _resolve));

  page.on("request", addOne);
  page.on("requestfinished", finishOne);
  page.on("requestfailed", finishOne);

  try {
    addOne();
    await action(page);
    finishOne();
    await pending;
  } finally {
    page.off("request", addOne);
    page.off("requestfinished", finishOne);
    page.off("requestfailed", finishOne);
  }
}
