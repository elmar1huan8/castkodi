"use strict";

const assert    = require("assert");
const requirejs = require("requirejs");

requirejs.config({
    "baseUrl":     "src/core",
    "nodeRequire": require
});

describe("scraper/arteradio", function () {
    let module;

    before(function (done) {
        requirejs(["scrapers"], function (scrapers) {
            module = scrapers;
            done();
        });
    });

    describe("#patterns", function () {
        it("should return error when it's not a sound", function () {
            const url = "https://www.arteradio.com/content/au_hasard";
            return module.extract(url).then(function (file) {
                assert.strictEqual(file, url);
            });
        });
    });

    describe("https://www.arteradio.com/son/*", function () {
        it("should return sound URL", function () {
            const url = "https://www.arteradio.com/son/61657661/fais_moi_ouir";
            const expected = "https://download.www.arte.tv/permanent/" +
                             "arteradio/sites/default/files/sons/" +
                             "01faismoiouir_hq_fr.mp3";
            return module.extract(url).then(function (file) {
                assert.strictEqual(file, expected);
            });
        });
    });
});
