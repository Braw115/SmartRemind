import { RouterWrap } from "../../lib/routerwrap"
import { validateCgi } from "../../lib/validator"
import { BaseHandler } from "../lib/basehandler"
import { User_deviceDb } from "../../model/users/user_device"
import { TasksDb } from "../../model/users/tasks"
import { commonValidator } from "./validator"
import { Users } from "../../model/users/users"
export const router = new RouterWrap({ prefix: "/devices/tasks" })
export class Tasks extends BaseHandler {

    /**
    * 获取设备关联用户所有任务清单
    * 废弃
    * @param params
    * @param ctx
    */
    public static async getDeviceAllTasks(ctx: any): Promise<any> {

        const { devid, start, length, rfid } = ctx.request.query
        validateCgi({ devid: devid }, commonValidator.devid)
        validateCgi({ start, length }, commonValidator.findall)
        //获取设备用户组用户id
        let sourceuuids = [devid]
        let res = await User_deviceDb.getInstance().getDeviceUsers(devid)
        for (let r of res) {
            sourceuuids.push(r.useruuid)
        }

        //判断是否有rfid，如果有的话则要加上绑定的rfid的私有的和指定该用户的消息，否则只显示公共的
        if (rfid) {
            //根据rfid获取用户
            let user = await Users.getInstance().findByRFID(rfid)
            if (user) {
                let obj = { devid: devid, useruuid: user.uuid, status: 1 }
                //判断该用户是否绑定该设备
                let device_user = await User_deviceDb.getInstance().findByUserAndDevice(obj)
                if (device_user) {
                    return await TasksDb.getInstance().findAllTaskByDeviceAndUser(user.uuid, sourceuuids, start, length)
                }
            }
        }
        return await TasksDb.getInstance().findAllTaskByDevice(sourceuuids, start, length)
    }

    /**
     * 获取设备关联用户所有任务清单
     * 废弃
     * @param params
     * @param ctx
     */
    public static async getDeviceTodayTasks(ctx: any): Promise<any> {
        const { devid, start, length, rfid } = ctx.request.query
        validateCgi({ devid: devid }, commonValidator.devid)
        validateCgi({ start, length }, commonValidator.findall)
        //获取设备用户组用户id
        let sourceuuids = [devid]
        let res = await User_deviceDb.getInstance().getDeviceUsers(devid)
        for (let r of res) {
            sourceuuids.push(r.useruuid)
        }
        //判断是否有rfid，如果有的话则要加上绑定的rfid的私有的和指定该用户的消息，否则只显示公共的
        if (rfid) {
            //根据rfid获取用户
            let user = await Users.getInstance().findByRFID(rfid)
            if (user) {
                let obj = { devid: devid, useruuid: user.uuid, status: 1 }
                //判断该用户是否绑定该设备
                let device_user = await User_deviceDb.getInstance().findByUserAndDevice(obj)
                if (device_user) {
                    return await TasksDb.getInstance().findTodayTaskByDeviceAndUser(user.uuid, sourceuuids, start, length)
                }
            }
        }
        return await TasksDb.getInstance().findTodayTaskByDevice(sourceuuids, start, length)
    }

    /**
     * 删除消息
     * @param params
     */
    public static async delTask(params: any): Promise<any> {
        const { uuid } = params
        validateCgi({ uuid }, commonValidator.UUID)
        let Message = await TasksDb.getInstance().deleteByUuid(uuid)
        if (!Message) {
            return { msg: "Deleted Failed" }
        }
        return { "msg": "Deleted Successfully" }
    }

    /**
   * 将消息任务标记为已读
   * @param params
   */
    public static async readTask(params: any): Promise<any> {
        const { uuid } = params
        validateCgi({ uuid }, commonValidator.UUID)
        let Message = await TasksDb.getInstance().changeStatus(uuid, "read")
        if (!Message) {
            return { msg: "Modified Failed" }
        }
        return { "msg": "Modified Successfully" }
    }
}




/**
* 获取所有任务
*/
router.handle("get", "/", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Tasks.getDeviceAllTasks(ctx)))


/**
* 获取今日任务
*/
router.handle("get", "/getTodayTasks", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Tasks.getDeviceTodayTasks(ctx)))


/**
* 删除任务
*/
router.handle("delete", "/:uuid", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Tasks.delTask(ctx.params)))


/**
* 已读任务
*/
router.handle("put", "/:uuid", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Tasks.readTask(ctx.params)))