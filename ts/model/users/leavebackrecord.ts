import { DataTypes, Sequelize } from "sequelize"
import { ModelBase } from "../lib/modelbase"

const [schema, table] = ["users", "leavebackrecord"]
const modelName = `${schema}.${table}`
export const defineFunction = function (sequelize: Sequelize) {
    LeaveBackRecordDb.getInstance(sequelize)
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        useruuid: DataTypes.UUID,
        time: DataTypes.TIME,
        type: DataTypes.CHAR(8),
        ext: DataTypes.JSON
    }, {
            timestamps: false,
            schema: schema,
            freezeTableName: true,
            tableName: table
        })
}

export class LeaveBackRecordDb extends ModelBase {
    private static instance: LeaveBackRecordDb
    private constructor(seqz: Sequelize, modelName: string) {
        super(seqz, modelName)
    }

    public static getInstance(seqz: Sequelize = undefined) {
        if (!LeaveBackRecordDb.instance)
            LeaveBackRecordDb.instance = new LeaveBackRecordDb(seqz, modelName)
        return LeaveBackRecordDb.instance
    }

    /**
     * 添加记录
     */
    public async  insert(obj: any) {
        let res = await this.model().create(obj, { returning: true })
        return res ? res.get() : undefined
    }


    /**
     * 获取指定时间段指定方式的记录
     * @param useruuid
     * @param type
     * @param starttime
     * @param endtime
     */
    public async getAllRecord(useruuid: string, type: string, starttime: string, endtime: string) {
        let res = await this.model().findAll({
            where: {
                useruuid, type, time: {
                    $gte: starttime,
                    $lte: endtime
                }
            },
            order: [['time', 'desc']]
        })
        return res.map((r: any) => r.get())
    }


}
