/// <reference types="node"/>

export function scanStream(
  stream: NodeJS.ReadableStream,
  test: (line: string) => boolean,
  cb: (error: Error | null, found?: boolean) => void
): void {
  function onError(error: Error) {
    cleanup();
    cb(error);
  }
  function onData(line: string) {
    if (test(line)) {
      cleanup();
      cb(null, true);
    }
  }
  function onEnd() {
    cleanup();
    cb(null, false);
  }
  function cleanup() {
    stream.off("error", onError);
    stream.off("data", onData);
    stream.off("end", onEnd);
  }
  stream.on("error", onError);
  stream.on("data", onData);
  stream.on("end", onEnd);
}
