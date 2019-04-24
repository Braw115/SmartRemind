const JPush = require('jpush-sdk')
import { config } from "../config/JPush"
const client = JPush.buildClient(config.AppKey, config.MasterSecret);


/**
 * 极光推送，推送回家，离家信息
 * @param uuids
 * @param content
 */
export async function jpush(uuid: string, content: string): Promise<any> {
    return new Promise((resolve, reject) => {
        client.push().setPlatform('ios', 'android')
            .setAudience(JPush.alias(uuid))
            .setNotification('MagHub', JPush.ios(content, "sound"), JPush.android(content))
            .setOptions(null, 60, null, true)
            .send(function (err: any, res: any) {
                if (err) {
                    if (err instanceof JPush.APIConnectionError) {
                        console.log(err.message);
                        //Response Timeout means your request to the server may have already received, please check whether or not to push
                        console.log(err.isResponseTimeout);
                    } else if (err instanceof JPush.APIRequestError) {
                        console.log(err.message);
                    }
                    reject()
                } else {
                    resolve()
                    console.log('Sendno: ' + res.sendno);
                    console.log('Msg_id: ' + res.msg_id);
                }
            })
        /* resolve() */
    })
}