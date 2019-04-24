import assert = require("assert")
import { ReqError } from "../lib/reqerror"
export class ForegetPasswordInfo {
    private email: string
    private key: string
    private token: string
    private ForgetPassword: string
    private uuid: string
    constructor(email: string, key: string, token: string, ForgetPassword: string, uuid?: string) {
        [this.email, this.key, this.token, this.ForgetPassword, this.uuid] = [email, key, token, ForgetPassword, uuid]
    }

    public static valueOf(s: string): ForegetPasswordInfo {
        assert(typeof s === "string")

        let obj = JSON.parse(s)
        if (!obj)
            throw new ReqError("invalid ForegetPasswordInfo format")

        let { email, key, token, ForgetPassword, uuid } = obj


        return new ForegetPasswordInfo(email, key, token, ForgetPassword, uuid)
    }

    public getEmail() { return this.email }
    public getKey() { return this.key }
    public getToken() { return this.token }
    public getForgetPassword() { return this.ForgetPassword }
    public getUuid() { return this.uuid }

}

import logger = require("winston")
import { getRedisClientAsync } from "../lib/redispool"
const [sessionDbOpt, Sessiontimeout] = [{ db: 2 }, 60 * 60]

export class RedisForegetPassword {
    public static async setForgetPasswordAsync(uuid: string, ForegetPasswordInfo: ForegetPasswordInfo) {
        const content = JSON.stringify(ForegetPasswordInfo)
        await getRedisClientAsync(async rds => await rds.setAsync(uuid, content, "ex", Sessiontimeout), sessionDbOpt)
    }

    public static async getForgetPasswordAsync(key: string): Promise<any> {
        if (!key)
            return { error: "Retrieve password link is invalid" }

        let s = await getRedisClientAsync(async rds => await rds.getAsync(key), sessionDbOpt)
        if (!s)
            return { error: "Retrieve password link is invalid" }

        let info = ForegetPasswordInfo.valueOf(s)
        return { info }
    }

    public static async delForgetPassword(uuid: string) {
        try {
            await getRedisClientAsync(async rds => rds.delAsync(uuid), sessionDbOpt)
        } catch (e) {
            logger.error("delForgetPassword error", e.message)
        }
    }

}
