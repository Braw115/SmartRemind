import { MqttWrapper } from "../../lib/mqttwrapper"
//import * as winston from "winston"
import { Dispatch } from "../../dispatch"
import { LocalMqttConf } from "../../config/mqtt"

export class MqttManager {
    private static instance = new MqttManager()

    private _localMqtt: MqttWrapper
    private _willLocalMqtt: MqttWrapper

    private constructor() { }
    public static getInstance() { return MqttManager.instance }

    public get localMqtt() { return this._localMqtt }
    public get willLocalMqtt() { return this._willLocalMqtt }

    public async initialize() {
        const localMqtt = new MqttWrapper()
        const willLocalMqtt = new MqttWrapper()

        // 本地mqtt必需连接上,否则系统无法正常运行
        await localMqtt.initialize(LocalMqttConf, {
            clientId: "dev/esp_66",
            topics: ["dev/esp_66"],
            onMessage: (topic: any, msgBuf: any) => Dispatch.getInstance().dispatchLocal(topic, msgBuf)
        })
        this._localMqtt = localMqtt

        //本地willmqtt必需连接上
        await localMqtt.initialize(LocalMqttConf, {
            clientId: "dev/will/esp_66",
            topics: ["dev/will/esp_66"],
            onMessage: (topic: any, msgBuf: any) => Dispatch.getInstance().dispatchLocalWill(topic,msgBuf)
        })
        this._willLocalMqtt = willLocalMqtt
    }
}

