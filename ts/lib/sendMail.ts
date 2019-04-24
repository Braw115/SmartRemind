import nodemailer = require("nodemailer");
import { emailOpt, fromEmail } from "../config/email"
let transporter = nodemailer.createTransport(emailOpt);




export async function sendActivateEmail(email: string, token: string): Promise<any> {

    let mailOptions = {
        from: fromEmail, // 发送者
        to: email, // 接受者
        subject: "Welcome! Please activate your PITAKA smart reminder account!", // 标题
        html: `You are almost there! Please click the link below to activate your PITAKA smart reminder account. The link expires in 1 hour</br>
            <a href='https://magmemo.ipitaka.com/api/app/users/activate?email=${email}&token=${token}'>Click Here</a></br>
            Having trouble with the link? Copy and paste the URL below into your browser window.</br>
            https://magmemo.ipitaka.com/api/app/users/activate?email=${email}&token=${token}`, // 文本
    };
    let res = await transporter.sendMail(mailOptions);
    return res
}




export async function sendForgetPasswordEmail(email: string, key: string): Promise<any> {

    let mailOptions = {
        from: fromEmail, // 发送者
        to: email, // 接受者
        subject: "Welcome! Please reset your PITAKA smart reminder account!", // 标题
        html: `You are almost there! Please click the link below to reset your PITAKA smart reminder account. The link expires in 1 hour</br>
                <a href='https://maghex.ipitaka.com/api/forget/index.html?key=${key}'>Click here</a></br>
                Having trouble with the link? Copy and paste the URL below into your browser window.</br>
                https://maghex.ipitaka.com/api/forget/index.html?key=${key}`, // 文本
    };
    let res = await transporter.sendMail(mailOptions);
    return res
}