import { DataTypes, Sequelize } from "sequelize"
import { ModelBase } from "../lib/modelbase"

const [schema, table] = ["users", "devices"]
const modelName = `${schema}.${table}`
export const defineFunction = function (sequelize: Sequelize) {
    DevicesDb.getInstance(sequelize)
    return sequelize.define(modelName, {
        devid: { type: DataTypes.CHAR(36), primaryKey: true },
        ext: DataTypes.JSONB,
        location: DataTypes.JSONB,
        created: DataTypes.TIME,
        modified: DataTypes.TIME,
    }, {
            timestamps: false,
            schema: schema,
            freezeTableName: true,
            tableName: table
        })
}

export class DevicesDb extends ModelBase {
    private static instance: DevicesDb
    private constructor(seqz: Sequelize, modelName: string) {
        super(seqz, modelName)
    }

    public static getInstance(seqz: Sequelize = undefined) {
        if (!DevicesDb.instance)
            DevicesDb.instance = new DevicesDb(seqz, modelName)
        return DevicesDb.instance
    }

    /**
     * 添加设备
     */
    public async  insertDevices(obj: any) {
        let res = await this.model().create(obj, { returning: true })
        return res ? res.get() : undefined
    }

    /**
     * app获取设备，查看设备是否已存在
     * @param devid
     */
    public async  findDevicesBydevid(devid: string) {
        let res = await this.model().findOne({ where: { devid: devid } })
        return res ? res.get() : undefined
    }

    /**
     * 删除设备
     * @param uuid
     */
    public async delete(devid: string) {
        let res = await this.model().destroy({ where: { devid: devid } })
        return res != 0 ? res : undefined
    }

    public async  updateLocation(devid: string, location: any) {
        let [number, res] = await this.model().update({ location }, { where: { devid }, returning: true })
        return number > 0 ? res[0].get() : undefined
    }
}
