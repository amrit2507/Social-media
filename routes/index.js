const express=require('express');

const router=express.Router();

const homeController=require('../controllers/home_controller');

router.get('/',homeController.home);
router.use('/users',require('./user'));

//for any further router access from here
//router.use('/routerName',require('./routerFile'));

console.log('router loaded');
module.exports=router;