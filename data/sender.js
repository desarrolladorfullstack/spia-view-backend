const the_vars = require('./vars')
const example_hex_block = "00000000000000340C01050000002C63616D7265713A302C312C313637313437323434392C31302C31382E3233342E3136362E3230382C39313938010000DC95"
export const sendCommand = function (hex_block=false) {
    if (!hex_block){
        hex_block = example_hex_block
    }
    return Buffer.from(hex_block, the_vars.HEX)
}