import path from "path";
import { build, Metafile } from "esbuild";
import instrument from "./instrument";
import markoPlugin from "./marko-plugin";

const cwd = process.cwd();

export default async function (runtimeId: string, file: string) {
  const outdir = path.join(cwd, "dist");
  const built = await build({
    outdir,
    bundle: true,
    write: false,
    format: "esm",
    metafile: true,
    platform: "browser",
    sourcemap: "inline",
    entryNames: "[dir]/[name]-[hash]",
    entryPoints: { [runtimeId]: file },
    plugins: [markoPlugin({ runtimeId })],
  });

  const meta = built.metafile!.outputs;
  const assets: Record<string, { path: string; code: string }[]> = {};

  for (const file of built.outputFiles) {
    const fileMeta = meta[path.relative(cwd, file.path)];
    if (hasContent(fileMeta)) {
      const ext = path.extname(file.path);
      (assets[ext] || (assets[ext] = [])).push({
        path: path.relative(outdir, file.path),
        code:
          process.env.NYC_CONFIG && ext === ".js"
            ? instrument(file.text, file.path)
            : file.text,
      });
    }
  }

  return assets;
}

function hasContent({ inputs }: Metafile["outputs"][string]) {
  for (const id in inputs) {
    if (inputs[id].bytesInOutput) return true;
  }

  return false;
}
