
import { RouterWrap } from "../../lib/routerwrap"
import { validateCgi } from "../../lib/validator"
import { BaseHandler } from "../lib/basehandler"
import { ScenesDb } from "../../model/users/scenes"
import { LoginInfo } from "../../redis/logindao"
import { commonValidator, scenesValidator } from "./validator"


export const router = new RouterWrap({ prefix: "/app/scenes" })


export class Scenes extends BaseHandler {

    /**
     * app获取用户任务
     * @param ctx
     */
    public static async  getMyScenes(ctx: any): Promise<any> {
        const info: LoginInfo = super.getLoginInfo(ctx)
        // let uuid = "b927d5a7-58db-4e72-9750-f1a88bf942ce"
        let { start, length } = ctx.request.query
        start = start ? start : 0
        length = length ? length : 10
        let scenes = await ScenesDb.getInstance().findAllScenesByUser(info.getUuid(), start, length)
        return { scenes }
    }

    /**
     * 获取今日场景
     */
    public static async getTodayScenes(ctx: any): Promise<any> {
        const info: LoginInfo = super.getLoginInfo(ctx)
        // let uuid = "b927d5a7-58db-4e72-9750-f1a88bf942ce"
        let { weather, start, length, temperature, ultraviolet } = ctx.request.query
        start = start ? start : 0
        length = length ? length : 10
        validateCgi({ weather, temperature, ultraviolet }, scenesValidator.getscene)
        let scenes = await ScenesDb.getInstance().findScenesByCondition(info.getUuid(), start, length, weather, temperature, ultraviolet)
        return { scenes }
    }

    /**
    * 获取今日场景
    */
    public static async getTodayScenesCount(ctx: any): Promise<any> {
        const info: LoginInfo = super.getLoginInfo(ctx)
        // let uuid = "b927d5a7-58db-4e72-9750-f1a88bf942ce"
        let { weather, temperature, ultraviolet } = ctx.request.query
        validateCgi({ weather, temperature, ultraviolet }, scenesValidator.getscene)
        let count = await ScenesDb.getInstance().findScenesCountByCondition(info.getUuid(), weather, temperature, ultraviolet)
        return { count }
    }



    /**
     * 增加任务
     * @param body
     * @param ctx
     */
    public static async addScene(body: any, ctx: any): Promise<any> {
        const info: LoginInfo = super.getLoginInfo(ctx)
        // let uuid = "b927d5a7-58db-4e72-9750-f1a88bf942ce"
        const { title, remarks, weather, temperaturelow, temperaturehigh, ultravioletlow, ultraviolethigh } = body
        // validateCgi({ title, remarks, weather, remindtype, remindtime, ultravioletlow, ultraviolethigh, humiditylow, humidityhigh }, scenesValidator.addscene)
        let obj = { useruuid: info.getUuid(), title, remarks, weather, temperaturelow, temperaturehigh, ultravioletlow, ultraviolethigh }
        let scenes = await ScenesDb.getInstance().insertScenes(obj)
        if (!scenes) {
            return { msg: "Added Failed" }
        }
        return { "msg": "Added Successfully" }
    }

    /**
     * 更新任务
     * @param params
     * @param body
     */
    public static async updateScene(params: any, body: any): Promise<any> {
        const { uuid } = params
        const { title, remarks, weather, temperaturelow, temperaturehigh, ultravioletlow, ultraviolethigh } = body
        validateCgi({ uuid }, commonValidator.UUID)
        // validateCgi({ title, remarks, weather, remindtype, remindtime, ultravioletlow, ultraviolethigh, humiditylow, humidityhigh }, scenesValidator.addscene)
        let obj = { title, remarks, weather, temperaturelow, temperaturehigh, ultravioletlow, ultraviolethigh }
        let scenes = await ScenesDb.getInstance().updateScenes(uuid, obj)
        if (!scenes) {
            return { msg: "Modified Failed" }
        }
        return { "msg": "Modified Successfully" }
    }


    /**
     * 删除任务
     * @param params
     */
    public static async delScene(params: any): Promise<any> {
        const { uuid } = params
        validateCgi({ uuid }, commonValidator.UUID)
        let scenes = await ScenesDb.getInstance().delete(uuid)
        if (!scenes) {
            return { msg: "Deleted Failed" }
        }
        return { "msg": "Deleted Successfully" }
    }
}

router.loginHandle("get", "/todayScene", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Scenes.getTodayScenes(ctx)))

router.loginHandle("get", "/todaySceneCount", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Scenes.getTodayScenesCount(ctx)))

/**
 * 获取我的场景
 */
router.loginHandle("get", "/", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Scenes.getMyScenes(ctx)))


/**
 * 增加场景
 */
router.loginHandle("post", "/", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Scenes.addScene((ctx.request as any).body, ctx)))

/**
 * 修改场景
 */
router.loginHandle("put", "/:uuid", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Scenes.updateScene(ctx.params, (ctx.request as any).body)))

/**
 * 删除场景
 */
router.loginHandle("delete", "/:uuid", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Scenes.delScene(ctx.params)))


