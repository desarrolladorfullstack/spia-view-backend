const proto = require('./data/proto')
String.prototype.getBytes = proto.StringBytes
Buffer.prototype.getBytes = proto.BytesHex
Number.prototype.getBytes = proto.getBytes
Boolean.prototype.getBytes = proto.getBytes
const parser_mod = require('./data/parser')
const sender_mod = require('./data/sender')
const worker_mod = require('./data/worker')
const the_vars = require('./data/vars')
const LOG_MIN_LENGTH = 255
var LOG_MODE = 0
var TEST_MODE = true
var PORT_NUMBER = 80
if (process && process?.argv != undefined && process.argv.length > 0) {
  let arg_values = process.argv.slice(2)
  const log_mode_arg = arg_values[0]
  if (log_mode_arg != undefined) {
    LOG_MODE = parseInt(log_mode_arg)
    console.log("LOG_MODE =>", LOG_MODE, `'${log_mode_arg}'`)
  }
  if (arg_values.length > 1) {
    TEST_MODE = (parseInt(arg_values[1]) == 1) ?? false
  }
  if (arg_values.length > 2) {
    PORT_NUMBER = parseInt(arg_values[2]) ?? 80
  }
}
const net = require('net')
var KEEP_ALIVE = 360000
const port = PORT_NUMBER ?? 80
function command_writer(socket, test = true, device = false) {
  if (device){
    device = (device?._id + worker_mod._ext) ?? false
  }
  return new Promise((resolve, reject) => {
    worker_mod.load(function (result) {
      if ((worker_mod?.queue_commands) || (result)) {
        console.log("check queue_commands??:", worker_mod?.queue_commands)
      }
      if (worker_mod?.queue_commands !== undefined || result) {
        let worker_commands = worker_mod?.queue_commands
        if ((worker_commands === undefined || !worker_commands) && (result)) {
          console.log('worker_command is result > ', result.constructor.name)
          worker_commands = result
        }
        let hex_block = false
        if (worker_commands && worker_commands.length > 0) {
          const command_type_name = worker_commands.constructor.name
          if (command_type_name === 'Array') {
            hex_block = worker_commands[0]
            let command_extracted = hex_block
              .toString(the_vars.UTF8_SETTING.encoding)
            command_extracted = command_extracted
              .substring(15, command_extracted.length - 3)
            console.log('queue_commands typeof is Array[!]:', command_extracted)
          } else if (command_type_name === 'Object') {
            console.log("queue_commands typeof is Object")
            hex_block = Object.values(worker_commands)[0]
          } else if (command_type_name === 'Buffer') {
            console.log("queue_commands typeof is Buffer")
            hex_block = worker_commands
          }
        }
        if (test) {
          console.log('command_writer TEST:', test)
        }
        const command = sender_mod.sendCommand(hex_block, test)
        if (command) {
          try {
            socket.write(command)
            if(!worker_commands || !hex_block){
              worker_mod.add(command, true, device)
            }
          } catch (socker_write_e) {
            console.log('SEND COMMAND:', command, 'ERROR:', socker_write_e)
          }
          if (test) {
            worker_mod.queue_commands = false
          }
          resolve(command)
        } else {
          console.log('COMMAND NOT FOUND:', command, hex_block)
          reject(`COMMAND NOT FOUND: ${command}`)
        }
      }
    }, device)
  }).then((success) => {
    if (success.length > 0) {
      let command_value = success.toString(the_vars.UTF8_SETTING.encoding)
      command_value = command_value.substring(15, command_value.length - 4)
      console.log("CMD:", command_value ?? success/* , success.constructor.name */)
      worker_mod.shift((updated)=>{
        console.log("worker_mod.shift:", updated)
        if (!updated) {
          command_next = sender_mod.next(command)
          if (command_next){
            worker_mod.add(command_next,true,device)
          }
        }
        /* if (updated){ */
          /* return */ command_writer(socket, false)
          return command_value
        /* } */
      }, device)
    }else{      
      /* return */ command_writer(socket, false)
      return success
    }
  }).catch((failed) => {
    console.error("Error in command_writer:", failed)
    return failed
  })
}
function socket_handler(socket) {
  const remoteAddress = socket.remoteAddress
  const remotePort = socket.remotePort
  socket.setNoDelay(true)
  socket.setKeepAlive(true, 9 * KEEP_ALIVE)
  socket.setTimeout(10 * KEEP_ALIVE)
  socket.on('data', onSocketData)
  socket.once('close', onSocketClose)
  socket.on('error', onSocketError)
  socket.on('timeout', onSocketTimeout)
  function onSocketTimeout() {
    console.log('Connection from', remoteAddress, 'timeouted \n\tAT:', new Date())
    parser_mod.files_reset()
  }
  function onSocketData(data) {
    console.log('\nClient IP:', `${remoteAddress} ; RemotePort: ${remotePort}`)
    if (parser_mod.parser_options) {
      const connection_client = `${remoteAddress}:${remotePort}`
      /* console.log("set connection", connection_client) */
      parser_mod.parser_options["connection"] = connection_client
    } else {
      console.log("parser_options??", parser_mod.parser_options)
    }
    socket.write(response_write(data))
    console.log("\nAT:", new Date(), "\nRES:",
      recent_response.toString(the_vars.HEX) ?? recent_response)
      /** FORCE camreq */
      if (recent_response.toString(the_vars.HEX) !== "01"){
        socket.write(sender_mod.camreq())
        console.log("SEND camreq")
      }
    /* command_writer(socket, TEST_MODE)
      .then((msg) => console.log(`running command_writer!!! => ${msg}`)) */
  }
  function onSocketClose() {    
    const connection_client = `${remoteAddress}:${remotePort}`
    console.log('Communication from', connection_client,
      'closed \n\tAT: ', new Date())
    parser_mod.files_reset()
    let device_connection = false
    if (worker_mod.conn.hasOwnProperty(connection_client)){
      device_connection = worker_mod.conn[connection_client]
      delete worker_mod.conn[connection_client]
      console.log('remove connection device:',
       !worker_mod.conn.hasOwnProperty(connection_client))
    }
    command_writer(socket, TEST_MODE, device_connection)
      .then((msg) => console.log(`running command_writer!!! => ${msg}`))
  }
  function onSocketError(err) {
    console.log('Error in', remoteAddress, 'socket:', err.message, err.stack)
    parser_mod.files_reset()
  }
}

let recent_response = undefined
const default_response = 0x01
function response_value(data) {
  let response_any = default_response
  response_any = parser_mod.blockParser(data)
  /*console.log('<<--', response_any, typeof response_any)*/
  return response_any || default_response
}
function response_write(
  data, data_type = the_vars.HEX,
  options = { type: 'text/plain' }
) {
  let data_hex = data.toString(data_type)
  let data_log = data_hex
  if (LOG_MODE == 0) {
    const isLogMinLength = data_hex.length > LOG_MIN_LENGTH
    let data_length = isLogMinLength ? LOG_MIN_LENGTH : data_hex.length
    data_log = data_hex.substring(0, data_length)
    console.log("LOG_MIN_LENGTH =>", LOG_MIN_LENGTH)
  }
  console.log(' \nREQ:', data_log, data.length)
  let respond = recent_response = response_value(data)
  /*console.log('TYPE?:', typeof respond, respond)*/
  if (typeof respond == 'object') {
    console.log('OBJECT ?:', respond.getBytes())
    return respond
  } else {
    recent_response = respond.getBytes()
  }
  return respond.getBytes()
}

let net_options = null
const server = net.createServer(net_options, socket_handler)

server.listen(port, socket_listener)

function socket_listener() {
  console.log('Server listening on Port:', server.address().port)
}
