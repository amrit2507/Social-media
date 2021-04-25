const queue=require('../config/kue');

const forgetMailer=require('../mailer/forget_mailer');

queue.process('forgetPassword',function(job,done){
    console.log('forgetPassword worker is processing a job', job.data);
    console.log(job.data);
    forgetMailer.forgotPassword(job.data);

    done();
})