import { RouterWrap } from "../../lib/routerwrap"
import { validateCgi } from "../../lib/validator"
import { BaseHandler } from "../lib/basehandler"
import { PushlogDb } from "../../model/users/pushlog"
import { LoginInfo } from "../../redis/logindao"
import { commonValidator } from "./validator"
export const router = new RouterWrap({ prefix: "/app/pushlog" })


export class PushLog extends BaseHandler {

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
        let type ="bar"
        let record = await PushlogDb.getInstance().findAllByUseruuid(info.getUuid(), type,start, length);
        return { record }
    }


    /**
     * 删除推送
     * @param params
     * @param ctx
     */
    public static async del(params: any): Promise<any> {
        let { uuid } = params
        let record = await PushlogDb.getInstance().delByUuid(uuid)
        if (!record) {
            return { msg: "Deleted Failed" }
        }
        return { msg: "Deleted Successfully" }
    }

}

/**
 * 获取我的推送记录
 */
router.loginHandle("get", "/", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await PushLog.getRecord(ctx.request.query, ctx)))

/**
* 删除推送记录
*/
router.loginHandle("delete", "/:uuid", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await PushLog.del(ctx.params)))


