const worker_mod = require("./worker")
const sender_mod = require('./sender')
const the_vars = require("./vars")
var SPIA_DATA_PATH = '/home/node/data/'
var SPIA_FILE_EXT = '.spia'
var SPIA_DEVICE = 'undefined'
var LOOP_SAVE_EVENT = 0
class DeviceType {
    #_type_id = undefined
    #_DEVICES = ['gps', 'dualcam']
    set type_id(any_id) {
        this.#_type_id = any_id
    }
    type_name = undefined
    getname() {
        this.type_name = this.#_DEVICES[this.#_type_id - 1]
        /* console.log('type_name?:', type_name) */
        return this.type_name
    }
    constructor(type_id = 1) {
        this.#_type_id = type_id
        this.getname()
    }
    toString() {
        return `DeviceType:${this.getname()}`
    }
}
class Imei extends DeviceType {
    _id = undefined
    set id(any_id) {
        this._id = any_id
    }
    constructor(imei_id = undefined, type_id = 1) {
        /* console.log('type_id?:', type_id) */
        super(type_id)
        this._id = imei_id.toString()
    }
    toString() {
        return `Imei:${this._id},${super.toString()}`
    }
}
class EventProperty {
    #_PROPERTY_KEYS = {'1':'Digital Input 1','252':'Unplug','499':'Dualcam'}
    #_PROPERTY_VALUES = {'1':{'0':'no', '1':'yes'}}
    _property_id = undefined
    _property_value = undefined
    /*_property_stamp = undefined*/
    #_property_block = undefined
    #_property_object = undefined
    parseProperty() {
        if (this.#_property_block !== undefined){

        }else if (this.#_property_object !== undefined){
            this._property_id = Object.keys(this.#_property_object)[0]
            this._property_value = this.#_property_object[this._property_id]
        }
    }
    getvalue() {
        let value_name = this._property_value
        let property_key = this._property_id.toString()
        if (Object.keys(this.#_PROPERTY_VALUES).includes(property_key)){
            let property_value_key = this._property_value.toString()
            if (Object.keys(this.#_PROPERTY_VALUES[property_key]).includes(property_value_key)){
                value_name = this.#_PROPERTY_VALUES[property_key][property_value_key]
            }
        }
        return value_name
    }
    getname() {
        let type_name = this._property_id
        /* console.log('type_name?:', type_name) */
        let property_key = this._property_id.toString()
        if (Object.keys(this.#_PROPERTY_KEYS).includes(property_key)){
            type_name = this.#_PROPERTY_KEYS[property_key]
        }
        return type_name
    }
    constructor(property_data = undefined) {
        if (property_data.constructor.name === 'Buffer'){
            this.#_property_block = property_data
        }else if(property_data.constructor.name === 'Object'){
            this.#_property_object = property_data
        }
        this.parseProperty()
    }
    toString() {
        return `${this.getname()}=>${this.getvalue()}`
    }
}
class EventType {
    #_event_type_id = undefined
    #_EVENT_KEYS = {'499':'Dualcam', '252':'Unplug'} /*['switch-on', 'switch-off']*/
    #_event_timestamp = undefined
    _properties = undefined
    addProperty(any_property) {
        if (this._properties == undefined) {
            this._properties = [] /* {} */
        }
        this._properties.push(new EventProperty(any_property))
    }
    set event_type_id(any_id) {
        this.#_event_type_id = any_id
    }
    set event_timestamp(value) {
        this.#_event_timestamp = value
    }
    get event_timestamp() {
        return this.#_event_timestamp
    }
    getname() {
        let type_name = this.#_event_type_id
        /* console.log('type_name?:', type_name) */
        let event_key = this.#_event_type_id.toString()
        if (Object.keys(this.#_EVENT_KEYS).includes(event_key)){
            type_name = this.#_EVENT_KEYS[event_key]
        }
        return type_name
    }
    constructor(event_type_id = 1) {
        this.#_event_type_id = event_type_id
    }
    toString() {
        let properties_msg = ""
        if (this._properties) {
            properties_msg = `,Properties:(${this._properties.toString()})`
        }
        let msg = `(EventType:${this.getname()}${properties_msg}])`
        return msg
    }
}
class DeviceEvent extends EventType {
    _event_id = undefined
    _event_datetime = undefined
    #_event_object = undefined
    #_event_block = undefined
    _codec = undefined
    _crc = undefined
    set crc(any_crc) {
        this._crc = any_crc
    }
    set codec(any_codec) {
        this._codec = any_codec
    }
    parseEvent() {
        if (this.#_event_block !== undefined){

        }else if (this.#_event_object !== undefined){
            if (this.#_event_object?.event_id !== undefined){
                this.event_type_id = this._event_id = this.#_event_object.event_id
            }
            if (this.#_event_object?.timestamp !== undefined){
                /*console.log('parseEvent:', this.#_event_object.timestamp)*/
                this.event_timestamp = this.#_event_object.timestamp
                this._event_datetime = new Date(this.#_event_object.timestamp*1000)
            }
            if (this.#_event_object?.codec !== undefined){
                this._codec = this.#_event_object.codec
            }
            if (this.#_event_object?.crc !== undefined){
                this._crc = this.#_event_object.crc
            }
            this.parseProperties()
            this.saveEvent()
        }
    }
    parseProperties() {
        if (this.#_event_block !== undefined){

        }else if (this.#_event_object !== undefined){
            for (const property_key in this.#_event_object){
                const anyProperty = Object.fromEntries(
                    Object.entries(this.#_event_object).filter(
                        ([index])=> index === property_key) )
                this.addProperty(anyProperty)
            }
        }
    }
    constructor(event_data = undefined) {
        super()
        if (event_data.constructor.name === 'Buffer'){
            this.#_event_block = event_data
        }else if(event_data.constructor.name === 'Object'){
            this.#_event_object = event_data
        }
        this.parseEvent()
    }
    saveEvent(loop=0) {
        /*TODO : write .spia (HEX data (key value) for DB spiaview inserts (events & properties)*/
        console.log("saveEvent:", this.getname(),
            '. At:', this._event_datetime, this.event_timestamp)
        const spia_file = this.event_timestamp + SPIA_FILE_EXT
        let event_value = Object.values(this._properties).find(
            prop_object=>prop_object._property_id.toString() === this._event_id.toString())
        /*console.log("properties in Event:", Object.values(this._properties))*/
        if (event_value !== undefined){
            event_value = Buffer.from(event_value._property_value.toString()).toString(the_vars.HEX)
        }
        const event_id = Buffer.from(this._event_id.toString()).toString(the_vars.HEX)
        let data_hex = `${event_id}\t${event_value}`
        for (const prop_object of this._properties){
            if (prop_object._property_id.toString() !== this._event_id.toString()){
                const prop_key =  Buffer.from(prop_object._property_id.toString())
                    .toString(the_vars.HEX)
                const prop_value =  Buffer.from(prop_object._property_value.toString())
                    .toString(the_vars.HEX)
                data_hex += "\n" + `${prop_key}\t${prop_value}`
            }
        }
        const spia_file_path = SPIA_DATA_PATH + SPIA_DEVICE + '/'        
        /* SPIA_DEVICE = 'undefined' */
        worker_mod.checkDir(spia_file_path, (exists_spia_folder)=>{
            /* console.log('exists_spia_folder:', exists_spia_folder) */
            /*if(exists_spia_folder){*/
                /*exists_spia_file = */
                worker_mod.checkFile(spia_file_path+spia_file, (exists_spia_file)=>{
                    if(!exists_spia_file){
                        worker_mod.writeFile(spia_file_path+spia_file,
                            data_hex + "\n~", !exists_spia_file)
                    }else if (loop < LOOP_SAVE_EVENT){
                        console.log('exists_spia_file:', exists_spia_file)
                        this.event_timestamp += 1
                        this.saveEvent(loop+1)
                    }else{
                        worker_mod.load(function (result) {
                            if (result.constructor.name === 'Array' && result.length > 0){
                                result = result[0]
                                let command_value = result.toString(the_vars.UTF8_SETTING.encoding)
                                command_value = command_value.substring(15, command_value.length-4)
                                console.log("LOOP_SAVE_EVENT(callback): (command_value) =>", command_value)
                            }else{
                                console.log("LOOP_SAVE_EVENT(callback): (result) =>", result)                    
                            }
                            if (result.constructor.name !== "Boolean"){
                                const queue_commands = [sender_mod.delete()]
                                console.log("add_queue_commands !", queue_commands)
                                worker_mod.add(queue_commands,true, SPIA_DEVICE + worker_mod._ext)
                            }
                        })
                    }
                })
            /*}*/
        })

    }
    toString() {
        return `Event:(${this._event_id})::${super.toString()}`
    }
}
class Device extends Imei {
    #_imei = undefined
    #_type = 1
    _events = undefined

    set imei(any_imei) {
        this.#_imei = any_imei
        SPIA_DEVICE = this._id.toString()
    }
    get imei() {
        return this.#_imei
    }
    addEvent(any_event) {
        if (this._events == undefined) {
            this._events = [] /* {} */
        }
        this._events.push(new DeviceEvent(any_event))
    }
    set type(any_type_id) {
        this.#_type = any_type_id
    }
    constructor(imei_id = undefined, type_id = 1) {
        SPIA_DEVICE = 'undefined'
        super(imei_id, type_id)
        this.imei = imei_id
        this.#_type = type_id
    }
    toString() {
        let events_msg = ""
        if (this._events) {
            events_msg = `,Events:(${this._events.toString()})`
        }
        let msg = `Device:[${super.toString()}${events_msg}]`
        return msg
    }
}
module.exports = {
    "DeviceData": Device,
    "DeviceEvent": DeviceEvent,
    "EventProp": EventProperty
}