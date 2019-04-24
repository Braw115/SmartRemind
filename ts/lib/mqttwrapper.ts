import * as mqtt from 'mqtt'
import * as assert from "assert"
import * as winston from "winston"

export class MqttWrapper {
    private client: mqtt.MqttClient

    public constructor() { }

    public initialize(config: any, opt: { clientId: string, onMessage: Function, onConnect?: Function, onClose?: Function, topics: string[] }) {
        let done = false
        return new Promise((resolve, reject) => {
            const { host, port, options } = config
            const { clientId, onMessage, topics } = opt

            assert(host && port && options && clientId && onMessage && topics)

            const param = Object.assign({}, options, { clientId })

            const p = Object.assign({}, options, { clientId, key: "*", cert: "*", host, port })
            winston.info(`mqtt param: ${JSON.stringify(p)}`)

            let client = mqtt.connect(`mqtt://${host}:${port}`, param)

            // connect -> offline -> close -> reconnect
            // reconnect -> close
            client.on('connect', () => {
                winston.info("connect ok", topics)

                opt.onConnect && opt.onConnect()

                if (!done) {
                    resolve(true)
                    done = true
                }

                client.subscribe(topics, { qos: 0 }, (err, arr) => {
                    // [{ topic: 'srv/devmgr', qos: 0 }, { topic: '$SYS/brokers/+/clients/dev/#', qos: 0 }]
                    err && winston.error(`subscribe fail. ${err.message}`)
                    arr.forEach(res => {
                        if (res.qos > 3) {
                            winston.error(`subscribe fail. ${JSON.stringify(res)}`)
                        } else {
                            winston.info(`subscribe OK. ${JSON.stringify(res)}`)
                        }
                    })
                })
            })

            // 重连事件
            client.on("reconnect", () => {
                winston.warn("reconnect")
            })

            // 连接断开事件
            client.on("close", (err: any) => {
                winston.warn(`close on error ${err}`)
                opt.onClose && opt.onClose()
            })

            // 消息到达
            client.on("message", (topic: string, msgBuf: Buffer) => onMessage(topic, msgBuf))

            // 其他异常事件
            client.on("error", (err: any) => { winston.error(`exception ${err}`) })

            this.client = client
        })
    }

    public connected() {
        return this.client.connected
    }

    public publish(topic: string, message: string, opt?: mqtt.IClientPublishOptions) {
        const client = this.client
        return new Promise((resolve, reject) => {
            if (!client.connected) {
                return reject(new Error(`disconnected`))
            }

            if (opt) {
                client.publish(topic, message, opt, (err, packet) => {
                    if (err)
                        return reject(err)
                    return resolve(packet)
                })
                return
            }

            client.publish(topic, message, (err, packet) => {
                if (err)
                    return reject(err)
                return resolve(packet)
            })
        })
    }
}

