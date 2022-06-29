let ArrBytes = () => {
    let bytes = []
    for (let iter = 0; iter < this.length; ++iter) {
        bytes.push(this.charCodeAt(iter))
    }
    return Buffer.from(bytes)
}
let getHex =  () => {
    return this.toString('hex')
}
let getBytes = function () {
    return Buffer.from([this])
}
module.exports = {
    "StringBytes":ArrBytes,
    "BytesHex":getHex,
    "getBytes":getBytes
}