/*
00000000 -> <pre>
000003af -> <len>
8e -> <codec>
0a -> n!
-- Event[0]
00000181b0548ca0 -> timestamp
01 -> priority
d3d408be -> lon 
02c1e423 -> lat
0a3e -> height
009e -> angle
06 -> satelites
0000 -> speed
01f3 -> event_id
000f -> n!(Property:keys)
0008 -> n!(Property){0,2}
-- Property <<
00f0:01
0015:05
00c8:00
0045:01
0001:01
01f1:03
01f2:03
01f3:01
0005 -> n!(Property){0,4}
-- Property <<
00b5:0011
00b6:000f
0042:34de
0043:0000
0044:0000
0002 -> n!(Property){0,8}
-- Property <<
00f1:000b2bc7
0010:00000446
0000 -> n!(Property){0,16}+
-- Property <<
0000 -> n!(Property){0,/x(2..n)/}+
-- Property <<
-- Event[1]
00000181b08485e0
01
d3d4072f
02c1ebc1
0a18
00c6
08
0000
01f3
000f
0008
00f0:01,0015:05,00c8:00,0045:01,0001:01,01f1:03,01f2:03,01f3:01
0005
00b5:000e,00b6:000b,0042:34b0,0043:0000,0044:0000
0002
00f1:000b2bc7,0010:000006a0
0000
0000
-- Event[2]
new Date(0x00000181b0938d88)
0x01
d3d406a9
02c1e6ce
0a27
0x00d7
0x09
0000
01f3
000f
000800f00100150500c80000450100010101f10301f20301f301000500b5000c00b600080042347e0043000000440000000200f1000b2bc70010000007890000000000000181b104e91001d3d40c3202c1ec250a17002908000001f3000f000800f00100150500c80000450100010101f10301f20301f301000500b5000d00b6000a004234f60043000000440000000200f1000b2bc7001000000a270000000000000181b115a63801d3d4086b02c1e5810a3500170a000401f3000f000800f00100150500c80000450100010101f10301f20301f301000500b5000c00b60009004234b50043000000440000000200f1000b2bc7001000000ac80000000000000181b14a911801d3d407d502c1eaa60a18002a0a000001f3000f000800f00100150500c80000450100010101f10301f20301f301000500b5000b00b60007004234710043000000440000000200f1000b2bc7001000000b670000000000000181b187f3f001d3d405af02c1ec140a16012c0e000001f3000f000800f00100150500c80000450100010101f10301f20301f301000500b5000a00b60006004234c30043000000440000000200f1000b2bc7001000000cbe0000000000000181b1946b5801d3d4052a02c1e4340a2d00d90d000501f3000f000800f00100150500c80000450100010101f10301f20301f301000500b5000a00b60006004234870043000000440000000200f1000b2bc7001000000cfd0000000000000181b19ec3c801d3d4063502c1f6e30000000003000001f3000f000800f00100150500c80000450200010101f10301f20301f301000500b5003000b6002e004234f20043000000440000000200f1000b2bc70010000007d9
0000
0000
-- Event[9]
00000181b1aa1e08
01
(~0xd3d40059 + 1 >>> 0).toString(16)*-1[1:]
02c1ec89
0a30
0111
09
0000
01f3
000f
0008
00f0:01,0015:00,00c8:00,0045:01,0001:01,01f1:03,01f2:03,01f3:01
0005
00b5:000c,00b6:0008,0042:34ae,0043:0000,0044:0000
0002
00f1:00000000,0010:00000941
0000
0000
0a n! [END]
00006427 -> CRC
*/
const parser_mod = require('./data/parser')
const mapper_mod = require('./data/modeler')
const proto = require('./data/proto')
let input_block = '000000000000033d8e07000001825fad29000100000000000000000000000000000000010013000800f00100150500c80000450200010000b400001465017d00000600b5000000b6000000430fc90044008c001a08960068004d000400f1000b2bc500100000000001d30000012a01d400b8ff5900000001014c0001b7000001826099d2f001d3d4079202c1ef770a13003f07000000420014000800f00000150500c80000450100010000b400001400017d00000700b5000c00b6000800421fd000430f0c00440000001a0bb800680bb8000400f1000b2bc500100000002701d30000013001d400f800af00000001014c0001b7000001826099d6d801d3d4079202c1ef770a13003f07000000fc0014000900f00000150500c80000450100010000b400001400017d0000fc01000600b5000c00b6000800430f0100440000001a0bb800680bb8000400f1000b2bc500100000002701d30000013001d400f800af00000001014c0001b70000018264df779801d3d3fc1d02c1e50c0a24000005000000420014000800f00000150500c80000450100010000b400001465017d00000700b5001200b60010004220cf00430d3b00440000001a08ce0068004d000400f1000b2bc500100000000001d30000821e01d40000000200000001014c0001b70000018264df7f6801d3d3fc1d02c1e50c0a24000004000000fc0014000900f00000150500c80000450100010000b400001465017d0000fc01000600b5002600b6001000430d1a00440000001a08ce0068004d000400f1000b2bc500100000000001d30000821e01d40000000200000001014c0001b70000018265df47e00100000000000000000000000000000000420014000800f00000150500c80000450200010000b400001467017d00000700b5000000b6000000421ff900430d0300440000001a09b30068004b000400f1000b2bc500100000000001d30000022801d40000000000000001014c0001b70000018265df53980100000000000000000000000000000000fc0014000900f00000150500c80000450200010000b400001467017d0000fc01000600b5000000b6000000430ccb00440000001a09b30068004b000400f1000b2bc500100000000001d30000022801d40000000000000001014c0001b707000066c5'
input_block = '00000000000003af8e0a00000181b0548ca001d3d408be02c1e4230a3e009e06000001f3000f000800f00100150500c80000450100010101f10301f20301f301000500b5001100b6000f004234de0043000000440000000200f1000b2bc70010000004460000000000000181b08485e001d3d4072f02c1ebc10a1800c608000001f3000f000800f00100150500c80000450100010101f10301f20301f301000500b5000e00b6000b004234b00043000000440000000200f1000b2bc70010000006a00000000000000181b0938d8801d3d406a902c1e6ce0a2700d709000001f3000f000800f00100150500c80000450100010101f10301f20301f301000500b5000c00b600080042347e0043000000440000000200f1000b2bc70010000007890000000000000181b104e91001d3d40c3202c1ec250a17002908000001f3000f000800f00100150500c80000450100010101f10301f20301f301000500b5000d00b6000a004234f60043000000440000000200f1000b2bc7001000000a270000000000000181b115a63801d3d4086b02c1e5810a3500170a000401f3000f000800f00100150500c80000450100010101f10301f20301f301000500b5000c00b60009004234b50043000000440000000200f1000b2bc7001000000ac80000000000000181b14a911801d3d407d502c1eaa60a18002a0a000001f3000f000800f00100150500c80000450100010101f10301f20301f301000500b5000b00b60007004234710043000000440000000200f1000b2bc7001000000b670000000000000181b187f3f001d3d405af02c1ec140a16012c0e000001f3000f000800f00100150500c80000450100010101f10301f20301f301000500b5000a00b60006004234c30043000000440000000200f1000b2bc7001000000cbe0000000000000181b1946b5801d3d4052a02c1e4340a2d00d90d000501f3000f000800f00100150500c80000450100010101f10301f20301f301000500b5000a00b60006004234870043000000440000000200f1000b2bc7001000000cfd0000000000000181b19ec3c801d3d4063502c1f6e30000000003000001f3000f000800f00100150500c80000450200010101f10301f20301f301000500b5003000b6002e004234f20043000000440000000200f1000b2bc70010000007d90000000000000181b1aa1e0801d3d4005902c1ec890a30011109000001f3000f000800f00100150000c80000450100010101f10301f20301f301000500b5000c00b60008004234ae0043000000440000000200f1000000000010000009410000000000006427'
console.log(input_block)
input_block = Buffer.from(input_block, "hex")
console.log('buffered: ', input_block)
const block_length = input_block.length
response_any = parser_mod.blockParser(input_block)
let device = parser_mod.deviceObject
console.log('response:', response_any/*, device*/)
let default_imei = '000f383630383936303530373934383538'
if (device == undefined) {
    device = new mapper_mod.DeviceData(Buffer.from(default_imei, "hex"))
    console.log("New DEVICE: ", device.toString())
}
const codec = input_block[8]
const events = input_block[9]
if (events == input_block[block_length - 5]) {
    console.log('events:', events,
        input_block.subarray(block_length - 5, block_length - 4))
}
const crc = input_block.subarray(block_length - 2)
console.log('codec:', Buffer.from([codec]), 'crc:', crc)
let events_block = input_block.subarray(10, block_length - 5)
/*console.log('events.block:', events_block[events_block.length-1])*/
let loop = 0, block_index = 0, block_complete = false
while (loop < events) {
    const end_index = block_index + 8
    let timestamp = new Date(parseInt(
        events_block.subarray(block_index, end_index).toString('hex'), 16))
    console.log("[" ,loop+1, "]!", 
        // timestamp, events_block.subarray(block_index, end_index).toString('hex'),
        `${timestamp.getFullYear()}/${timestamp.getMonth()+1}/${timestamp.getDate()}`,
        `${timestamp.getHours()}:${timestamp.getMinutes()}:${timestamp.getMinutes()}`)
    let is_timestamp = timestamp.toString() != 'Invalid Date'
    is_timestamp &= timestamp.getFullYear() < new Date().getFullYear() + 1
    if (!is_timestamp) {
        break
    }
    console.log('Events(', loop + 1, ')')
    console.log('timestamp', timestamp)
    const priority = parseInt(
        events_block.subarray(block_index + 8, block_index + 9)
            .toString('hex'), 16)
    console.log('priority', priority/*, 'loop:', loop+1*/)
    const coordinates = {}
    coordinates['longitude'] = proto.coordinate(parseInt(
        events_block.subarray(block_index + 9, block_index + 13)
            .toString('hex'), 16))
    coordinates['latitude'] = proto.coordinate(parseInt(
        events_block.subarray(block_index + 13, block_index + 17)
            .toString('hex'), 16))
    coordinates['altitude'] = parseInt(
        events_block.subarray(block_index + 17, block_index + 19)
            .toString('hex'), 16)
    coordinates['angle'] = parseInt(
        events_block.subarray(block_index + 19, block_index + 21)
            .toString('hex'), 16)
    console.log('coordinates', coordinates/*, 'loop:', loop+1*/)
    const satelites = parseInt(
        events_block.subarray(block_index + 21, block_index + 22)
            .toString('hex'), 16)
    console.log('satelites', satelites/*, 'loop:', loop+1*/)
    const speed = parseInt(
        events_block.subarray(block_index + 22, block_index + 24)
            .toString('hex'), 16)
    console.log('speed', speed/*, 'loop:', loop+1*/)
    const event_id = parseInt(
        events_block.subarray(block_index + 24, block_index + 26)
            .toString('hex'), 16)
    console.log('event_id', event_id/*, 'loop:', loop+1*/)
    let properties_keys = parseInt(
        events_block.subarray(block_index + 26, block_index + 28)
            .toString('hex'), 16)
    console.log('properties', properties_keys/*, 'loop:', loop+1*/)
    const properties = {}
    if (properties_keys < 1) {
        loop++
        continue
    }
    loop_properties = 0
    let property_start = block_index + 28
    // 142
    while (loop_properties !== false) {
        let keys_for_properties = parseInt(
            events_block.subarray(property_start, property_start + 2)
                .toString('hex'), 16)
        let value_indexes = Math.pow(2, loop_properties)
        property_start += 2
        let is_x_bytes = (value_indexes > 8)
        for (let property of Array(keys_for_properties).keys()) {
            prop_key = parseInt(
                events_block.subarray(property_start, property_start + 2)
                    .toString('hex'), 16)
            /* console.log("KEY? [", property_start, ":" ,property_start + 2,"] =>", prop_key) */
            property_start += !is_x_bytes ? 2 : 4
            let property_value_end = property_start + value_indexes
            if (is_x_bytes) {
                const property_x_bytes_end = parseInt(
                    events_block.subarray(property_start - 2, property_start)
                        .toString('hex'), 16)
                property_value_end = property_start + Math.pow(2, property_x_bytes_end-1)
                // console.log("XBYTES ? [", property_start, ":", property_value_end, "]{", property_x_bytes_end, "}")
            }
            prop_value = parseInt(
                events_block.subarray(property_start, property_value_end)
                    .toString('hex'), 16)
            // console.log("VALUE? [", property_start, ":", property_value_end, "] =>", prop_value)
            properties[prop_key] = prop_value
            property_start = property_value_end
            /* if (is_x_bytes) */ 
                // console.log(`{"${prop_key}":` , prop_value,'}[', property + 1, "] ", value_indexes,"!")
        }
        loop_properties++
        properties_keys -= keys_for_properties
        /* if (is_x_bytes || value_indexes == 8)  */
        /* console.log('left ?: {', properties_keys,'} >> ', 
            events_block.subarray(property_start, property_start + 4)) */
        if (properties_keys <= 0) {
            block_index = property_start
            while ( parseInt(events_block.subarray(block_index, block_index+4).toString('hex'), 16) == 0){
                // console.log("empty !!", events_block.subarray(block_index, block_index+4).toString('hex'))
                block_index += 4
                property_start = block_index
            }
            // console.log('next ?: [', loop+2,']! >> ', events_block.subarray(block_index, block_index + 8))
            break
        }
    }
    console.log('properties', properties/*, 'loop:', loop+1*/)
    // if(block_complete){        
    loop++;
    //}
}