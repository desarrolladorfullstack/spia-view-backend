
module.exports = {
    TIMEZONE_LOCAL:'America/Bogota',
    'HEX':'hex',
    'RADIX_HEX':16,
    'BYTE_ZERO':0x0000,
    'UTF8_SETTING':{encoding: 'utf-8'},
    'INVALID':{'date':'Invalid Date'},
    'MIME_TYPES':{
        'image':"image/jpeg",
        'video_raw':"application/octet-stream"
    },
    'CMD':{
        'REQUESTING': Buffer.from([142]),
        'RESPONDING': Buffer.from([12]),
        'TYPE':{
            'SEND': Buffer.from([5]),
            'RECEIVE': Buffer.from([6])
        }
    }
}