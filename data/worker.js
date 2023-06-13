const fs_mod = require('fs')
const path_mod = require("path")
const the_vars = require("./vars")
var queue_commands = true
const QUEUE_COMMANDS_FILE = '.worker'
const connections = {}
module.exports = {
    "conn": connections,
    "load": load,
    "add": add_queue_commands,
    "queue_commands": queue_commands,
    "checkDir": check_dir,
    "checkFile": check_file,
    "writeFile": write_file
}
const QUEUE_COMMANDS_FILE_PATH = './'

function load(callback = false) {
    /*fs_mod.readdir(QUEUE_COMMANDS_FILE_PATH, (err, files) => {
        files.forEach(file => {
            const media_file = path_mod.resolve(QUEUE_COMMANDS_FILE_PATH, file)
            const isDirectory = fs_mod.lstatSync(media_file).isDirectory()
            if (!isDirectory) {*/
    let queued_file_path = QUEUE_COMMANDS_FILE_PATH + QUEUE_COMMANDS_FILE
    let reader_options = {}
    reader_options = the_vars.UTF8_SETTING
    fs_mod.readFile(queued_file_path, reader_options, function (err, data) {
        if (data === undefined/* || data.toString() <= 0*/) {
            console.log("QUEUE_COMMANDS_FILE is undefined!")
            save("", true)
            return data
        }
        const lines = data.toString()
        if (data && lines.length > 0) {
            console.log(`lines of QUEUE_COMMANDS_FILE >> (${data}) => '${lines}'`)
        }
        let queued_buffered_command = Buffer.from(data, the_vars.HEX)
        if (data && queued_buffered_command) {
            console.log("queued_buffered_command >> ",
                `('${queued_buffered_command.toString(the_vars.HEX)}')`,
                `=> ${queued_buffered_command.constructor.name}`)
        }
        if (queued_buffered_command.length > 0) {
            add_queue_commands(queued_buffered_command, false)
            if (queue_commands.constructor.name === 'Buffer') {
                let command_extracted = queue_commands
                    .toString(the_vars.UTF8_SETTING.encoding)
                command_extracted = command_extracted
                    .substring(15, command_extracted.length-3)
                console.log('queue_commands added!!', command_extracted)
            } else if (queue_commands.constructor.name === 'Array') {
                for (let command_value of queue_commands) {
                    let command_extracted = command_value
                        .toString(the_vars.UTF8_SETTING.encoding)
                    command_extracted = command_extracted
                        .substring(15, command_extracted.length-3)
                    console.log('queue_commands added [!]', command_extracted)
                }
            } else {
                console.log('queue_commands added!', queue_commands)
            }
        } else if (lines.length <= 0) {
            queue_commands = false
            console.log("lines 0 =>", queue_commands)
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

function save(commands, create = false) {
    let data_hex = commands
    console.log("save commands ??:", commands.constructor.name)
    if (typeof commands == 'boolean') {
        data_hex = commands.toString()
    } else if (['Array', 'Object'].includes(commands.constructor.name)) {
        for (const command of commands) {
            save(command, create)
        }
        return
    } else if (commands.constructor.name === 'Buffer') {
        data_hex = commands.toString(the_vars.HEX)
        console.log("data_hex >>", `${data_hex}`, data_hex)
    }
    console.log("save commands >>", `(${data_hex})`, data_hex.constructor.name)
    write_file(QUEUE_COMMANDS_FILE_PATH + QUEUE_COMMANDS_FILE, `${data_hex}`, create)
}
function add_queue_commands(commands, update = true) {
    const queue_commands_type_name = queue_commands.constructor.name
    if (update) {
        console.log(`add_queue_commands T(${queue_commands_type_name}):`, commands,
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
        save(commands)
    }
    return this
}

function check_dir(path = '/home/node/data/', callback, strict = true) {
    let exists = false
    const path_struct = path_mod.parse(path)
    console.log("check_dir>>", path_struct.dir, path_struct.base)
    fs_mod.readdir(`${path_struct.dir}/`, (err, folders) => {
        if (!err && folders && folders.length > 0) {
            folders.forEach(folder => {
                const inner_dir = path_mod.resolve(path_struct.dir, folder)
                const isDirectory = fs_mod.lstatSync(inner_dir).isDirectory()
                /*console.log('check_dir->exists?:', inner_dir, isDirectory)*/
                if (isDirectory && path.indexOf(inner_dir) > -1) {
                    console.log('check_dir->exists:', inner_dir, folder)
                    exists = true
                }
            })
        } else if (err) {
            console.warn("check_dir->readdir ", path, folders, '\n\t ERROR:', err)
        }
        if (/*exists/!*!== false*!/ &&*/ (callback)) {
            if (callback.constructor.name === 'Function') {
                console.log("callback of load() ... ")
                if (strict && !exists) {
                    fs_mod.mkdir(path, (err) => {
                        if (err) {
                            return console.log('mkdir ERROR:', err)
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
    console.log("check_file>>", path_struct.dir, path_struct.base)
    fs_mod.readdir(`${path_struct.dir}/`, (err, files) => {
        if (!err && files && files.length > 0) {
            files.forEach(file => {
                const inner_file = path_mod.resolve(path_struct.dir, file)
                const isDirectory = fs_mod.lstatSync(inner_file).isDirectory()
                /*console.log('check_file->exists?:', inner_file, !isDirectory)*/
                if (!isDirectory && path.indexOf(inner_file) > -1) {
                    console.log('check_file->exists:', inner_file, file)
                    exists = true
                }
            })
        } else if (err) {
            console.warn("check_file->readdir ", path, files, "\n\t ERROR:", err)
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
    if (!data || data.constructor.name === 'Boolean') {
        console.log('write_file ERROR: data is not valid!')
        return false
    }
    if (!create) {
        fs_mod.appendFileSync(
            file_path,
            "\n" + data,
            (err) => handled_error_fs(err))
    } else {
        fs_mod.writeFileSync(
            file_path,
            data,
            (err) => handled_error_fs(err))
    }
    return this
}

function handled_error_fs(error) {
    if (error) {
        console.error(['Error in handled_error_fs: ', error])
    } else {
        console.log("File content written successfully!", QUEUE_COMMANDS_FILE)
    }
}