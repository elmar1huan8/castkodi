import assert from "node:assert";
import mockSocket from "mock-socket";
import sinon from "sinon";
import { JSONRPC } from "../../../../src/core/tools/jsonrpc.js";

const Server = mockSocket.Server;

describe("tools/jsonrpc.js", function () {
    describe("open()", function () {
        it("should return promise fulfilled", async function () {
            const server = new Server("ws://localhost/");
            server.on("connection", (socket) => {
                assert.strictEqual(socket.url, "ws://localhost/");
            });

            const jsonrpc = await JSONRPC.open(new URL("ws://localhost/"));
            assert.strictEqual(typeof jsonrpc, "object");

            server.close();
        });

        it("should return promise rejected", async function () {
            // Ne pas instancier de serveur pour faire échouer la connexion.
            await assert.rejects(
                () => JSONRPC.open(new URL("ws://localhost/")), {
                    name:    "Error",
                    message: "Connection to the server at ws://localhost/" +
                             " unestablished",
                },
            );
        });
    });

    describe("close()", function () {
        it("should close connection", async function () {
            const server = new Server("ws://localhost/");
            const promise = new Promise((resolve) => {
                server.on("connection", (socket) => {
                    socket.on("close", resolve);
                });
            });

            const jsonrpc = await JSONRPC.open(new URL("ws://localhost/"));
            jsonrpc.close();

            const event = await promise;
            assert.strictEqual(event.code, 1005);
            assert.strictEqual(event.reason, "");
            assert.strictEqual(event.wasClean, true);

            server.close();
        });

        it("should close connection with code", async function () {
            const server = new Server("ws://localhost/");
            const promise = new Promise((resolve) => {
                server.on("connection", (socket) => {
                    socket.on("close", resolve);
                });
            });

            const jsonrpc = await JSONRPC.open(new URL("ws://localhost/"));
            jsonrpc.close(1000);

            const event = await promise;
            assert.strictEqual(event.code, 1000);
            assert.strictEqual(event.reason, "");
            assert.strictEqual(event.wasClean, true);

            server.close();
        });

        it("should close connection with code and reason", async function () {
            const server = new Server("ws://localhost/");
            const promise = new Promise((resolve) => {
                server.on("connection", (socket) => {
                    socket.on("close", resolve);
                });
            });

            const jsonrpc = await JSONRPC.open(new URL("ws://localhost/"));
            jsonrpc.close(4242, "foo");

            const event = await promise;
            assert.strictEqual(event.code, 4242);
            assert.strictEqual(event.reason, "foo");
            assert.strictEqual(event.wasClean, false);

            server.close();
        });
    });

    describe("send()", function () {
        it("should send message", async function () {
            const server = new Server("ws://localhost/");
            server.on("connection", (socket) => {
                socket.on("message", (data) => {
                    const request = JSON.parse(data.toString());
                    assert.deepStrictEqual(request, {
                        jsonrpc: "2.0",
                        method:  "foo",
                        params:  { bar: "baz" },
                        id:      1,
                    });

                    socket.send(JSON.stringify({
                        jsonrpc: "2.0",
                        result:  "qux",
                        id:      request.id,
                    }));
                });
            });

            const jsonrpc = await JSONRPC.open(new URL("ws://localhost/"));
            const result = await jsonrpc.send("foo", { bar: "baz" });
            assert.strictEqual(result, "qux");

            server.close();
        });

        it("should send message without params", async function () {
            const server = new Server("ws://localhost/");
            server.on("connection", (socket) => {
                socket.on("message", (data) => {
                    const request = JSON.parse(data.toString());
                    assert.deepStrictEqual(request, {
                        jsonrpc: "2.0",
                        method:  "foo",
                        id:      1,
                    });

                    socket.send(JSON.stringify({
                        jsonrpc: "2.0",
                        result:  { bar: "baz" },
                        id:      request.id,
                    }));
                });
            });

            const jsonrpc = await JSONRPC.open(new URL("ws://localhost/"));
            const result = await jsonrpc.send("foo");
            assert.deepStrictEqual(result, { bar: "baz" });

            server.close();
        });

        it("should dispatch error message", async function () {
            const server = new Server("ws://localhost/");
            server.on("connection", (socket) => {
                socket.on("message", (data) => {
                    const request = JSON.parse(data.toString());
                    socket.send(JSON.stringify({
                        jsonrpc: "2.0",
                        error:   { code: 42, message: "bar" },
                        id:      request.id,
                    }));
                });
            });

            const jsonrpc = await JSONRPC.open(new URL("ws://localhost/"));
            await assert.rejects(() => jsonrpc.send("foo"), {
                name:    "Error",
                message: "bar",
            });

            server.close();
        });

        it("should dispatch result", async function () {
            const server = new Server("ws://localhost/");
            server.on("connection", (socket) => {
                socket.on("message", (data) => {
                    const request = JSON.parse(data.toString());
                    switch (request.id) {
                        case 1:
                            socket.send(JSON.stringify({
                                jsonrpc: "2.0",
                                result:  "baz",
                                id:      request.id,
                            }));
                            break;
                        case 2:
                            socket.send(JSON.stringify({
                                jsonrpc: "2.0",
                                result:  { qux: "quux" },
                                id:      request.id,
                            }));
                            break;
                        default:
                            socket.send(JSON.stringify({
                                jsonrpc: "2.0",
                                error:   { message: request.id },
                                id:      request.id,
                            }));
                    }
                });
            });

            const jsonrpc = await JSONRPC.open(new URL("ws://localhost/"));
            let result = await jsonrpc.send("foo");
            assert.strictEqual(result, "baz");
            result = await jsonrpc.send("bar");
            assert.deepStrictEqual(result, { qux: "quux" });

            server.close();
        });
    });

    describe("addEventListener()", function () {
        it("should dispatch close event", async function () {
            const fake = sinon.fake();
            const server = new Server("ws://localhost/");

            const jsonrpc = await JSONRPC.open(new URL("ws://localhost/"));
            jsonrpc.addEventListener("close", fake);

            server.close();

            assert.strictEqual(fake.callCount, 1);
            assert.strictEqual(fake.firstCall.args.length, 1);
            assert.strictEqual(fake.firstCall.args[0].type, "close");
        });

        it("should dispatch notification event", async function () {
            const server = new Server("ws://localhost/");
            server.on("connection", (socket) => {
                // Décaler l'envoi de la notification pour laisser le temps au
                // client d'ajouter son écouteur.
                setTimeout(() => socket.send(JSON.stringify({
                    jsonrpc: "2.0",
                    method:  "foo",
                    params:  { bar: "baz" },
                })), 0);
            });

            const jsonrpc = await JSONRPC.open(new URL("ws://localhost/"));
            const notification = await new Promise((resolve) => {
                jsonrpc.addEventListener("notification", resolve);
            });

            server.close();

            assert.strictEqual(notification.type, "notification");
            assert.strictEqual(notification.method, "foo");
            assert.deepStrictEqual(notification.params, {
                bar: "baz",
            });
        });
    });
});
