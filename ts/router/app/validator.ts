
//验证uuid
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

const password = {
    isLength: {
        errmsg: "password length wrong！",
        param: [1, 64]
    }
}
const email = {
    isLength: {
        errmsg: "email wrong!",
        param: [0, 32]
    }
}

const username = {
    isLength: {
        errmsg: "username wrong!",
        param: [1, 20]
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

const title = {
    isLength: {
        errmsg: "title length wrong",
        param: [1, 2048]
    }
}
const remarks = {
    isLength: {
        errmsg: "remark length wrong",
        param: [0, 2048]
    }
}
// const type = {
//     isIn: {
//         errmsg: "type wrong",
//         param: [["private", "public", "specify"]]
//     }
// }

const source = {
    isIn: {
        errmsg: "source wrong",
        param: [["user", "device"]]
    }
}

const remindtype = {
    isIn: {
        errmsg: "remindtype wrong",
        param: [["day", "month", "year", "one", "never", "week"]]
    }
}

const remindtime = {
    isLength: {
        errmsg: "remindtime wrong",
        param: [1, 11]
    }
}

// const remindpeople = {
//     isUUID: {
//         errmsg: "remindpeople is wrong",
//         param: 1
//     }
// }

const showtype = {
    isIn: {
        errmsg: "showtype wrong",
        param: [["back", "leave"]]
    }
}

const weather = {
    isLength: {
        errmsg: "weather length wrong",
        param: [1, 100]
    }
}

const temperature = {
    isFloat: {
        errmsg: "temperature wrong",
        param: { min: -100, max: 100 }
    }
}

const humidity = {
    isInt: {
        errmsg: "humidity wrong",
        param: { min: 0, max: 100 }
    }
}




export const commonValidator = {
    UUID: {
        uuid: uuid
    },
    devid: {
        devid: devid
    },
    findall: {
        start: start,
        length: length
    }
}

export const userValidator = {
    login: {
        email: email,
        password: password
    },
    regist: {
        email: email,
        password: password
    },
    updateUsername: {
        uuid: uuid,
        username: username
    }, updatePassword: {
        uuid: uuid,
        oldpassword: password,
        newpassword: password
    }

}

export const tasksValidator = {
    task: {
        title: title,
        remarks: remarks,
        remindtime: remindtime,
        showtype: showtype
    }
}

export const messagesValidator = {
    message: {
        sourceuuid: sourceuuid,
        source: source
    }
}


export const scenesValidator = {
    addscene: {
        title: title,
        remarks: remarks,
        weather: weather,
        temperaturelow: temperature,
        temperaturehigh: temperature,
        humiditylow: humidity,
        humidityhigh: humidity,
        remindtype: remindtype,
        remindtime: remindtime
    },
    getscene: {
        weather: weather,
        temperature: temperature,
        humidity: humidity
    }

}


export const leavebackrecordValidator = {
    recordtype: {
        showtype: showtype
    }
}