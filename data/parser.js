const mapper_mod = require('./modeler')
const worker_mod = require('./worker')
const fs_mod = require('fs')
const path_mod = require('path')
const {exec} = require('child_process')
const IMEI_BYTE_LENGTH = 8
const CAM_INIT_BYTE_LENGTH = 4
const CAM_SETTINGS_BYTE_LENGTH = 4
const IMEI_LENGTH_BYTES = 2
const IMEI_BLOCK_LENGTH = 17
var IMEI_BLOCK_INDEX = '000f'
var IMEI_CAM_INDEX = '00000005'
var CAM_INPUT_ERROR = "0005000400000011"
var RESUME_CAM_COMMAND = Buffer.from(['00', '02'])
var FILE_REQ_CAM_COMMAND = Buffer.from(['00', '08'])
var REPEAT_INIT_CAM_COMMAND = Buffer.from(['00', '09'])
var FILE_MEDIA_PATH = '/home/node/media/'
var data_options = {}
let cam_mode = "photor"
let packet_offset = 0
let packet_size = 0
let recent_device = undefined
let recent_block = undefined
let file_raw = {}
let file_name = 'file_raw'
var orientation_cam_mode = {
    "videor":"rear",
    "videof":"front",
    "photor":"rear",
    "photof":"front"
}
var settings_cam_mode = Object.keys(orientation_cam_mode)
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
                let queued_file_path = FILE_MEDIA_PATH+file
                let reader_options = {encoding: 'utf-8'}
                fs_mod.readFile(queued_file_path, reader_options, function(err, data){
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

function define_file_type_in_file_name(file_path, file_hex_path) {
    let mime_type_cmd = `file --mime-type ${file_path}`
    exec(mime_type_cmd, (error, stdout, stderr) => {
        if (error) {
            console.warn(`error [mime_type_cmd]: ${error.message}`, mime_type_cmd)
            return
        }
        if (stderr) {
            console.warn(`stderr [mime_type_cmd]: ${stderr}`, mime_type_cmd)
            return
        }
        console.log(`stdout [mime_type_cmd]: ${stdout}`, mime_type_cmd)
        let separator_mime_type = ": "
        let is_mime_response = stdout.indexOf(separator_mime_type) > -1
        if (is_mime_response) {
            let split_mime_type = stdout.split(separator_mime_type)[1]
            if (split_mime_type.length > 0) {
                split_mime_type = split_mime_type.replace("\n", "")
            }
            let file_type = false
            console.log(`stdout [split_mime_type] => [[${split_mime_type}]]`)
            let is_video = split_mime_type == "application/octet-stream"
            if (is_video) {
                file_type = "_video"
            }
            let is_image = split_mime_type == "image/jpeg"
            if (is_image) {
                file_type = "_image"
            }
            let file_hex_release_path = file_hex_path+file_type
            console.log('file_hex_release_path:', file_hex_release_path)
            try {
                if (fs_mod.existsSync(file_hex_release_path)) {
                    let file_stamp_replace = file_hex_release_path.split('_')[2]
                    file_hex_release_path = file_hex_release_path.replace(file_stamp_replace, new Date().getTime())
                    console.log('file_hex_release_path [copy]:', file_hex_release_path)
                }
            } catch(err) {
                console.error(err)
            }
            let move_file_as_type_cmd = `cp ${file_hex_path} ${file_hex_release_path}`
            if (file_type) {
                exec(move_file_as_type_cmd, (error, stdout, stderr) => {
                    if (error) {
                        console.warn(`error [move_file_as_type_cmd]: ${error.message}`, move_file_as_type_cmd)
                        return
                    }
                    if (stderr) {
                        console.warn(`stderr [move_file_as_type_cmd]: ${stderr}`, move_file_as_type_cmd)
                        return
                    }
                    console.log(`stdout [move_file_as_type_cmd]: ${stdout}`, move_file_as_type_cmd)
                })
            }
        }
    })
}

function define_hex_file_types_for_records_flush(){
    /** generate hex file with file type definition => released file for records.sh */
    let list_hex_files_cmd = `find ${FILE_MEDIA_PATH} -name *"_hex"`
    exec(list_hex_files_cmd, (error, stdout, stderr) => {
        if (error) {
            console.warn(`error [list_hex_files_cmd]: ${error.message}`, list_hex_files_cmd)
            return
        }
        if (stderr) {
            console.warn(`stderr [list_hex_files_cmd]: ${stderr}`, list_hex_files_cmd)
            return
        }
        console.log(`stdout [list_hex_files_cmd]: ${stdout}`, list_hex_files_cmd, typeof stdout)
        let split_files_hex = stdout.split('\n')
        split_files_hex.pop()
        if (split_files_hex.length <= 0){
            console.log('split_files_hex empty ', split_files_hex)
            return
        }
        for (let file_hex_path of split_files_hex){
            if (file_hex_path.length <= 0){
                console.log('search_file_path empty ', file_hex_path)
                continue
            }
            let split_file_path = file_hex_path.split('_')
            split_file_path = split_file_path.slice(0, -2)
            let search_file_path = split_file_path.join('_')
            let search_file_path_cmd = `find ${FILE_MEDIA_PATH} -not -name *"_hex"* | grep "${search_file_path}"`
            exec(search_file_path_cmd, (error, stdout, stderr) => {
                if (error) {
                    console.warn(`error [search_file_path_cmd]: ${error.message}`, search_file_path_cmd)
                    return
                }
                if (stderr) {
                    console.warn(`stderr [search_file_path_cmd]: ${stderr}`, search_file_path_cmd)
                    return
                }
                console.log(`stdout [search_file_path_cmd]: ${stdout}`, search_file_path_cmd, typeof stdout)
                let file_path = stdout.split("\n")[0]
                define_file_type_in_file_name(file_path, file_hex_path)
            })
        }
    })
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
        define_hex_file_types_for_records_flush()
        if (any == CAM_INPUT_ERROR){
            cam_mode = change_cam_mode[cam_mode]
            console.log("cam mode switch to", cam_mode)
            return file_req_response(cam_mode)
        }
        return 0x0000
    },
    "00010006": (any=false) => {
        define_hex_file_types_for_records_flush()
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
        console.log("accept packet offset?", packet_offset, any.substring(0,64), req_offset)
        if (any.length > 16){
            let packet_data_accepted = any.substring(16)
            console.log("accept packet offset => already packet data:", packet_data_accepted.substring(0,64))
            let is_packet_data_block = packet_data_accepted.substring(0,4) == "0004"
            if (is_packet_data_block){
                return CAM_COMMANDS["0004"](packet_data_accepted)
            }
        }
        return req_offset >= packet_offset
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
        let packet_data = Buffer.from(packet_hex, 'hex')
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
        console.log("is Created",  isCreated, packet_hex.substring(0,64))
        console.log("..:: WARNING: insert as hex ::..")
        let file_path = FILE_MEDIA_PATH+file_name
        let file_hex_path = file_path+"_hex"
        for (const cam_mode_index in orientation_cam_mode) {
            let searchValue = "_"+cam_mode_index
            let replaceValue = orientation_cam_mode[cam_mode_index]
            console.log("file_path ? cam_mode_index =>", file_path, cam_mode_index, replaceValue)
            if (file_path.indexOf(searchValue) > -1){
                file_hex_path = file_path.replace(searchValue,"_"+replaceValue)+"_hex"
                break
            }
        }
        let hex_packet_data = packet_hex+"\n"
        if (isCreated){
            fs_mod.appendFileSync(
                file_path,
                packet_data,
                (err) => handled_error_fs(err))
            fs_mod.appendFileSync(
                file_hex_path,
                hex_packet_data,
                (err) => handled_error_fs(err))
        }else{
            fs_mod.writeFileSync(
                file_path,
                packet_data,
                (err) => handled_error_fs(err))
            fs_mod.writeFileSync(
                file_hex_path,
                hex_packet_data,
                (err) => handled_error_fs(err))
        }
        /*define_file_type_in_file_name(file_path, file_hex_path)*/

        return packet_response()
    }
}

function build_device(input_block) {
    const encoding = 'hex'
    const block_length = input_block.length
    let device = recent_device
    if (data_options && data_options.hasOwnProperty("connection") 
        && worker_mod.conn.hasOwnProperty(data_options['connection']) ){
        device = worker_mod.conn[data_options['connection']]
    }
    console.log('response:', response_any, device)
    let default_imei = '000f383630383936303530373934383538'
    if (device == undefined) {
        console.warn('DEVICE=>undefined')
        return false
    }
    const codec = input_block[8]
    /* device.codec = codec */
    const events = input_block[9]
    if (events == input_block[block_length - 5]) {
        console.log('events:', events,
            input_block.subarray(block_length - 5, block_length - 4))
    }
    const crc = input_block.subarray(block_length - 2)
    console.log('codec:', Buffer.from([codec]), 'crc:', crc)
    /* device.crc = crc */
    let events_block = input_block.subarray(10, block_length - 5)
    /*console.log('events.block:', events_block[events_block.length-1])*/
    let loop = 0, block_index = 0, block_complete = false
    const radix_hex = 16
    let loop_properties
    while (loop < events) {
        const end_index = block_index + 8
        let timestamp = new Date(parseInt(
            events_block.subarray(block_index, end_index).toString(encoding), radix_hex))
        let is_timestamp = timestamp.toString() != 'Invalid Date'
        is_timestamp &= timestamp.getFullYear() < new Date().getFullYear() + 1
        if (!is_timestamp) {
            timestamp = new Date(parseInt(
                events_block.subarray(block_index - 2, block_index + 6).toString(encoding), radix_hex))
            let is_timestamp_2 = timestamp.toString() != 'Invalid Date'
            is_timestamp_2 &= timestamp.getFullYear() < new Date().getFullYear() + 1
            if (!is_timestamp_2) {
                break
            } else {
                block_index -= 2
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
                .toString(encoding), radix_hex)
        console.log('priority', priority/*, 'loop:', loop+1*/)
        const coordinates = {}
        coordinates['longitude'] = proto.coordinate(parseInt(
            events_block.subarray(block_index + 9, block_index + 13)
                .toString(encoding), radix_hex))
        coordinates['latitude'] = proto.coordinate(parseInt(
            events_block.subarray(block_index + 13, block_index + 17)
                .toString(encoding), radix_hex))
        coordinates['altitude'] = parseInt(
            events_block.subarray(block_index + 17, block_index + 19)
                .toString(encoding), radix_hex)
        coordinates['angle'] = parseInt(
            events_block.subarray(block_index + 19, block_index + 21)
                .toString(encoding), radix_hex)
        console.log('coordinates', coordinates/*, 'loop:', loop+1*/)
        const satelites = parseInt(
            events_block.subarray(block_index + 21, block_index + 22)
                .toString(encoding), radix_hex)
        console.log('satelites', satelites/*, 'loop:', loop+1*/)
        const speed = parseInt(
            events_block.subarray(block_index + 22, block_index + 24)
                .toString(encoding), radix_hex)
        console.log('speed', speed/*, 'loop:', loop+1*/)
        const event_id = parseInt(
            events_block.subarray(block_index + 24, block_index + 26)
                .toString(encoding), radix_hex)
        console.log('event_id', event_id/*, 'loop:', loop+1*/)
        let properties_keys = parseInt(
            events_block.subarray(block_index + 26, block_index + 28)
                .toString(encoding), radix_hex)
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
                    .toString(encoding), radix_hex)
            let value_indexes = Math.pow(2, loop_properties)
            property_start += 2
            let is_x_bytes = (value_indexes > 8)
            for (let property of Array(keys_for_properties).keys()) {
                const prop_key_byte = events_block.subarray(
                    property_start, property_start + 2).toString(encoding)
                prop_key = parseInt(prop_key_byte, radix_hex)
                /* console.log("KEY? [", property_start, ":" ,property_start + 2,"] =>", prop_key_byte, prop_key) */
                property_start += !is_x_bytes ? 2 : 4
                let property_value_end = property_start + value_indexes
                if (is_x_bytes) {
                    const property_x_bytes_end = parseInt(
                        events_block.subarray(property_start - 2, property_start)
                            .toString(encoding), radix_hex)
                    property_value_end = property_start + Math.pow(2, property_x_bytes_end - 1)
                    // console.log("XBYTES ? [", property_start, ":", property_value_end, "]{", property_x_bytes_end, "}")
                }
                prop_value = parseInt(
                    events_block.subarray(property_start, property_value_end)
                        .toString(encoding), radix_hex)
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
                let block_end = block_index + 4
                while (parseInt(events_block.subarray(block_index, block_end).toString(encoding), radix_hex) == 0) {
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
    }else{
        console.log("is Cam Command", isCamCommand, "=>", cam_command_index)
    }
    if (isIMEI) {
        const imei_id = bufferBlock.subarray(IMEI_LENGTH_BYTES, IMEI_BLOCK_LENGTH);
        recent_device = new mapper_mod.DeviceData(imei_id)
        console.log("Init device:", recent_device.toString())
        /*000f383630383936303530373934383538*/
        if (bufferBlock.length > IMEI_BLOCK_LENGTH){
            console.log("can receive trace joined:", bufferBlock)
            recent_block = bufferBlock = bufferBlock.subarray(IMEI_BLOCK_LENGTH)
            return analyse_block(bufferBlock)
        }
        return true
    }
    if (isCamIMEI) {
        try {
            let imei_byte_start = CAM_INIT_BYTE_LENGTH + IMEI_BYTE_LENGTH /* + IMEI_LENGTH_BYTES */
            let settings = bufferBlock.subarray(imei_byte_start, imei_byte_start + CAM_SETTINGS_BYTE_LENGTH)
            let imei_hex_block = bufferBlock.subarray(CAM_INIT_BYTE_LENGTH, imei_byte_start).toString('hex')
            bufferBlock = parseInt(imei_hex_block, 16)
            console.log('cam imei??', typeof bufferBlock, bufferBlock)
            let cam_mode_bin = parseInt(settings.subarray(0,2).toString('hex'),16)
                .toString(2).padStart(8, '0').substring(2,6)
            console.log('cam settings??', cam_mode_bin, parseInt(settings.toString('hex'),16))
            let index_of_settings_cam_mode = settings_cam_mode.indexOf(cam_mode)
            if (Object.keys(cam_mode_bin).indexOf(index_of_settings_cam_mode.toString()) > -1 ){
                if (cam_mode_bin[index_of_settings_cam_mode] == 0){
                    for (const index_bin_cam_mode in cam_mode_bin) {
                        if (cam_mode_bin[index_bin_cam_mode] == 1){
                            cam_mode = settings_cam_mode[index_bin_cam_mode]
                            let log_type = 'settings_cam_mode[index_bin_cam_mode]'
                            console.log(log_type, settings_cam_mode[index_bin_cam_mode])
                            break
                        }
                    }
                }
            }
            define_hex_file_types_for_records_flush()
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
        if (data_options){
            if (data_options.hasOwnProperty("connection")){
                if ( !worker_mod.conn.hasOwnProperty(data_options['connection']) ){
                    worker_mod.conn[data_options['connection']] = recent_device
                    let json = JSON.stringify(worker_mod.conn[data_options['connection']])
                    json = json.replace('"_id"','"imei"')
                    console.log("Add connection by options:", 
                        data_options['connection'],
                        "<pre>",json,"</pre>");
                }
                if(block_success !== true){
                    let is_event_block = block_success == bufferBlock[9]
                    if (recent_block != undefined){
                        is_event_block |= block_success == recent_block[9]
                        if (recent_block != bufferBlock){
                            bufferBlock = recent_block
                        }
                    }
                    if (is_event_block){
                        console.log("Block event:", bufferBlock)
                        build_device(bufferBlock)
                    }
                }
            }
        }
        let data_read_log = block_success ?? Buffer.from(block_success, 16)
        console.log("MOD::read_block-> ", data_read_log/* , typeof block_success */)
    } catch (e) {
        console.error("MOD::read_block[ERR] ", e)
    }
    /*console.log("MOD::read_block?? ", typeof block_success)*/
    return block_success
}

module.exports = {
    "blockParser": read_block,
    "deviceObject": recent_device,
    "files_reset": () => define_hex_file_types_for_records_flush(),
    "parser_options": data_options
}