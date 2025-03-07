import fs from "fs";
import path from "path";
import { once } from "events";
import { AddressInfo } from "net";
import express from "express";
import markoExpress from "@marko/express";
import { wait } from "./queue";
import build from "./build";

export async function start(dir: string) {
  const entries = await fs.promises.readdir(dir);
  const app = express();
  app.use(throttleMiddleware());
  app.use(markoExpress());

  app.get("/external.js", (req, res) => {
    res.type("js");
    res.end(
      `(window.scriptValues || (window.scriptValues = [])).push(${JSON.stringify(
        req.query.value
      )});`
    );
  });

  app.get("/external.css", (req, res) => {
    res.type("css");
    res.end(`body { color: ${req.query.color} }`);
  });

  app.get("/external(.*).gif", (req, res) => {
    res.sendFile(path.join(__dirname, "images/sample.gif"));
  });

  await Promise.all(
    entries.map(async (entry) => {
      const name = path.basename(entry, ".marko");
      if (name !== entry) {
        const file = path.join(dir, entry);
        const runtimeId = `${path.basename(dir)}_${name}`.replace(
          /[^a-z0-9_$]+/g,
          "_"
        );
        const assets = await build(runtimeId, file);
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const template = require(file).default;

        for (const ext in assets) {
          for (const asset of assets[ext]) {
            app.get(`/${asset.path}`, (_req, res) => {
              res.type(ext);
              res.end(asset.code);
            });
          }
        }

        app.get(`/${name === "index" ? "" : name}`, (req, res) => {
          res.locals.runtimeId = runtimeId;
          res.locals.assets = assets;
          res.locals.req = req;

          if (process.env.NODE_ENV === "test") {
            // for some reason express suppresses errors in test env.
            res.on("error", console.error);
          }
          res.marko(template);
        });
      }
    })
  );

  const server = app.listen();
  await once(server, "listening");

  return {
    url: `http://localhost:${(server.address() as AddressInfo).port}`,
    close: () => new Promise<void>((r) => server.close(() => r())),
  };
}

// Ensure each write is flushed completely and throttled
// to avoid race conditions.
function throttleMiddleware() {
  return ((_req, res, next) => {
    const write = res.write.bind(res);
    const end = res.end.bind(res);
    let buf = "";

    (res as any).flush = () => {
      call(write);
    };

    res.write = (chunk) => {
      buf += chunk.toString();
      return true;
    };

    res.end = ((chunk) => {
      if (chunk && typeof chunk !== "function") {
        res.write(chunk);
      }

      call(end);
    }) as express.Response["end"];

    next();

    function call(write: (chunk: string, cb: () => void) => void) {
      const data = buf;
      buf = "";
      wait(() => new Promise((resolve) => write(data, resolve)));
    }
  }) as express.RequestHandler;
}
