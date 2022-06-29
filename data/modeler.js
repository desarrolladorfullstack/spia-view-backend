class DeviceType{
    _id = undefined
    _devices = ['gps','dualcam']
    set id(any_id){
        this._id = any_id
    }
    constructor (type_id=1){
        this._id = type_id - 1
    }
    toString(){
        return `<DeviceType:${this._devices[this._id]}>`
    }
}
class Imei extends DeviceType{
    _id = undefined
    set id(any_id){
        this._id = any_id
    }
    constructor (imei_id=undefined, type_id=undefined){
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
    constructor (imei_id=undefined, type_id=1){
        super(imei_id, type_id)
    }
    toString(){
        return `<Device:[${super.toString()}]>`
    }
}
module.exports = {
    "DeviceData":Device
}