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

var buffer_time_sec = 10;
var buffer_time     = buffer_time_sec * 1000; 

var draw_limit_sec = 120;
var draw_limit     = draw_limit_sec * 1000;

const send_handshake = (socket) =>{
  client_pool.set(socket.handshake.address, {'last_send': Date.now(), 'can_undo': true});
  socket.emit('handshake', client_pool.get(socket.handshake.address))
};

let dev_reset = false;

io.on("connection", (socket) => {
  
  if(dev_reset)                     // FOR DEV RESETS ONLY
    socket.emit('reset', null);

  socket.emit('limit', draw_limit);

  if(!client_pool.get(socket.handshake.address)){      // If current IP address has NOT been seen before
    client_pool.set(socket.handshake.address, {'last_send': null, 'can_undo': false});
  }
  socket.emit('handshake', client_pool.get(socket.handshake.address))
  client_count += 1;
  console.log("New client connected. Current connection count: " + client_count);

    socket.on('init', (timestamp) => {
        db.getData(socket, timestamp);
    });

  socket.on("update", (data) => {
    send_handshake(socket)
    db.queueData(client_pool, buffer_time, data, socket);
  });

  socket.on("undo", (data) => {
    let erased;

    if(client_pool.get(socket.handshake.address).can_undo){
      client_pool.get(socket.handshake.address).can_undo = false;
      erased = true;
    }else{
      erased = false;
    }

    socket.emit('erase', erased);
  });

  socket.on("disconnect", () => {
    client_count -= 1;
    console.log("Client disconnected Current connection count: " + client_count);
  });
});


server.listen(port, () => console.log(`Listening on port ${port}`));

