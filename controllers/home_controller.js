const Post = require('../models/post');
const User = require('../models/user');



module.exports.home = async function(req, res){

    try{
         // populate the user of each post
        let posts = await Post.find({})
        .sort('-createdAt')
        .populate('user')
        .populate({
            path: 'comments',
            populate: {
                path: 'user'
            },
            populate:{
               path:'likes' 
            }
        }).populate('likes');
        
        let user;
        if(req.user){
            user=await User.findById(req.user._id)
            .populate({
                path:'friendships',
                populate:[{
                    path:'to_user',
                    model: 'User'
                },{
                    path:'from_user'
                }]
            });
        }
        let users = await User.find({});
        // console.log('************',user);
        return res.render('home', {
            title: "Codeial | Home",
            posts:  posts,
            all_users: users,
            user:user
        });

    }catch(err){
        console.log('Error', err);
        return;
    }
   
}

// module.exports.actionName = function(req, res){}


// using then
// Post.find({}).populate('comments').then(function());

// let posts = Post.find({}).populate('comments').exec();

// posts.then()
