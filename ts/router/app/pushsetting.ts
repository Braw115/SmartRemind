import { RouterWrap } from "../../lib/routerwrap"
import { validateCgi } from "../../lib/validator"
import { BaseHandler } from "../lib/basehandler"
import { PushSettingDb } from "../../model/users/pushsetting"
import { LoginInfo } from "../../redis/logindao"
import { commonValidator } from "./validator"
export const router = new RouterWrap({ prefix: "/app/pushsetting" })


export class PushSetting extends BaseHandler {

    /**
     * @param params
     * @param ctx
     */
    public static async getRecord(params: any, ctx: any): Promise<any> {
        const info: LoginInfo = super.getLoginInfo(ctx)
        // let uuid = "b927d5a7-58db-4e72-9750-f1a88bf942ce"
        const { start, length, pushtype } = ctx.request.query
        validateCgi({ start, length }, commonValidator.findall)
        let record = await PushSettingDb.getInstance().getRecord(info.getUuid(), start, length, pushtype);
        return { record }
    }

    public static async insert(body: any, ctx: any): Promise<any> {
        const info: LoginInfo = super.getLoginInfo(ctx)
        // let uuid = "b927d5a7-58db-4e72-9750-f1a88bf942ce"
        let { listenuuid, hour, minute, timezone, isbackleavepush, isnobackleavepush, pushmessage, pushtype } = body
        //验证
        let obj = { listenuuid: listenuuid.toString(), receiveuuid: info.getUuid(), hour, minute, timezone, isbackleavepush, isnobackleavepush, pushmessage, pushtype }
        let record = await PushSettingDb.getInstance().insert(obj)
        if (!record) {
            return { msg: "Added Failed" }
        }
        return { "msg": "Added Successfully" }
    }

    public static async update(params: any, body: any, ctx: any): Promise<any> {
        let { uuid } = params
        let { listenuuid, hour, minute, timezone, isbackleavepush, isnobackleavepush, pushmessage, pushtype } = body
        let obj = { listenuuid: listenuuid.toString(), hour, minute, timezone, isbackleavepush, isnobackleavepush, pushmessage, pushtype }
        let record = await PushSettingDb.getInstance().update(uuid, obj)
        if (!record) {
            return { msg: "Updated Failed" }
        }
        return { "msg": "Updated Successfully" }
    }

    public static async del(params: any, ctx: any): Promise<any> {
        let { uuid } = params
        let record = await PushSettingDb.getInstance().delByUuid(uuid)
        if (!record) {
            return { msg: "Deleted Failed" }
        }
        return { "msg": "Deleted Successfully " }
    }

}

/**
 * 获取我的提醒设置
 */
router.loginHandle("get", "/", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await PushSetting.getRecord(ctx.request.query, ctx)))

/**
* 增加提醒设置
*/
router.loginHandle("post", "/", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await PushSetting.insert((ctx.request as any).body, ctx)))


/**
* 更新提醒设置
*/
router.loginHandle("put", "/:uuid", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await PushSetting.update(ctx.params, (ctx.request as any).body, ctx)))

/**
 * 删除提醒设置
 */
router.loginHandle("delete", "/:uuid", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await PushSetting.del(ctx.params, ctx)))

