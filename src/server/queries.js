const Pool = require('pg').Pool
const pool = new Pool({
  user: 'opc',
  password: 'test',
  host: '0.0.0.0',
  database: 'canvas-db',
  port: 5432,
})

const getData = (request, response) => {
  pool.query('SELECT data FROM canvas_data ORDER BY time_stamp ASC', (error, results) => {
    if (error) {
      throw error
    }
    /** @type {any[]} */
    let res = []
    for(let i = 0; i < results.rows.length; i++){
      res.push(results.rows[i].data)
    }
    response.status(200).json(res)
  })
}

const pushData = (request, response) => {
  const data = request.body;
  pool.query('INSERT INTO canvas_data VALUES (now(), $1)',[data], (error, results) => {
    if (error) {
      throw error
    }
    response.status(201).send("Succesfully added data");
  })
}

module.exports = {
  getData,
  pushData,
}
