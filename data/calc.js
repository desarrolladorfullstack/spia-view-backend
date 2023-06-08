const crc_mod = require('./crc')
function crc16_generic(init_value, data, poly=0x8408) {
    if (poly == 'ARC'){
        return new crc16_arc().calcCRC16(data)
    }
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
    return RetVal
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
            let bit
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

/** execution */
function test_crc(){
    const packet = Buffer.from('ffd8ffe000104a46494600010100000100010000ffdb00c500100b0c0e0c0a100e0d0e1211101318281a181616183123251d283a333d3c3933383740485c4e404457453738506d51575f626768673e4d71797064785c656763011112121815182f1a1a2f634238426363636363636363636363636363636363636363636363636363636363636363636363636363636363636363636363636363021112121815182f1a1a2f634238426363636363636363636363636363636363636363636363636363636363636363636363636363636363636363636363636363ffc000110802d0050003012200021101031102ffc401a20000010501010101010100000000000000000102030405060708090a0b100002010303020403050504040000017d01020300041105122131410613516107227114328191a1082342b1c11552d1f02433627282090a161718191a25262728292a3435363738393a434445464748494a535455565758595a636465666768696a737475767778797a838485868788898a92939495969798999aa2a3a4a5a6a7a8a9aab2b3b4b5b6b7b8b9bac2c3c4c5c6c7c8c9cad2d3d4d5d6d7d8d9dae1e2e3e4e5e6e7e8e9eaf1f2f3f4f5f6f7f8f9fa0100030101010101010101010000000000000102030405060708090a0b1100020102040403040705040400010277000102031104052131061241510761711322328108144291a1b1c109233352f0156272d10a162434e125f11718191a262728292a35363738393a434445464748494a535455565758595a636465666768696a737475767778797a82838485868788898a92939495969798999aa2a3a4a5a6a7a8a9aab2b3b4b5b6b7b8b9bac2c3c4c5c6c7c8c9cad2d3d4d5d6d7d8d9dae2e3e4e5e6e7e8e9eaf2f3f4f5f6f7f8f9faffdd00040000ffda000c03010002110311003f007368b15ac113ea179f66924ce13ca2f8c1f507e9f9d25d69221b34bcb69bed101cee7dbb36f38e84e7ad41a56992ea539543b635fbefc1dbc1c719e7a55cd4b5289a11636036da2fd4efe41ee3230735221967a579b66d7771379100c6d6dbbb7738e80e7ad26a3a749a7cc158ee46fb8fd3774cf19e3ad6deb76bf6cbcb1b7dfb37f99f36338c007fa541ff00328ff9ff009e94586537d263b68636bebafb3bbe7e4f2f7f4f707e94cbad33cab45bab79bcf80e72db76e39c74273d6a3d374f935098aa9da8bf7dfaedeb8e33cf4a9f51d423308b2b11b6d57bf5dfd0f7191839a042be931dbc31b5edd7d9ddf3f2797bfa7b83f4a8eeb4df2ad16eade6f3e139cb6ddb8e71d09cf5a8f4dd3e4bf98aa9da8bf7dfaedeb8e33cf4ab1a8ea1198459d90db6abdfaefe87b8c8c1cd2033296af7f62ea1ff003eff00f8faff008d327d32f2de16966876a2f53b81f6f5a0092d74df36d1aeae26f2', 'hex')
    const crc_val = Buffer.from('312a','hex')
    const poly = 0x8408
    console.log(crc16_generic(0,packet,poly), parseInt(crc_val.toString('hex'), 16))
    const packet_2 = Buffer.from('2118c36ddd9e71d01cf5a8f51d3e4b0982b1dc8df75fa6ee99e33ef5b5ad5b7db2eeca0dfb37f99f36338c007fa541ff003297f9ff009e94ec329be951dbc31b5edd7d9ddf3f2797bfa7b83f4a65d699e55a2dd5bcde7c27396dbb71ce3a139eb56ef6eecf5486069ae7ecce9bb29b0bf5f7e3d2ac4e91c7e1865865f350747dbb73f3fa50073a05380abc346bfef6ff00f8faff008d12e9b756f119258b6a2f53b81feb40895f4a8e08a36bcb9f21df3f2f97bba7b83f4a86ef4df26d16ea097cf84e7736ddbb79c74273d696c6c64be94aa9da8bf79bae3ae38fc29fa9ea1198859d90db6cbd7beee87b8c8c1cd302fd917d2e2885edd79664ce2229bb18f707e95b11c8b2a0743953d0d7156d0db4dbfed175e46318fdd96ddf957431cc6db4887c893ce8f9fdf9f971f3703079f6a3719ad4552b4d4526c2498493f43576a441451453e8014514530168a28a401452528a630a292973400b4b4da5148419f41403ce28cd20fbd40c5073da9467d29a323b5381e6980b45145200a28a28b80518a334668b80628c54135e5b5b8ccd3c69fef30159d3f89b4f8b211da523fb8b46a05bd65bcbd26e9bd129343c7f645b9f519ae7b51f127db2d64b74b6dab20c12cd59e9abdf456eb04571e5c683002819fce981e805954649007bd539f58d3e0cf9975164760727f4ae025b9925399669243fed31351ef51d051603b39fc576483f731cb29fa607eb5426f15dcb7fa8b68e3ff7ce6b9bdec7a0a42e738269858d79b5ed466ce6e0463d1140aa72decf29fdedc48ff56aa7bbf1a32680b1299334dde7d2999f7a4c8f7a631fb8fad19f7a6eef6a42c7da90c7607614738e94c2def485850049cfad309e69bba8c9a005e68c1a0134bbb8e94c426da368a5a50a4f41400dda29554529523a8a7229182475a40364fbff008520623a53e643e67d698c8558a9ea2801436e383d294a83d291179abf1d9c48b1f9b260bf6a4dd80cf2306a48a69226dc8483eb56aea048350823ce6371935a6b676c0711e6a5c9580ce5bb3773daac830e8f9e075ad93d4d675cc51c7a959f96a1724e715a07ad6727d80a6bcebe7fd9b61fceab5fc8e26b885402b32807f2ab11ff00c872663d040a3f535048776a9ed9a7d410a97970a8abe4838006734efb7cdde01f9d5ba314683b14defda453198b1bb8eb48106292ec0fb647ee2a6c53d87145bb650b028152d322e235fa538b00326b27b92c5a5a88cc83f887e755eee791150c38209e4d211768a86da432c219860f7a968016969b4b4805a292b32e7548c6e48fe66cf5ed4d26c08e7d45bed4ea31b6373cd453cde6cd19273b8802a81c82493927934fb725aee0cff7c56ea0235c440c838f5a2788794d5320cbafd0d2dc0c42d537345b192a1a3b60e8483e6b7229d0de4b0be72587706a48e3f334f0738f9dcfeb', 'hex')
    const crc_val_2 = Buffer.from('0931','hex')
    console.log(crc16_generic(parseInt(crc_val.toString('hex'), 16),packet_2), parseInt(crc_val_2.toString('hex'), 16))
}





// CRC-16 ARC Table
class crc16_arc{
    /**
     * @sum   Calculate CRC16-ARC.
     *
     * @desc  Calculates the CRC16-ARC (CRC16-IBM or CRC16-ANSI with 0xA001).
     */
    #CrcArcStr(text_input) {
        let CrcArcTable = crc_mod.CRC16_ARC
        const len = text_input.length
        let crc = 0
        for (let n = 0; n < len; n++)
        {
            let c = text_input.charCodeAt(n)
            crc = CrcArcTable[(crc ^ c) & 0xFF] ^ ((crc >> 8) & 0xFF)
        }
        return crc
    }


    /**
     * @sum   Decimal to Hex.
     *
     * @desc  Calculates the HEX value of the CRC16.
     */
    #Dec2Hex16(i) {
        return (i+0x00000000).toString(16).substring(-4).toUpperCase()
    }

    /**
     * @sum   CRC16-IBM/CRC16-ANSI/CRC16-ARC calculator.
     *
     * @desc  Calculate CRC16 with CR+LF or LF check.
     */
    calcCRC16(text_input, crlf)
    {
        // Get the CRC from the text_input
        let isTelegram = text_input.indexOf('!') > -1
        if(isTelegram){
            let CRC_text = text_input.substring(text_input.indexOf('!') + 1, text_input.length)
            CRC_text = CRC_text.replace(/\n\r|\r|\n/g, "")   // Remove leftover 'newline' chars in CRC from text_input

            // Some meters have a backslash in their name, replace with "\\"      -- UNTESTED --
            //text_input = text_input.replace(/\\/g, "\\\\");                         -- UNTESTED --

            // Formatting according to Windows CR+LF or Unix LF 'new line' characters
            text_input = text_input.replace(/(\r\n|\r)/g, "\n")                     // Default LF Unix
            if (crlf) text_input = text_input.replace(/\n/g, "\r\n")                // true = CR+LF Windows, false = LF Unix

            // Remove the CRC from the text_input before calculating the CRC16
            text_input = text_input.substring(0, text_input.indexOf('!') + 1)
        }
        // Calculate the CRC16 from the text_input
        const calculatedCRC16 = this.#Dec2Hex16(this.#CrcArcStr(text_input))

        // If the CRC from text_input and calculated CRC16 are equal: return true
        if(isTelegram){
            if (CRC_text == calculatedCRC16) {
                return true
            } else {
                return false
            }
        }
        return calculatedCRC16
    }
}