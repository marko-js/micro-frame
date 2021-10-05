import * as convert from "convert-source-map";
import { createInstrumenter } from "istanbul-lib-instrument";

export default function (code: string, filename: string) {
  const inputMap = convert.fromSource(code)?.toObject();

  if (inputMap) {
    const instrumenter = createInstrumenter({ esModules: true });

    return (
      instrumenter.instrumentSync(
        convert.removeComments(code),
        filename,
        inputMap
      ) + convert.fromObject(instrumenter.lastSourceMap()).toComment()
    );
  }

  return code;
}
