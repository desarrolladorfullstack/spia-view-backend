var IMEI_BLOCK_INDEX = '000f'
var IMEI_CAM_INDEX = '00000005'
var CAM_COMMANDS = {
    "00010006": () => {
        let response_cam = Buffer.from(['00','02']),
        response_length = Buffer.from(['00','04']),
        response_payload = Buffer.from(['00','00','00','01'])
        response_cam = Buffer.concat([response_cam, response_length, response_payload])
        return Buffer.from(response_cam,'hex')
    },
    "init": (cam_input="videor") => {
        let response_cam = Buffer.from(['00','08']),
        response_length = Buffer.from(['00','07']),
        response_payload = Buffer.from(`%${cam_input}`)
        response_cam = Buffer.concat([response_cam, response_length, response_payload])
        return Buffer.from(response_cam,'hex')
    }
}
const mapper_mod = require('./modeler')
let recent_device = undefined
const build_device = (input_block)=>{
    const block_length = input_block.length
    let device = recent_device
    console.log('response:', response_any/*, device*/)
    let default_imei = '000f383630383936303530373934383538'
    if (device == undefined) {
        console.warn('DEVICE=>undefined')
        return false
    }
    const codec = input_block[8]
    device.codec = codec
    const events = input_block[9]
    if (events == input_block[block_length - 5]) {
        console.log('events:', events,
            input_block.subarray(block_length - 5, block_length - 4))
    }
    const crc = input_block.subarray(block_length - 2)
    console.log('codec:', Buffer.from([codec]), 'crc:', crc)
    device.crc = crc
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
}
const analyse_block = (bufferBlock) => {  
    let hexBlock = bufferBlock.toString('hex')
    /* console.log("MOD::analyse_block? ", typeof hexBlock) */
    let isIMEI = hexBlock.indexOf(IMEI_BLOCK_INDEX) === 0
    isCamIMEI = hexBlock.indexOf(IMEI_CAM_INDEX) === 0
    let isCamCommand = hexBlock.substring(0,8) in CAM_COMMANDS
    isCamCommand |= CAM_COMMANDS.hasOwnProperty(hexBlock.substring(0,8)) 
    if (isIMEI){
        recent_device = new mapper_mod.DeviceData(bufferBlock)
        console.log(recent_device.toString())
        return true
    }
    if (isCamIMEI){
        try{
            bufferBlock = bufferBlock.subarray(4, 16)
            console.log('cam imei?? ', typeof bufferBlock, bufferBlock.toString('hex'))
        }catch(e){
            console.error("MOD::analyse_block[ERR] ", e)
        }
        recent_device = new mapper_mod.DeviceData(bufferBlock, 2)
        console.log(recent_device.toString())
        return CAM_COMMANDS["init"]("videor")
    }
    if (isCamCommand){
        return CAM_COMMANDS[hexBlock.substring(0,8)]()
    }
    return bufferBlock[9]
}
const read_block = (bufferBlock) => {
    /* console.log("MOD::read_block? ", typeof bufferBlock) */
    let block_success = true
    try {
        block_success = analyse_block(bufferBlock)
        console.log("MOD::read_block-> ", block_success, typeof block_success)
    }catch (e){
        console.error("MOD::read_block[ERR] ", e)
    }
    /* console.log("MOD::read_block?? ", typeof block_success) */
    return block_success
}
module.exports.blockParser = read_block
module.exports.deviceObject = recent_device