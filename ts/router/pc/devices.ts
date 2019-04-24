import { RouterWrap } from "../../lib/routerwrap"
import { validateCgi } from "../../lib/validator"
import { BaseHandler } from "../lib/basehandler"
import { DevicesDb } from "../../model/users/devices"
import { User_deviceDb } from "../../model/users/user_device"
import { MessagesDb } from "../../model/users/messages"
import { RfidDb } from "../../model/users/rfid"
// import { LeaveBackRecordDb } from "../../model/users/leavebackrecord"
import { PushSettingDb } from "../../model/users/pushsetting"
import { RedisRinging, RingingInfo } from "../../redis/ringing"
import { commonValidator, deviceValidator } from "./validator"
import { Users } from "../../model/users/users"
//import { AppupdatesDb } from "../../model/users/appupdates"
import { jpush } from "../../lib/JPush"
import { BackHomeInfo, RedisBackHome } from "../../redis/backhome"
import { PushlogDb } from "../../model/users/pushlog"
export const router = new RouterWrap({ prefix: "/devices/dev" })

let pushed = new Set()

export class Device extends BaseHandler {
    /*设置推送记录*/
    public static setPushedByUserUUID(useruuid: string, type: string) {
        pushed.add(useruuid + type)
        setTimeout(() => {
            pushed.delete(useruuid + type)
        }, 3 * 1000)
    }

    /**
     * 设备初始化     --删除设备表，用户设备表，留言表中与设备有关的数据
     * @param params
     * @param body
     */
    public static async delDevice(params: any): Promise<any> {
        const { devid ,rfidarr } = params
        validateCgi({ devid: devid }, commonValidator.devid)
        //删除设备表中的数据
        await DevicesDb.getInstance().delete(devid)
        //删除用户数据关联表中的数据
        await User_deviceDb.getInstance().deleteByDevice(devid)
        //删除录音留言表中的数据
        await MessagesDb.getInstance().deleteByDevid(devid)
        //删除钥匙
        if( rfidarr && rfidarr.length>=0){
            for(let rfid of rfidarr){
                await RfidDb.getInstance().delByRfid(rfid);
            }
        }
        return { "msg": "Initialized successfully" }
    }



    /**
     * 振铃
     * @param params
     */
    public static async ringing(query: any): Promise<any> {
        const { devid } = query
        validateCgi({ devid: devid }, commonValidator.devid)
        //获取设备用户组用户id
        let res = await User_deviceDb.getInstance().getDeviceUsers(devid)
        if (res.length < 1) {
            return { msg: "The device is not associated with the user" }
        }

        let uuid = res[0].useruuid
        let cache = new RingingInfo(uuid)
        await RedisRinging.setRingingAsync(uuid, cache)
        return { msg: "Ringing Successfully" }
    }
    /**
     * 通过设备mid地址，判断设备是否被激活
     * @param params
     */
    public static async getDeviceStatus(query: any): Promise<any> {
        // let devid = "c14a0947-c073-4f15-a73f-3e1dfa65c0ba"
        let { devid } = query
        validateCgi({ devid: devid }, commonValidator.devid)
        //查询该设备是否激活
        let res = await DevicesDb.getInstance().findDevicesBydevid(devid)
        if (res) {
            let res1 = await User_deviceDb.getInstance().getDeviceUsers(devid)
            if (res1.length > 0) {
                if (res1[0].username) {
                    return { uuid: devid, isActivated: true, username: res1[0].username, location: res.location }
                }
            }
            return { uuid: devid, isActivated: true, username: 'master', location: res.location }
        }
        return { uuid: devid, isActivated: false, username: 'master' }
    }

    /**
     * 获取消息任务条数
     * @param params
     * @param req
     */
    // public static async getMessageAndTaskCount(req: any): Promise<any> {
    //     let { devid, weather, ultraviolet, humidity, rfid } = req.query
    //     let sourceuuids = [devid]
    //     validateCgi({ devid: devid }, commonValidator.devid)
    //     validateCgi({ weather, ultraviolet, humidity }, scenesValidator.getscene)
    //     //获取设备用户组用户id
    //     let res = await User_deviceDb.getInstance().getDeviceUsers(devid)
    //     for (let r of res) {
    //         sourceuuids.push(r.useruuid)
    //     }
    //     //判断是否有rfid，如果有的话则要加上绑定的rfid的私有的和指定该用户的消息，否则只显示公共的
    //     if (rfid) {
    //         //根据rfid获取用户
    //         let user = await Users.getInstance().findByRFID(rfid)
    //         if (user) {
    //             let obj = { devid: devid, useruuid: user.uuid, status: 1 }
    //             //判断该用户是否绑定该设备
    //             let device_user = await User_deviceDb.getInstance().findByUserAndDevice(obj)
    //             if (device_user) {
    //                 let messagecount = await MessagesDb.getInstance().findMessageCountByDevice(sourceuuids)
    //                 let taskcount = await TasksDb.getInstance().findTaskCountByDeviceAndUser(user.uuid, sourceuuids)
    //                 // let todayTaskcount = await TasksDb.getInstance().findTodayTaskCountByDeviceAndUser(user.uuid, sourceuuids)
    //                 let todayScenescount = await ScenesDb.getInstance().findTodayScenesCountByDevice(sourceuuids, weather, ultraviolet, humidity)
    //                 return { count: messagecount + taskcount + todayScenescount }
    //             }
    //         }
    //     }
    //     let messagecount = await MessagesDb.getInstance().findMessageCountByDevice(sourceuuids)
    //     let taskcount = await TasksDb.getInstance().findTaskCountByDevice(sourceuuids)
    //     // let todayTaskcount = await TasksDb.getInstance().findTodayTaskCountByDevice(sourceuuids)
    //     let todayScenescount = await ScenesDb.getInstance().findTodayScenesCountByDevice(sourceuuids, weather, ultraviolet, humidity)
    //     return { count: messagecount + taskcount + todayScenescount }
    // }

    /**
     * 绑定rfid
     * @param body
     */
    public static async bundlingRFID(body: any): Promise<any> {
        const { uuid, rfid, type, name, devid } = body
        validateCgi({ uuid, rfid, type, devid }, deviceValidator.bundlingRFID)

        let device_user = await User_deviceDb.getInstance().findByUserAndDevice({ devid: devid, useruuid: uuid })
        if (!device_user)
            return { msg: "user no bundling" }

        //查看rfid是否已经绑定   当有值时，则已经绑定
        let user = await Users.getInstance().findByRFID(rfid)
        if (user) {
            return { msg: "rfid is already bound" }
        }
        let obj = { rfid, type, useruuid: uuid, name }
        let user1 = await RfidDb.getInstance().insert(obj)
        if (!user1) {
            return { msg: "Bundling Failed" }
        }
        return { "msg": "Bundling Successfully" }
    }

    /**
     * 删除rfid
     * @param query
     */
    public static async deleteRFID(body: any): Promise<any> {
        const { rfid } = body
        let user1 = await RfidDb.getInstance().delByRfid(rfid)
        if (!user1) {
            return { msg: "delete Failed" }
        }
        return { "msg": "delete Successfully" }
    }

    /**
     * 根据rfid获取绑定的用户
     * @param param
     */
    public static async getInfoByRFID(query: any): Promise<any> {
        const { rfid, devid, weather, ultraviolet, temperature, showtype } = query
        const { start, length } = query
        validateCgi({ start, length }, commonValidator.findall)
        validateCgi({ rfid, devid, weather, ultraviolet, temperature, showtype }, deviceValidator.getInfoByRFID)
        //判断rfid是否绑定用户
        let user = await Users.getInstance().findByRFID(rfid)
        if (!user) {
            return { "msg": "A new MagTag has been detected. Waiting to be paired." }
        }

        //判断绑定的用户是否在设备用户组
        let obj = { devid: devid, useruuid: user.uuid, status: 1 }
        let device_user = await User_deviceDb.getInstance().findByUserAndDevice(obj)
        if (!device_user) {
            return { "msg": "user no bundling" }
        }
        //保存用户每次离家回家的时间信息
        // let recordobj = { useruuid: user.uuid, type: showtype }
        // await LeaveBackRecordDb.getInstance().insert(recordobj)
        //将用户回家信息存入redis
        let info = await RedisBackHome.getBackhomeAsync(user.uuid)
        let backhomeInfo = null
        if (info) {
            backhomeInfo = info.info
        }
        if (showtype === "back") {
            //查看用户是否已经放上去了物品
            if (backhomeInfo) {
                backhomeInfo.setNum(backhomeInfo.getNum() + 1)
            } else {
                backhomeInfo = new BackHomeInfo(1, user.username)
            }
            await RedisBackHome.setBackhomeAsync(user.uuid, backhomeInfo)
        } else {
            if (backhomeInfo && backhomeInfo.getNum() > 1) {
                backhomeInfo.setNum(backhomeInfo.getNum() - 1)
                await RedisBackHome.setBackhomeAsync(user.uuid, backhomeInfo)
            } else {
                await RedisBackHome.delBackhome(user.uuid)
            }
        }

        //获取设备用户组用户id
        let res = await User_deviceDb.getInstance().getDeviceUsers(devid)
        let useruuids = res.map(r => { return r.useruuid })
        //获取设置了要提醒人的uuid
        // let blackpush = await BlackPushDb.getInstance().findall(user.uuid)
        let setting = await PushSettingDb.getInstance().getpush(user.uuid)
        // let push = setting.map((bp: any) => { return bp.receiveuuid })
        if (user.ispublish && user.ispublish === 1) {
            for (let r of setting) {
                if (r.receiveuuid !== user.uuid && useruuids.includes(r.receiveuuid)) {
                    //用户设置接收时接收
                    let u = await Users.getInstance().findByPrimary(r.receiveuuid)
                    if (u.isreceive && u.isreceive === 1) {
                        //去掉用户uuid的横杠
                        //运用极光推送，推送用户回家离家信息
                        let pushid = (u.uuid).replace(/-/g, "")
                        let content = ""
                        if (showtype === 'back' && r.pushtype === 'back') {
                            if (!pushed.has(u.uuid + 'back')) {
                                Device.setPushedByUserUUID(u.uuid, 'back')
                                content = (user.username ? user.username : "-") + " is home now"
                                await PushlogDb.getInstance().insert({ content, useruuid: u.uuid, type:"bar"})
                                await jpush(pushid, content)
                            }
                        } else if (showtype === 'leave' && r.pushtype === 'leave') {
                            if (!pushed.has(u.uuid + 'leave')) {
                                Device.setPushedByUserUUID(u.uuid, 'leave')
                                content = (user.username ? user.username : "-") + " is leaving home now"
                                await PushlogDb.getInstance().insert({ content, useruuid: u.uuid, type:"bar" })
                                await jpush(pushid, content)
                            }
                        }
                    }
                }

            }
        }
        //获取用户当天任务，留言，场景
        let sourceuuids = [devid, user.uuid]
        let data = await Users.getInstance().findTodayInfoByDevice(sourceuuids, weather, ultraviolet, temperature, showtype, start, length);
        return { user, data }
    }


    /**
     * 设备获取信息
    * @param param
     */
    public static async getInfoByDevice(query: any): Promise<any> {
        const { devid, weather, ultraviolet, temperature } = query
        const { start, length } = query
        validateCgi({ start, length }, commonValidator.findall)
        validateCgi({ devid, weather, ultraviolet, temperature }, deviceValidator.getInfoByDevice)
        //获取设备用户组用户id
        let res = await User_deviceDb.getInstance().getDeviceUsers(devid)
        let backer = [devid]
        for (let r of res) {
            let backhomeInfo = await RedisBackHome.getBackhomeAsync(r.useruuid)
            if (backhomeInfo) {
                backer.push(r.useruuid)
            }
        }
        //有人回家，显示回家的人的消息
        let result = await Users.getInstance().findInfoByDevice(backer, weather, ultraviolet, temperature, "back", start, length)
        return { data: result }
    }

    /**
    * 设备获取信息
   * @param param
    */
    public static async getInfoCountByDevice(query: any): Promise<any> {
        const { devid, weather, ultraviolet, temperature } = query
        // validateCgi({ devid, weather, ultraviolet, temperature }, deviceValidator.getInfoByDevice)
        //获取设备用户组用户id
        let res = await User_deviceDb.getInstance().getDeviceUsers(devid)
        let backer = [devid]
        for (let r of res) {
            let backhomeInfo = await RedisBackHome.getBackhomeAsync(r.useruuid)
            if (backhomeInfo) {
                backer.push(r.useruuid)
            }
        }
        //有人回家，显示回家的人的消息
        let result = await Users.getInstance().findInfoCountByDevice(backer, weather, ultraviolet, temperature, "back")
        return { count: result }
    }

}




/**
 * 振铃
 */
router.handle("get", "/ringing", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Device.ringing(ctx.request.query)))

/**
 * 根据设备id判断设备是否已经激活
 */
router.handle("get", "/", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Device.getDeviceStatus(ctx.request.query)))


/**
 * 绑定rfid
 */
router.handle("post", "/bundlingRFID", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Device.bundlingRFID((ctx.request as any).body)))

/**
* 删除rfid
*/
router.handle("delete", "/deleteRFID", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Device.deleteRFID((ctx.request as any).body)))


/**
*获取rfid绑定的用户和信息
*/
router.handle("get", "/getInfoByRFID", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Device.getInfoByRFID(ctx.query)))

/**
*获取已经回家的用户信息
*/
router.handle("get", "/getInfoByDevice", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Device.getInfoByDevice(ctx.query)))



/**
* 首页获取信息，任务场景条数
*/
router.handle("get", "/getInfoCountByDevice", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Device.getInfoCountByDevice(ctx.query)))


/**
* 设备初始化
*/
router.handle("post", "/", async (ctx, next) =>
    BaseHandler.handlerResult(ctx, await Device.delDevice((ctx.request as any).body)))

