import assert from "node:assert";
import * as scraper from "../../../../src/core/scraper/acestream.js";

describe("core/scraper/acestream.js", function () {
    describe("extract()", function () {
        it("should return undefined when it's a unsupported URL",
                                                             async function () {
            const url = new URL("http://www.acestream.org/");

            const file = await scraper.extract(url);
            assert.strictEqual(file, undefined);
        });

        it("should return video URL", async function () {
            const url = new URL("acestream://foo");

            const file = await scraper.extract(url);
            assert.strictEqual(file,
                "plugin://program.plexus/" +
                                     "?mode=1&name=&url=acestream%3A%2F%2Ffoo");
        });
    });
});
