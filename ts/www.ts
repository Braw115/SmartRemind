/// <reference path="../typings/index.d.ts" />

import { createServer } from "http"
import { getApp } from "./init"
async function main() {
    let app = await getApp()
    let port = parseInt(process.env.PORT) || 3000
    createServer(app.callback()).listen(port)
    console.log("start on port 3000")
}
main()