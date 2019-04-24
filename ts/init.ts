import * as koa from "koa"
import winston = require("winston")

async function initKoa(app: koa) {
    const convert = require('koa-convert')

    // TODO enable only on DEBUG mode
    const logger = require('koa-logger')
    app.use(convert(logger()))

    // 静态文件
    const path = require('path')
    const serve = require('koa-static')
    app.use(convert(serve(path.join(__dirname, '../public'))))
    // 跨域
    const cors = require('koa-cors')
    app.use(convert(cors({ origin: '*' })))

    // body解析
    const bodyParser = require('koa-bodyparser')
    app.use(convert(bodyParser({ limit: '10mb' })))

    const multer = require("koa-multer")
    const upload = multer({ dest: path.join(__dirname, '../public/temp') })
    app.use(upload.array("file"))

    app.on("error", (err: any) => winston.error("%s", err))
}

import { initRouter } from "./router"
export async function getApp() {
    const app = new koa()
    try {
        await Promise.all([initKoa, initResource].map(f => f(app)))
        await initRouter(app)
    } catch (e) {
        winston.error("init fail", e)
        process.exit(1)
    }

    // handle uncaughtException
    process.on("uncaughtException", (err: Error) => winston.error("uncaughtException", err))
    return app
}

//-------------------------------------------------------------------------

import { pgOpt } from "./config/postgres"
import * as redisPool from "./lib/redispool"
import * as  redisConfig from "./config/redis"
import { Sequelize, Options } from "sequelize"
import { init as initModel } from "./model"
import { init as initDeamon } from "./deamon"
import { config as logConfig } from "./config/winston"
import { setSeqz } from "./lib/global"
import { MqttManager } from "./deamon/mqttmanager/index"
async function initResource(app: koa) {
    winston.configure(logConfig) // 日志

    redisPool.init(redisConfig.opt)   // redis
    let seqz = new Sequelize(pgOpt.database, pgOpt.username, pgOpt.password, pgOpt.options as Options)   // postgres

    await initModel(seqz)   // database model
    setSeqz(seqz)
    Object.defineProperty(app.context, 'seqz', { get: () => seqz })     // app.context["seqz"] = seqz
    await initDeamon() // init deamon

    await MqttManager.getInstance().initialize()

    winston.info("initResource ok")
}