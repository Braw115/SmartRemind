
import { RouterWrap } from "../../lib/routerwrap"
import { validateCgi } from "../../lib/validator"
import { BaseHandler } from "../lib/basehandler"
import { MessagesDb } from "../../model/users/messages"
import { LoginInfo } from "../../redis/logindao"
import { messagesValidator, commonValidator } from "./validator"
export const router = new RouterWrap({ prefix: "/app/messages" })


export class Messages extends BaseHandler {

    /**
     * 获取我的留言
     * @param params
     * @param ctx
     */
    public static async getMyMessages(ctx: any): Promise<any> {
        const info: LoginInfo = super.getLoginInfo(ctx)
        // let uuid = "b927d5a7-58db-4e72-9750-f1a88bf942ce"
        const { start, length } = ctx.request.query
        validateCgi({ start, length }, commonValidator.findall)
        let messages = await MessagesDb.getInstance().findAllMessageByUser(info.getUuid(), start, length)
        return { messages }
    }


    /**
     * 获取我的今日留言
     * @param ctx
     */
    public static async getTodayMessages(ctx: any): Promise<any> {
        const info: LoginInfo = super.getLoginInfo(ctx)
        // let uuid = "b927d5a7-58db-4e72-9750-f1a88bf942ce"
        const { start, length } = ctx.request.query
        validateCgi({ start, length }, commonValidator.findall)
        let messages = await MessagesDb.getInstance().findTodayMessageByUser(info.getUuid(), start, length)
        return { messages }
    }

    public static async getTodayMessageCount(ctx: any): Promise<any> {
        const info: LoginInfo = super.getLoginInfo(ctx)
        // let uuid = "b927d5a7-58db-4e72-9750-f1a88bf942ce"
        let count = await MessagesDb.getInstance().findTodayMessageCountByUser(info.getUuid())
        return { count }
    }


    /**
     * 增加消息
     * @param body
     * @param ctx
     */
    public static async addMessage(body: any, ctx: any): Promise<any> {
        const info: LoginInfo = super.getLoginInfo(ctx)
        // let uuid = "b927d5a7-58db-4e72-9750-f1a88bf942ce"
        const { source, filename, message, remindpeople, showtype, remindtime } = body
        if (remindpeople.length < 1) {
            return { msg: "no remindpeople" }
        }
        validateCgi({ sourceuuid: info.getUuid(), source }, messagesValidator.message)
        let obj = { remindtime, sourceuuid: info.getUuid(), source, message, filename, status: "unread", remindpeople: remindpeople.toString(), showtype }
        let messages = await MessagesDb.getInstance().insertMessages(obj)
        if (!messages) {
            return { msg: "Added Failed" }
        }
        return { msg: "Added Successfully" }
    }

    /**
     * 删除消息
     * @param params
     */
    public static async delMessage(params: any): Promise<any> {
        const { uuid } = params
        validateCgi({ uuid }, commonValidator.UUID)
        let Message = await MessagesDb.getInstance().deleteByUuid(uuid)
        if (!Message) {
            return { msg: "Deleted Failed" }
        }
        return { msg: "Deleted Successfully" }
    }


}

/**
 * 获取我的留言列表
 */
router.loginHandle("get", "/", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Messages.getMyMessages(ctx)))


/**
 * 获取我的留言列表
 */
router.loginHandle("get", "/todayMessage", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Messages.getTodayMessages(ctx)))

/**
* 获取我的留言条数
*/
router.loginHandle("get", "/todayMessageCount", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Messages.getTodayMessageCount(ctx)))



/**
 * 增加留言
 */
router.loginHandle("post", "/", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Messages.addMessage((ctx.request as any).body, ctx)))


/**
 * 删除留言
 */
router.loginHandle("delete", "/:uuid", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Messages.delMessage(ctx.params)))


