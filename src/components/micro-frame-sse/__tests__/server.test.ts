import path from "path";
import fixture from "../../../__tests__/fixture";

describe(
  "ssr sse stream",
  fixture(path.join(__dirname, "fixtures/ssr-sse-stream"))
);
