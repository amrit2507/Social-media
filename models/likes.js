const mongoose = require('mongoose');

const likeSchema=new mongoose.Schema({
    user: {
        type:  mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    //this defines the object id of the liked
    likeable:{
        type: mongoose.Schema.Types.ObjectId,
        require:true,
        refPath:'onModel'
    },
    onModel:{
        type:String,
        require:true,
        enum:['Post','Comment']
    }
})