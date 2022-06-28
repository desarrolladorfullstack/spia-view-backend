const net = require('net')
const port = 80
const server = net.createServer()
let response_write = (data, dtype='hex') => {
  console.log(data.toString(dtype))
  return '01'
}
server.on('connection', (socket) => {
  socket.on('data', (data) => {
    console.log('\nCliente: ' , `${socket.remoteAddress} : ${socket.remotePort} \n`)
    socket.write(response_write(data))
    console.log( "\n AT: ", new Date() )
  })

  socket.on('close', () => {
    console.log('Comunicación finalizada')
  })

  socket.on('error', (err) => {
    console.log(err.message)
  })
})

server.listen(port, () => {
  console.log('servidor esta escuchando en la puerta', server.address().port)
})