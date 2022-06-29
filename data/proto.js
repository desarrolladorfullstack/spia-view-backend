String.prototype.getBytes = function () {
    let bytes = []
    for (let iter = 0; iter < this.length; ++iter) {
        bytes.push(this.charCodeAt(iter))
    }
    return Buffer.from(bytes)
}
Buffer.prototype.getBytes = function () {
    return this.toString('hex')
}
Number.prototype.getBytes = function () {
    return Buffer.from([this])
}
Boolean.prototype.getBytes = function () {
    return Buffer.from([this])
}