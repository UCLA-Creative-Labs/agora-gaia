const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const db = require('./queries.js');

const port = 3000;
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

var client_count = 0;
let client_pool = new Map();

io.on("connection", (socket) => {
  console.log(client_pool)

  if(!client_pool.get(socket.handshake.address)){      // If current IP address has NOT been seen before
    client_pool.set(socket.handshake.address, {'last_send': null, 'can_undo': false});
  }

  socket.emit('handshake', client_pool.get(socket.handshake.address))
  client_count += 1;
  console.log("New client connected. Current connection count: " + client_count);
  db.getData(socket);

  socket.on("update", (data) => {
    client_pool.set(socket.handshake.address, {'last_send': Date.now(), 'can_undo': true});
    console.log(client_pool);
    db.pushData(data, socket);
  });

  socket.on("undo", (data) => {
    let res;
    if(client_pool.get(socket.handshake.address)){
      client_pool.delete(socket.handshake.address);
      console.log(client_pool)
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

