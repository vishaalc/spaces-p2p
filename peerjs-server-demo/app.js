const http = require("http");
const express = require("express");
const { ExpressPeerServer } = require("peer");
const Websocket = require("ws");
const dotenv = require("dotenv");

dotenv.config();
process.title = "muse-p2p-server";

const PEERJS_PORT = process.env.PEERJS_PORT || 3001;
const app = express();
app.set("port", PEERJS_PORT);
app.get("/", (req, res, next) => res.send("Lorem ipsum"));

// Signal peer ids
const httpServer = http.createServer(app);
const peerServer = ExpressPeerServer(httpServer, {
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
const WS_PORT = process.env.WS_PORT || 3002
const wsServer = new Websocket.Server({
  server: httpServer,
  port: WS_PORT,
  // path: "/socket",
});

wsServer.on("connection", (socket) => {
  // Send new peer ID
  socket.on("message", (peer) => {
    socket.send(peer);
  });
});

httpServer.listen(PEERJS_PORT);
console.log("Peer server running @ http://localhost:", PEERJS_PORT);