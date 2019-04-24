import { DataTypes, Sequelize } from "sequelize"
import { ModelBase } from "../lib/modelbase"

const [schema, table] = ["users", "appupdates"]
const modelName = `${schema}.${table}`
export const defineFunction = function (sequelize: Sequelize) {
    AppupdatesDb.getInstance(sequelize)
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        version: DataTypes.STRING,
        url: DataTypes.STRING,
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

export class AppupdatesDb extends ModelBase {
    private static instance: AppupdatesDb
    private constructor(seqz: Sequelize, modelName: string) {
        super(seqz, modelName)
    }

    public static getInstance(seqz: Sequelize = undefined) {
        if (!AppupdatesDb.instance)
            AppupdatesDb.instance = new AppupdatesDb(seqz, modelName)
        return AppupdatesDb.instance
    }

    public async getLatestVersion() {
        let res = await this.model().findOne({ order: "created desc" })
        return res
    }

    public async getAppByVersion(version: any) {
        let res = await this.model().findOne({ where: { version } })
        return res
    }

    public async insertOne(obj: any) {
        let res = await this.model().create(obj, { returning: true })
        return res ? res.get() : undefined
    }
}
