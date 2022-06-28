const net = require('net')
const port = 80
const server = net.createServer()
let response_value = (data) => { 
  response_any = default_response = '01'
  console.log('<<--', response_any)
  return default_response
}
let response_write = (data, dtype='hex', options={type: 'text/plain'}) => {
  console.log(' \nREQ:', data.toString(dtype))
  return new Blob([response_value(data)], options)
}
server.on('connection', (socket) => {
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