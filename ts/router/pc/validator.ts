const uuid = {
    isUUID: {
        errmsg: "uuid is wrong",
        param: 1
    }
}
const sourceuuid = {
    isLength: {
        errmsg: "sourceuuid length wrong！",
        param: [1, 36]
    }
}

const devid = {
    isLength: {
        errmsg: "devid length wrong！",
        param: [1, 36]
    }
}

const start = {
    isInt: {
        errmsg: "start wrong",
        param: { min: 0 }
    }
}
const length = {
    isInt: {
        errmsg: "length wrong",
        param: { min: 0 }
    }
}

const source = {
    isIn: {
        errmsg: "source wrong",
        param: [["user", "device"]]
    }
}

const rfidtype = {
    isIn: {
        errmsg: "rfidtype wrong",
        param: [["key", "wallet", "dock"]]
    }
}

const rfid = {
    isLength: {
        errmsg: "rfid wrong",
        param: [1, 36]
    }
}

const weather = {
    isLength: {
        errmsg: "weather length wrong",
        param: [1, 100]
    }
}

const ultraviolet = {
    isInt: {
        errmsg: "ultraviolet wrong",
        param: { min: 0, max: 100 }
    }
}

const temperature = {
    isFloat: {
        errmsg: "temperature wrong",
        param: { min: -100, max: 100 }
    }
}


const showtype = {
    isLength: {
        errmsg: "showtype wrong",
        param: [1, 11]
    }
}



export const commonValidator = {
    UUID: {
        uuid: uuid
    }, devid: {
        devid: devid
    },
    findall: {
        start: start,
        length: length
    }
}


export const messagesValidator = {
    message: {
        sourceuuid: sourceuuid,
        source: source
    }
}
export const deviceValidator = {
    getInfoByRFID: {
        weather: weather,
        rfid: rfid,
        devid: devid,
        ultraviolet: ultraviolet,
        temperature: temperature,
        showtype: showtype
    },
    getInfoByDevice: {
        weather: weather,
        devid: devid,
        ultraviolet: ultraviolet,
        temperature: temperature
    },
    deleteRFID: {
        type: rfidtype,
        uuid: uuid
    },
    bundlingRFID: {
        uuid: uuid,
        rfid: rfid,
        type: rfidtype,
        devid: devid
    }
}

export const scenesValidator = {
    getscene: {
        weather: weather,
        ultraviolet: ultraviolet,
        temperature: temperature
    }
}