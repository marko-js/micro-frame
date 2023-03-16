interface SSE {
  lastEventId?: string;
  data: string;
  type?: string;
}

export type ReadFunction = (
  param: SSE
) => [string | undefined, string, boolean?];

export default (read?: ReadFunction) =>
  function parser(
    iterator: AsyncIterator<Buffer | string>
  ): AsyncIterator<[string | undefined, string, boolean?]> {
    let buf = "";
    let isDone = false;

    function extractOneEventFromBuf() {
      const index = buf.indexOf("\n\n");
      if (index > -1) {
        const eventStr = buf.substring(0, index);
        buf = buf.substring(index + 2);
        return eventStr;
      } else if (isDone) {
        const ret = buf;
        buf = "";
        return ret;
      }
      return;
    }

    return {
      async next() {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const eventStr = extractOneEventFromBuf();
          if (eventStr) {
            const ev = parseEvent(eventStr);
            return {
              value: read ? read(ev) : [ev.lastEventId, ev.data, true],
              done: false,
            };
          }

          if (isDone) {
            return {
              value: undefined,
              done: true,
            };
          } else {
            const { value, done } = await iterator.next();
            if (done) {
              isDone = true;
            } else {
              buf += value.toString();
            }
          }
        }
      },
    };
  };

function parseEvent(eventStr: string) {
  const ev: {
    [k: string]: string | undefined;
  } = {
    id: undefined,
    data: "",
    type: undefined,
  };
  eventStr.split("\n").forEach((line) => {
    const lineMatch = /^(id|type|data): (.*)$/.exec(line);
    if (lineMatch) {
      if (lineMatch[1] === "data") {
        ev[lineMatch[1]] += lineMatch[2];
      } else {
        ev[lineMatch[1]] = lineMatch[2];
      }
    }
  });
  return {
    lastEventId: ev.id,
    data: ev.data as string,
    type: ev.type,
  };
}
