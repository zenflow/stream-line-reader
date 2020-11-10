const { PassThrough } = require("stream");
const { StreamLineReader } = require("..");

describe("working", () => {
  it("with immediate input", async () => {
    const input = new PassThrough();
    const lines = new StreamLineReader(input);

    [..."A1B23C4"].forEach((line) => input.write(`${line}\n`));
    input.end();
    expect(await lines.readUntil("A")).toStrictEqual(["A"]);
    expect(await lines.readUntil(/B/)).toStrictEqual(["1", "B"]);
    expect(await lines.readUntil((line) => line === "C")).toStrictEqual(["2", "3", "C"]);
    expect(lines.readBuffered()).toStrictEqual(["4"]);
    expect(lines.readBuffered()).toStrictEqual([]);
    expect(await lines.readRemaining()).toStrictEqual([""]);
  });

  it("with delayed input", async () => {
    const input = new PassThrough();
    const lines = new StreamLineReader(input);

    input.write("1\n2");
    expect(lines.readBuffered()).toStrictEqual(["1"]);
    process.nextTick(() => input.write("\n3\n4"));
    expect(await lines.readUntil("3")).toStrictEqual(["2", "3"]);
    process.nextTick(() => input.end());
    expect(await lines.readRemaining()).toStrictEqual(["4"]);
  });
});
