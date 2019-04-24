import assert = require("assert")
import { ReqError } from "../lib/reqerror"
export class BackHomeInfo {
    private num: number
    private name: string
    constructor(num: number, name: string) {
        [this.num] = [num],
            [this.name] = [name]
    }

    public static valueOf(s: string): BackHomeInfo {
        assert(typeof s === "string")

        let obj = JSON.parse(s)
        if (!obj)
            throw new ReqError("invalid backhome format")

        let { num, name } = obj


        return new BackHomeInfo(num, name)
    }

    public getNum() { return this.num }
    public setNum(num: number) {
        this.num = num
    }
    public getName() { return this.name }
}

import logger = require("winston")
import { getRedisClientAsync } from "../lib/redispool"


const [sessionDbOpt, Sessiontimeout] = [{ db: 4 }, 86400]

export class RedisBackHome {
    public static async setBackhomeAsync(uuid: string, backHomeInfo: BackHomeInfo) {
        const content = JSON.stringify(backHomeInfo)
        await getRedisClientAsync(async rds => await rds.setAsync(uuid, content, "ex", Sessiontimeout), sessionDbOpt)
    }

    public static async  getBackhomeAsync(uuid: string): Promise<any> {
        let s = await getRedisClientAsync(async rds => await rds.getAsync(uuid), sessionDbOpt)
        if (!s)
            return null

        let info = BackHomeInfo.valueOf(s)
        return { info }
    }

    public static async delBackhome(uuid: string) {
        try {
            await getRedisClientAsync(async rds => await rds.delAsync(uuid), sessionDbOpt)
        } catch (e) {
            logger.error("delLogin error", e.message)
        }
    }

    /*   //设置已经推送
      public static async setPushed(uuid: string, type: string) {
          const content = "pushed"
          await getRedisClientAsync(async rds => await rds.setAsync("pushed" + type + uuid, content, "ex", 30), sessionDbOpt)
      }

      //获取是否已经推送
      public static async getPushed(uuid: string, type: string) {
          return await getRedisClientAsync(async rds => await rds.getAsync("pushed" + type + uuid), sessionDbOpt)
      } */
}
