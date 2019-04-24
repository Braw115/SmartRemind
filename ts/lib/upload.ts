
const Path = require("path")
import utils = require("./utils")

export function moveFile(file: any): Promise<any> {
    return new Promise(async (resolve, reject) => {

        let fileName = file.originalname
        let tempDir = Path.join(__dirname, '../../public/temp/')
        let oldPath = tempDir + fileName
        let newPath = "/data/apk/" + fileName

        let err = await utils.renameAsync(oldPath, newPath)
        if (err) return reject(err)

        return resolve()
    })
}