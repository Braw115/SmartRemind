import assert = require("assert")
import { ReqError } from "../lib/reqerror"
export class RegisterInfo {
    private email: string
    private key: string
    private token: string
    private register: string
    private password: string
    private username: string
    constructor(email: string, key: string, token: string, register: string, password?: string, username?: string) {
        [this.email, this.key, this.token, this.register, this.password, this.username] = [email, key, token, register, password, username]
    }

    public static valueOf(s: string): RegisterInfo {
        assert(typeof s === "string")

        let obj = JSON.parse(s)
        if (!obj)
            throw new ReqError("invalid RegisterInfo format")

        let { email, key, token, register, password, username } = obj


        return new RegisterInfo(email, key, token, register, password, username)
    }

    public getEmail() { return this.email }
    public getKey() { return this.key }
    public getToken() { return this.token }
    public getRegister() { return this.register }
    public getPassword() { return this.password }
    public getUsername() { return this.username }
}

import logger = require("winston")
import { getRedisClientAsync } from "../lib/redispool"

// import { sendError } from "../lib/response"

const [sessionDbOpt, Sessiontimeout] = [{ db: 1 }, 30 * 60]

export class RedisRegister {
    public static async setRegisterAsync(email: string, registerInfo: RegisterInfo) {
        const content = JSON.stringify(registerInfo)
        await getRedisClientAsync(async rds => await rds.setAsync(email, content, "ex", Sessiontimeout), sessionDbOpt)
    }

    public static async getRegisterAsync(email: string, token: string): Promise<any> {
        if (!email || !token)
            return { error: "link is invalid！" }

        let s = await getRedisClientAsync(async rds => await rds.getAsync(email), sessionDbOpt)
        if (!s)
            return { error: "link is invalid！" }

        let info = RegisterInfo.valueOf(s)
        if (token !== info.getToken())
            return { error: "link is invalid！" }
        return { info }
    }

    public static async delRegister(email: string) {
        try {
            await getRedisClientAsync(async rds => rds.delAsync(email), sessionDbOpt)
        } catch (e) {
            logger.error("delRegister error", e.message)
        }
    }

}
