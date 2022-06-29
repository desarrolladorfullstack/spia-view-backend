const parser_mod = require('./data/parser')
const net = require('net')
var KEEP_ALIVE = 3000
const port = 80
const server = net.createServer()
String.prototype.getBytes = function () {
  let bytes = []
  for (let iter = 0; iter < this.length; ++iter) {
    bytes.push(this.charCodeAt(iter))
  }
  return Buffer.from(bytes)
}
Buffer.prototype.getBytes = function () {
  return this.toString('hex')
}
Number.prototype.getBytes = function () {
  return Buffer.from([this])
}
Boolean.prototype.getBytes = function () {
  return Buffer.from([this])
}
let response_value = (data) => { 
  response_any = default_response = 0x01
  response_any = parser_mod.blockParser(data)
  console.log('<<--', response_any, typeof response_any)
  return response_any || default_response
}
let response_write = (data, dtype='hex', options={type: 'text/plain'}) => {
  console.log(' \nREQ:', data.toString(dtype))
  return response_value(data).getBytes()
}
server.on('connection', (socket) => {
  socket.setKeepAlive(true)
  socket.on('data', (data) => {
    console.log('\nCliente: ' , `${socket.remoteAddress} : ${socket.remotePort}`)
    socket.write(response_write(data))
    console.log( "\nAT: ", new Date() , "\nRES: ", response_write(data))
  })

  socket.on('close', () => {
    console.log('Comunicación finalizada')
  })

  socket.on('error', (err) => {
    console.log('error en socket: ', err.message)
  })
})

server.listen(port, () => {
  console.log('servidor esta escuchando en puerto', server.address().port)
})