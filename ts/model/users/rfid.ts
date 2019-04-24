import { DataTypes, Sequelize } from "sequelize"
import { ModelBase } from "../lib/modelbase"

const [schema, table] = ["users", "rfid"]
const modelName = `${schema}.${table}`
export const defineFunction = function (sequelize: Sequelize) {
    RfidDb.getInstance(sequelize)
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        useruuid: DataTypes.UUID,
        rfid: DataTypes.CHAR(36),
        type: DataTypes.CHAR(8),
        name: DataTypes.CHAR(255)
    }, {
            timestamps: false,
            schema: schema,
            freezeTableName: true,
            tableName: table
        })
}

export class RfidDb extends ModelBase {
    private static instance: RfidDb
    private constructor(seqz: Sequelize, modelName: string) {
        super(seqz, modelName)
    }

    public static getInstance(seqz: Sequelize = undefined) {
        if (!RfidDb.instance)
            RfidDb.instance = new RfidDb(seqz, modelName)
        return RfidDb.instance
    }

    /**
     * 添加记录
     */
    public async    insert(obj: any) {
        let res = await this.model().create(obj, { returning: true })
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
    * 删除记录通过rfid
    */
    public async delByRfid(rfid: string) {
        let res = await this.model().destroy({ where: { rfid } })
        return res != 0 ? res : undefined
    }

    /**
    * 更改rfid名字
    */
    public async update(uuid: string, name: string) {
        let [number, res] = await this.model().update({ name }, { where: { uuid }, returning: true })
        return number > 0 ? res[0].get() : undefined
    }


    /**
     * 获取用户所有的rfid
     * @param useruuid
     */
    public async getRfid(useruuid: string) {
        let rfids = await this.model().findAll({
            where: { useruuid },
            order: [["type", "ASC"]]
        })
        return rfids.map(r => r.get())
    }

    public async getRfidByrfid(rfid: string) {
        let rfids = await this.model().findAll({
            where: { rfid }
        })
        return rfids.map(r => r.get())
    }

    /**
    * 获取用户所有的rfidcount
    * @param useruuid
    */
    public async getRfidCount(useruuid: string) {
        let count = await this.model().count({
            where: { useruuid }
        })
        return count
    }

    /**
     * 获取用户所有的rfid
     * @param useruuid
     */
    public async findByPrimary(uuid: string) {
        let rfids = await this.model().findByPrimary(uuid)
        return rfids ? rfids.get() : undefined
    }
}
