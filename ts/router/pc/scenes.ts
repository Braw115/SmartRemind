import { RouterWrap } from "../../lib/routerwrap"
import { validateCgi } from "../../lib/validator"
import { BaseHandler } from "../lib/basehandler"
import { User_deviceDb } from "../../model/users/user_device"
import { ScenesDb } from "../../model/users/scenes"
import { commonValidator, scenesValidator } from "./validator"
export const router = new RouterWrap({ prefix: "/devices/scenes" })
export class Scenes extends BaseHandler {

    /**
      * 获取设备关联用户所有任务清单
      * 已废弃
      * @param params
      * @param ctx
      */
    public static async getDeviceTodayScenes(ctx: any): Promise<any> {
        const { devid, weather, start, length, ultraviolet, humidity } = ctx.request.query
        validateCgi({ devid: devid }, commonValidator.devid)
        validateCgi({ start, length }, commonValidator.findall)
        validateCgi({ weather, ultraviolet, humidity }, scenesValidator.getscene)
        //获取设备用户组用户id
        let sourceuuids = [devid]
        let res = await User_deviceDb.getInstance().getDeviceUsers(devid)
        for (let r of res) {
            sourceuuids.push(r.useruuid)
        }
        return await ScenesDb.getInstance().findTodayScenesByDevice(sourceuuids, start, length, weather, parseInt(ultraviolet), parseFloat(humidity))
    }

}


/**
* 获取设备今日场景
*/
router.handle("get", "/", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Scenes.getDeviceTodayScenes(ctx)))