interface SSE {
  lastEventId: string;
  data: string;
  type?: string;
}
export default (read?: (param: SSE) => [string, string, boolean?]) =>
  function parser(
    iterator: AsyncIterator<Buffer | string>
  ): AsyncIterator<[string, string, boolean?]> {
    let buf = "";
    const eventBuf: SSE[] = [];

    function parseEvent(eventStr: string) {
      let data = "";
      let id = "";
      let type;
      const lines = eventStr.split("\n").filter(Boolean);
      const idRegEx = /^id: (.*?)$/;
      const dataRegEx = /^data: (.*?)$/;
      const typeRegEx = /^type: (.*?)$/;
      for (const l of lines) {
        const idRes = idRegEx.exec(l);
        if (idRes) {
          id = idRes[1];
        }

        const typeRes = typeRegEx.exec(l);
        if (typeRes) {
          type = typeRes[1];
        }

        const dataRes = dataRegEx.exec(l);
        data += dataRes ? dataRes[1] : "";
      }
      eventStr = "";
      return { lastEventId: id, data, type };
    }

    return {
      async next() {
        if (eventBuf.length) {
          const nextEv = eventBuf.shift() as SSE;
          return {
            value: read
              ? read(nextEv)
              : [nextEv.lastEventId, nextEv.data, true],
            done: false,
          };
        }

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { value, done } = await iterator.next();
          if (done) {
            if (buf) {
              const ev = parseEvent(buf);
              buf = "";
              return {
                value: read ? read(ev) : [ev.lastEventId, ev.data, true],
                done: false,
              };
            } else {
              return {
                value: undefined,
                done: true,
              };
            }
          }

          const str = value.toString();
          const split = str.split("\n\n");
          if (split.length > 1) {
            const ev = parseEvent(buf + split.shift());
            buf = split.pop() || "";
            eventBuf.push(...split.map(parseEvent));
            return {
              value: read ? read(ev) : [ev.lastEventId, ev.data, true],
              done: false,
            };
          } else {
            buf += str;
          }
        }
      },
    };
  };
