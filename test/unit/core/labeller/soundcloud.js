import assert from "node:assert";
import sinon from "sinon";
import * as labeller from "../../../../src/core/labeller/soundcloud.js";

describe("core/labeller/soundcloud.js", function () {
    describe("extract()", function () {
        it("should return audio label", async function () {
            const stub = sinon.stub(globalThis, "fetch").resolves(new Response(
                `<html>
                   <head>
                     <meta property="og:title" content="foo" />
                   </head>
                 </html>`,
            ));

            const audioUrl = new URL("http://bar.com/");

            const label = await labeller.extract(audioUrl);
            assert.strictEqual(label, "foo");

            assert.strictEqual(stub.callCount, 1);
            assert.deepStrictEqual(stub.firstCall.args, [
                new URL("http://bar.com/"),
            ]);
        });

        it("should return undefined when it's not audio page",
                                                             async function () {
            const stub = sinon.stub(globalThis, "fetch").resolves(new Response(
                `<html>
                   <head></head>
                 </html>`,
            ));

            const audioUrl = new URL("http://foo.com/");

            const label = await labeller.extract(audioUrl);
            assert.strictEqual(label, undefined);

            assert.strictEqual(stub.callCount, 1);
            assert.deepStrictEqual(stub.firstCall.args, [
                new URL("http://foo.com/"),
            ]);
        });
    });
});
