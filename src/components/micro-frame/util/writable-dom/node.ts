// Noop on the server side.
import type getWritableDOM from "./web";
export = (() => {
  throw new Error("Cannot use DOM streaming in a non browser environment.");
}) as any as typeof getWritableDOM;
