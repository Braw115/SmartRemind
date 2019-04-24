
import { RouterWrap } from "../../lib/routerwrap"
import { validateCgi } from "../../lib/validator"
import { BaseHandler } from "../lib/basehandler"

import { User_deviceDb } from "../../model/users/user_device"
import { MessagesDb } from "../../model/users/messages"
import { messagesValidator, commonValidator } from "./validator"
export const router = new RouterWrap({ prefix: "/devices/messages" })
export class Messages extends BaseHandler {
    /**
     * 设备添加消息
     * @param params
     * @param body
     */
    public static async addMessage(body: any): Promise<any> {
        const { devid, source, message, filename } = body

        validateCgi({ sourceuuid: devid, source }, messagesValidator.message)

        let obj = { sourceuuid: devid, source, message, filename, status: "unread" }
        let Message = await MessagesDb.getInstance().insertMessages(obj)
        if (!Message) {
            return { msg: "Added Failed" }
        }
        return { Message }
    }

    /**
    * 获取设备和用户关联的单挑消息
    */
    public static async getDeviceOneMessage(ctx: any): Promise<any> {
        const { uuid } = ctx.params
        return await MessagesDb.getInstance().findOneMessageByDevice(uuid)
    }

    /**
     * 获取设备和关联用户的所有消息
     * @param params
     * @param ctx
     */
    public static async getDeviceAllMessage(ctx: any): Promise<any> {
        const { start, length, devid } = ctx.request.query
        validateCgi({ devid: devid }, commonValidator.devid)
        validateCgi({ start, length }, commonValidator.findall)
        let sourceuuids = [devid]
        //获取设备用户组用户id
        let res = await User_deviceDb.getInstance().getDeviceUsers(devid)
        for (let r of res) {
            sourceuuids.push(r.useruuid)
        }
        return await MessagesDb.getInstance().findAllMessageByDevice(sourceuuids, start, length)
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
        return { "msg": "Deleted Successfully" }
    }


    /**
   * 将消息标示为已读
   * @param params
   */
    public static async readMessage(params: any): Promise<any> {
        const { uuid } = params
        validateCgi({ uuid }, commonValidator.UUID)
        let Message = MessagesDb.getInstance().changeStatus(uuid, "read")
        if (!Message) {
            return { msg: "Modified Failed" }
        }
        return { "msg": "Modified Successfully" }
    }


}



/**
 *获取设备一条留言
 */
router.handle("get", "/:uuid", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Messages.getDeviceOneMessage(ctx)))

/**
 * 设备添加录音消息
 */
router.handle("post", "/", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Messages.addMessage((ctx.request as any).body)))

/**
 * 获取设备所有留言
 */
router.handle("get", "/", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Messages.getDeviceAllMessage(ctx)))

/**
* 删除设备录音
*/
router.handle("delete", "/:uuid", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Messages.delMessage(ctx.params)))

/**
 * 已读设备录音
 */
router.handle("put", "/:uuid", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Messages.readMessage(ctx.params)))