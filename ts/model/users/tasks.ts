import { DataTypes, Sequelize } from "sequelize"
import { ModelBase } from "../lib/modelbase"

const [schema, table] = ["users", "tasks"]
const modelName = `${schema}.${table}`
export const defineFunction = function (sequelize: Sequelize) {
    TasksDb.getInstance(sequelize)
    return sequelize.define(modelName, {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        useruuid: DataTypes.CHAR(36),
        title: DataTypes.TEXT,
        remarks: DataTypes.TEXT,
        type: DataTypes.CHAR(8),
        status: DataTypes.CHAR(8),
        remindtime: DataTypes.DATE,
        remindtype: DataTypes.CHAR(8),
        remindpeople: DataTypes.CHAR(36),
        showtype: DataTypes.CHAR(8),
        peoplename: DataTypes.CHAR(32),
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

export class TasksDb extends ModelBase {
    private static instance: TasksDb
    private constructor(seqz: Sequelize, modelName: string) {
        super(seqz, modelName)
    }

    public static getInstance(seqz: Sequelize = undefined) {
        if (!TasksDb.instance)
            TasksDb.instance = new TasksDb(seqz, modelName)
        return TasksDb.instance
    }

    /**
     * 1、添加任务
     */
    public async  insertTasks(obj: any) {
        let res = await this.model().create(obj, { returning: true })
        return res ? res.get() : undefined
    }
    /**
     * 修改任务
     * @param uuid
     * @param username
     */
    public async updateTasks(uuid: string, obj: any) {
        let [number, res] = await this.model().update(obj, { where: { uuid: uuid }, returning: true })
        return number > 0 ? res[0].get() : undefined
    }

    /**
     * 获取用户任务条数
     * @param uuid
     */
    public async  findTasksCount(useruuid: string) {
        let res = await this.model().count({ where: { useruuid: useruuid } })
        return res
    }
    /**
     * 获取用户所有的任务
     * @param uuid
     */
    public async findAllTaskByUser(useruuid: string, cursor: number, limit: number) {
        let res = await this.model().findAll({
            where: { useruuid: useruuid },
            offset: cursor,
            limit: limit,
            order: [['modified', 'desc']]
        })
        return res.map((r: any) => r.get())
    }


    /**
     * 获取指定给我的今日任务
     * @param useruuid
     * @param cursor
     * @param limit
     */
    public async getTodaytask(useruuid: string, cursor: number, limit: number) {
        let res = await this.seqz.query(`select * from users.tasks  where remindpeople like '%${useruuid}%' and now() - remindtime<interval '24 hour' and now() - remindtime>=interval '0 hour' order by created desc LIMIT '${limit}' OFFSET '${cursor}' `, { type: "SELECT" }) as any[]
        return res
    }

    /**
     * 获取指定给我的今日任务条数
     */
    public async getTodaytaskCount(useruuid: string) {
        let res = await this.seqz.query(`select count(*) from users.tasks  where remindpeople like '%${useruuid}%' and (now() - remindtime)<interval '32 hour' and (now() - remindtime)>=interval '0 hour'  `, { type: "SELECT" }) as any[]
        return res[0].count
    }



    public async findTodayTaskByUser(useruuid: string, cursor: number, limit: number) {
        let res = await this.seqz.query(`select a.* from users.today_task a where a.useruuid='${useruuid}' order by a.remindtime desc LIMIT '${limit}' OFFSET '${cursor}' `, { type: "SELECT" }) as any[]
        return res
    }


    /**
     * 删除任务
     * @param uuid
     */
    public async delete(uuid: string) {
        let res = await this.model().destroy({ where: { uuid: uuid } })
        return res != 0 ? res : undefined
    }

    /**
     * 通过设备获取所有任务
     * @param obj
     */
    public async findAllTaskByDevice(obj: any, cursor: number, limit: number) {
        let useruuids = ""
        for (let o of obj) {
            useruuids += `'${o}',`
        }
        useruuids = useruuids.substr(0, useruuids.length - 1)
        let res = await this.seqz.query(`select a.*,b.avatar,b.username from "users"."tasks" a left join "users"."users" b on a.useruuid=b.uuid where 1=1 and type='public' and useruuid in (${useruuids})   ORDER BY a.modified desc LIMIT '${limit}' OFFSET '${cursor}'`, { type: "SELECT" }) as any[]
        return res
    }

    /**
     * 当有rfid时，获取设备所有任务以及用户私有和指定的任务
     * @param obj
     * @param cursor
     * @param limit
     */
    public async findAllTaskByDeviceAndUser(useruuid: any, obj: any, cursor: number, limit: number) {
        let useruuids = ""
        for (let o of obj) {
            useruuids += `'${o}',`
        }
        useruuids = useruuids.substr(0, useruuids.length - 1)
        let res = await this.seqz.query(`select a.*,b.avatar,b.username from "users"."tasks" a left join "users"."users" b on a.useruuid=b.uuid where (type='public' and useruuid in (${useruuids}) or (type='private' and useruuid='${useruuid}') or (type='specify' and remindpeople='${useruuid}'))   ORDER BY a.modified desc LIMIT '${limit}' OFFSET '${cursor}'`, { type: "SELECT" }) as any[]
        return res
    }

    /**
     * 通过设备获取今日任务
     * @param obj
     * @param cursor
     * @param limit
     */
    public async findTodayTaskByDevice(obj: any, cursor: number, limit: number) {
        let useruuids = ""
        for (let o of obj) {
            useruuids += `'${o}',`
        }
        useruuids = useruuids.substr(0, useruuids.length - 1)
        let res = await this.seqz.query(`select a.*,b.avatar,b.username from "users"."today_task" a left join "users"."users" b on a.useruuid=b.uuid where 1=1 and type='public' and useruuid in (${useruuids})   ORDER BY a.modified desc LIMIT '${limit}' OFFSET '${cursor}'`, { type: "SELECT" }) as any[]
        return res
    }

    /**
     * 当有rfid时，获取设备今日任务以及用户私有和指定的任务
     * @param useruuid
     * @param obj
     * @param cursor
     * @param limit
     */
    public async findTodayTaskByDeviceAndUser(useruuid: any, obj: any, cursor: number, limit: number) {
        let useruuids = ""
        for (let o of obj) {
            useruuids += `'${o}',`
        }
        useruuids = useruuids.substr(0, useruuids.length - 1)
        let res = await this.seqz.query(`select a.*,b.avatar,b.username from "users"."today_task" a left join "users"."users" b on a.useruuid=b.uuid where (type='public' and useruuid in (${useruuids}) or (type='private' and useruuid='${useruuid}') or (type='specify' and remindpeople='${useruuid}'))  ORDER BY a.modified desc LIMIT '${limit}' OFFSET '${cursor}'`, { type: "SELECT" }) as any[]
        return res
    }


    /**
     * 当没有rfid时，查找公共的任务数量
     * @param obj
     */
    public async findTaskCountByDevice(obj: any) {
        let res = await this.model().count({
            where: { useruuid: { $in: obj }, type: "public", status: "unread" },
        })
        return res
    }

    /**
     * 当有rfid时，查找公共的任务和个人任务数量
     * @param useruuid
     * @param obj
     */
    public async findTaskCountByDeviceAndUser(useruuid: any, obj: any) {
        let res = await this.model().count({
            where: { $or: [{ useruuid: { $in: obj }, type: "public" }, { useruuid: useruuid, type: 'private' }, { type: "specify", remindpeople: useruuid }] },
        })
        return res
    }

    /**
     * 当没有rfid时，查找公共的今日任务数量
     * @param obj
     */
    public async findTodayTaskCountByDevice(obj: any) {
        let useruuids = ""
        for (let o of obj) {
            useruuids += `'${o}',`
        }
        useruuids = useruuids.substr(0, useruuids.length - 1)
        let res = await this.seqz.query(`select count(*) from users.today_task a where a.useruuid in (${useruuids}) and type='public'`, { type: "SELECT" }) as any[]
        return parseInt(res[0].count)
    }

    /**
     * 当有rfid时，查找公共的今日任务和个人任务数量
     * @param useruuid
     * @param obj
     */
    public async findTodayTaskCountByDeviceAndUser(useruuid: any, obj: any) {
        let useruuids = ""
        for (let o of obj) {
            useruuids += `'${o}',`
        }
        useruuids = useruuids.substr(0, useruuids.length - 1)
        let res = await this.seqz.query(`select count(*) from users.today_task a where (type='public' and useruuid in (${useruuids}) or (type='private' and useruuid='${useruuid}') or (type='specify' and remindpeople='${useruuid}'))`, { type: "SELECT" }) as any[]
        return parseInt(res[0].count)
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
}
