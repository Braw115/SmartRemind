import * as winston from "winston"
import { PushSettingDb } from "../../model/users/pushsetting"
import { jpush } from "../../lib/JPush"
import { RedisBackHome } from "../../redis/backhome"
import { PushlogDb } from "../../model/users/pushlog"
import { Users } from "../../model/users/users"
const TIME_INTERVAL = 2
const FETCH_INTERVAL = TIME_INTERVAL * 1000 * 60

export function init(map: { deamonNotifyMap: Map<string, Function>, deamonGetMap: Map<string, Function> }) {
    Push.getInstance().run()
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

class Push {
    private static instance = new Push()
    private constructor() { }
    public static getInstance() {
        return Push.instance
    }

    private async nobackpush() {
        //查询还未回家需要提醒的所有人
        let date = new Date()
        let  hours = date.getUTCHours()
        let minutes = date.getUTCMinutes()

        let pusher = await PushSettingDb.getInstance().noback(hours, minutes);
        for (let p of pusher) {
            let list = (p.listenuuid).split(",")
            for (let l of list) {
                let backhomeinfo = await RedisBackHome.getBackhomeAsync(l)
                //判断有没有回家
                if (p.pushtype === 'back' && !backhomeinfo) {
                    let pushid = (p.receiveuuid).replace(/-/g, "")
                    //获取未回家人的姓名
                    let user = await Users.getInstance().findByPrimary(l)
                    if (user) {
                        let content = (user.username ? user.username : "-") + " hasn't been home yet. Give him/her a call?"
                        //记录推送信息
                        await PushlogDb.getInstance().insert({ content, useruuid: p.receiveuuid, type:"bar"})
                        if (pushid)
                            await jpush(pushid, content)
                    }
                } else if (p.pushtype === 'leave' && backhomeinfo) {
                    let pushid = (p.receiveuuid).replace(/-/g, "")
                    let content = (backhomeinfo.info.getName() ? backhomeinfo.info.getName() : "-") + " hasn't left home yet. Give him/her a call?"
                    //记录推送信息
                    await PushlogDb.getInstance().insert({ content, useruuid: p.receiveuuid,  type:"bar"})
                    if (pushid)
                        await jpush(pushid, content)
                }
            }

        }
    }

    public async run() {
        while (true) {
            //每十分钟执行一ci
            try {
                await this.nobackpush()
            } catch (e) {
                winston.error(`push fail. ` + JSON.stringify(e))
            }
            await sleep(FETCH_INTERVAL)
        }
    }
}
