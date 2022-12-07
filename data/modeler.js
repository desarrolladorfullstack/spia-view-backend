class DeviceType{
    _type_id = undefined
    devices = ['gps','dualcam']
    set type_id(any_id){
        this._type_id = any_id
    }
    getname(){
        const type_name = this.devices[this._type_id-1]
        /* console.log('type_name?:', type_name) */
        return type_name
    }
    constructor (type_id=1){
        this._type_id = type_id
    }
    toString(){
        return `DeviceType:${this.getname()}`
    }
}
class Imei extends DeviceType{
    _id = undefined
    set id(any_id){
        this._id = any_id
    }
    constructor (imei_id=undefined, type_id=1){
        /* console.log('type_id?:', type_id) */
        super(type_id)
        this._id = imei_id.toString()
    }
    toString(){
        return `Imei:${this._id},${super.toString()}`
    }
}
class EventProperty {
    _property_id = undefined
    properties = ['latitude', 'longitude']
    _property_value = undefined
    _property_block = undefined
    parseProperty(){
        
    }
    getname(){
        const type_name = this.properties[this._property_id-1]
        /* console.log('type_name?:', type_name) */
        return type_name
    }
    constructor (property_block=undefined){
        this._property_block = property_block
        this.parseProperty()
    }
    toString(){
        return `${this.getname()}=>${this._property_value},`
    }
}
class EventType{
    _event_type_id = undefined
    events = ['switch-on', 'switch-off']
    _properties = undefined
    adProperty(any_property){
        if (this._properties == undefined){
            this._properties = {}
        }
        this._properties.push(any_property)
    }
    set event_type_id(any_id){
        this._event_type_id = any_id
    }
    getname(){
        const type_name = this.events[this._event_type_id-1]
        /* console.log('type_name?:', type_name) */
        return type_name
    }
    constructor (event_type_id=1){
        this._event_type_id = event_type_id
    }
    toString(){
        let properties_msg = this._properties ? `Events:(${this._properties.toString()})` : "" 
        let msg = `(EventType:${this.getname()},${properties_msg}])`
        return msg
    }
}
class DeviceEvent extends EventType{
    _event_id = undefined
    _event_type = undefined
    _event_block = undefined
    parseEvent(){
        
    }
    constructor (event_block=undefined){
        super();
        this._event_block = event_block
        this.parseEvent()
    }
    toString(){
        return `Event:(${this._event_id})::${super.toString()}`
    }
}
class Device extends Imei{
    _imei = undefined
    _codec = undefined
    _crc= undefined
    _type = 1
    _events = undefined
    set crc(any_crc){
        this._crc = any_crc
    }
    set codec(any_codec){
        this._codec = any_codec
    }
    set imei(any_imei){
        this._imei = any_imei
    }
    get imei(){
        return this._imei
    }
    addEvent(any_event){
        if (this._events == undefined){
            this._events = {}
        }
        this._events.push(any_event)
    }
    set type(any_type_id){
        this._type = any_type_id
    }
    constructor (imei_id=undefined, type_id=1){
        super(imei_id, type_id)
        this._imei = imei_id
        this._type = type_id
    }
    toString(){
        let events_msg = this._events ? `Events:(${this._events.toString()})` : "" 
        let msg = `Device:[${super.toString()}${events_msg}]`
        return msg
    }
}
module.exports = {
    "DeviceData":Device,
    "DeviceEvent":DeviceEvent,
    "EventProp":EventProperty
}