import { RouterWrap } from "../../lib/routerwrap"
import { BaseHandler } from "../lib/basehandler"
import { RfidDb } from "../../model/users/rfid"
import { DockDB } from "../../model/users/dock"
import { Users } from "../../model/users/users"
import { User_deviceDb } from "../../model/users/user_device"
import { LoginInfo } from "../../redis/logindao"
import { DockupdatesDb } from "../../model/users/dockupdates"
import { MqttManager } from "../../deamon/mqttmanager"
import * as winston from "winston"
export const router = new RouterWrap({ prefix: "/app/dock" })


export class Dock extends BaseHandler {
    public static async add(body: any, ctx: any): Promise<any> {
        const { rfid, name, type } = body
        const info: LoginInfo = super.getLoginInfo(ctx)
        // let uuid = "6fa6cfb1-8c12-4e67-9e38-7014ec9898cc"
        let obj = { rfid, name, type, useruuid: info.getUuid() }
        //查看rfid是否已经绑定   当有值时，则已经绑定
        let user = await Users.getInstance().findByRFID(rfid)
        if (user) {
            return { msg: "rfid is already bound" }
        }
        let record = await RfidDb.getInstance().insert(obj)
        if (!record) {
            return { msg: "Added Failed" }
        }
        let dockObj = {
            useruuid: info.getUuid(),
            rfiduuid: record.uuid,
            linephone: "off",
            linepower: "off",
            electricity: 0
        }
        let dock = await DockDB.getInstance().insert(dockObj)
        if (!dock) {
            await RfidDb.getInstance().delByUuid(record.uuid)
            return { msg: "Added Failed" }
        }
        return { dock }
    }

    public static async upgrade(params: any): Promise<any> {
        const { uuid } = params
        let dockerInfo = await DockDB.getInstance().findByPrimary(uuid)
        let dockerUpdate = await DockupdatesDb.getInstance().getLatestVersion()
        let rfid = await RfidDb.getInstance().findByPrimary(dockerInfo.rfiduuid)
        if (dockerInfo.version >= dockerUpdate.version) {
            return { msg: "version is fully" }
        }

        let message = {
            cmd: "upgrade",
            data: {
                version: dockerUpdate.version
            }
        }
        await this.publishUpgrade(message, rfid.rfid)
        

        return { "msg": "Update Successfully" }
    }

    public static async update(body: any, params: any): Promise<any> {
        const { name } = body
        const { uuid } = params
        let record = await RfidDb.getInstance().update(uuid, name)
        if (!record) {
            return { msg: "Update Failed" }
        }
        return { "msg": "Update Successfully" }
    }

    public static async getDockInfo(params: any): Promise<any> {
        const { uuid } = params
        let dockerInfo = await DockDB.getInstance().findOne(uuid)
        return { dockerInfo }
    }

    public static async delDock(params: any): Promise<any> {
        const { uuid } = params
        await DockDB.getInstance().delByUuid(uuid)
        
        return { "msg": "Delete Successfully" }
    }

    public static async publishUpgrade(cmd: any, mac: any) {
        const s = JSON.stringify(cmd)
        winston.debug(`forward to local. ${s}`)

        const mqtt = MqttManager.getInstance().localMqtt
        if (!(mqtt && mqtt.connected)) {
            winston.error(`local mqtt is disconnected, discard`)
            return
        }

        try {
            await mqtt.publish("srv/esp_66/" + mac, s)
        } catch (e) {
            winston.error(`publish fail. ${e.message}`)
        }
    }

    public static async getDevice(ctx: any): Promise<any> {
        const info: LoginInfo = super.getLoginInfo(ctx)
        // let uuid = "6fa6cfb1-8c12-4e67-9e38-7014ec9898cc"
        let record = await RfidDb.getInstance().getRfid(info.getUuid())
        
        let usedevice = await User_deviceDb.getInstance().getDeviceByUser(info.getUuid())
        if (usedevice)
            record.push(usedevice)
        return { record }
    }

}

/**
 * 增加dock
 */
router.loginHandle("post", "/", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Dock.add((ctx.request as any).body, ctx)))


/**
 * 升级dock
 */
router.handle("put", "/upgrade/:uuid", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Dock.upgrade(ctx.params)))

/**
 * 修改dock
 */
router.loginHandle("put", "/:uuid", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Dock.update((ctx.request as any).body, ctx.params)))

/**
 * 删除dock
 */
router.loginHandle("delete", "/:uuid", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Dock.delDock(ctx.params)))


/**
 * 获取devivelist
 */
router.loginHandle("get", "/rfid", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Dock.getDevice(ctx)))

/**
* 获取dock详情
*/
router.loginHandle("get", "/:uuid", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Dock.getDockInfo(ctx.params)))



