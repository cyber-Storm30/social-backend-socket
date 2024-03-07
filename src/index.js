// Import necessary modules
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const Redis = require("ioredis");

const app = express();
app.use(
  cors({
    origin: "http://localhost:3000",
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
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  sub.subscribe("MESSAGES");
  socket.on("joinRoom", (data) => {
    // socket.join(roomId);
    console.log(data);
  });

  socket.on("sendMessage", async (data) => {
    console.log("Message received", data);
    await pub.publish("MESSAGES", JSON.stringify(data.data));
    // io.emit("receiveMessage", data.data);
  });

  sub.on("message", (channel, message) => {
    if (channel === "MESSAGES") {
      io.emit("receiveMessage", JSON.parse(message));
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
