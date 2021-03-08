const http = require("http");
const express = require("express");
const { ExpressPeerServer } = require("peer");
const Websocket = require("ws");

process.title = "muse-peer-server";

const PEERJS_PORT = process.env.PEERJS_PORT || 3001;
const app = express();
app.set("port", PEERJS_PORT);
app.get("/", (req, res, next) => res.send("Lorem ipsum"));

// Signal peer ids
const server = http.createServer(app);
const peerServer = ExpressPeerServer(server, {
  allow_discovery: true,
  debug: true,
});

app.use("/signal", peerServer);

peerServer.on("connection", (client) => {
  console.log("Client connected ", client.id);
});

peerServer.on("disconnect", (client) => {
  console.log("Client disconnected ", client.id);
});

// Websocket listen
const WS_PORT = process.env.WS_PORT || 3002;
const wsServer = new Websocket.Server({
  httpServer: server,
  port: WS_PORT,
});

wsServer.on("connection", (socket) => {
  // Send new peer ID
  socket.on("message", (peer) => {
    socket.send(peer);
  });
});

server.listen(PEERJS_PORT);
console.log(`Peer server running @ http://localhost:${PEERJS_PORT}/signal`);
console.log(`Websocket server running @ ws://localhost:${WS_PORT}`);
