import { DataTypes, Sequelize } from "sequelize"
import { ModelBase } from "../lib/modelbase"

const [schema, table] = ["users", "users"]
const modelName = `${schema}.${table}`
export const defineFunction = function (sequelize: Sequelize) {
    Users.getInstance(sequelize)
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.CHAR(36),
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        username: DataTypes.CHAR(32),
        password: DataTypes.CHAR(32),
        email: DataTypes.CHAR(64),
        avatar: DataTypes.TEXT,
        ext: DataTypes.JSONB,
        key_rfid: DataTypes.CHAR(36),
        wallet_rfid: DataTypes.CHAR(36),
        created: DataTypes.TIME,
        modified: DataTypes.TIME,
        isreceive: DataTypes.INTEGER,
        ispublish: DataTypes.INTEGER,
        homeaddress: DataTypes.CHAR(255),
        jobaddress: DataTypes.CHAR(255),
        workingtime: DataTypes.DATE,
        offtime: DataTypes.DATE
    }, {
            timestamps: false,
            schema: schema,
            freezeTableName: true,
            tableName: table
        })
}

export class Users extends ModelBase {
    private static instance: Users
    private constructor(seqz: Sequelize, modelName: string) {
        super(seqz, modelName)
    }

    public static getInstance(seqz: Sequelize = undefined) {
        if (!Users.instance)
            Users.instance = new Users(seqz, modelName)
        return Users.instance
    }

    /**
     * 1、添加用户
     */
    public async  insertUsers(email: string, password: string) {
        let res = await this.model().create({ password: password, email: email }, { returning: true })
        return res ? res.get() : undefined
    }

    public async  insert(obj: any) {
        let res = await this.model().create(obj, { returning: true })
        return res ? res.get() : undefined
    }
    /**
     * 查询邮箱是否已经注册
     * @param email
     */
    public async getByEmail(email: string) {
        let res = await this.model().findOne({ where: { email: email } })
        return res ? res.get() : undefined
    }
    /**
     * 用户登录验证
     * @param email
     * @param password
     */
    public async checkUser(email: string, password: string) {
        let res = await this.model().findOne({ where: { email: email, password: password } })
        return res ? res.get() : undefined
    }

    /**
     * 更新用户名
     * @param uuid
     * @param username
     */
    public async updateUsername(uuid: string, username: string) {
        let [number, res] = await this.model().update({ username: username }, { where: { uuid: uuid }, returning: true })
        return number > 0 ? res[0].get() : undefined
    }

    /**
     * 更新密码
     * @param uuid
     * @param password
     */
    public async  updatePassword(uuid: string, password: string) {
        let [number, res] = await this.model().update({ password: password }, { where: { uuid: uuid }, returning: true })
        return number > 0 ? res[0].get() : undefined
    }

    /**
    * 更新密码
    * @param email
    * @param password
    */
    public async  updatePasswordByEmail(email: string, password: string) {
        let [number, res] = await this.model().update({ password: password }, { where: { email: email }, returning: true })
        return number > 0 ? res[0].get() : undefined
    }

    /**
     * 更新头像
     * @param uuid
     * @param avater
     */
    public async updateAvatar(uuid: string, avatar: string) {
        let [number, res] = await this.model().update({ avatar: avatar }, { where: { uuid: uuid }, returning: true })
        return number > 0 ? res[0].get() : undefined
    }

    /**
    * 7、根据ID查找用户
   * @param uuid
   */
    public async  findByPrimary(uuid: string) {
        let user = await this.model().findByPrimary(uuid)
        return user ? user.get() : undefined
    }
    /**
       * 7、根据ID查找用户
      * @param uuid
      */
    public async  findSettingByUuid(uuid: string) {
        let user = await this.model().findOne({ attributes: ["ispublish", "isreceive"], where: { uuid } })
        return user ? user.get() : undefined
    }

    /**
  * 7、根据邮件查找用户
  * @param uuid
  */
    public async  findByEmail(email: string) {
        let user = await this.model().findOne({ where: { email } })
        return user ? user.get() : undefined
    }



    public async  findbyUuidAndType(obj: any) {
        let user = await this.model().findOne({ where: obj })
        return user ? user.get() : undefined
    }


    public async  findByRFID(rfid: string) {
        let user = await this.seqz.query(`select b.uuid,b.avatar,b.ispublish,b.isreceive,b.username,a.rfid,a.name,a.type from users.rfid a join users.users b on a.useruuid=b.uuid where rfid='${rfid}'`,
            { type: "SELECT" }) as any[]

        return user.length > 0 ? user[0] : undefined
    }


    // public async updateRfid(uuid: string, obj: any) {
    //     let [number, res] = await this.model().update(obj, { where: { uuid: uuid }, returning: true })
    //     return number > 0 ? res[0].get() : undefined
    // }

    //设置接收推送状态
    // public async updateReceive(uuid: string, obj: any) {
    //     let [number, res] = await this.model().update(obj, { where: { uuid: uuid }, returning: true })
    //     return number > 0 ? res[0].get() : undefined
    // }

    //获取用户所有信息
    public async findInfoByDevice(useruuid: any, weather: any, ultraviolet: number, temperature: number, showtype: any, start: number, length: number) {
        let useruuids = ""
        let remindpeople = ""
        for (let o of useruuid) {
            useruuids += `'${o}',`
            remindpeople += ` remindpeople like '%${o}%' or`
        }
        useruuids = useruuids.substr(0, useruuids.length - 1)
        remindpeople = remindpeople.substr(0, remindpeople.length - 2)
        let res = await this.seqz.query(`select * from ((select a.uuid,a.useruuid sourceuuid,a.title,a.remarks,a.remindtime,a.remindtype,a.ext,a.created,a.modified,'task' thistype,'' source,'' filename,b.avatar,b.username,status from users.tasks a left join users.users b on a.useruuid=b.uuid where (${remindpeople}) and showtype='${showtype}')
        UNION
        (select a.uuid,a.useruuid sourceuuid,a.title,a.remarks,a.remindtime,a.remindtype,a.ext,a.created,a.modified ,'scenes' thistype ,'' source,'' filename,b.avatar,b.username,'' status from users.scenes a left join users.users b on b.uuid=a.useruuid where a.useruuid in (${useruuids}) and (a.weather = '${weather}' or a.weather='AnyWeather')  and (ultravioletlow<=${ultraviolet} and ultraviolethigh>=${ultraviolet}) and (temperaturelow<=${temperature} and temperaturehigh>=${temperature})  )
        UNION(select c.uuid,c.sourceuuid,'' title,'' remarks,c.remindtime,'' remindtype,c.ext,c.created,c.modified,'message' thistype,c.source,c.filename,d.avatar,d.username ,status from "users"."messages" c left join "users"."users" d on c.sourceuuid=d.uuid where  (${remindpeople}   and showtype='${showtype}') or sourceuuid='${useruuid[0]}' ))e ORDER BY e.modified DESC limit ${length} offset ${start}`,
            { type: "SELECT" }) as any[]

        return res
    }
    //获取用户当天所有的信息
    public async findTodayInfoByDevice(useruuid: any, weather: any, ultraviolet: number, temperature: number,
        showtype: any, start: number, length: number) {
        let useruuids = ""
        let remindpeople = ""
        for (let o of useruuid) {
            useruuids += `'${o}',`
            remindpeople += ` remindpeople like '%${o}%' or`
        }
        useruuids = useruuids.substr(0, useruuids.length - 1)
        remindpeople = remindpeople.substr(0, remindpeople.length - 2)
        let res = await this.seqz.query(`
        select * from (
            (select a.uuid,a.useruuid sourceuuid,a.title,a.remarks,a.remindtime,a.remindtype,a.ext,a.created,a.modified,
                'task' thistype,'' source,'' filename,b.avatar,b.username,status
            from users.tasks a left join users.users b on a.useruuid=b.uuid
            where (${remindpeople}) and showtype='${showtype}' and (now() - remindtime)<interval '32 hour'
            and (now() - remindtime)>=interval '0 hour')
        UNION
        (select a.uuid,a.useruuid sourceuuid,a.title,a.remarks,a.remindtime,a.remindtype,a.ext,a.created,a.modified ,
            'scenes' thistype ,'' source,'' filename,b.avatar,b.username,'' status
            from users.scenes a left join users.users b on b.uuid=a.useruuid
            where a.useruuid in (${useruuids}) and (a.weather = '${weather}' or a.weather='AnyWeather')
            and (ultravioletlow<=${ultraviolet} and ultraviolethigh>=${ultraviolet})
            and (temperaturelow<=${temperature} and temperaturehigh>=${temperature}) )
        UNION(
            select c.uuid,c.sourceuuid,'' title,'' remarks,c.remindtime,'' remindtype,c.ext,c.created,c.modified,
            'message' thistype,c.source,c.filename,d.avatar,d.username ,status
            from "users"."messages" c left join "users"."users" d on c.sourceuuid=d.uuid
            where(
                (${remindpeople}   and showtype='${showtype}') or sourceuuid='${useruuid[0]}')
                and  (now() - remindtime)<interval '32 hour' and (now() - remindtime)>=interval '0 hour'
            )
            ) e
                ORDER BY e.modified DESC limit ${length} offset ${start}`,
            { type: "SELECT" }) as any[]

        return res
    }

    //获取用户当天所有的信息
    public async findInfoCountByDevice(useruuid: any, weather: any, ultraviolet: number, temperature: number, showtype: any) {
        let useruuids = ""
        let remindpeople = ""
        for (let o of useruuid) {
            useruuids += `'${o}',`
            remindpeople += ` remindpeople like '%${o}%' or`
        }
        useruuids = useruuids.substr(0, useruuids.length - 1)
        remindpeople = remindpeople.substr(0, remindpeople.length - 2)
        let res = await this.seqz.query(`select count(*) from ((select a.uuid,a.useruuid sourceuuid,a.title,a.remarks,a.remindtime,a.remindtype,a.ext,a.created,a.modified,'task' thistype,'' source,'' filename,b.avatar,b.username,status from users.tasks a left join users.users b on a.useruuid=b.uuid where (${remindpeople}) and showtype='${showtype}')
        UNION
        (select a.uuid,a.useruuid sourceuuid,a.title,a.remarks,a.remindtime,a.remindtype,a.ext,a.created,a.modified ,'scenes' thistype ,'' source,'' filename,b.avatar,b.username,'' status from users.scenes a left join users.users b on b.uuid=a.useruuid where a.useruuid in (${useruuids}) and (a.weather = '${weather}' or a.weather='AnyWeather')  and (ultravioletlow<=${ultraviolet} and ultraviolethigh>=${ultraviolet}) and (temperaturelow<=${temperature} and temperaturehigh>=${temperature}))
        UNION(select c.uuid,c.sourceuuid,'' title,'' remarks,c.remindtime,'' remindtype,c.ext,c.created,c.modified,'message' thistype,c.source,c.filename,d.avatar,d.username ,status from "users"."messages" c left join "users"."users" d on c.sourceuuid=d.uuid where  (${remindpeople}   and showtype='${showtype}') or sourceuuid='${useruuid[0]}' ))e `,
            { type: "SELECT" }) as any[]

        return res[0].count
    }


    //更新操作
    public async update(uuid: string, obj: any) {
        let [number, res] = await this.model().update(obj, { where: { uuid: uuid }, returning: true })
        return number > 0 ? res[0].get() : undefined
    }

    public async updateisreceive(uuid: string, isreceive: any) {
        let [number, res] = await this.model().update({ isreceive }, { where: { uuid: uuid }, returning: true })
        return number > 0 ? res[0].get() : undefined
    }

}
