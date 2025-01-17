const fs_mod = require('fs')
const path_mod = require("path")
const the_vars = require("./vars")
var queue_commands = true
const QUEUE_COMMANDS_FILE = '.worker'
const QUEUE_COMMANDS_FILE_PATH = '/opt/extra/'
const connections = {}
module.exports = {
    "_ext": QUEUE_COMMANDS_FILE,
    "_path": QUEUE_COMMANDS_FILE_PATH,
    "conn": connections,
    "load": load,
    "add": add_queue_commands,
    "queue_commands": queue_commands,
    "checkDir": check_dir,
    "checkFile": check_file,
    "writeFile": write_file,
    "shift": shift_queue_commands
}
function load(callback = false, filename = QUEUE_COMMANDS_FILE, add_path = true) {
    /*fs_mod.readdir(QUEUE_COMMANDS_FILE_PATH, (err, files) => {
        files.forEach(file => {
            const media_file = path_mod.resolve(QUEUE_COMMANDS_FILE_PATH, file)
            const isDirectory = fs_mod.lstatSync(media_file).isDirectory()
            if (!isDirectory) {*/
    if (!filename){
        filename = QUEUE_COMMANDS_FILE
    }
    let queued_file_path = filename
    if (add_path) {
        queued_file_path = QUEUE_COMMANDS_FILE_PATH + queued_file_path
        /* console.log("Adding file path in load():", queued_file_path) */
    }
    let reader_options = {}
    reader_options = the_vars.UTF8_SETTING
    fs_mod.readFile(queued_file_path, reader_options, function (err, data) {
        if (data !== undefined /* && data.toString() > 0 */){
            const lines = data.toString()
            if (data && lines.length > 0) {
                console.log(`lines of ${queued_file_path} >> [${data.length}] => [${lines.length}]`)
            }
            if (lines.indexOf("\n") !== -1){
                console.log('data lines:', lines)
                console.log('readFile.queue_commands:', queue_commands)
            }
            let queued_buffered_command = Buffer.from(data, the_vars.HEX)
            if (data && queued_buffered_command) {
                if (queued_buffered_command.length <= 0) {
                    console.log("queued_buffered_command ??:",
                        `${queued_buffered_command.toString(the_vars.HEX)}`)
                } else if (queued_buffered_command.constructor.name !== 'Buffer'){
                    console.log("queued_buffered_command >> ",
                        `[${queued_buffered_command.length /* toString(the_vars.HEX) */}]`,
                        `=> ${queued_buffered_command.constructor.name}`)
                }
            }
            if (queued_buffered_command.length > 0) {
                add_queue_commands(queued_buffered_command, false)
                if (queue_commands.constructor.name === 'Buffer') {
                    const command_extracted = queue_commands
                        .subarray(15, queue_commands.length - 5)
                        .toString(the_vars.UTF8_SETTING.encoding)
                    console.log('queue_commands added!!', command_extracted)
                } else if (queue_commands.constructor.name === 'Array') {
                    for (let command_value of queue_commands) {
                        let command_extracted = command_value
                        if (command_extracted.constructor.name === 'Array') {
                            command_extracted = Array.from(command_value).shift()
                        }
                        if (command_extracted.constructor.name === 'Buffer') {
                            command_extracted = command_extracted
                                .subarray(15, command_value.length - 5)
                                    .toString(the_vars.UTF8_SETTING.encoding)
                        }else{                            
                            console.log('queue_commands T[!]:', command_extracted.constructor.name)
                        }
                        console.log('queue_commands added [!]', command_extracted)
                    }
                } else {
                    console.log('queue_commands added!', queue_commands)
                }
            } else if (lines.length <= 0) {
                queue_commands = false
                console.log(queued_file_path, ": lines 0 =>", queue_commands)
            }
        }else if (data === undefined/* || data.toString() <= 0*/) {
            console.log("QUEUE_COMMANDS_FILE is undefined!")
            save("", true, filename)
            queue_commands = false
            /* return false */
        }
        if ((callback)) {
            if (callback.constructor.name === 'Function') {
                console.log("callback of load() ... ")
                callback(queue_commands)
            } else {
                console.log("callback type in load() =>", callback.constructor.name)
            }
        }
    })
    /*        }
        })
    })*/
    return this
}

function save(commands, create = false, filename = QUEUE_COMMANDS_FILE, add_path = true) {
    let data_hex = commands
    if (typeof commands == 'boolean') {
        console.log('data_hex is Boolean:', data_hex, 'create:', create)
        if (!create){
            return this
        }
    } else if (['Array', 'Object'].includes(commands.constructor.name)) {
        for (const command of commands) {
            save(command, create, filename, add_path)
        }
        return
    } else if (commands.constructor.name === 'Buffer') {
        data_hex = commands.toString(the_vars.HEX)
        /* console.log("data_hex >>", `${data_hex}`, data_hex) */
    } else if (commands.constructor.name !== 'String') {
        console.log("save commands ??:", commands.constructor.name)
    } else  {
        console.log("save command (HEX STRING):", data_hex)
    }
    if (data_hex && data_hex.length > 0){
        const data_buffer = Buffer.from(data_hex, the_vars.HEX)
        const extracted_data_hex = data_buffer.subarray(15, data_buffer.length - 5).toString()
        const timestamp = new Date().getTime()
        console.log("save commands >>", `([${extracted_data_hex}][\\t][${timestamp}])`, 'in', filename)
        /* data_hex = `${data_hex}\t${timestamp}` */
    }
    let file_path = filename
    if (add_path) {
        file_path = QUEUE_COMMANDS_FILE_PATH + file_path
        if (!data_hex || data_hex.length <= 0){
            console.log("Adding file path to queue for processing:",  file_path)
        }
    }
    write_file(file_path, `${data_hex}`, create)
    return this
}
function add_queue_commands(commands, update = true, filename = QUEUE_COMMANDS_FILE) {
    const queue_commands_type_name = queue_commands.constructor.name
    if (update) {
        console.log(`add_queue_commands T(${queue_commands_type_name}):`, commands?.length,
            /* "update:", update*/)
    }
    if (queue_commands_type_name === 'Boolean') {
        queue_commands = [commands]
    } else if (queue_commands_type_name === 'Array') {
        queue_commands.concat([commands])
    } else if (queue_commands_type_name === 'Object') {
        queue_commands = { ...queue_commands, ...commands }
    } else {
        queue_commands = [queue_commands]
        queue_commands.concat([commands])
    }
    if (update) {
        save(commands, false, filename)
    }
    return this
}

function check_dir(path = '/home/node/data/', callback, strict = true) {
    let exists = false
    const path_struct = path_mod.parse(path)
    /* console.log("check_dir>>", path_struct.dir, path_struct.base) */
    fs_mod.readdir(`${path_struct.dir}/`, (err, folders) => {
        if (!err && folders && folders.length > 0) {
            folders.forEach(folder => {
                const inner_dir = path_mod.resolve(path_struct.dir, folder)
                try{ 
                    const isDirectory = fs_mod.lstatSync(inner_dir).isDirectory()
                    /*console.log('check_dir->exists?:', inner_dir, isDirectory)*/
                    if (isDirectory && path.indexOf(inner_dir) > -1) {
                        /* console.log('check_dir->exists:', inner_dir, folder) */
                        exists = true
                    }
                }catch (lstatSync_e) {
                    console.warn("check_dir->readdir:", path, folders,
                        '\n\t lstatSync_e:', lstatSync_e?.message)
                }
            })
        } else if (err) {
            console.warn("check_dir->readdir ", path, folders, '\n\t ERROR:', err?.message)
        }
        if (!exists) {
            console.log('check_dir Not exists:', path)
        }
        if (/*exists/!*!== false*!/ &&*/ (callback)) {
            if (callback.constructor.name === 'Function') {
                console.log("callback of load() ... ")
                if (strict && !exists) {
                    fs_mod.mkdir(path, (err) => {
                        if (err) {
                            return console.log('mkdir ERROR:', err?.message)
                        } else {
                            callback(exists)
                        }
                        console.log(`Directory (${path}) created successfully!`)
                    })
                } else {
                    callback(exists)
                }
            } else {
                console.log("callback type in load() =>", callback.constructor.name)
            }
        }
    })
    return this/*exists !== false*/
}

function check_file(path = '/home/node/.worker', callback) {
    let exists = false
    const path_struct = path_mod.parse(path)
    /* console.log("check_file>>", path_struct.dir, path_struct.base) */
    fs_mod.readdir(`${path_struct.dir}/`, (err, files) => {
        if (!err && files && files.length > 0) {
            files.forEach(file => {
                const inner_file = path_mod.resolve(path_struct.dir, file)
                try {
                    const isDirectory = fs_mod.lstatSync(inner_file).isDirectory()
                    /*console.log('check_file->exists?:', inner_file, !isDirectory)*/
                    if (!isDirectory && path.indexOf(inner_file) > -1) {
                        /* console.log('check_file->exists:', inner_file, file) */
                        exists = true
                    }
                }catch (lstatSync_e) {
                    console.warn("check_file->readdir:", path, files,
                        '\n\t lstatSync_e:', lstatSync_e?.message)
                }
            })
        } else if (err) {
            console.warn("check_file->readdir ", path, files, "\n\t ERROR:", err?.message)
        }
        if (!exists) {
            console.log('check_file Not exists:', path)
        }
        if (/*exists/!*!== false*!/ &&*/ (callback)) {
            if (callback.constructor.name === 'Function') {
                console.log("callback of load() ... ")
                callback(exists)
            } else {
                console.log("callback type in load() =>", callback.constructor.name)
            }
        }
    })
    return this/*exists !== false*/
}

function write_file(file_path = './.worker', data = false, create = false) {
    if ((!data && !create) || data.constructor.name === 'Boolean') {
        console.log('write_file ERROR: data is not valid!:', data)
        /* load((result)=>{
            console.log('write_file: re(load) =>', result)
        }) */
        return false
    }
    if (!create) {
        console.log('write_file prepend?:', file_path, data?.length)
        load((original) => {
            let original_extracted = undefined
            if(original && original.constructor.name === 'Array'){
                let command_extracted_buffer = Array.from(original).shift()
                original_extracted = command_extracted_buffer
                if (original_extracted && original_extracted.constructor.name === 'Buffer') {
                    original_extracted = original_extracted
                        .subarray(15, command_extracted_buffer.length - 5)
                        .toString(the_vars.UTF8_SETTING.encoding)
                }
            }
            let data_extracted = data
            if(data && data.constructor.name === 'String'){
                const data_extracted_buffer = data_extracted = Buffer.from(data, the_vars.HEX)
                if (data_extracted.constructor.name === 'Buffer') {
                    data_extracted = data_extracted
                        .subarray(15, data_extracted_buffer.length - 5)
                        .toString(the_vars.UTF8_SETTING.encoding)
                }
            }
            if (data_extracted !== original_extracted){
                const isNewLine = original?.length != undefined
                if(isNewLine){
                    console.log('write_file: add', data_extracted,
                        'on beginning of', original.length, 'line(s):', original_extracted, '...')
                }else{
                    console.log('write_file: first line', data_extracted, '.')
                }
                const data_line = !isNewLine ? data : data + "\n"
                save(data_line, true, file_path, false)
                save(original, false, file_path, false)
                load((result) => {
                    if (!result){
                        console.log('write_file: prepend =>', result)
                    }else if (result.constructor.name === 'Array'){
                        for (let command_value of result) {
                            let command_extracted = command_value
                            if (command_extracted.constructor.name === 'Buffer') {
                                command_extracted = command_extracted
                                    .subarray(15, command_value.length - 5)
                                    .toString(the_vars.UTF8_SETTING.encoding)
                            }
                            console.log('write_file: prepend [!] =>', command_extracted)
                        }
                    }
                    /*console.log('write_file: prepend =>', result)*/
                }, file_path, false)
            }            
        }, file_path, false)
    } else {
        console.log('write_file create?:', file_path, data?.length)
        try{ 
            fs_mod.writeFileSync( file_path, data, (err) => handled_error_fs(err))
        }catch(writeFileSync_e) {
            handled_error_fs(writeFileSync_e)
        }
    }
    return this
}

function shift_queue_commands(callback = false, filename = QUEUE_COMMANDS_FILE) {
    load((result) => {
        if (result && result.length > 0) {
            data = result
            if (data.constructor.name === 'Array') {
                data.shift()
                if (data && data.length <= 0) {
                    console.log('queue commands ready for truncate[!]')
                } else {
                    for (let command_value of data) {
                        const command_extracted = command_value
                            .subarray(15, command_value.length - 5)
                                .toString(the_vars.UTF8_SETTING.encoding)
                        console.log('ready to shift queue commands[!]:', command_extracted)
                    }
                }
            } else {
                console.log('ready to shift queue commands:', data)
            }
            save(data, true, filename)
            load(callback, filename)
        }
    }, filename)
    return this
}

function handled_error_fs(error) {
    if (error) {
        console.error('Error in handled_error_fs:', error?.message)
    } else {
        console.log("File content written successfully!", QUEUE_COMMANDS_FILE)
    }
}