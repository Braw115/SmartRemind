import { DataTypes, Sequelize } from "sequelize"
import { ModelBase } from "../lib/modelbase"

const [schema, table] = ["users", "messages"]
const modelName = `${schema}.${table}`
export const defineFunction = function (sequelize: Sequelize) {
    MessagesDb.getInstance(sequelize)
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        sourceuuid: DataTypes.CHAR(36),
        source: DataTypes.CHAR(8),
        message: DataTypes.TEXT,
        filename: DataTypes.CHAR(225),
        status: DataTypes.CHAR(8),
        remindpeople: DataTypes.CHAR(1024),
        showtype: DataTypes.CHAR(16),
        remindtime: DataTypes.TIME,
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

export class MessagesDb extends ModelBase {
    private static instance: MessagesDb
    private constructor(seqz: Sequelize, modelName: string) {
        super(seqz, modelName)
    }

    public static getInstance(seqz: Sequelize = undefined) {
        if (!MessagesDb.instance)
            MessagesDb.instance = new MessagesDb(seqz, modelName)
        return MessagesDb.instance
    }

    /**
     * 添加留言
     */
    public async  insertMessages(obj: any) {
        let res = await this.model().create(obj, { returning: true })
        return res ? res.get() : undefined
    }

    /**
     * app获取留言任务条数
     * @param useruuid
     */
    public async  findMessagesCount(useruuid: string) {
        let res = await this.model().count({ where: { sourceuuid: useruuid, source: "user" } })
        return res
    }

    /**
     * app获取用户留言
     * @param useruuid
     * @param cursor
     * @param limit
     */
    public async findAllMessageByUser(useruuid: string, cursor: number, limit: number) {
        let res = await this.model().findAll({
            attributes: ["uuid", "sourceuuid", "filename", "status", "remindpeople", "created", "modified", "message", "remindtime"],
            where: { sourceuuid: useruuid, source: "user" },
            offset: cursor,
            limit: limit,
            order: [['modified', 'desc']]
        })
        return res.map((r: any) => r.get())
    }

    public async findTodayMessageByUser(useruuid: string, cursor: number, limit: number) {
        // let res = await this.model().findAll({
        //     attributes: ["uuid", "sourceuuid", "source", "filename", "status",
        //         "ext", "created", "modified"],
        //     where: { remindpeople: { $ilike: "%" + useruuid + "%" } },
        //     offset: cursor,
        //     limit: limit,
        //     order: [['modified', 'desc']]
        // })
        // return res.map((r: any) => r.get())

        let res = await this.seqz.query(`select a.uuid,a.sourceuuid,a.source,a.filename,a.status,a.remindtime
        a.ext,a.created,a.modified,b.avatar,b.username
        from "users"."messages" a left join "users"."users" b on a.sourceuuid=b.uuid
        where remindpeople like '%${useruuid}%' and to_char(a.remindtime, 'YYYY-mm-dd')=to_char(now(),'YYYY-mm-dd') ORDER BY a.modified desc LIMIT '${limit}' OFFSET '${cursor}'`,
            { type: "SELECT" }) as any[]
        return res
    }


    public async findTodayMessageCountByUser(useruuid: string) {
        let res = await this.seqz.query(`select count(*)
        from "users"."messages"
        where remindpeople like '%${useruuid}%' and now() - remindtime<interval '32 hour' and now() - remindtime>=interval '0 hour' and status='unread'`,
            { type: "SELECT" }) as any[]
        return res[0].count
    }


    /**
     * 删除留言
     * @param uuid
     */
    public async deleteByUuid(uuid: string) {
        let res = await this.model().destroy({ where: { uuid: uuid } })
        return res != 0 ? res : undefined
    }

    /**
    * 修改留言状态
    * @param uuid
    */
    public async changeStatus(uuid: string, status: string) {
        let [number, res] = await this.model().update({ status: status }, { where: { uuid: uuid }, returning: true })
        return number > 0 ? res[0].get() : undefined
    }

    /**
     * 删除留言
     * @param devid
     */
    public async deleteByDevid(devid: string) {
        let res = await this.model().destroy({ where: { sourceuuid: devid } })
        return res != 0 ? res : undefined
    }


    /**
     * 通过sourceuuid数据来来获取留言
     * @param obj
     */
    public async findAllMessageByDevice(obj: any, cursor: number, limit: number) {
        let sourceuuids = ""
        for (let o of obj) {
            sourceuuids += `'${o}',`
        }
        sourceuuids = sourceuuids.substr(0, sourceuuids.length - 1)
        let res = await this.seqz.query(`select a.uuid,a.sourceuuid,a.source,a.filename,a.status,
        a.ext,a.created,a.modified,b.avatar,b.username
        from "users"."messages" a left join "users"."users" b on a.sourceuuid=b.uuid
        where sourceuuid in (${sourceuuids})  ORDER BY a.modified desc LIMIT '${limit}' OFFSET '${cursor}'`,
            { type: "SELECT" }) as any[]

        return res
    }

    /**
     * 获取当天设备的留言
     * @param obj
     */
    public async findTodayMessageByDevice(obj: any) {
        let sourceuuids = ""
        for (let o of obj) {
            sourceuuids += `'${o}',`
        }
        sourceuuids = sourceuuids.substr(0, sourceuuids.length - 1)
        let res = await this.seqz.query(`select a.uuid,a.sourceuuid,a.source,a.filename,a.status,
        a.ext,a.created,a.modified,b.avatar,b.username
        from "users"."messages" a left join "users"."users" b on a.sourceuuid=b.uuid
        where sourceuuid in (${sourceuuids}) and to_char(a.created, 'YYYY-mm-dd')=to_char(now(),'YYYY-mm-dd')  ORDER BY a.modified desc`,
            { type: "SELECT" }) as any[]

        return res
    }




    /**
     * 通过留言的uuid来获取单条留言
     * @param obj
     */
    public async findOneMessageByDevice(uuid: any) {
        //let res = await this.model().findOne({ where: { uuid: uuid } })
        let res = await this.seqz.query(`select a.uuid,a.sourceuuid,a.source,a.filename,a.status,
        a.message,a.ext,a.created,a.modified,b.username
        from "users"."messages" a left join "users"."users" b on a.sourceuuid=b.uuid
        where a.uuid='${uuid}'`, { type: "SELECT" }) as any[]
        return res
    }

    public async findMessageCountByDevice(obj: any) {
        let res = await this.model().count({
            where: { sourceuuid: { $in: obj }, status: "unread" },
        })
        return res
    }
}
