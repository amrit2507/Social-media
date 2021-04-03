const express=require('express');

const router=express.Router();

const userController=require('../controllers/users_controller');

router.get('/profile',userController.action);
router.get('/sign-up',userController.SignUp);
router.get('/sign-in',userController.SignIn);
router.post('/create',userController.create);
router.post('/create-session',userController.createSession);
module.exports=router;