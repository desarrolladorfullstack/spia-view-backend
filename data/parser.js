let read_block = (bufferBlock) => {
    console.log("MOD::read_block? ", typeof bufferBlock)
    let block_success = true
    try {
        block_success = bufferBlock[9]
        console.log("MOD::read_block-> ", block_success, typeof block_success)
    }catch (e){
        console.error("MOD::read_block[ERR] ", e)
    }
    console.log("MOD::read_block?? ", typeof block_success)
    return block_success
}
module.exports.blockParser = read_block