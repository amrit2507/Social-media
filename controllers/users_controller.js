const User = require('../models/user');
const Token = require('../models/token');
const fs = require('fs');
const crypto = require('crypto');
const queue=require('../config/kue');
const forgetMailer = require('../mailer/forget_mailer');
const path = require('path');
const forgotPasswordWorker=require('../workers/forgot_password_worker');
const Friendship=require('../models/friendship');

// let's keep it same as before
module.exports.profile = async function (req, res){
    let user=await User.findById(req.params.id);
    let bothFriends=false;
    let f1=await Friendship.findOne({
        from_user:req.user._id,
        to_user:user._id
    });
    let f2=await Friendship.findOne({
        to_user:req.user._id,
        from_user:user._id
    });
    if(f1 || f2){
        bothFriends=true;
    }
    return res.render('user_profile', {
        title: 'User Profile',
        profile_user: user,
        is_friends:bothFriends
    });
}



module.exports.update = async function (req, res) {
    if (req.user.id == req.params.id) {
        try {
            const user = await User.findByIdAndUpdate(req.params.id);
            User.uploadedAvatar(req, res, function (err) {
                if (err) { console.log('********Multer error:', err) }
                user.name = req.body.name;
                user.email = req.body.email;

                if (req.file) {

                    if (user.avatar) {
                        fs.unlinkSync(path.join(__dirname, '..', user.avatar));
                    }

                    user.avatar = User.avatarPath + '/' + req.file.filename;
                    console.log(user.path);
                }
                user.save();
                return res.redirect('back');
            });
        } catch (err) {
            req.flash('error', err);
            return res.redirect('back');
        }
    }
    else {
        req.flash('error', 'Unauthorized!');
        return res.status(401).send('Unauthorized');
    }
}


// render the sign up page
module.exports.signUp = function (req, res) {
    if (req.isAuthenticated()) {
        return res.redirect('/users/profile');
    }


    return res.render('user_sign_up', {
        title: "Codeial | Sign Up"
    })
}


// render the sign in page
module.exports.signIn = function (req, res) {

    if (req.isAuthenticated()) {
        return res.redirect('/users/profile');
    }
    return res.render('user_sign_in', {
        title: "Codeial | Sign In"
    })
}

// get the sign up data
module.exports.create = function (req, res) {
    if (req.body.password != req.body.confirm_password) {
        req.flash('error', 'Passwords do not match');
        return res.redirect('back');
    }

    User.findOne({ email: req.body.email }, function (err, user) {
        if (err) { req.flash('error', err); return }

        if (!user) {
            User.create(req.body, function (err, user) {
                if (err) { req.flash('error', err); return }

                return res.redirect('/users/sign-in');
            })
        } else {
            req.flash('success', 'You have signed up, login to continue!');
            return res.redirect('back');
        }

    });
}


// sign in and create a session for the user
module.exports.createSession = function (req, res) {
    req.flash('success', 'Logged in Successfully');
    return res.redirect('/');
}

module.exports.destroySession = function (req, res) {
    req.logout();
    req.flash('success', 'You have logged out!');


    return res.redirect('/');
}

module.exports.resetPassword = function (req, res) {
    console.log(req.body);
    User.findOne({ email: req.body.email }, function (err, user) {
        if (err) { req.flash('error', err); return; };
        if (!user) {
            req.flash('error', 'Invalid email');
            return res.redirect('back');
        }
        else {
            Token.create({
                user: user,
                accessToken: crypto.randomBytes(20).toString('hex'),
                isValid: true
            }, function (err, token) {
                if (err) { console.log('Error in creating token', err); return; }
                else {
                    //Mail
                    // forgetMailer.forgotPassword(token);
                    let job=queue.create('forgetPassword',token).save(function(err){
                        if(err){
                            console.log('error in creating queue',err);
                            return;
                        }
                        console.log('job enqueued',job.id);
                    })
                    return res.redirect('back');
                }
            })
        }
    })
}
module.exports.tokenChecking = function (req, res) {
    let accessToken = req.params.token;
    Token.findOne({ accessToken: accessToken }, function (err, token) {
        if (err) { console.log('Error in finding token', err); return; }
        else {
            console.log(token);
            if (!token.isValid) {
                req.flash('error', 'Token expired');
                return res.redirect('/users/sign-in');
            }
            return res.render('forgot_password', {
                title: 'Forget-Password',
                token: token
            })
        }
    })
}
module.exports.changePassword = function (req, res) {
    if (req.body.password != req.body.confirm_password) {
        req.flash('error', 'Passwords do not match');
        return res.redirect('back');
    } else {
        let tokenId = req.body.token;
        Token.findById(tokenId, function (err, token) {
            if (err) {
                console.log('Token not valid', err);
                return res.redirect('/users/sign-in');
            } else {
                if (!token.isValid) {
                    req.flash('error', 'Token expired');
                    return res.redirect('/users/sign-in');
                }
                else{
                    User.findById(token.user,function(err,user){
                        if(err){
                            console.log('User not found',err);
                            return res.redirect('/users/sign-in');
                        }
                        else{
                            user.password=req.body.password;
                            user.save();
                            req.flash('success', 'Password Changed Successfully');
                            token.isValid=false;
                            token.save();
                            return res.redirect('/users/sign-in');
                        }
                    })
                }
            }
        })
    }
}
module.exports.addFriend=async function(req,res){
    try{
        if (!req.isAuthenticated()) {
            return res.redirect('back');
        }
        let user1=await User.findById(req.user._id);
        let user2=await User.findById(req.params.id);
        let friendship=await Friendship.create({
            from_user:user1._id,
            to_user:req.params.id
        });
        await user1.friendships.push(friendship._id);    
        await user2.friendships.push(friendship._id);    
        await user1.save();
        await user2.save();
        
        return res.redirect('back');
    }catch(err){
        console.log('Error in adding friend',err);
        return res.redirect('back');
    }
}
module.exports.removeFriend=async function(req,res){
    try{
        if (!req.isAuthenticated()) {
            return res.redirect('back');
        }
        let f1=await Friendship.findOne({
            from_user:req.user._id,
            to_user:req.params.id
        });
        let f2=await Friendship.findOne({
            to_user:req.user._id ,
            from_user: req.params.id 
        });
        if(f1){
            await User.findByIdAndUpdate(req.user._id, { $pull: {friendships: f1._id}});
            await User.findByIdAndUpdate(req.params.id, { $pull: {friendships: f1._id}});
            f1.remove();
        }else{
            await User.findByIdAndUpdate(req.user._id, { $pull: {friendships: f2._id}});
            await User.findByIdAndUpdate(req.params.id, { $pull: {friendships: f2._id}});
            f2.remove();
        }
        return res.redirect('back');
    }catch(err){
        console.log('Error in removing friend',err);
        return res.redirect('back');
    }
    
}