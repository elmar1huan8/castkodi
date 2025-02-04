import assert from "node:assert";
import * as storage from "../../../src/core/storage.js";

describe("core/storage.js", function () {
    describe("initialize()", function () {
        it("should create config in Chrome", async function () {
            // eslint-disable-next-line no-underscore-dangle
            browser.runtime._setBrowserInfo({ name: "Chrome" });

            await storage.initialize();
            const config = await browser.storage.local.get();
            assert.deepStrictEqual(config, {
                "config-version":   4,
                "server-mode":      "single",
                "server-list":      [{ address: "", name: "" }],
                "server-active":    0,
                "general-history":  false,
                "menu-actions":     ["send", "insert", "add"],
                "menu-contexts":    [
                    "audio", "frame", "link", "page", "selection", "video",
                ],
                "youtube-playlist": "playlist",
                "youtube-order":    "default",
            });
        });

        it("should create config in Firefox", async function () {
            // eslint-disable-next-line no-underscore-dangle
            browser.runtime._setBrowserInfo({ name: "Firefox" });

            await storage.initialize();
            const config = await browser.storage.local.get();
            assert.deepStrictEqual(config, {
                "config-version":   4,
                "server-mode":      "single",
                "server-list":      [{ address: "", name: "" }],
                "server-active":    0,
                "general-history":  false,
                "menu-actions":     ["send", "insert", "add"],
                "menu-contexts":    [
                    "audio",
                    "frame",
                    "link",
                    "page",
                    "selection",
                    "tab",
                    "video",
                ],
                "youtube-playlist": "playlist",
                "youtube-order":    "default",
            });
        });
    });

    describe("migrate()", function () {
        it("should upgrade from version '1'", async function () {
            browser.storage.local.set({
                "config-version":     1,
                "connection-host":    "foo",
                "general-history":    true,
                "menus-send":         false,
                "menus-insert":       true,
                "menus-add":          false,
                "contexts-audio":     true,
                "contexts-frame":     false,
                "contexts-link":      true,
                "contexts-page":      false,
                "contexts-selection": true,
                "contexts-tab":       false,
                "contexts-video":     true,
                "youtube-playlist":   "video",
                bar:                  "baz",
            });

            await storage.migrate();
            const config = await browser.storage.local.get();
            assert.deepStrictEqual(config, {
                "config-version":   4,
                "server-mode":      "single",
                "server-list":      [{ address: "foo", name: "" }],
                "server-active":    0,
                "general-history":  true,
                "menu-actions":     ["insert"],
                "menu-contexts":    ["audio", "link", "selection", "video"],
                "youtube-playlist": "video",
                "youtube-order":    "",
            });
        });

        it("should upgrade from version '2'", async function () {
            browser.storage.local.set({
                "config-version":   2,
                "server-mode":      "multi",
                "server-list":      [
                    { host: "foo",              name: "bar" },
                    { host: "https://baz.com/", name: "qux" },
                ],
                "server-active":    1,
                "general-history":  false,
                "menu-actions":     ["send"],
                "menu-contexts":    [],
                "youtube-playlist": "playlist",
            });

            await storage.migrate();
            const config = await browser.storage.local.get();
            assert.deepStrictEqual(config, {
                "config-version":   4,
                "server-mode":      "multi",
                "server-list":      [
                    { address: "foo",              name: "bar" },
                    { address: "https://baz.com/", name: "qux" },
                ],
                "server-active":    1,
                "general-history":  false,
                "menu-actions":     ["send"],
                "menu-contexts":    [],
                "youtube-playlist": "playlist",
                "youtube-order":    "",
            });
        });

        it("should upgrade from version '3'", async function () {
            browser.storage.local.set({
                "config-version":   3,
                "server-mode":      "single",
                "server-list":      [{ address: "foo", name: "" }],
                "server-active":    0,
                "general-history":  true,
                "menu-actions":     [],
                "menu-contexts":    [],
                "youtube-playlist": "playlist",
            });

            await storage.migrate();
            const config = await browser.storage.local.get();
            assert.deepStrictEqual(config, {
                "config-version":   4,
                "server-mode":      "single",
                "server-list":      [{ address: "foo", name: "" }],
                "server-active":    0,
                "general-history":  true,
                "menu-actions":     [],
                "menu-contexts":    [],
                "youtube-playlist": "playlist",
                "youtube-order":    "",
            });
        });

        it("should do nothing from version '4'", async function () {
            browser.storage.local.set({
                "config-version":   4,
                "server-mode":      "multi",
                "server-list":      [
                    { address: "foo",              name: "bar" },
                    { address: "https://baz.com/", name: "qux" },
                ],
                "server-active":    1,
                "general-history":  true,
                "menu-actions":     [],
                "menu-contexts":    ["bookmark"],
                "youtube-playlist": "video",
                "youtube-order":    "default",
            });

            await storage.migrate();
            const config = await browser.storage.local.get();
            assert.deepStrictEqual(config, {
                "config-version":   4,
                "server-mode":      "multi",
                "server-list":      [
                    { address: "foo",              name: "bar" },
                    { address: "https://baz.com/", name: "qux" },
                ],
                "server-active":    1,
                "general-history":  true,
                "menu-actions":     [],
                "menu-contexts":    ["bookmark"],
                "youtube-playlist": "video",
                "youtube-order":    "default",
            });
        });
    });

    describe("remove()", function () {
        it("should support no permission", async function () {
            browser.storage.local.set({
                "general-history": true,
                "menu-contexts":   ["bookmark"],
            });

            await storage.remove([]);
            const config = await browser.storage.local.get();
            assert.deepStrictEqual(config, {
                "general-history": true,
                "menu-contexts":   ["bookmark"],
            });
        });

        it("should ignore unknown permission", async function () {
            browser.storage.local.set({
                "general-history": true,
                "menu-contexts":   ["bookmark"],
                foo:               "bar",
            });

            await storage.remove(["foo"]);
            const config = await browser.storage.local.get();
            assert.deepStrictEqual(config, {
                "general-history": true,
                "menu-contexts":   ["bookmark"],
                foo:               "bar",
            });
        });

        it("should disable 'general-history'", async function () {
            browser.storage.local.set({
                "general-history": true,
                "menu-contexts":   ["bookmark"],
            });

            await storage.remove(["history"]);
            const config = await browser.storage.local.get();
            assert.deepStrictEqual(config, {
                "general-history": false,
                "menu-contexts":   ["bookmark"],
            });
        });

        it("should remove 'bookmark'", async function () {
            browser.storage.local.set({
                "general-history": true,
                "menu-contexts":   ["bookmark", "foo"],
            });

            await storage.remove(["bookmarks"]);
            const config = await browser.storage.local.get();
            assert.deepStrictEqual(config, {
                "general-history": true,
                "menu-contexts":   ["foo"],
            });
        });

        it("should support when 'bookmark' is removed", async function () {
            browser.storage.local.set({
                "general-history": true,
                "menu-contexts":   [],
            });

            await storage.remove(["bookmarks"]);
            const config = await browser.storage.local.get();
            assert.deepStrictEqual(config, {
                "general-history": true,
                "menu-contexts":   [],
            });
        });

        it("should remove / disable 'general-history' and 'bookmark'",
                                                             async function () {
            browser.storage.local.set({
                "general-history": true,
                "menu-contexts":   ["bookmark"],
            });

            await storage.remove(["history", "bookmarks"]);
            const config = await browser.storage.local.get();
            assert.deepStrictEqual(config, {
                "general-history": false,
                "menu-contexts":   [],
            });
        });
    });
});
