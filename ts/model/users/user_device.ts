import { DataTypes, Sequelize } from "sequelize"
import { ModelBase } from "../lib/modelbase"

const [schema, table] = ["users", "user_device"]
const modelName = `${schema}.${table}`
export const defineFunction = function (sequelize: Sequelize) {
    User_deviceDb.getInstance(sequelize)
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        devid: DataTypes.CHAR(36),
        useruuid: DataTypes.CHAR(36),
        status: DataTypes.INTEGER,
        ext: DataTypes.JSONB,
        created: DataTypes.TIME,
        modified: DataTypes.TIME,
        type:DataTypes.STRING
    }, {
            timestamps: false,
            schema: schema,
            freezeTableName: true,
            tableName: table
        })
}

export class User_deviceDb extends ModelBase {
    private static instance: User_deviceDb
    private constructor(seqz: Sequelize, modelName: string) {
        super(seqz, modelName)
    }

    public static getInstance(seqz: Sequelize = undefined) {
        if (!User_deviceDb.instance)
            User_deviceDb.instance = new User_deviceDb(seqz, modelName)
        return User_deviceDb.instance
    }

    /**
    * 获取用户设备
    */
    public async  findByUserAndDevice(obj: any) {
        let res = await this.model().findOne({ where: obj })
        return res ? res.get() : undefined
    }



    /**
     * 添加用户设备关联
     */
    public async  insertUser_divice(obj: any) {
        let res = await this.model().create(obj, { returning: true })
        return res ? res.get() : undefined
    }

    /**
    * 更新
    */
    public async  updateUser_divice(uuid: any, status: any) {
        let [number, res] = await this.model().update({ status }, { where: { uuid }, returning: true })
        return number > 0 ? res[0].get() : undefined
    }
    /**
       * 更新
       */
    public async  update(uuid: any, obj: any) {
        let [number, res] = await this.model().update(obj, { where: { uuid }, returning: true })
        return number > 0 ? res[0].get() : undefined
    }

    /**
   * 更新
   */
    public async  upsertUser_divice(obj: any, useruuid: any) {
        //await this.model().update(obj, { where: { useruuid } })
        //await this.model().upsert(obj, { where: { useruuid } })
        await this.model().upsert(obj)
    }



    /**
     * 删除设备用户关联
     * @param devid
     */
    public async deleteByDevice(devid: string) {
        let res = await this.model().destroy({ where: { devid: devid } })
        return res != 0 ? res : undefined
    }


    /**
     * 删除设备用户关联
     * @param devid
     * @param useruuid
     */
    public async delete(obj: any) {
        let res = await this.model().destroy({ where: obj })
        return res != 0 ? res : undefined
    }

    public async getDeviceUsers(devid: string) {
        let res = await this.seqz.query(`select a.uuid,a.useruuid,devid,username,avatar,"isreceive" from "users"."user_device" a join "users"."users" b on a.useruuid=b.uuid where a.devid='${devid}' and a.status=1 ORDER BY a.created `, { type: "SELECT" }) as any[]
        return res
    }

    public async getDeviceUsersapply(devid: string) {
        let res = await this.seqz.query(`select a.uuid,a.useruuid,devid,username,avatar from "users"."user_device" a join "users"."users" b on a.useruuid=b.uuid where a.devid='${devid}' and a.status=0 ORDER BY a.created `, { type: "SELECT" }) as any[]
        return res
    }

    public async getDeviceByUser(useruuid: string) {
        let res = await this.model().findOne({ where: { useruuid } })
        return res ? res.get() : undefined
    }
}
