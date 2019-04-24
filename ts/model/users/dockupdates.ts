import { DataTypes, Sequelize } from "sequelize"
import { ModelBase } from "../lib/modelbase"

const [schema, table] = ["users", "dockupdates"]
const modelName = `${schema}.${table}`
export const defineFunction = function (sequelize: Sequelize) {
    DockupdatesDb.getInstance(sequelize)
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        version: DataTypes.CHAR(36),
        url: DataTypes.CHAR(225),
        message: DataTypes.TEXT,
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

export class DockupdatesDb extends ModelBase {
    private static instance: DockupdatesDb
    private constructor(seqz: Sequelize, modelName: string) {
        super(seqz, modelName)
    }

    public static getInstance(seqz: Sequelize = undefined) {
        if (!DockupdatesDb.instance)
            DockupdatesDb.instance = new DockupdatesDb(seqz, modelName)
        return DockupdatesDb.instance
    }

    public async getLatestVersion() {
        let res = await this.model().findOne({ order: "created desc" })
        return res ? res.get() : undefined
    }

    public async getAppByVersion(version: any) {
        let res = await this.model().findOne({ where: { version } })
        return res
    }

}
