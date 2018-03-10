"use strict";

const assert    = require("assert");
const requirejs = require("requirejs");

requirejs.config({
    "baseUrl":     "src/core",
    "nodeRequire": require
});

describe("scraper/rutube", function () {
    let module;

    before(function (done) {
        requirejs(["scrapers"], function (scrapers) {
            module = scrapers;
            done();
        });
    });

    describe("#patterns", function () {
        it("should return error when it's not a video", function () {
            const url = "https://rutube.ru/index/hot/";
            return module.extract(url).then(function (file) {
                assert.strictEqual(file, url);
            });
        });
    });

    describe("https://rutube.ru/video/*/", function () {
        it("should return error when it's not a video", function () {
            const url = "https://rutube.ru/video/no_id/";
            const expected = "novideo";
            return module.extract(url).then(function () {
                assert.fail();
            }, function (error) {
                assert.strictEqual(error.name, "PebkacError");
                assert.ok(error.title.includes(expected));
                assert.ok(error.message.includes(expected));
            });
        });

        it("should return error when it's not a video", function () {
            const url = "https://rutube.ru/video/0a1b2c3d4e5/";
            const expected = "novideo";
            return module.extract(url).then(function () {
                assert.fail();
            }, function (error) {
                assert.strictEqual(error.name, "PebkacError");
                assert.ok(error.title.includes(expected));
                assert.ok(error.message.includes(expected));
            });
        });

        it("should return video id", function () {
            const url = "https://rutube.ru/video/" +
                 "c666623cab5ea368a8153b915dcdd028/?pl_id=12041&pl_type=source";
            const expected = "https://bl.rutube.ru/route/" +
              "c666623cab5ea368a8153b915dcdd028.m3u8";
            return module.extract(url).then(function (file) {
                assert.ok(file.startsWith(expected));
            });
        });

        it("should return video id", function () {
            const url = "http://rutube.ru/play/embed/7575145";
            const expected = "https://bl.rutube.ru/route/" +
            "588572c42e63e719645ce41b28c5ee13.m3u8";
            return module.extract(url).then(function (file) {
                assert.ok(file.startsWith(expected));
            });
        });
    });
});
