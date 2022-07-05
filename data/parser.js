var IMEI_BLOCK_INDEX = '000f'
var IMEI_CAM_INDEX = '00000005'
const mapper_mod = require('./modeler')
let recent_device = undefined
const analyse_block = (bufferBlock) => {  
    let hexBlock = bufferBlock.toString('hex')
    /* console.log("MOD::analyse_block? ", typeof hexBlock) */
    let isIMEI = hexBlock.indexOf(IMEI_BLOCK_INDEX) === 0
    isCamIMEI = hexBlock.indexOf(IMEI_CAM_INDEX) === 0
    if (isIMEI){
        recent_device = new mapper_mod.DeviceData(bufferBlock)
        console.log(recent_device.toString())
        return true
    }
    if (isCamIMEI){
        try{
            bufferBlock = bufferBlock.subarray(4, 16)
            console.log('cam imei?? ', typeof bufferBlock, bufferBlock.toString('hex'))
        }catch(e){
            console.error("MOD::analyse_block[ERR] ", e)
        }
        recent_device = new mapper_mod.DeviceData(bufferBlock, 2)
        console.log(recent_device.toString())
        return 0x0008
    }
    return bufferBlock[9]
}
const read_block = (bufferBlock) => {
    /* console.log("MOD::read_block? ", typeof bufferBlock) */
    let block_success = true
    try {
        block_success = analyse_block(bufferBlock)
        console.log("MOD::read_block-> ", block_success, typeof block_success)
    }catch (e){
        console.error("MOD::read_block[ERR] ", e)
    }
    /* console.log("MOD::read_block?? ", typeof block_success) */
    return block_success
}
module.exports.blockParser = read_block