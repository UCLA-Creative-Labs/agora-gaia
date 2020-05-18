const Pool = require('pg').Pool
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PWD,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
})

const getData = (socket, timestamp) => {
    const timestampsec = Math.floor(timestamp / 1000);
    const query = 'SELECT data FROM canvas_data WHERE time_stamp > to_timestamp('
                    + timestampsec
                    + ') ORDER BY time_stamp ASC';

  pool.query(query, (error, results) => {
    if (error) {
      throw error
    }
    /** @type {any[]} */
    let res = []
    for(let i = 0; i < results.rows.length; i++){
      res.push(results.rows[i].data)
    }
    socket.emit('package', res);
  })
}

async function queueData(client_pool, buffer_time, data, socket){
  await setTimeout(() =>{
    if(client_pool.get(socket.handshake.address).can_undo) {
        pushData(client_pool, data, socket);
    }
  }, buffer_time);
};

const pushData = (client_pool, data, socket) => {
    client_pool.get(socket.handshake.address).can_undo = false;
    pool.query('INSERT INTO canvas_data VALUES (now(), $1)',[data], (error, results) => {
      if (error) {
        throw error
      }
      socket.broadcast.emit('stroke', data);
        socket.emit('disableundo', true);
    })
}

module.exports = {
  getData,
  queueData,
  pushData,
}
