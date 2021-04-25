const passport=require('passport');
const googleStratregy=require('passport-google-oauth').OAuth2Strategy;
const crypto=require('crypto');
const User=require('../models/user');

passport.use(new googleStratregy({
        clientID: "566754828935-k0b9r2oik2uiicfu33fb578la7bk0cov.apps.googleusercontent.com",
        clientSecret:"Yo3Y054TpT5UXHKJKsiNCZyS",
        callbackURL:"http://localhost:8000/users/auth/google/callback"
    },

    function(accessToken,refreshToken,profile,done){
        User.findOne({email:profile.emails[0].value}).exec(function(err,user){
            if(err){
                console.log('error in google strategy-passport',err);
                return;
            }
            console.log(profile);
            if(user){
                return done(null,user);
            }else{
                User.create({
                    name:profile.displayName,
                    email:profile.emails[0].value,
                    password:crypto.randomBytes(20).toString('hex')
                },function(err,user){
                    if(err){
                        console.log('error in Creating user',err);
                        return;
                    }
                    return done(null,user);
                })
            }
        })
    }
))

module.exports=passport;