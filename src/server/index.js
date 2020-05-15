const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const db = require('./queries.js')

const port = 3000;
const app = express();

const server = http.createServer(app);

const io = socketIo(server);

var client_count = 0;

io.on("connection", (socket) => {
  client_count += 1;
  console.log("New client connected. Current connection count: " + client_count);
  db.getData(socket);

  socket.on("update", (data) => {
    console.log(data)
    db.pushData(data);
    socket.broadcast.emit('stroke', data);
  });

  socket.on("disconnect", () => {
    client_count -= 1;
    console.log("Client disconnected Current connection count: " + client_count);
  });
});


server.listen(port, () => console.log(`Listening on port ${port}`));

