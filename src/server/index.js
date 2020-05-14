const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const db = require('./queries')
const port = 3000

app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
)

app.get('/', (request, response) => {
  response.send({ info: 'Test, Node.js, Express, and Postgres API' })
})

app.get('/data', db.getData)
app.post('/data', db.pushData)

app.listen(port, () => {
  console.log(`App running on port ${port}.`)
})