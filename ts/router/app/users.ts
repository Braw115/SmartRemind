
import { RouterWrap } from "../../lib/routerwrap"
import { validateCgi } from "../../lib/validator"
import { BaseHandler } from "../lib/basehandler"
import { sendActivateEmail, sendForgetPasswordEmail } from "../../lib/sendMail"
import { Users } from "../../model/users/users"
import { DevicesDb } from "../../model/users/devices"
import { ScenesDb } from "../../model/users/scenes"
import { MessagesDb } from "../../model/users/messages"
import { TasksDb } from "../../model/users/tasks"
import { PushlogDb } from "../../model/users/pushlog"
import { User_deviceDb } from "../../model/users/user_device"
import { RfidDb } from "../../model/users/rfid"
import { checkPassword, md5sum } from "../../lib/utils"
import { LoginInfo, RedisLogin } from "../../redis/logindao"
import { RegisterInfo, RedisRegister } from "../../redis/registerdao"
import { RedisRinging } from "../../redis/ringing"
import { PushSettingDb } from "../../model/users/pushsetting"
import { ForegetPasswordInfo, RedisForegetPassword } from "../../redis/foregetPassword"
import { userValidator, commonValidator } from "./validator"
export const router = new RouterWrap({ prefix: "/app/users" })


export class AppUser extends BaseHandler {
    //登录
    public static async login(args: any): Promise<any> {
        let { email, password } = args
        validateCgi({ email, password }, userValidator.login)
        //查看用户是否注册
        let user1 = await Users.getInstance().getByEmail(email)
        //当没有注册过时，提示需要注册
        if (!user1) {
            return { msg: "This mailbox has not been registered" }
        }

        let user = await Users.getInstance().checkUser(email, md5sum(password))
        if (!user) {
            return super.NotAcceptable("Invalid password")
        }

        delete user.password
        let [now, uuid] = [new Date(), user.uuid]
        let [token, key] = [md5sum(`${now.getTime()}_${Math.random()}`), md5sum(`${now.getTime()}_${Math.random()}`)]
        let cache = new LoginInfo(uuid, key, token, now.toLocaleString(), user)
        await RedisLogin.setLoginAsync(uuid, cache)
        return { uuid, token, username: user.username }
    }

    //注册
    public static async register(args: any): Promise<any> {
        let { email, password, username } = args
        validateCgi({ email, password }, userValidator.regist)
        //查看用户是否注册
        let user1 = await Users.getInstance().getByEmail(email)
        //当没有注册过时，发送激活链接
        if (!user1) {
            let now = new Date()
            let [token, key] = [md5sum(`${now.getTime()}_${Math.random()}`), md5sum(`${now.getTime()}_${Math.random()}`)]
            let cache = new RegisterInfo(email, key, token, now.toLocaleString(), md5sum(password), username)
            await RedisRegister.setRegisterAsync(email, cache)
            sendActivateEmail(email, token)
            //发送激活邮件
            return { msg: "The activation message has been sent to the registration mailbox" }
        }
        return { msg: "This mailbox has been registered" }
    }
    /**
     * 注册用户激活
     * @param ctx
     */
    public static async activate(ctx: any): Promise<any> {
        let { email, token } = ctx.request.query
        // 获取redis中的注册信息
        let res = await RedisRegister.getRegisterAsync(email, token)
        if (res.info) {
            //存在待激活的注册信息，将注册信息插入数据库
            let obj = { email: res.info.email, password: res.info.password, username: res.info.username }
            let u = await Users.getInstance().findByEmail(res.info.email)
            if (!u) {
                await Users.getInstance().insert(obj)
            }
            //  RedisRegister.delRegister(email)
            return ctx.redirect('/api/register/success.html')
        }
        return ctx.redirect('/api/register/invalid.html')


    }
    /**
     * 登出
     * @param args
     */
    public static async logout(ctx: any): Promise<any> {
        const info: LoginInfo = super.getLoginInfo(ctx)
        await RedisLogin.delLogin(info.getUuid())
        return { msg: "Sign out Successfully" }
    }
    /**
     * 忘记密码发送邮件
     * @param args
     */
    public static async forgetPassword(body: any): Promise<any> {
        let { email } = body
        //查看该邮箱是否注册
        let res = await Users.getInstance().findByEmail(email)
        if (!res) {
            return { msg: "The mailbox is not registered" }
        }
        //发送修改密码邮件
        let now = new Date()
        let [token, key] = [md5sum(`${now.getTime()}_${Math.random()}`), md5sum(`${now.getTime()}_${Math.random()}`)]
        let cache = new ForegetPasswordInfo(email, key, token, now.toLocaleString())
        await RedisForegetPassword.setForgetPasswordAsync(key, cache)
        await sendForgetPasswordEmail(email, key)
        return { msg: "An email has been sent to your email box. Please follow the instructions there to reset your password." }
    }

    /**
     * 忘记密码修改密码
     * @param ctx
     * @param body
     */
    public static async changePassword(ctx: any, body: any) {
        const { key, password } = body
        //获取redis中保存的修改密码的信息
        let res = await RedisForegetPassword.getForgetPasswordAsync(key)
        if (res.info) {
            // if (res.info.email !== email) {
            //     return { error: "Please enter a mailbox that is the same as the registered email address" }
            // }
            let newuser = await Users.getInstance().updatePasswordByEmail(res.info.email, md5sum(password))
            if (!newuser)
                return { msg: "Modified Failed" }
            //清除修改密码缓存
            await RedisForegetPassword.delForgetPassword(key)
            return { msg: "Modified Successfully" }
        }
        return super.NotAcceptable("Retrieve password link is invalid")

    }

    /**
     * 更新密码
     * @param args
     * @param body
     * @param ctx
     */
    public static async updatePassword(body: any, ctx: any): Promise<any> {
        const info: LoginInfo = super.getLoginInfo(ctx)
        let uuid = info.getUuid()
        let { oldpassword, newpassword } = body
        validateCgi({ uuid, oldpassword, newpassword }, userValidator.updatePassword)
        let user = await Users.getInstance().findByPrimary(uuid)
        checkPassword(user.password, md5sum(oldpassword))
        let newuser = await Users.getInstance().updatePassword(uuid, md5sum(newpassword))
        if (!newuser)
            return { msg: "Modified Failed" }
        //清理登录缓存
        await RedisLogin.delLogin(uuid)
        return { msg: "Modified Successfully" }
    }

    /**
     * 更新用户名
     * @param args
     * @param body
     * @param ctx
     */
    public static async updateUsername(body: any, ctx: any): Promise<any> {
        const info: LoginInfo = super.getLoginInfo(ctx)
        let { username } = body
        validateCgi({ uuid: info.getUuid(), username }, userValidator.updateUsername)
        let newuser = await Users.getInstance().updateUsername(info.getUuid(), username)
        if (!newuser)
            return { msg: "Modified Failed" }
        return { msg: "Modified Successfully" }
    }

    /**
     * 更新头像
     * @param args
     * @param body
     * @param ctx
     */
    public static async updateAvatar(body: any, ctx: any): Promise<any> {
        const info: LoginInfo = super.getLoginInfo(ctx)
        let { avatar } = body
        let newuser = await Users.getInstance().updateAvatar(info.getUuid(), avatar)
        if (!newuser)
            return { msg: "Modified Failed" }
        return { msg: "Modified Successfully" }
    }
    /**
     * 获取用户信息
     * @param args
     */
    public static async getUserInfo(ctx: any): Promise<any> {
        const info: LoginInfo = super.getLoginInfo(ctx)
        let user = await Users.getInstance().findByPrimary(info.getUuid())
        if (!user) {
            return { msg: "user does not exist" }
        }
        delete user.password
        return { user }
    }
    /**
     * 获取用户信息
     * @param args
     */
    public static async getuserstatus(ctx: any): Promise<any> {
        const info: LoginInfo = super.getLoginInfo(ctx)
        let status = 0
        let res = await User_deviceDb.getInstance().findByUserAndDevice({ useruuid: info.getUuid() })
        if (res) {
            status = parseInt(res.status) + 1
        }
        return { status }
    }

    public static async IsRinging(ctx: any): Promise<any> {
        const info: LoginInfo = super.getLoginInfo(ctx)
        let res = await RedisRinging.getRingingAsync(info.getUuid())
        if (res.info) {
            //有振铃
            await RedisRinging.delRinging(info.getUuid())
            return { isRinging: true }
        }

        return { isRinging: false }
    }


    /**
     * 加入设备用户组
     * @param params
     * @param body
     */
    public static async applyjoinDevice(body: any): Promise<any> {
        const { devid, useruuid, longitude, latitude,type } = body
        validateCgi({ devid: devid }, commonValidator.devid)
        validateCgi({ uuid: useruuid }, commonValidator.UUID)
        //参数校验
        let location = { longitude, latitude }
        //查看用户是否已经用户组中
        let res1 = await User_deviceDb.getInstance().findByUserAndDevice({ useruuid })
        if (res1 && res1.status === 1) {
            return { title: "Bad Request", msg: "The user has already associated  device" }
        }
        //查看设备是否已经存在，当设备不存在时，则说明设备为第一次激活。
        let res = await DevicesDb.getInstance().findDevicesBydevid(devid)
        if (!res) {
            await DevicesDb.getInstance().insertDevices({ devid, location })
        } else {
            //判断是否有位置传过来，更新设备地址
            if (longitude && latitude) {
                await DevicesDb.getInstance().updateLocation(devid, location)
            }
        }
        //判断该设备是否有绑定的用户，如果没有绑定用户时，直接给用户添加绑定
        let users = await User_deviceDb.getInstance().getDeviceUsers(devid)
        if (users.length <= 0) {
            //删除现用户申请信息
            await User_deviceDb.getInstance().delete({ useruuid, devid, status: 0,type })
            //添加用户到用户组,状态为加入状态
            let res1 = await User_deviceDb.getInstance().insertUser_divice({ useruuid, devid, status: 1 ,type})
            if (!res1) {
                return { title: "Bad Request", msg: "Join Failed" }
            }
            return { title: "Request sent", "msg": "Join Successfully" }
        } else {
            //添加用户到用户组,状态为申请状态
            let obj = { useruuid, devid, status: 0,type }
            //删除用户上一个增加信息
            // if (res1 && res1.status === 0)
            //     await User_deviceDb.getInstance().update(res1.uuid, { devid })
            // else {
            //     await User_deviceDb.getInstance().insertUser_divice(obj)
            // }
            await User_deviceDb.getInstance().upsertUser_divice(obj, useruuid)
            return { title: "Request sent", "msg": "Pending approval from parenting account" }
        }
    }


    public static async deviceuser(ctx: any): Promise<any> {
        const info: LoginInfo = super.getLoginInfo(ctx)
        //获取用户所在的用户组成员，并判断用户是不是第一个绑定人员
        let obj = { useruuid: info.getUuid(), status: 1 }
        let user_device = await User_deviceDb.getInstance().findByUserAndDevice(obj)
        if (!user_device) {
            return { msg: "user did not associated the device" }
        }
        //根据设备id获取绑定的所有用户
        let user = await User_deviceDb.getInstance().getDeviceUsers(user_device.devid)
        //查看用户是否是第一个绑定的人，如果是查出申请的信息
        if (user[0].useruuid === info.getUuid()) {
            let apply = await User_deviceDb.getInstance().getDeviceUsersapply(user_device.devid);
            return { user, apply }
        }
        return { user, apply: [] }
    }


    public static async remindusers(ctx: any): Promise<any> {
        const info: LoginInfo = super.getLoginInfo(ctx)
        //获取用户所在的用户组成员，并判断用户是不是第一个绑定人员
        let obj = { useruuid: info.getUuid(), status: 1 }
        let user_device = await User_deviceDb.getInstance().findByUserAndDevice(obj)
        if (!user_device) {
            //获取我的个人信息
            let user = await Users.getInstance().findByPrimary(info.getUuid())
            user.useruuid = user.uuid
            return { user: [user] }
        }
        //根据设备id获取绑定的所有用户
        let user = await User_deviceDb.getInstance().getDeviceUsers(user_device.devid)
        return { user }
    }
    public static async myInfo(ctx: any): Promise<any> {
        const info: LoginInfo = super.getLoginInfo(ctx)
        //获取用户所在的用户组成员，并判断用户是不是第一个绑定人员
        let obj = { useruuid: info.getUuid(), status: 1 }
        let membercount = 0
        let user_device = await User_deviceDb.getInstance().findByUserAndDevice(obj)
        if (user_device) {
            //根据设备id获取绑定的所有用户
            let user = await User_deviceDb.getInstance().getDeviceUsers(user_device.devid)
            //查看用户是否是第一个绑定的人，如果是查出申请的信息
            if (user[0].useruuid === info.getUuid()) {
                let apply = await User_deviceDb.getInstance().getDeviceUsersapply(user_device.devid);
                membercount = apply.length
            }
        }
        //获取用户所有要是数量
        let rfidcount = await RfidDb.getInstance().getRfidCount(info.getUuid());
        let usedevice = await User_deviceDb.getInstance().getDeviceByUser(info.getUuid())
        if (usedevice)
            rfidcount += 1
        return { membercount, rfidcount }

    }
    public static async dealjoinapply(body: any): Promise<any> {
        let { uuid, status } = body
        validateCgi({ uuid: uuid }, commonValidator.UUID)
        if (status === 1) {
            //同意加入申请。将状态变为1
            let res = await User_deviceDb.getInstance().updateUser_divice(uuid, status);
            if (!res)
                return { msg: "Deal Failed" }
            return { msg: "new member added" }
        } else {
            //不同意,删除数据库中的申请信息
            let obj = { uuid }
            await User_deviceDb.getInstance().delete(obj)
            return { msg: "Deal Successfully" }
        }
    }
    public static async unbind(ctx: any, body: any): Promise<any> {
        const info: LoginInfo = super.getLoginInfo(ctx)
        let { devid } = body
        validateCgi({ devid: devid }, commonValidator.devid)
        let obj = { useruuid: info.getUuid(), devid }
        let user_devices = await User_deviceDb.getInstance().delete(obj)
        let pushsetting = await PushSettingDb.getInstance().findReceiveuuid(info.getUuid())
        let uuidstr = ''
        for (let p of pushsetting) {
            let receiveuuid = p.receiveuuid.split(",")
            for (let r of receiveuuid) {
                if (r == info.getUuid())
                    continue
                else
                    uuidstr = uuidstr + r + ','
            }
            uuidstr = uuidstr.substring(0, uuidstr.length - 1)
            await PushSettingDb.getInstance().update(p.uuid, { receiveuuid: uuidstr })
        }


        if (!user_devices) {
            return { msg: "Deleted Failed" }
        }
        return { "msg": "Deleted Successfully" }
    }

    public static async setReceive(ctx: any, body: any): Promise<any> {
        const info: LoginInfo = super.getLoginInfo(ctx)
        let { isreceive } = body
        let obj = { isreceive }
        let users = await Users.getInstance().update(info.getUuid(), obj)
        if (!users) {
            return { msg: "Update Failed" }
        }
        return { "msg": "Update   Successfully" }
    }

    public static async getsyspushsetting(ctx: any, body: any): Promise<any> {
        const info: LoginInfo = super.getLoginInfo(ctx)
        let user = await Users.getInstance().findSettingByUuid(info.getUuid())
        if (!user) {
            return { msg: "user does not exist" }
        }
        return { user }
    }

    public static async setPublish(ctx: any, body: any): Promise<any> {
        const info: LoginInfo = super.getLoginInfo(ctx)
        let { ispublish } = body
        let obj = { ispublish }
        let users = await Users.getInstance().update(info.getUuid(), obj)
        if (!users) {
            return { msg: "Update Failed" }
        }
        return { "msg": "Update   Successfully" }
    }

    public static async setAddress(ctx: any, body: any): Promise<any> {
        const info: LoginInfo = super.getLoginInfo(ctx)
        let { homeaddress, workaddress } = body
        let obj = { homeaddress, workaddress }
        let users = await Users.getInstance().update(info.getUuid(), obj)
        if (!users) {
            return { msg: "Update Failed" }
        }
        return { "msg": "Update   Successfully" }
    }

    public static async setTime(ctx: any, body: any): Promise<any> {
        const info: LoginInfo = super.getLoginInfo(ctx)
        let { workingtime, offtime } = body
        let obj = { workingtime, offtime }
        let users = await Users.getInstance().update(info.getUuid(), obj)
        if (!users) {
            return { msg: "Update Failed" }
        }
        return { "msg": "Update   Successfully" }
    }


    public static async myremind(ctx: any, query: any): Promise<any> {
        const info: LoginInfo = super.getLoginInfo(ctx)
        let { weather, temperature, ultraviolet } = ctx.request.query
        let taskcount = await TasksDb.getInstance().getTodaytaskCount(info.getUuid())
        let secnescount = await ScenesDb.getInstance().findScenesCountByCondition(info.getUuid(), weather, temperature, ultraviolet)
        let messagecount = await MessagesDb.getInstance().findTodayMessageCountByUser(info.getUuid())
        let pushcount = await PushlogDb.getInstance().findtodaypushcount(info.getUuid())
        return { remindcount: parseInt(taskcount) + parseInt(secnescount) + parseInt(messagecount), pushcount: parseInt(pushcount) }
    }

}


/**
* 获取用户信息
*/
router.loginHandle("get", "/", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await AppUser.getUserInfo(ctx)))

/**
* 获取用户信息
*/
router.loginHandle("get", "/status", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await AppUser.getuserstatus(ctx)))


/**
 * 1、用户登录
 */
router.handle("post", "/login", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await AppUser.login((ctx.request as any).body)))

/**
 * 2、用户注册
 */
router.handle("post", "/register", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await AppUser.register((ctx.request as any).body)))

/**
 * 登出
 */
router.loginHandle("post", "/logout", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await AppUser.logout(ctx)))

/**
 * 用户激活
 */
router.handle("get", "/activate", async (ctx, next) =>
    await AppUser.activate(ctx))

/**
 * 振铃
 */
router.loginHandle("get", "/IsRinging", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await AppUser.IsRinging(ctx)))


/**
 * 忘记密码,发送邮件
 */
router.handle("post", "/forgetPassword", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await AppUser.forgetPassword((ctx.request as any).body)))

/**
* 忘记密码,找回密码
*/
router.handle("post", "/changePassword", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await AppUser.changePassword(ctx, (ctx.request as any).body)))

/**
 * 修改密码
 */
router.loginHandle("put", "/updatepassword", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await AppUser.updatePassword((ctx.request as any).body, ctx)))

/**
 * 修改用户名
 */
router.loginHandle("put", "/updateusername", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await AppUser.updateUsername((ctx.request as any).body, ctx)))

/**
 * 修改用户头像
 */
router.loginHandle("put", "/updateavatar", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await AppUser.updateAvatar((ctx.request as any).body, ctx)))



/**
 * 用户加入设备组
 */
router.handle("post", "/applyjoinDevice", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await AppUser.applyjoinDevice((ctx.request as any).body)))

/**
 * 获取用户家庭组的成员
 */
router.loginHandle("get", "/deviceusers", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await AppUser.deviceuser(ctx)))

/**
* 获取可提醒的人员信息
*/
router.loginHandle("get", "/remindusers", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await AppUser.remindusers(ctx)))


/**
 * 处理申请
 */
router.loginHandle("post", "/dealjoinapply", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await AppUser.dealjoinapply((ctx.request as any).body)))


/**
 * 解除绑定
 */
router.loginHandle("delete", "/unbind", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await AppUser.unbind(ctx, (ctx.request as any).body)))


router.loginHandle("put", "/setReceive", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await AppUser.setReceive(ctx, (ctx.request as any).body)))


router.loginHandle("put", "/setPublish", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await AppUser.setPublish(ctx, (ctx.request as any).body)))

router.loginHandle("get", "/syspushsetting", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await AppUser.getsyspushsetting(ctx, (ctx.request as any).body)))



/**
 * 设置上下班地址
 */
router.loginHandle("put", "/setaddress", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await AppUser.setAddress(ctx, (ctx.request as any).body)))


/**
 * 设置上下班时间
 */
router.loginHandle("put", "/settime", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await AppUser.setTime(ctx, (ctx.request as any).body)))


/**
* 获取用户要是和待处理个数
*/
router.loginHandle("get", "/myinfo", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await AppUser.myInfo(ctx)))

/**
* 获取用户提醒个数
*/
router.loginHandle("get", "/myremindcount", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await AppUser.myremind(ctx, ctx.query)))


