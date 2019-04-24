import { DataTypes, Sequelize } from "sequelize"
import { ModelBase } from "../lib/modelbase"

const [schema, table] = ["users", "pushlog"]
const modelName = `${schema}.${table}`
export const defineFunction = function (sequelize: Sequelize) {
    PushlogDb.getInstance(sequelize)
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        useruuid: DataTypes.UUID,
        content: DataTypes.CHAR(225),
        pushtime: DataTypes.TIME,
        type:DataTypes.STRING //取值为bar,dock
    }, {
            timestamps: false,
            schema: schema,
            freezeTableName: true,
            tableName: table
        })
}

export class PushlogDb extends ModelBase {
    private static instance: PushlogDb
    private constructor(seqz: Sequelize, modelName: string) {
        super(seqz, modelName)
    }

    public static getInstance(seqz: Sequelize = undefined) {
        if (!PushlogDb.instance)
            PushlogDb.instance = new PushlogDb(seqz, modelName)
        return PushlogDb.instance
    }

    /**
     * 添加记录
     */
    public async  insert(obj: any) {
        let res = await this.model().create(obj)
        return res ? res.get() : undefined
    }

    /**
     * 删除记录通过uuid
     */
    public async delByUuid(uuid: string) {
        let res = await this.model().destroy({ where: { uuid } })
        return res != 0 ? res : undefined
    }




    /**
     * 获取用户所有的推送记录
     * @param useruuid
     */
    public async findAllByUseruuid(useruuid: string, type:string,cursor: number, limit: number) {
        let res = await this.model().findAll({
            where: { useruuid,type }, offset: cursor,
            limit: limit,
            order: [['pushtime', 'desc']]
        })
        return res ? res : undefined
    }

    /**
    * 获取今日推送数量
    * @param useruuid
    */
    public async findtodaypushcount(useruuid: string) {
        let res = await this.seqz.query(`select count(*) from "users"."pushlog" where useruuid ='${useruuid}' and to_char(pushtime, 'YYYY-mm-dd')=to_char(now(),'YYYY-mm-dd') and type='bar'`,
            { type: "SELECT" }) as any[]
        return res[0].count

    }
}
