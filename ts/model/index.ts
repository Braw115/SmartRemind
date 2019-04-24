import { stat } from "fs"
import { join } from "path"
import * as assert from "assert"
import * as logger from "winston"
import { promisify } from "bluebird"
import { Sequelize } from "sequelize"

const statAsync = promisify(stat)

export async function init(seqz: Sequelize) {
    let paths: string[] = [
        "./users/users",
        "./users/tasks",
        "./users/messages",
        "./users/devices",
        "./users/user_device",
        "./users/scenes",
        "./users/appupdates",
        "./users/leavebackrecord",
        "./users/pushsetting",
        "./users/rfid",
        "./users/pushlog",
        "./users/dock",
        "./users/dockupdates"
    ]


    await Promise.all(paths.map(path => statAsync(join(__dirname, path) + ".js")))
    paths.forEach(path => {
        let m = require(path)
        assert(m.defineFunction, `miss defineFunction in file ${path}`)
        seqz.import(path, m.defineFunction)
    })

    logger.info("initModel ok")
}