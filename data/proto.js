let ArrBytes = () => {
    let bytes = []
    for (let iter = 0; iter < this.length; ++iter) {
        bytes.push(this.charCodeAt(iter))
    }
    return Buffer.from(bytes)
}
let getHex = () => {
    return Buffer.from(this)
}
let getBytes = function () {
    return Buffer.from([this])
}
let toCoordinate = (hex) => hex/(10*Math.pow(10,6))
let negativeCoordinate = (hex) => (hex.toString(2))[0]==1
let convertCoordinate= (hex) =>{
  let buffer_hex = (~hex + 1 >>> 0)
  if (buffer_hex >= hex){
    return toCoordinate(hex)
  }
  hex = parseInt(buffer_hex)
  if (negativeCoordinate(buffer_hex)){
    hex *= -1
  }
  return toCoordinate(hex)
}
module.exports = {
    "StringBytes":ArrBytes,
    "BytesHex":getHex,
    "getBytes":getBytes,
    "coordinate":convertCoordinate
}
