import { DataTypes, Sequelize } from "sequelize"
import { ModelBase } from "../lib/modelbase"

const [schema, table] = ["users", "scenes"]
const modelName = `${schema}.${table}`
export const defineFunction = function (sequelize: Sequelize) {
    ScenesDb.getInstance(sequelize)
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        useruuid: DataTypes.CHAR(36),
        title: DataTypes.TEXT,
        remarks: DataTypes.TEXT,
        weather: DataTypes.CHAR(16),
        temperaturelow: DataTypes.DOUBLE,
        temperaturehigh: DataTypes.DOUBLE,
        humiditylow: DataTypes.INTEGER,
        humidityhigh: DataTypes.INTEGER,
        ultravioletlow: DataTypes.INTEGER,
        ultraviolethigh: DataTypes.INTEGER,
        ext: DataTypes.JSONB,
        created: DataTypes.TIME,
        modified: DataTypes.TIME,
    }, {
            timestamps: false,
            schema: schema,
            freezeTableName: true,
            tableName: table
        })
}

export class ScenesDb extends ModelBase {
    private static instance: ScenesDb
    private constructor(seqz: Sequelize, modelName: string) {
        super(seqz, modelName)
    }

    public static getInstance(seqz: Sequelize = undefined) {
        if (!ScenesDb.instance)
            ScenesDb.instance = new ScenesDb(seqz, modelName)
        return ScenesDb.instance
    }

    /**
     * 1、添加任务
     */
    public async  insertScenes(obj: any) {
        let res = await this.model().create(obj, { returning: true })
        return res ? res.get() : undefined
    }
    /**
     * 修改任务
     * @param uuid
     * @param username
     */
    public async updateScenes(uuid: string, obj: any) {
        let [number, res] = await this.model().update(obj, { where: { uuid: uuid }, returning: true })
        return number > 0 ? res[0].get() : undefined
    }

    /**
     * 获取用户任务条数
     * @param uuid
     */
    public async  findScenesCount(useruuid: string) {
        let res = await this.model().count({ where: { useruuid: useruuid } })
        return res
    }
    /**
     * 获取用户所有的任务
     * @param uuid
     */
    public async findAllScenesByUser(useruuid: string, cursor: number, limit: number) {
        let res = await this.model().findAll({
            where: { useruuid: useruuid },
            offset: cursor,
            limit: limit,
            order: [['modified', 'desc']]
        })
        return res.map((r: any) => r.get())
    }

    /**
     * 获取今日场景
     * @param useruuid
     * @param cursor
     * @param limit
     * @param weather
     * @param temperature
     * @param humidity
     */
    public async findScenesByCondition(useruuid: string, cursor: number, limit: number, weather: number, temperature: number, ultraviolet: number): Promise<any> {
        let res = await this.model().findAll({
            where: {
                useruuid: useruuid,
                weather: ["AnyWeather", weather],
                temperaturehigh: { gt: temperature },
                temperaturelow: { lt: temperature },
                ultraviolethigh: { gt: ultraviolet },
                ultravioletlow: { lt: ultraviolet }
            },
            offset: cursor,
            limit: limit,
            order: [['modified', 'desc']]
        })
        return res.map((r: any) => r.get())
    }


    /**
     * 获取今日场景总条数
     * @param useruuid
     * @param cursor
     * @param limit
     * @param weather
     * @param temperature
     * @param humidity
     */
    public async findScenesCountByCondition(useruuid: string, weather: number, temperature: number, ultraviolet: number): Promise<any> {
        let res = await this.model().count({
            where: {
                useruuid: useruuid,
                weather: ["AnyWeather", weather],
                temperaturehigh: { gt: temperature },
                temperaturelow: { lt: temperature },
                ultraviolethigh: { gt: ultraviolet },
                ultravioletlow: { lt: ultraviolet },
            }
        })
        return res
    }


    public async findTodayScenesByUser(useruuid: string, cursor: number, limit: number, weather: string, ultraviolet: number, humidity: number) {
        //从视图中查找
        let res = await this.seqz.query(`select a.* from users.today_scenes a where a.useruuid='${useruuid}' and (a.weather = '${weather}' or a.weather='AnyWeather') and (ultravioletlow<=${ultraviolet} and ultraviolethigh>=${ultraviolet}) and (humiditylow<=${humidity} and humidityhigh>=${humidity}) order by a.remindtime desc `, { type: "SELECT" }) as any[]
        return res
    }

    /**
     * 删除任务
     * @param uuid
     */
    public async delete(uuid: string) {
        let res = await this.model().destroy({ where: { uuid: uuid } })
        return res != 0 ? res : undefined
    }


    public async findTodayScenesByDevice(obj: any, cursor: number, limit: number, weather: string, ultraviolet: number, humidity: number) {
        let useruuids = ""
        for (let o of obj) {
            useruuids += `'${o}',`
        }
        useruuids = useruuids.substr(0, useruuids.length - 1)
        let res = await this.seqz.query(`select a.*,b.avatar,b.username from "users"."today_scenes" a left join "users"."users" b on a.useruuid=b.uuid where (a.weather ='${weather}' or a.weather='AnyWeather') and useruuid in (${useruuids})  and (ultravioletlow<=${ultraviolet} and ultraviolethigh>=${ultraviolet}) and (humiditylow<=${humidity} and humidityhigh>=${humidity})   ORDER BY a.modified desc LIMIT '${limit}' OFFSET '${cursor}'`, { type: "SELECT" }) as any[]
        return res
    }



    public async findTodayScenesCountByDevice(obj: any, weather: string, ultraviolet: number, humidity: number) {
        let useruuids = ""
        for (let o of obj) {
            useruuids += `'${o}',`
        }
        useruuids = useruuids.substr(0, useruuids.length - 1)
        let res = await this.seqz.query(`select count(*) from users.today_scenes a where a.useruuid in (${useruuids}) and (a.weather='${weather}' or a.weather='AnyWeather') and (ultravioletlow<=${ultraviolet} and ultraviolethigh>=${ultraviolet}) and (humiditylow<=${humidity} and humidityhigh>=${humidity}) `, { type: "SELECT" }) as any[]
        return parseInt(res[0].count)
    }


    /**
     * 删除留言
     * @param uuid
     */
    public async deleteByUuid(uuid: string) {
        let res = await this.model().destroy({ where: { uuid: uuid } })
        return res != 0 ? res : undefined
    }
}
