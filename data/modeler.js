class DeviceType {
    #_type_id = undefined
    #devices = ['gps', 'dualcam']
    set type_id(any_id) {
        this.#_type_id = any_id
    }
    type_name = undefined
    getname() {
        this.type_name = this.#devices[this.#_type_id - 1]
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
    _property_id = undefined
    properties = ['latitude', 'longitude']
    _property_value = undefined
    _property_stamp = undefined
    _property_block = undefined
    parseProperty() {

    }
    getname() {
        const type_name = this.properties[this._property_id - 1]
        /* console.log('type_name?:', type_name) */
        return type_name
    }
    constructor(property_block = undefined) {
        this._property_block = property_block
        this.parseProperty()
    }
    toString() {
        return `${this.getname()}=>${this._property_value},`
    }
}
class EventType {
    _event_type_id = undefined
    __event_keys = ['switch-on', 'switch-off']
    __property_keys = {'1':'Digital Input 1'}
    __property_values = {'1':{'0':'no', '1':'yes'}}
    _properties = undefined
    addProperty(any_property) {
        if (this._properties == undefined) {
            this._properties = {}
        }
        if (any_property.constructor.name === 'Object'){
            let property_key = Object.keys(any_property)[0]
            let property_value = any_property[property_key]
            property_value = this.checkPropertyValue(property_key, property_value)
            property_key = this.checkProperty(property_key)
            any_property = {}
            any_property[property_key] = property_value
        }
        this._properties = {...this._properties, ...any_property}
    }

    checkPropertyValue(property_key, property_value) {
        if (Object.keys(this.__property_values).includes(property_key)){
            if (Object.keys(this.__property_values[property_key]).includes(property_value)){
                return this.__property_values[property_key][property_value]
            }
        }
        return property_value;
    }

    checkProperty(property_key) {
        if (Object.keys(this.__property_keys).includes(property_key)){
            return this.__property_keys[property_key]
        }
        return property_key;
    }
    set event_type_id(any_id) {
        this._event_type_id = any_id
    }
    getname() {
        const type_name = this.__event_keys[this._event_type_id - 1]
        /* console.log('type_name?:', type_name) */
        return type_name
    }
    constructor(event_type_id = 1) {
        this._event_type_id = event_type_id
    }
    toString() {
        let properties_msg = this._properties ? `Events:(${this._properties.toString()})` : ""
        let msg = `(EventType:${this.getname()},${properties_msg}])`
        return msg
    }
}
class DeviceEvent extends EventType {
    _event_id = undefined
    _event_object = undefined
    _event_block = undefined
    _codec = undefined
    _crc = undefined
    set crc(any_crc) {
        this._crc = any_crc
    }
    set codec(any_codec) {
        this._codec = any_codec
    }
    parseEvent() {
        if (this._event_block !== undefined){

        }else if (this._event_object !== undefined){
            if (this._event_object?.event_id !== undefined){
                this._event_type_id = this._event_id = this._event_object.event_id
            }
            if (this._event_object?.codec !== undefined){
                this._codec = this._event_object.codec
            }
            if (this._event_object?.crc !== undefined){
                this._crc = this._event_object.crc
            }
            this.parseProperties()
            this.saveEvent()
        }
    }
    parseProperties() {
        if (this._event_block !== undefined){

        }else if (this._event_object !== undefined){
            for (const property_key in this._event_object){
                const anyProperty = Object.fromEntries(
                    Object.entries(this._event_object).filter(
                        ([index])=> index === property_key) );
                this.addProperty(anyProperty);
            }
        }
    }
    constructor(event_data = undefined) {
        super()
        if (event_data.constructor.name === 'Buffer'){
            this._event_block = event_data
        }else if(event_data.constructor.name === 'Object'){
            this._event_object = event_data
        }
        this.parseEvent()
    }
    saveEvent() {
        /*TODO : write .spia (HEX data (key value) for DB spiaview inserts (evnts & properties)*/
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
    }
    get imei() {
        return this.#_imei
    }
    addEvent(any_event) {
        if (this._events == undefined) {
            this._events = {}
        }
        this._events.push(new DeviceEvent(any_event))
    }
    set type(any_type_id) {
        this.#_type = any_type_id
    }
    constructor(imei_id = undefined, type_id = 1) {
        super(imei_id, type_id)
        this.#_imei = imei_id
        this.#_type = type_id
    }
    toString() {
        let events_msg = this._events ? `Events:(${this._events.toString()})` : ""
        let msg = `Device:[${super.toString()}${events_msg}]`
        return msg
    }
}
module.exports = {
    "DeviceData": Device,
    "DeviceEvent": DeviceEvent,
    "EventProp": EventProperty
}