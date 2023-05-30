const fs_mod = require('fs')
const path_mod = require("path");
const the_vars = require("./vars");
var queue_commands = true;
const QUEUE_COMMANDS_FILE = '.worker';
const connections = {}
module.exports = {
    "conn": connections,
    "load": load,
    "add": add_queue_commands,
    "queue_commands":queue_commands
}
const QUEUE_COMMANDS_FILE_PATH = './';

function load(callback=false) {
    /*fs_mod.readdir(QUEUE_COMMANDS_FILE_PATH, (err, files) => {
        files.forEach(file => {
            const media_file = path_mod.resolve(QUEUE_COMMANDS_FILE_PATH, file)
            const isDirectory = fs_mod.lstatSync(media_file).isDirectory()
            if (!isDirectory) {*/
                let queued_file_path = QUEUE_COMMANDS_FILE_PATH+QUEUE_COMMANDS_FILE
                let reader_options = the_vars.UTF8_SETTING
                fs_mod.readFile(queued_file_path, reader_options, function(err, data){
                    if (data == undefined){
                        console.warn("QUEUE_COMMANDS_FILE is undefined!")
                        save("", true)
                        return data;
                    }
                    const lines = data
                    console.log("lines of QUEUE_COMMANDS_FILE >> ", data)
                    let queued_buffered_command = Buffer.from(data, the_vars.HEX)
                    if (queued_buffered_command > 0) {
                        add_queue_commands(queued_buffered_command, false)
                    }
                    console.log("callback type in load() => ", typeof callback)
                    if (typeof callback == 'function'){
                        console.log("callback of load() ... ")
                        callback(queue_commands)
                    }
                })

    /*        }
        })
    })*/
    return this
}

function save(commands, create=false) {
    let data_hex = commands;
    console.log("save commands ?? ", typeof commands)
    if (typeof queue_commands != 'string'){
        data_hex = commands.toString(the_vars.HEX);
    }

    if (!create){
        fs_mod.appendFileSync(
            QUEUE_COMMANDS_FILE_PATH+QUEUE_COMMANDS_FILE,
            data_hex,
            (err) => handled_error_fs(err))
    }else{
        fs_mod.writeFileSync(
            QUEUE_COMMANDS_FILE_PATH+QUEUE_COMMANDS_FILE,
            data_hex,
            (err) => handled_error_fs(err))
    }
}
function add_queue_commands(commands, update=true){
    if (typeof queue_commands == 'array'){
        queue_commands.concat(commands)
    }else{
        queue_commands = [queue_commands]
        queue_commands.concat(commands)
    }
    if (update){
        save(commands)
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