// import * as assert from "assert"
import * as winston from "winston"
import { DockDB } from "../model/users/dock"
import { RfidDb } from "../model/users/rfid"
import { RedisDock } from "../redis/dockjpush"
import { PushlogDb } from "../model/users/pushlog"
import { jpush } from "../lib/JPush"
import { MqttManager } from "../deamon/mqttmanager"
import { DockupdatesDb } from "../model/users/dockupdates"

const LOWPOWER = 20
const LOWLOWPOWER = 10
const LOWLOWLOWPOWER = 5


export class Dispatch {
    private static instance = new Dispatch()
    private constructor() { }
    public static getInstance() {
        return Dispatch.instance
    }

    private parse(msgBuf: Buffer) {
        const s = msgBuf.toString()
        try {
            const r = JSON.parse(s)
            if (!r.cmd)
                throw new Error("miss cmd")

            return r
        } catch (e) {
            winston.error(`parse fail ${s} ${e.message}`)
            return null
        }
    }

    private parseWill(msgBuf: Buffer) {
        const s = msgBuf.toString()
        try {
            const r = JSON.parse(s)
            if (!r.mac)
                throw new Error("miss mac")
            return r
        } catch (e) {
            winston.error(`parse fail ${s} ${e.message}`)
            return null
        }
    }

    public async dispatchLocal(topic: string, msgBuf: Buffer) {

        const r = this.parse(msgBuf)
        if (!r)
            return
        let rfid = await RfidDb.getInstance().getRfidByrfid(r.data.mac)
        if (rfid.length < 1)
            return
        let pushid = (rfid[0].useruuid).replace(/-/g, "")
      
        switch (r.cmd) {
            case "update":
                //TODO 信息上报处理

                if (rfid.length <= 0)
                    break
                let obj = {
                    battery: r.data.battery,
                    status: r.data.status,
                    charge_type: r.data.charge_type,
                    version: r.data.version,
                    online: true
                }

                let dock = await DockDB.getInstance().findOne(rfid[0].uuid)
                let uuid = dock.uuid
                let dockerredis = await RedisDock.getRedisDockAsync(uuid)
                 if (dockerredis.dockerinfo && "charged" === dockerredis.dockerinfo.status && r.data.status !== "charged") {
                    //TODO jpush status 拔掉充电
                    let content = "Your MagDock is not connected to the power outlet !"
                    await PushlogDb.getInstance().insert({ content, useruuid: rfid[0].useruuid, type:"dock" })
                    await jpush(pushid, content)
                    dockerredis.message.status = content
                }

                if (r.data.status === "full" && dockerredis.dockerinfo && dockerredis.dockerinfo.status!=="full") {
                    //TODO jpush battery 充满
                    let content = "Your MagDock is fully charged !"
                    //let full = await RedisDock.getRedisDockAsync(r.data.mac + "full")
                    // if(!full){
                    await PushlogDb.getInstance().insert({ content, useruuid: rfid[0].useruuid, type:"dock"  })
                    await jpush(pushid, content)
                        //await RedisDock.setRedisDock2Async(r.data.mac + "full", "1")
                    dockerredis.message.battery = content
                    //}
                   
                }

                if (dockerredis.dockerinfo && r.data.battery < dockerredis.dockerinfo.battery && r.data.battery == LOWPOWER && dockerredis.message.electricity === "") {
                    //TODO jpush battery 电量低于20%
                    let content = "Your MagDock battery is low !"
                    // let low = await RedisDock.getRedisDockAsync(r.data.mac + "low")
                    // if (!low) {
                    await PushlogDb.getInstance().insert({ content, useruuid: rfid[0].useruuid, type:"dock"  })
                    await jpush(pushid, content)
                        //await RedisDock.setRedisDock1Async(r.data.mac + "low", "1")
                    dockerredis.message.battery = content
                    // }
                }

                if (dockerredis.dockerinfo && r.data.battery < dockerredis.dockerinfo.battery && r.data.battery == LOWLOWPOWER && dockerredis.message.electricity === "Your MagDock battery is low !") {
                    //TODO jpush battery 电量低于10%
                    let content = "Your MagDock battery is " + LOWLOWPOWER + "% !"
                    // let lowlowpower = await RedisDock.getRedisDockAsync(r.data.mac + "lowlowpower")
                    // if (!lowlowpower) {
                        await PushlogDb.getInstance().insert({ content, useruuid: rfid[0].useruuid, type:"dock"  })
                        await jpush(pushid, content)
                       //await RedisDock.setRedisDock1Async(r.data.mac + "lowlowpower", "1")
                        dockerredis.message.battery = content
                    // }
                }

                if (dockerredis.dockerinfo && r.data.battery < dockerredis.dockerinfo.battery && r.data.battery == LOWLOWLOWPOWER && dockerredis.message.electricity !== "Your MagDock battery is " + LOWLOWPOWER + "% !") {
                    //TODO jpush battery 电量低于5%
                    let content = "Your MagDock battery is " + LOWLOWLOWPOWER + "% !"
                    // let lowlowlowpower = await RedisDock.getRedisDockAsync(r.data.mac + "lowlowlowpower")
                    // if (!lowlowlowpower) {
                        await PushlogDb.getInstance().insert({ content, useruuid: rfid[0].useruuid, type:"dock"  })
                        await jpush(pushid, content)
                        //await RedisDock.setRedisDock1Async(r.data.mac + "lowlowlowpower", "1")
                        dockerredis.message.battery = content
                   // }
                }

                if (!dockerredis.dockerinfo) {
                    dockerredis.message = {
                        battery: "",
                        status: "",
                        charge_type: ""
                    }

                }

                if (r.data.battery > LOWPOWER) {
                    dockerredis.message.electricity = ""
                } else if (r.data.battery < LOWPOWER && r.data.battery > LOWLOWPOWER) {
                    dockerredis.message.electricity = "Your MagDock battery is low !"
                } else if (r.data.battery < LOWLOWPOWER && r.data.battery > LOWLOWLOWPOWER) {
                    dockerredis.message.electricity = "Your MagDock battery is " + LOWLOWPOWER + "% !"
                }
                
                dockerredis.dockerinfo = obj
                await RedisDock.setRedisDockAsync(uuid, JSON.stringify(dockerredis))
                await DockDB.getInstance().updateByRfiduuid(rfid[0].uuid, obj)
                break
            case "upgrade":
                //TODO 获取数据库最新版本
                let dockbin = await DockupdatesDb.getInstance().getLatestVersion()
                let version = dockbin.version
                if (r.data.version < version) {
                    let message = {
                        cmd: "upgrade",
                        data: {
                            version: version
                        }
                    }
                    this.publishUpgrade(message, r.data.mac)
                }
                break
            case "1":
                //let dockbinreboot = await DockupdatesDb.getInstance().getLatestVersion()
                //let dockversion = dockbinreboot.version
                // if (dockversion === r.data.version) {
                let message = {
                    cmd: "reboot",
                    data: {
                        mac: r.data.mac
                    }
                }
                

                this.publishUpgrade(message, r.data.mac)
                //}
                break
            case "0":
                break
            case "willmessage":
                let rfiddock = await RfidDb.getInstance().getRfidByrfid(r.data.mac)
                await DockDB.getInstance().updateByRfiduuid(rfiddock[0].uuid, { online: false, status:"free", charge_type:"free"})
                let content = "Your MagDock is offline !"
                await PushlogDb.getInstance().insert({ content, useruuid: rfid[0].useruuid, type:"dock"  })
                await jpush(pushid, content)

                break
            default:
                winston.error(`not implement ${topic} ${msgBuf.toString()}`)
                break
        }

    }

    public async dispatchLocalWill(topic: string, msgBuf: Buffer) {
        const r = this.parseWill(msgBuf)
        if (!r)
            return

        let rfid = await RfidDb.getInstance().getRfidByrfid(r.mac)
        if (rfid.length < 1)
            return
        let pushid = (rfid[0].useruuid).replace(/-/g, "")

        let rfiddock = await RfidDb.getInstance().getRfidByrfid(r.mac)

        await DockDB.getInstance().updateByRfiduuid(rfiddock[0].uuid, { online: false, status:"free", charge_type:"free" })
        let content = "Your MagDock is offline !"
        await PushlogDb.getInstance().insert({ content, useruuid: rfid[0].useruuid, type:"dock"  })
        await jpush(pushid, content)
    }


    private async publishUpgrade(cmd: any, mac: any) {
        const s = JSON.stringify(cmd)
        winston.debug(`forward to local. ${s}`)

        const mqtt = MqttManager.getInstance().localMqtt
        if (!(mqtt && mqtt.connected)) {
            winston.error(`local mqtt is disconnected, discard`)
            return
        }

        try {
            await mqtt.publish("srv/esp_66/" + mac, s)
        } catch (e) {
            winston.error(`publish fail. ${e.message}`)
        }
    }
}
