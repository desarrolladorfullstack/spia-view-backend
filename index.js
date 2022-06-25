const net = require('net');
const port = 80;
const server = net.createServer()

server.on('connection', (socket)=>{
    socket.on('data', (data)=>{
        console.log('\nEl cliente ' + socket.remoteAddress + " : " + socket.remotePort + " dice: " + data)
        socket.write('Recibido!')
    })

    socket.on('close', ()=>{
        console.log('Comunicación finalizada')
    })

    socket.on('error', (err)=>{
        console.log(err.message)
    })
})

server.listen(port, ()=>{
    console.log('servidor esta escuchando en la puerta', server.address().port)
})