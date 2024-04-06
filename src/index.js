// Import necessary modules
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const Redis = require("ioredis");
const dotnev = require("dotenv");

const app = express();

dotnev.config();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
  })
);

const pub = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
});

const sub = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
});

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

sub.subscribe("MESSAGES");

io.on("connection", (socket) => {
  socket.on("ping", () => {
    socket.emit("pong");
  });

  socket.on("joinRoom", (data) => {
    // socket.join(roomId);
    console.log(data);
  });

  socket.on("sendMessage", async (data) => {
    await pub.publish("MESSAGES", JSON.stringify(data.data));
    // io.emit("receiveMessage", data.data);
  });

  sub.on("message", (channel, message) => {
    console.log("Received message from Redis:", JSON.parse(message));
    if (channel === "MESSAGES") {
      socket.emit("receiveMessage", JSON.parse(message));
    }
  });

  socket.on("disconnect", () => {
    console.log(`User ${socket.id} disconnected`);
  });
});

app.get("/", (req, res) => {
  res.send("Socket.io server is running.");
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
