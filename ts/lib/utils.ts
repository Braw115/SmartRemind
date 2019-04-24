import { createHash, } from "crypto"
import { ReqError } from "../lib/reqerror"
import fs = require("fs")

export function checkPassword(real: string, current: string): void {
    let [a, b] = [real.length === 32 ? real : md5sum(real), current.length === 32 ? current : md5sum(current)]
    if (a !== b)
        throw new ReqError("Invalid oldpasspord ", 400)
}

export function randomInt(from: number, to: number) {
    return Math.floor(Math.random() * (to - from) + from)
}

export function md5sum(str: string): string {
    return createHash('md5').update(str).digest("hex")
}

export function sleepAsync(ms: number): Promise<void> {
    return new Promise<void>(resolve => setTimeout(() => resolve(), ms))
}

export function md5(str: string): string {
    return createHash('md5').update(str).digest("hex")
}

export function renameAsync(oldPath: string, newPath: string) {
    return new Promise((resolve, reject) => fs.rename(oldPath, newPath, err => {
        if (err) {
            return reject(err)
        }
        return resolve()
    }))
}
