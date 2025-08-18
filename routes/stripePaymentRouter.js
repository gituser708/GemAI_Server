const express = require('express');
const stripePaymentCtrl = require('../controller/stripePaymentCtrl');
const isAuth = require('../middlewares/isAuth');

const stripePaymentRouter = express.Router();

stripePaymentRouter.post('/payment-checkout', isAuth, stripePaymentCtrl.handlePayment);
stripePaymentRouter.post('/free-plan', isAuth, stripePaymentCtrl.handleFreeSubscription);
stripePaymentRouter.post('/verify-payment/:paymentId', stripePaymentCtrl.verifyPayment);

module.exports = stripePaymentRouter;