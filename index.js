const proto = require('./data/proto')
String.prototype.getBytes = proto.StringBytes
Buffer.prototype.getBytes = proto.BytesHex
Number.prototype.getBytes = proto.getBytes
Boolean.prototype.getBytes = proto.getBytes
const parser_mod = require('./data/parser')
const net = require('net')
var KEEP_ALIVE = 200000
const port = 80
const server = net.createServer()
let recent_response = undefined
let response_value = (data) => { 
  response_any = default_response = 0x01
  response_any = parser_mod.blockParser(data)
  console.log('<<--', response_any, typeof response_any)
  return response_any || default_response
}
let response_write = (data, dtype='hex', options={type: 'text/plain'}) => {
  console.log(' \nREQ:', data.toString(dtype))
  let responsed = recent_response = response_value(data)
  console.log('TYPE?:', typeof responsed, responsed)
  if (typeof responsed == 'object'){
    console.log('OBJECT ?:', responsed.getBytes())
    return responsed
  }else{
    recent_response = responsed.getBytes()
  }
  return responsed.getBytes()
}
server.on('connection', (socket) => {
  socket.setNoDelay(true)
  socket.setKeepAlive(true)
  socket.setTimeout(10*KEEP_ALIVE)
  socket.on('data', (data) => {
    console.log('\nCliente: ' , `${socket.remoteAddress} : ${socket.remotePort}`)
    socket.write(response_write(data))
    console.log( "\nAT: ", new Date() , "\nRES: ", recent_response)
  })

  socket.on('close', () => {
    console.log('Comunicación finalizada \n\tAT: ', new Date())
  })

  socket.on('error', (err) => {
    console.log('error en socket: ', err.message)
  })
})

server.listen(port, () => {
  console.log('servidor esta escuchando en puerto', server.address().port)
})