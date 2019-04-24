import logger = require("winston")
import { getRedisClientAsync } from "../lib/redispool"
const [sessionDbOpt, Sessiontimeout, Sessiontimeout1,Sessiontimeout2] = [{ db: 6 }, 7 * 24 * 3600 * 1000, 5 * 60 * 1000,8* 3600 * 1000]

export class RedisDock {
    public static async setRedisDockAsync(uuid: string, content: string) {
        await getRedisClientAsync(async rds => await rds.setAsync(uuid, content, "ex", Sessiontimeout), sessionDbOpt)
    }

    public static async setRedisDock1Async(uuid: string, content: string) {
        await getRedisClientAsync(async rds => await rds.setAsync(uuid, content, "ex", Sessiontimeout1), sessionDbOpt)
    }
    public static async setRedisDock2Async(uuid: string, content: string) {
        await getRedisClientAsync(async rds => await rds.setAsync(uuid, content, "ex", Sessiontimeout2), sessionDbOpt)
    }

    public static async getRedisDockAsync(uuid: string): Promise<any> {
        let s = await getRedisClientAsync(async rds => await rds.getAsync(uuid), sessionDbOpt)
        if (!s)
            return { msg: "no ringing" }

        let info = JSON.parse(s)
        return info
    }

    public static async delRedisDock(uuid: string) {
        try {
            await getRedisClientAsync(async rds => rds.delAsync(uuid), sessionDbOpt)
        } catch (e) {
            logger.error("delLogin error", e.message)
        }
    }
}
