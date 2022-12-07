const proto = require('./data/proto')
String.prototype.getBytes = proto.StringBytes
Buffer.prototype.getBytes = proto.BytesHex
Number.prototype.getBytes = proto.getBytes
Boolean.prototype.getBytes = proto.getBytes
const parser_mod = require('./data/parser')
var LOG_MODE = 0;
if (process && process?.argv){
  let arg_values = process.argv.slice(2);
  LOG_MODE = parseInt(arg_values[0]);
}
const net = require('net')
var KEEP_ALIVE = 200000
const port = 80
const server = net.createServer()
let recent_response = undefined
let response_value = (data) => { 
  response_any = default_response = 0x01
  response_any = parser_mod.blockParser(data)
  /*console.log('<<--', response_any, typeof response_any)*/
  return response_any || default_response
}
let response_write = (data, data_type='hex', options={type: 'text/plain'}) => {
  let data_hex = data.toString(data_type);
  let data_log = data_hex;
  if(LOG_MODE == 0){
    let data_length = data_hex.length > 255 ? 255 : data_hex.length;
    data_log = data_hex.substring(0, data_length);
  }
  console.log(' \nREQ:', data_log, data.length )
  let respond = recent_response = response_value(data)
  /*console.log('TYPE?:', typeof respond, respond)*/
  if (typeof respond == 'object'){
    console.log('OBJECT ?:', respond.getBytes())
    return respond
  }else{
    recent_response = respond.getBytes()
  }
  return respond.getBytes()
}
server.on('connection', (socket) => {
  socket.setNoDelay(true)
  socket.setKeepAlive(true, 9*KEEP_ALIVE)
  socket.setTimeout(10*KEEP_ALIVE)
  socket.on('data', (data) => {
    console.log('\nClient IP:' , `${socket.remoteAddress} ; RemotePort: ${socket.remotePort}`)
    socket.write(response_write(data))
    console.log( "\nAT: ", new Date() , "\nRES: ", recent_response)
  })

  socket.on('close', () => {
    console.log('Communication closed \n\tAT: ', new Date())
    parser_mod.files_reset()
  })

  socket.on('error', (err) => {
    console.log('Error in socket: ', err.message)
    parser_mod.files_reset()
  })
})

server.listen(port, () => {
  console.log('Server listening on Port:', server.address().port)
})