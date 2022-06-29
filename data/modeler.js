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
        return `<Imei:${this._id},${super.toString()}>`
    }
}
class Device extends Imei{
    _imei = undefined
    _type = 1
    set imei(any_imei){
        this._imei = any_imei
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
        return `<Device:[${super.toString()}]>`
    }
}
module.exports = {
    "DeviceData":Device
}