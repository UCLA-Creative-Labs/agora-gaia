const Pool = require('pg').Pool

const pool = new Pool({
  user: 'opc',
  password: 'test',
  host: '0.0.0.0',
  database: 'canvas-db',
  port: 5432,
})

const getData = (socket) => {
  pool.query('SELECT data FROM canvas_data ORDER BY time_stamp ASC', (error, results) => {
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
    if(client_pool.get(socket.handshake.address).can_undo)
      pushData(client_pool, data, socket)
  }, buffer_time);
};

const pushData = (client_pool, data, socket) => {
    client_pool.get(socket.handshake.address).can_undo = false;
    pool.query('INSERT INTO canvas_data VALUES (now(), $1)',[data], (error, results) => {
      if (error) {
        throw error
      }
      socket.broadcast.emit('stroke', data);
    })
}

module.exports = {
  getData,
  queueData,
  pushData,
}
