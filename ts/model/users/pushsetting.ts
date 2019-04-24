import { DataTypes, Sequelize } from "sequelize"
import { ModelBase } from "../lib/modelbase"

const [schema, table] = ["users", "pushsetting"]
const modelName = `${schema}.${table}`
export const defineFunction = function (sequelize: Sequelize) {
    PushSettingDb.getInstance(sequelize)
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        listenuuid: DataTypes.CHAR(36),
        receiveuuid: DataTypes.CHAR(1024),
        hour: DataTypes.INTEGER,
        minute: DataTypes.INTEGER,
        timezone: DataTypes.INTEGER,
        isbackleavepush: DataTypes.INTEGER,
        isnobackleavepush: DataTypes.INTEGER,
        pushmessage: DataTypes.CHAR(255),
        pushtype: DataTypes.CHAR(8),
        ext: DataTypes.JSONB,
        created: DataTypes.TIME,
        modified: DataTypes.TIME
    }, {
            timestamps: false,
            schema: schema,
            freezeTableName: true,
            tableName: table
        })
}

export class PushSettingDb extends ModelBase {
    private static instance: PushSettingDb
    private constructor(seqz: Sequelize, modelName: string) {
        super(seqz, modelName)
    }

    public static getInstance(seqz: Sequelize = undefined) {
        if (!PushSettingDb.instance)
            PushSettingDb.instance = new PushSettingDb(seqz, modelName)
        return PushSettingDb.instance
    }

    /**
     * 添加记录
     */
    public async  insert(obj: any) {
        let res = await this.model().create(obj, { returning: true })
        return res ? res.get() : undefined
    }

    /**
     * 删除记录
     */
    public async delByUuid(uuid: string) {
        let res = await this.model().destroy({ where: { uuid } })
        return res != 0 ? res : undefined
    }

    /**
     * 更新记录
     * @param uuid
     * @param obj
     */
    public async  update(uuid: string, obj: any) {
        let [number, res] = await this.model().update(obj, { where: { uuid: uuid }, returning: true })
        return number > 0 ? res[0].get() : undefined
    }

    public async findReceiveuuid(uuid: string) {
        let res = await this.seqz.query(`
            select * from users.pushsetting where receiveuuid like '%${uuid}%'
        `, { type: "SELECT" }) as any[]
        return res
    }


    public async getRecord(receiveuuid: string, cursor: number, limit: number, pushtype: string) {
        let res = await this.seqz.query(`select * from users.pushsetting  where receiveuuid='${receiveuuid}' and pushtype='${pushtype}' order by modified limit ${limit} OFFSET ${cursor} `,
            { type: "SELECT" }) as any[]
        return res
    }

    public async getpush(listenuuid: String) {
        let res = await this.seqz.query(`select * from users.pushsetting  where listenuuid like '%${listenuuid}%' and isbackleavepush=1`,
            { type: "SELECT" }) as any[]
        return res
    }


    /**
     * 获取应该要提醒的人
     */
    public async noback(currenthour: number, currentminute: number) {
        let res = await this.seqz.query(`
        select * from users.pushsetting
        where (${currenthour} -(hour+timezone))*60 + (${currentminute}-minute)>=0
        and (${currenthour} -(hour+timezone))*60 + (${currentminute}-minute)<2
        and isnobackleavepush=1`,
            { type: "SELECT" }) as any[]
        return res
    }



}
