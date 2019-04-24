import { DataTypes, Sequelize } from "sequelize"
import { ModelBase } from "../lib/modelbase"

const [schema, table] = ["users", "dock"]
const modelName = `${schema}.${table}`
export const defineFunction = function (sequelize: Sequelize) {
    DockDB.getInstance(sequelize)
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        useruuid: DataTypes.UUID,
        rfiduuid: DataTypes.UUID,
        battery: DataTypes.INTEGER,
        status: DataTypes.ENUM("charged", "charging", "free"),   //"charged":被充电, "charging"：给其他设备充电,"free"：空闲
        charge_type: DataTypes.CHAR(64),//phone ，watch，other,free
        version: DataTypes.CHAR(64),
        online: DataTypes.BOOLEAN,
        created: DataTypes.TIME,
        modified: DataTypes.TIME
    }, {
            timestamps: false,
            schema: schema,
            freezeTableName: true,
            tableName: table
        })
}

export class DockDB extends ModelBase {
    private static instance: DockDB
    private constructor(seqz: Sequelize, modelName: string) {
        super(seqz, modelName)
    }

    public static getInstance(seqz: Sequelize = undefined) {
        if (!DockDB.instance)
            DockDB.instance = new DockDB(seqz, modelName)
        return DockDB.instance
    }

    /**
     * 添加dock
     */
    public async insert(obj: any) {
        let res = await this.model().create(obj, { returning: true })
        return res ? res.get() : undefined
    }

    /**
     * 删除dock通过uuid
     */
    public async delByUuid(uuid: string) {
        let res = await this.model().destroy({ where: { rfiduuid: uuid } })
        return res != 0 ? res : undefined
    }

    /**
    * 更改dock信息
    */
    public async update(uuid: string, obj: any) {
        let [number, res] = await this.model().update(obj, { where: { uuid }, returning: true })
        return number > 0 ? res[0].get() : undefined
    }

    public async updateByRfiduuid(rfiduuid: string, obj: any) {
        let [number, res] = await this.model().update(obj, { where: { rfiduuid }, returning: true })
        return number > 0 ? res[0].get() : undefined
    }


    /**
     * 获取dock详情
     * @param uuid
     */
    public async findByPrimary(uuid: string) {
        let dockinfo = await this.model().findByPrimary(uuid)
        return dockinfo ? dockinfo.get() : undefined
    }

    /**
     * 获取dock详情
     * @param uuid
     */
    public async findOne(rfiduuid: string) {
        let dockinfo = await this.model().findOne({ where: { rfiduuid } })
        return dockinfo ? dockinfo.get() : undefined
    }
}
