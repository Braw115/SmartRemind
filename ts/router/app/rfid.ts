import { RouterWrap } from "../../lib/routerwrap"
import { validateCgi } from "../../lib/validator"
import { BaseHandler } from "../lib/basehandler"
import { RfidDb } from "../../model/users/rfid"
import { DockDB } from "../../model/users/dock"
import { Users } from "../../model/users/users"
import { LoginInfo } from "../../redis/logindao"
import { commonValidator } from "./validator"
export const router = new RouterWrap({ prefix: "/app/rfid" })


export class Rfid extends BaseHandler {

    /**
     * 获取我的推送记录
     * @param params
     * @param ctx
     */
    public static async getRecord(query: any, ctx: any): Promise<any> {
        const { start, length } = query
        validateCgi({ start, length }, commonValidator.findall)
        const info: LoginInfo = super.getLoginInfo(ctx)
        // let uuid = "6fa6cfb1-8c12-4e67-9e38-7014ec9898cc"
        let record = await RfidDb.getInstance().getRfid(info.getUuid())
        return { record }
    }

    /**
     * 获取rfid详情
     * @param params
     */
    public static async getRfid(params: any): Promise<any> {
        let { uuid } = params
        //validateCgi({ start, length }, commonValidator.findall)

        let record = await RfidDb.getInstance().findByPrimary(uuid)
        return { record }
    }


    /**
     * 删除推送
     * @param params
     * @param ctx
     */
    public static async del(params: any): Promise<any> {
        let { uuid } = params
        let rfid = await RfidDb.getInstance().findByPrimary(uuid)
        if (rfid.type === "dock")
            await DockDB.getInstance().delByUuid(uuid)
        let record = await RfidDb.getInstance().delByUuid(uuid)
        if (!record) {
            return { msg: "Deleted Failed" }
        }
        return { "msg": "Deleted Successfully" }
    }


    public static async add(body: any, ctx: any): Promise<any> {
        const { rfid, name, type } = body
        const info: LoginInfo = super.getLoginInfo(ctx)
        // let uuid = "6fa6cfb1-8c12-4e67-9e38-7014ec9898cc"
        let obj = { rfid, name, type, useruuid: info.getUuid() }
        //查看rfid是否已经绑定   当有值时，则已经绑定
        let user =  await Users.getInstance().findByRFID(rfid)
        if (user) {
            return { msg: "rfid is already bound" }
        }
        let record = await RfidDb.getInstance().insert(obj)
        if (!record) {
            return { msg: "Added Failed"}
        }
        return { "msg": "Added Successfully" }
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


}

/**
 * 获取我的rfid
 */
router.loginHandle("get", "/", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Rfid.getRecord(ctx.request.query, ctx)))

/**
* 获取我的rfid
*/
router.loginHandle("get", "/:uuid", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Rfid.getRfid(ctx.params)))

/**
* 删除rfid
*/
router.loginHandle("delete", "/:uuid", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Rfid.del(ctx.params)))

/**
 * 增加rfid
 */
router.loginHandle("post", "/", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Rfid.add((ctx.request as any).body, ctx)))


/**
 * 修改rfid
 */
router.loginHandle("put", "/:uuid", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Rfid.update((ctx.request as any).body, ctx.params)))



