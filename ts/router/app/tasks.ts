
import { RouterWrap } from "../../lib/routerwrap"
import { validateCgi } from "../../lib/validator"
import { BaseHandler } from "../lib/basehandler"
import { TasksDb } from "../../model/users/tasks"
import { LoginInfo } from "../../redis/logindao"
import { commonValidator } from "./validator"


export const router = new RouterWrap({ prefix: "/app/tasks" })


export class Tasks extends BaseHandler {

    /**
     * app获取用户任务
     * @param ctx
     */
    public static async getMyTasks(ctx: any): Promise<any> {
        const info: LoginInfo = super.getLoginInfo(ctx)
        // let uuid = "b927d5a7-58db-4e72-9750-f1a88bf942ce"
        const { start, length } = ctx.request.query
        validateCgi({ start, length }, commonValidator.findall)
        let tasks = await TasksDb.getInstance().findAllTaskByUser(info.getUuid(), start, length)
        return { tasks }
    }

    public static async getTodayTasks(ctx: any): Promise<any> {
        const info: LoginInfo = super.getLoginInfo(ctx)
        // let uuid = "b927d5a7-58db-4e72-9750-f1a88bf942ce"
        const { start, length } = ctx.request.query
        validateCgi({ start, length }, commonValidator.findall)
        let tasks = await TasksDb.getInstance().getTodaytask(info.getUuid(), start, length)
        return { tasks }
    }

    public static async getTodayTaskCount(ctx: any): Promise<any> {
        const info: LoginInfo = super.getLoginInfo(ctx)
        // let uuid = "b927d5a7-58db-4e72-9750-f1a88bf942ce"
        let count = await TasksDb.getInstance().getTodaytaskCount(info.getUuid())
        return { count }
    }

    /**
     * 增加任务
     * @param body
     * @param ctx
     */
    public static async addTask(body: any, ctx: any): Promise<any> {
        const info: LoginInfo = super.getLoginInfo(ctx)
        // let uuid = "b927d5a7-58db-4e72-9750-f1a88bf942ce"
        let { title, remarks, remindtime, remindpeople, showtype } = body
        // validateCgi({ title, remarks,  remindtime, showtype ,remindpeople}, tasksValidator.task)
        // remindpeople = remindpeople ? remindpeople : ''
        // peoplename = peoplename ? peoplename : ''
        if (remindpeople.length < 1) {
            return { msg: "no remindpeople" }
        }
        let obj = { useruuid: info.getUuid(), title, remarks, status: "unread", remindtime, showtype, remindpeople: remindpeople.toString() }
        let task = await TasksDb.getInstance().insertTasks(obj)
        if (!task) {
            return { msg: "Added Failed" }
        }
        return { "msg": "Added Successfully" }
    }

    /**
     * 更新任务
     * @param params
     * @param body
     */
    public static async updateTask(params: any, body: any): Promise<any> {
        const { uuid } = params
        let { title, remarks, remindtime, remindpeople, showtype } = body
        // validateCgi({ uuid }, commonValidator.UUID)
        // validateCgi({ title, remarks, type, remindtype, remindtime, showtype }, tasksValidator.task)
        // remindpeople = remindpeople ? remindpeople : ''
        // peoplename = peoplename ? peoplename : ''
        if (remindpeople.length < 1) {
            return { msg: "no remindpeople" }
        }
        let obj = { title, remarks, status: "unread", remindtime, remindpeople: remindpeople.toString(), showtype }
        let task = await TasksDb.getInstance().updateTasks(uuid, obj)
        if (!task) {
            return { msg: "Modified Failed" }
        }
        return { "msg": "Modified Successfully" }
    }


    /**
     * 删除任务
     * @param params
     */
    public static async delTask(params: any): Promise<any> {
        const { uuid } = params
        validateCgi({ uuid }, commonValidator.UUID)
        let task = await TasksDb.getInstance().delete(uuid)
        if (!task) {
            return { msg: "Deleted Failed" }
        }
        return { "msg": "Deleted Successfully" }
    }
}


/**
 * 查看指定给我的任务
 */
router.loginHandle("get", "/todayTask", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Tasks.getTodayTasks(ctx)))

/**
* 查看指定给我的任务
*/
router.loginHandle("get", "/todayTaskCount", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Tasks.getTodayTaskCount(ctx)))

/**
 * 获取我的任务列表
 */
router.loginHandle("get", "/", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Tasks.getMyTasks(ctx)))


/**
 * 增加任务
 */
router.loginHandle("post", "/", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Tasks.addTask((ctx.request as any).body, ctx)))

/**
 * 修改任务
 */
router.loginHandle("put", "/:uuid", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Tasks.updateTask(ctx.params, (ctx.request as any).body)))

/**
 * 删除任务
 */
router.loginHandle("delete", "/:uuid", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Tasks.delTask(ctx.params)))


