import assert from "node:assert";
import sinon from "sinon";
import * as scraper from "../../../../src/core/scraper/arte.js";

describe("core/scraper/arte.js", function () {
    describe("extract()", function () {
        it("should return undefined when it's a unsupported URL",
                                                             async function () {
            const url = new URL("https://www.arte.tv/fr/guide/");

            const file = await scraper.extract(url);
            assert.strictEqual(file, undefined);
        });

        it("should return undefined when video is unavailable",
                                                             async function () {
            const stub = sinon.stub(globalThis, "fetch").resolves(new Response(
                JSON.stringify({ data: { attributes: { streams: [] } } }),
            ));

            const url = new URL("https://www.arte.tv/de/videos/foo/bar");

            const file = await scraper.extract(url);
            assert.strictEqual(file, undefined);

            assert.strictEqual(stub.callCount, 1);
            assert.deepStrictEqual(stub.firstCall.args, [
                "https://api.arte.tv/api/player/v2/config/de/foo",
            ]);
        });

        it("should return video URL", async function () {
            const stub = sinon.stub(globalThis, "fetch").resolves(new Response(
                JSON.stringify({
                    data: {
                        attributes: {
                            streams: [{ url: "https://foo.tv/bar.mp4" }],
                        },
                    },
                }),
            ));

            const url = new URL("https://www.arte.tv/fr/videos/baz/qux");

            const file = await scraper.extract(url);
            assert.strictEqual(file, "https://foo.tv/bar.mp4");

            assert.strictEqual(stub.callCount, 1);
            assert.deepStrictEqual(stub.firstCall.args, [
                "https://api.arte.tv/api/player/v2/config/fr/baz",
            ]);
        });
    });
});
