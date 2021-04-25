const nodemailer=require('../config/nodemailer');

exports.forgotPassword=(token)=>{
    let htmlString=nodemailer.renderTemplate({token:token},'/reset_password.ejs');

    nodemailer.transporter.sendMail({
        from:'amritanshusharma25@gmail.com',
        to:token.user.email,
        subject:"Forgot Password",
        html:htmlString
    },(err,info)=>{
        if(err){
            console.log('error in sending mail',err);
            return;
        }
        console.log("Message sent",info);
        return;
    })
}