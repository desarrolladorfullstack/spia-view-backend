const mapper_mod = require('./modeler')
const fs_mod = require('fs')
const path_mod = require('path')
var IMEI_BLOCK_INDEX = '000f'
var IMEI_CAM_INDEX = '00000005'
var CAM_INPUT_ERROR = "0005000400000011"
var RESUME_CAM_COMMAND = Buffer.from(['00', '02'])
var FILE_REQ_CAM_COMMAND = Buffer.from(['00', '08'])
var REPEAT_INIT_CAM_COMMAND = Buffer.from(['00', '09'])
var FILE_MEDIA_PATH = '/home/node/media/'
let cam_mode = "photor"
let packet_offset = 0
let packet_size = 0
let recent_device = undefined
let file_raw = {}
let file_name = 'file_raw'

var change_cam_mode = {
    "videor":"videof",
    "videof":"photor",
    "photor":"photof",
    "photof":"videor"
}
const load_temp_packets = () => {
    let queued_packets = {}
    fs_mod.readdir(FILE_MEDIA_PATH, (err, files) => {
        files.forEach(file => {
            const media_file = path_mod.resolve(FILE_MEDIA_PATH, file)
            const isDirectory = fs_mod.lstatSync(media_file).isDirectory()
            if (!isDirectory) { 
                fs_mod.readFile(FILE_MEDIA_PATH+file, {encoding: 'utf-8'}, function(err,data){
                    let queued_offset = parseInt(data)
                    if (queued_offset > 0) {
                        queued_packets[file] = queued_offset
                    }
                })
            }
        })
    })
    if (queued_packets && Object.keys(queued_packets).length === 0
    && Object.getPrototypeOf(queued_packets) === Object.prototype){
        console.log('[queued packets not found]')
        return false
    }
    console.log('[queued packets] =>', queued_packets)
    return queued_packets
} 
const save_temp_packet = (file_name, offset) => {
    fs_mod.writeFileSync(
        FILE_MEDIA_PATH+'temp_'+file_name,
        `${offset}`,
        (err) => handled_error_fs(err))
}
const packet_response = (any=false) => {
    if (packet_offset > 0 && packet_offset >= packet_size){
        console.warn("reset counters for other packing.", file_name, 'completed')
        packet_offset = 0
        file_raw[file_name] = []
        file_name = 'file_raw'
        recent_packet = undefined
        cam_mode = change_cam_mode[cam_mode]
        save_temp_packet(file_name, -1)
        return REPEAT_INIT_CAM_COMMAND 
    } 
    if (!any) {
        packet_offset++
    } 
    save_temp_packet(file_name, packet_offset)
    let payload_hex = ['00', '00', '00', packet_offset]
    let response_payload = Buffer.from(payload_hex)
    if (packet_offset > 255){
        let hex_offset = packet_offset.toString(16)
        if (hex_offset.length%2 == 1 ) {
             hex_offset = "0"+hex_offset 
        }
        /* console.log('hex', hex_offset) */
        for (let count = 0; count < Math.round(hex_offset.length/2) ; count ++) {
            const start = hex_offset.length - (count * 2) - 2
            const end = hex_offset.length - (count * 2)
            const offset_byte = hex_offset.substring(start, end)
            /* console.log('offset', offset_byte , count, start, end) */
            payload_hex[payload_hex.length-1-count]=offset_byte
        }
        response_payload = Buffer.from(payload_hex.join(''),'hex')
    }
    const response_length = Buffer.from(['00', payload_hex.length])
    console.log('payload_hex', packet_offset, payload_hex, response_payload)
    const response_cam = Buffer.concat([RESUME_CAM_COMMAND, response_length, response_payload])
    console.log(file_name, 'write count', packet_offset, 'of', packet_size)
    return Buffer.from(response_cam, 'hex')
}
const file_req_response = (cam_input="videor") => {
    const queued_files = load_temp_packets()
    if (queued_files) {
        file_name = Object.keys(queued_files)[0]
        packet_offset = queued_files[file_name]
        console.log('queued file:', file_name, packet_offset)
        return packet_response()
    }
    const payload_hex = `%${cam_input}`
    const response_length = Buffer.from(['00', payload_hex.length])
    const response_payload = Buffer.from(payload_hex)
    const response_cam = Buffer.concat([FILE_REQ_CAM_COMMAND, response_length, response_payload])
    return Buffer.from(response_cam, 'hex')
}
var CAM_COMMANDS = {
    "init": (any=false) => { 
        if (cam_mode != "videor" && change_cam_mode.hasOwnProperty(cam_mode)){
            cam_mode = change_cam_mode[cam_mode]
        }
        console.log("cam mode init to", cam_mode)
        return file_req_response(any)
    },
    "00050004": (any=false)=>{
        if (any == CAM_INPUT_ERROR){
            cam_mode = change_cam_mode[cam_mode]
            console.log("cam mode switch to", cam_mode)
            return file_req_response(cam_mode)
        }
        return 0x0000
    },
    "00010006": (any=false) => {
        packet_size = parseInt(any.substring(8,16), 16)
        packet_offset = 0
        const recent_imei = recent_device?.imei.toString('hex')
        file_name = `file_raw_${new Date().getTime()}_${recent_imei}_${cam_mode}`
        file_raw[file_name] = []
        return packet_response()
    },
    "00030004": (any=false) =>{
        const temp_packet_offset = load_temp_packets()[file_name]
        req_offset = parseInt(Buffer.from(any.substring(8)),16)
        console.log("accept packet offset?", packet_offset, any, req_offset)
        if (req_offset < packet_offset){
            return false
        }
        return true
    },
    "0004": (any=false) => {
        /* packet_offset++ */
        if (recent_device == undefined) {
            console.error("recent_device not found")
            return packet_response()
        }
        if (any.length <= 16){
            console.warn("no packet:", any)
            return true
        }
        console.log("recent_device packets:", recent_device.toString())
        console.log(" -- > offset:", packet_offset)
        const handled_error_fs = (error) => {
            if (error) {
                console.error(['Error en escritura: ', error])
            } else {
                console.log("Archivo escrito correctamente!", file_name)
            }
        }
        const packet_len = parseInt(
            Buffer.from(any.substring(4, 8), 'hex'), 16) || 1024
        console.log(" -- > len:", packet_len)
        const packet_end = any.length - 4
        const packet_hex = any.substring(8, packet_end)
        const packet_data = Buffer.from(packet_hex, 'hex')
        let is_packet_written = file_raw.hasOwnProperty(file_name)
        if (is_packet_written){
            is_packet_written = file_raw[file_name].includes(packet_hex.substring(0, 128))
        }else{
            file_raw[file_name] = []
        }
        const heap_of_packets = false /* packet_size > 100 */
        if (is_packet_written && !heap_of_packets) {
            console.log("packet already written", packet_hex.substring(0, 32))
            const keep_offset = true
            return packet_response(keep_offset)
        }
        file_raw[file_name].push(packet_hex.substring(0, 128))
        const isCreated = packet_offset > 1
        console.log("is Created",  isCreated, packet_hex)
        if (isCreated){
            fs_mod.appendFileSync(
                FILE_MEDIA_PATH+file_name,
                packet_data,
                (err) => handled_error_fs(err))
        }else{
            fs_mod.writeFileSync(
                FILE_MEDIA_PATH+file_name,
                packet_data,
                (err) => handled_error_fs(err))
        }
        return packet_response()
    }
}
const build_device = (input_block) => {
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
        let is_timestamp = timestamp.toString() != 'Invalid Date'
        is_timestamp &= timestamp.getFullYear() < new Date().getFullYear() + 1
        if (!is_timestamp) {
        timestamp = new Date(parseInt(
            events_block.subarray(block_index-2, block_index+6).toString('hex'), 16))
        let is_timestamp_2 = timestamp.toString() != 'Invalid Date'
        is_timestamp_2 &= timestamp.getFullYear() < new Date().getFullYear() + 1
        if (!is_timestamp_2){
            break
        }else{
            block_index-=2
            // console.log('is_timestamp_2 ?: [', loop+1,']! >> ', events_block.subarray(block_index, block_index + 8))
        }
    }
    console.log("[", loop + 1, "]!",
        // timestamp, events_block.subarray(block_index, end_index).toString('hex'),
        `${timestamp.getFullYear()}/${timestamp.getMonth() + 1}/${timestamp.getDate()}`,
        `${timestamp.getHours()}:${timestamp.getMinutes()}:${timestamp.getMinutes()}`)
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
            const prop_key_byte = events_block.subarray(
                property_start, property_start + 2).toString('hex')
            prop_key = parseInt( prop_key_byte, 16)
            /* console.log("KEY? [", property_start, ":" ,property_start + 2,"] =>", prop_key_byte, prop_key) */
                property_start += !is_x_bytes ? 2 : 4
                let property_value_end = property_start + value_indexes
                if (is_x_bytes) {
                    const property_x_bytes_end = parseInt(
                        events_block.subarray(property_start - 2, property_start)
                            .toString('hex'), 16)
                    property_value_end = property_start + Math.pow(2, property_x_bytes_end - 1)
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
                while (parseInt(events_block.subarray(block_index, block_index + 4).toString('hex'), 16) == 0) {
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
        loop++
        //}
    }
}
const analyse_block = (bufferBlock) => {
    let hexBlock = bufferBlock.toString('hex')
    /* console.log("MOD::analyse_block? ", typeof hexBlock) */
    let isIMEI = hexBlock.indexOf(IMEI_BLOCK_INDEX) === 0
    isCamIMEI = hexBlock.indexOf(IMEI_CAM_INDEX) === 0
    let cam_command_index = hexBlock.substring(0, 8)
    let isCamCommand = cam_command_index in CAM_COMMANDS
    isCamCommand |= CAM_COMMANDS.hasOwnProperty(cam_command_index)
    if (!isCamCommand){
        cam_command_index = hexBlock.substring(0, 4)
        isCamCommand = cam_command_index in CAM_COMMANDS
        isCamCommand |= CAM_COMMANDS.hasOwnProperty(cam_command_index)
    }
    console.log("is Cam Command", isCamCommand, "=>", cam_command_index)
    if (isIMEI) {
        recent_device = new mapper_mod.DeviceData(bufferBlock)
        console.log(recent_device.toString())
        return true
    }
    if (isCamIMEI) {
        try {
            bufferBlock = bufferBlock.subarray(4, 16)
            console.log('cam imei?? ', typeof bufferBlock, bufferBlock.toString('hex'))
        } catch (e) {
            console.error("MOD::analyse_block[ERR] ", e)
        }
        recent_device = new mapper_mod.DeviceData(bufferBlock, 2)
        console.log(recent_device.toString())
        return CAM_COMMANDS["init"](cam_mode)
    }
    if (isCamCommand) {
        return CAM_COMMANDS[cam_command_index](hexBlock)
    }
    return bufferBlock[9]
}
const read_block = (bufferBlock) => {
    /* console.log("MOD::read_block? ", typeof bufferBlock) */
    let block_success = true
    try {
        block_success = analyse_block(bufferBlock)
        console.log("MOD::read_block-> ", block_success ?? Buffer.from(block_success, 16)/* , typeof block_success */)
    } catch (e) {
        console.error("MOD::read_block[ERR] ", e)
    }
    console.log("MOD::read_block?? ", typeof block_success)
    return block_success
}
module.exports.blockParser = read_block
module.exports.deviceObject = recent_device