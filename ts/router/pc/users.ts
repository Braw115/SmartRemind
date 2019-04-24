import { RouterWrap } from "../../lib/routerwrap"
import { validateCgi } from "../../lib/validator"
import { BaseHandler } from "../lib/basehandler"
import { User_deviceDb } from "../../model/users/user_device"
import { RfidDb } from "../../model/users/rfid"
import { commonValidator } from "./validator"
import { PushSettingDb } from "../../model/users/pushsetting"
export const router = new RouterWrap({ prefix: "/devices/users" })
export class Users extends BaseHandler {
    /**
        * 获取设备关联的所有用户
        * @param params
        */
    public static async getDeviceAllUsers(query: any): Promise<any> {
        const { devid } = query
        validateCgi({ devid: devid }, commonValidator.devid)
        let users = await User_deviceDb.getInstance().getDeviceUsers(devid)
        for (let user of users) {
            //获取用户的rfid信息,添加到用户列表中
            let rfids = await RfidDb.getInstance().getRfid(user.useruuid)
            user.rfids = rfids
        }
        return users
    }


    /**
    * 删除设备的某个用户
    * @param params
    * @param body
    */
    public static async delDeviceUser(body: any): Promise<any> {
        const { useruuid, devid } = body
        validateCgi({ devid: devid }, commonValidator.devid)
        validateCgi({ uuid: useruuid }, commonValidator.UUID)
        let obj = { devid, useruuid }
        //删除设备表中的数据
        let res = await User_deviceDb.getInstance().delete(obj)

        let pushsetting = await PushSettingDb.getInstance().findReceiveuuid(useruuid)
        let uuidstr = ''
        for (let p of pushsetting) {
            let receiveuuid = p.receiveuuid.split(",")
            for (let r of receiveuuid) {
                if (r == useruuid)
                    continue
                else
                    uuidstr = uuidstr + r + ','
            }
            uuidstr = uuidstr.substring(0, uuidstr.length - 1)
            await PushSettingDb.getInstance().update(p.uuid, { receiveuuid: uuidstr })
        }

        if (!res) {
            return { msg: "Deleted Failed" }
        }
        return { "msg": "Deleted Successfully" }
    }


}

/**
 * 获取设备用户组成员
 */
router.handle("get", "/", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Users.getDeviceAllUsers(ctx.request.query)))

/**
* 设备清除设备用户
*/
router.handle("delete", "/", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Users.delDeviceUser((ctx.request as any).body)))