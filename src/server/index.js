const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const db = require('./queries.js')

const port = 3000;
const app = express();

const server = http.createServer(app);

const io = socketIo(server);

var client_count = 0;

let buffer_pool = new Map();

io.on("connection", (socket) => {
  client_count += 1;
  console.log("New client connected. Current connection count: " + client_count);
  db.getData(socket);

  socket.on("update", (data) => {
    if(buffer_pool.get(socket.handshake.address)){
      socket.emit("ack", "Something Exists already pls undo");
    }
    else{
      buffer_pool.set(socket.handshake.address, data);
      console.log(buffer_pool)
      console.log(1)
      db.pushData(buffer_pool.get(socket.handshake.address), socket);
      console.log(2);
      socket.emit("ack", "Successfully pushed");
    }
  });
  socket.on("undo", (data) => {
    let res;
    if(buffer_pool.get(socket.handshake.address)){
      buffer_pool.delete(socket.handshake.address);
      console.log(buffer_pool)
      res = "Succesfully Deleted Line";
    }else{
      res = "No line exists for this client";
    }
    socket.emit("ack", res);
  });

  socket.on("disconnect", () => {
    client_count -= 1;
    console.log("Client disconnected Current connection count: " + client_count);
  });
});


server.listen(port, () => console.log(`Listening on port ${port}`));

