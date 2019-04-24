const moment = require("moment")
import { RouterWrap } from "../../lib/routerwrap"
import { validateCgi } from "../../lib/validator"
import { BaseHandler } from "../lib/basehandler"
import { LeaveBackRecordDb } from "../../model/users/leavebackrecord"
import { LoginInfo } from "../../redis/logindao"
import { leavebackrecordValidator } from "./validator"
export const router = new RouterWrap({ prefix: "/app/leavebackrecord" })


export class LeaveBackRecord extends BaseHandler {

    /**
     * 查看我的离回家记录
     * @param params
     * @param ctx
     */
    public static async getRecord(params: any, ctx: any): Promise<any> {
        const info: LoginInfo = super.getLoginInfo(ctx)
        // let uuid = "6fa6cfb1-8c12-4e67-9e38-7014ec9898cc"
        let starttime = moment().subtract(30, 'day').format()
        let endtime = moment().format()
        let { showtype } = params
        validateCgi({ showtype }, leavebackrecordValidator.recordtype)
        let record = await LeaveBackRecordDb.getInstance().getAllRecord(info.getUuid(), showtype, starttime, endtime);
        return { record }
    }

}

/**
 * 获取我回家离家的记录
 */
router.loginHandle("get", "/", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await LeaveBackRecord.getRecord(ctx.request.query, ctx)))


