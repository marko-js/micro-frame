export default (
  read?: (param: {
    lastEventId?: string;
    data: string;
    type?: string;
  }) => [string, string, boolean]
) => {
  return async function* parser(readable: AsyncGenerator<Buffer>) {
    async function* readEvent() {
      let buf = "";
      for await (const b of readable) {
        const str = b.toString();
        const split = str.split("\n\n");
        if (split.length > 1) {
          yield buf + split[0];
          for (const ev of split.slice(1, split.length - 1)) {
            yield ev;
          }
          buf = split[split.length - 1];
        } else {
          buf += str;
        }
      }
      if (buf) {
        yield buf;
      }
    }
    for await (const eventStr of readEvent()) {
      let data = "";
      let id;
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
      if (data) {
        if (read) yield read({ lastEventId: id, data, type });
        else yield [id, data, true];
      }
    }
  };
};
