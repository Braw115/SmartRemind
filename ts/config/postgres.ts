
//数据库
export const pgOpt = {
    database: "postgres",
    username: "postgres",
    password: "123456",
    options: {
        dialect: "postgres",
        host: "pg.todo.cn",
        port: 5432,
        pool: {
            maxConnections: 5,
            minConnections: 0,
            maxIdleTime: 100000
        }
    }
}
