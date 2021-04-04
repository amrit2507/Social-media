const Post = require("../models/post");

module.exports.home = function (req, res) {
    //     Post.find({},function(err,posts){
    //         if(err){
    //             console.log('Error in fetching from db');
    //         }
    //         return res.render('home',{
    //             title: "Home",
    //             posts:posts
    //         });
    //     });
    //Populate the user of each post
    Post.find({}).populate('user').exec(function (err, posts) {
        if (err) {
            console.log('Error in fetching from db');
        }
        return res.render('home', {
            title: "Home",
            posts: posts
        });
    });

}
