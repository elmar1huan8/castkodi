import assert from "node:assert";
import * as scraper from "../../../../src/core/scraper/gamekult.js";

describe("core/scraper/gamekult.js", function () {
    describe("extract()", function () {
        it("should return undefined when it's a unsupported URL",
                                                             async function () {
            const url = new URL("http://www.gameblog.fr/");

            const file = await scraper.extract(url);
            assert.strictEqual(file, undefined);
        });

        it("should return undefined when it's not a video", async function () {
            const url = new URL("https://www.gamekult.com/foo");
            const content = {
                html: () => Promise.resolve(new DOMParser().parseFromString(`
                    <html>
                      <body></body>
                    </html>`, "text/html")),
            };

            const file = await scraper.extract(url, content);
            assert.strictEqual(file, undefined);
        });

        it("should return video URL", async function () {
            const url = new URL("https://www.gamekult.com/foo");
            const content = {
                html: () => Promise.resolve(new DOMParser().parseFromString(`
                    <html>
                      <body>
                        <div class="js-dailymotion-video" data-id="bar"></div>
                      </body>
                    </html>`, "text/html")),
            };

            const file = await scraper.extract(url, content);
            assert.strictEqual(file,
                "plugin://plugin.video.dailymotion_com/" +
                                                     "?mode=playVideo&url=bar");
        });
    });
});
