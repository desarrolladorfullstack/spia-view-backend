const crc_mod = require('./crc')
function crc16_generic(init_value, data, poly=0x8408) {
    let RetVal = init_value
    let offset
    for (offset = 0; offset < data.length; offset++) {
        let bit
        RetVal ^= data[offset]
        for (bit = 0; bit < 8; bit++) {
            let carry = RetVal & 0x01
            RetVal >>= 0x01
            if (carry) {
                RetVal ^= poly
            }
        }
    }
    return RetVal;
}

function crc16_X25(packet, hex = true) {
    const FCS = 0xffff
    const FCEND = 0xff
    const CRC16TAB = crc_mod.CRC16_X25
    let fcs = FCS 
    packet_len = packet.length
    packet_index = 0
    console.log('packet', packet, 'packet_len', packet_len)
    while (packet_len>packet_index) {
        const fcs_8 = (fcs >> 8)
        const packet_point = packet[packet_index]
        const crc16_key = (fcs ^ packet_point) & FCEND
        fcs = fcs_8  ^ CRC16TAB[crc16_key]
        packet_index ++
    }
    const crc16_result = fcs ^ FCS
    return !hex ? crc16_result : crc16_result.toString(16)
} 
var crc = {
    extractCRC: function (message) {
        crcData = message.slice(message.length - 2, message.length)
        return crcData[0] * 256 + crcData[1]
    },
    calculateCRC: function(message, previous_crc) {
        let crc_poly = 0x8408
        let idx = 0
        let crc = 0x0000
        /* the payload length is calculated with removing size of header and CRC (4 + 2 bytes) */
        let payload_length = message.length - 6
        /* the payload is separated from the message header and CRC (4 bytes ofset + length)*/
        let payload = message.slice(4, 4 + payload_length)
        /* Init value for the first message is zero and for the upcoming messages it is the CRC value of the previous message */
        crc = previous_crc
        for (idx = 0; idx < payload_length; idx++) {
            let bit;
            /* Use XOR operation for initial value and payload */
            crc ^= payload[idx]
            for (bit = 0; bit < 8; bit++) {
                let carry_bit = crc & 0x01
                crc >>= 0x01
                if (carry_bit != 0) {
                    crc ^= crc_poly
                }
            }
        }       
        return crc
    }
 }; 
 module.exports = {
    'calculate_crc': crc16_generic,
    'calculate_crc_itu': crc16_X25,
    'crc_interface': crc,
    'test': test_crc
 }