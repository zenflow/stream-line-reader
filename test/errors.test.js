const { PassThrough } = require("stream");
const { StreamLineReader } = require("..");

describe("errors", () => {
  it("readUntil() stream ended without matching line", async () => {
    const input = new PassThrough();
    const lines = new StreamLineReader(input);

    input.write("foo\nbar\n");
    input.end();

    expect(await getRejection(lines.readUntil("baz"))).toMatchInlineSnapshot(`
      [Error: Stream ended without matching line
        matcher: "baz"
        lines:
          |foo
          |bar
          |]
    `);
    expect(await getRejection(lines.readUntil(/baz/))).toMatchInlineSnapshot(`
      [Error: Stream ended without matching line
        matcher: /baz/
        lines:
          |foo
          |bar
          |]
    `);
    expect(await getRejection(lines.readUntil((line) => line === "baz"))).toMatchInlineSnapshot(`
      [Error: Stream ended without matching line
        matcher: line => line === "baz"
        lines:
          |foo
          |bar
          |]
    `);

    expect(await lines.readRemaining()).toStrictEqual(["foo", "bar", ""]);
  });
});

async function getRejection(promise) {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error("Promise did not reject");
}
