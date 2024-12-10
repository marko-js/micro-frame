const decoder = new TextDecoder();
export default function consumeResponseBody(
  res: Response
): AsyncIterator<string, void> | undefined {
  if (res.body) {
    if ((res.body as any).getReader) {
      return consumeBodyReader(res.body.getReader());
    }

    if ((res.body as any)[Symbol.asyncIterator]) {
      return (res.body as any)[Symbol.asyncIterator]();
    }
  }

  throw new Error("Response body must be a stream.");
}

async function* consumeBodyReader(
  reader: ReadableStreamDefaultReader<Uint8Array>
) {
  do {
    const next = await reader.read();
    if (next.done) break;
    yield decoder.decode(next.value);
  } while (true);
}
