const express = require('express');
const userCtrl = require('../controller/userCtrl');
const isAuth = require('../middlewares/isAuth');

const userRouter = express.Router();

userRouter.post('/register', userCtrl.register);
userRouter.post('/login', userCtrl.login);
userRouter.post('/logout', userCtrl.logout);
userRouter.get('/profile', isAuth, userCtrl.profile);
userRouter.get('/check-auth', isAuth, userCtrl.checkAuth);
userRouter.post('/google-login', userCtrl.googleLogin);

module.exports = userRouter;