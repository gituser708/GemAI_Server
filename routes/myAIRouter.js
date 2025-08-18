const express = require('express');
const isAuth = require('../middlewares/isAuth');
const myAICtrl = require('../controller/myAICtrl');
const checkAPILimit = require('../middlewares/checkAPILimit');

const myAIRouter = express.Router();

myAIRouter.post('/generate-content', isAuth, checkAPILimit, myAICtrl.geminiAI);

module.exports = myAIRouter;