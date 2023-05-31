const the_vars = require('./vars')
const calc = require('./calc')
var IP_ADDRESS = 'dualcam.spia.com.co'
var PORT_NUMBER = '9971'
const example_hex_block = command_wrapper(`camreq:1,1,5,${Math.round(new Date().getTime() / 1000)}`)
let CAM_COMMAND = 'camreq'

function command_wrapper(command_value){
    const command_offset = Buffer.from([1]);
    const command_value_encoded = Buffer.from(command_value, the_vars.UTF8_SETTING.encoding)
    /*.toString(the_vars.HEX)*/
    const command_value_length = Buffer.from((command_value_encoded.length)
        .toString(the_vars.RADIX_HEX), the_vars.HEX)
    let command_alloc = 4 - command_value_length.length
    const command_value_size = Buffer.concat([Buffer.alloc(command_alloc), command_value_length])
    let the_command = Buffer.concat([command_value_size, command_value_encoded])
    the_command = Buffer.concat([the_vars.CMD.TYPE.SEND, the_command])
    the_command = Buffer.concat([command_offset, the_command, command_offset])
    the_command = Buffer.concat( [the_vars.CMD.RESPONDING , the_command] )
    const the_command_length = the_command.toString(the_vars.HEX).length
    let the_command_size = Buffer.from((the_command_length/2)
        .toString(the_vars.RADIX_HEX), the_vars.HEX)
    command_alloc = 4 - the_command_size.length
    the_command_size = Buffer.concat([Buffer.alloc(command_alloc), the_command_size])
    const utf8_command = Buffer.from(the_command, the_vars.HEX)
        .toString(the_vars.UTF8_SETTING.encoding)
    let crc16_ARC = calc.calculate_crc(0, utf8_command, 'ARC')
    crc16_ARC = Buffer.from(crc16_ARC, the_vars.HEX)
    command_alloc = 4 - crc16_ARC.length
    let command_crc = Buffer.from(crc16_ARC, the_vars.HEX);
    command_crc = Buffer.concat([Buffer.alloc(command_alloc), command_crc])
    the_command = Buffer.concat([the_command, command_crc])
    the_command = Buffer.concat([Buffer.alloc(4), the_command_size, the_command])
    return the_command
}
function command_camreq(record_time = 10, cam_mode = 0, cam_origin = 3) {
    const cam_timestamp = Math.round(new Date().getTime() / 1000)
    const cam_params = `${cam_mode},${cam_origin}`
    const time_params = `${cam_timestamp},${record_time}`
    let command_value = `${CAM_COMMAND}:${cam_params},${time_params}`
    command_value += `,${IP_ADDRESS},${PORT_NUMBER}`
    return command_wrapper(command_value) ?? null
}

function command_dout(option= 1, time= 60){
    CAM_COMMAND = 'setdigout'
    let command_value = `${CAM_COMMAND} ${option} ${time}`
    return command_wrapper(command_value) ?? null
}

function sendCommand(hex_block=false, test=false) {
    if (!hex_block && test){
        hex_block = /*(test ? */command_camreq() /*: command_dout(1, 300))*/
            ?? Buffer.from(example_hex_block, the_vars.HEX)
    }else if (typeof hex_block == 'string'){
        Buffer.from(hex_block, the_vars.HEX)
    }
    console.log('sendCommand >>', hex_block)
    return hex_block
}
module.exports = {
    "sendCommand":sendCommand,
    "setdigout":command_dout,
    "camreq":command_camreq
}