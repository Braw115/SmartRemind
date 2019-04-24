
import { RouterWrap } from "../../lib/routerwrap"
import { BaseHandler } from "../lib/basehandler"
import { AppupdatesDb } from "../../model/users/appupdates"
import { moveFile } from "../../lib/upload"

export const router = new RouterWrap({ prefix: "/devices/devicesupdates" })


export class Appupdates extends BaseHandler {
    public static async appupdates(): Promise<any> {
        let app = await AppupdatesDb.getInstance().getLatestVersion()
        return { app }
    }

    public static async getAppVersion(params: any): Promise<any> {
        let { version } = params
        let app = await AppupdatesDb.getInstance().getAppByVersion(version)
        return { app }
    }

    public static async uploadVersion(ctx: any): Promise<any> {
        const { version, message, file } = (ctx.request as any).body
        //const url = "http://18.218.59.235:6606/apk/" + file.originalname
        const url = "http://maghex.ipitaka.com:6606/apk/" + file.originalname
        let err = await moveFile(file)
        if (err) return super.InternalServerError(err)

        let res = await AppupdatesDb.getInstance().insertOne({ version, url, message })
        if (!res) return super.InternalServerError("插入失败")

        return { msg: "ok" }
    }
}


/**
 * 获取最新版本信息
 */
router.handle("get", "/", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Appupdates.appupdates()))

/**
 * 获取指定版本的信息
 */
router.handle("get", "/:version", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Appupdates.getAppVersion(ctx.params)))

/**
 *上传版本
 */
router.handle("post", "/", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Appupdates.uploadVersion(ctx)))
