var IMEI_BLOCK_INDEX = '000f';
const analyse_block = (bufferBlock) => {  
    let hexBlock = bufferBlock.toString('hex')
    console.log("MOD::analyse_block? ", typeof hexBlock)
    if (hexBlock.indexOf(IMEI_BLOCK_INDEX) === 0){
        return true
    }
    return bufferBlock[9]
}
const read_block = (bufferBlock) => {
    console.log("MOD::read_block? ", typeof bufferBlock)
    let block_success = true
    try {
        block_success = analyse_block(bufferBlock.toString('hex'))
        console.log("MOD::read_block-> ", block_success, typeof block_success)
    }catch (e){
        console.error("MOD::read_block[ERR] ", e)
    }
    console.log("MOD::read_block?? ", typeof block_success)
    return block_success
}
module.exports.blockParser = read_block