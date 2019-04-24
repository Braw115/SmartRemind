import assert = require("assert")
import { ReqError } from "../lib/reqerror"
export class RingingInfo {
    private uuid: string

    constructor(uuid: string) {
        [this.uuid] = [uuid]
    }

    public static valueOf(s: string): RingingInfo {
        assert(typeof s === "string")

        let obj = JSON.parse(s)
        if (!obj)
            throw new ReqError("invalid LoginInfo format")

        let { uuid } = obj


        return new RingingInfo(uuid)
    }

    public getUuid() { return this.uuid }
}

import logger = require("winston")
import { getRedisClientAsync } from "../lib/redispool"


const [sessionDbOpt, Sessiontimeout] = [{ db: 3 }, 86400]

export class RedisRinging {
    public static async setRingingAsync(uuid: string, ringingInfo: RingingInfo) {
        const content = JSON.stringify(ringingInfo)
        await getRedisClientAsync(async rds => await rds.setAsync(uuid, content, "ex", Sessiontimeout), sessionDbOpt)
    }

    public static async getRingingAsync(uuid: string): Promise<any> {
        let s = await getRedisClientAsync(async rds => await rds.getAsync(uuid), sessionDbOpt)
        if (!s)
            return { msg: "no ringing" }

        let info = RingingInfo.valueOf(s)
        return { info }
    }

    public static async delRinging(uuid: string) {
        try {
            await getRedisClientAsync(async rds => rds.delAsync(uuid), sessionDbOpt)
        } catch (e) {
            logger.error("delLogin error", e.message)
        }
    }
}
