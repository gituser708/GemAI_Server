require('dotenv').config({ quiet: true });
const asyncHandler = require('express-async-handler');
const calculateNextBillingDate = require('../utils/calculateNextBillingDate');
const shouldRenewSubscriptionPlan = require('../utils/shouldRenewSubscriptionPlan');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/Payment');
const User = require('../models/User');

const stripePaymentCtrl = {
  //! ✅ Create PaymentIntent
  handlePayment: asyncHandler(async (req, res) => {
    const { amount, subscriptionPlan } = req.body;
    const user = req.user;

    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    if (!amount || !subscriptionPlan) return res.status(400).json({ message: 'Missing amount or plan' });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(amount) * 100),
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId: user._id.toString(),
        userEmail: user.email,
        subscriptionPlan,
      },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentId: paymentIntent.id,
      metadata: paymentIntent.metadata,
    });
  }),

  //! ✅ Verify PaymentIntent and update user
  verifyPayment: asyncHandler(async (req, res) => {
    const { paymentId } = req.params;
    if (!paymentId) return res.status(400).json({ message: 'Missing paymentIntent ID' });

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Payment not completed' });
    }

    const { userId, userEmail, subscriptionPlan } = paymentIntent.metadata;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const amount = paymentIntent.amount / 100;
    const currency = paymentIntent.currency;

    const newPayment = await Payment.create({
      user: userId,
      email: userEmail,
      subscriptionPlan,
      amount,
      currency,
      status: 'success',
      reference: paymentIntent.id,
    });

    const planConfig = {
      Basic: { monthlyRequestCount: 50 },
      Premium: { monthlyRequestCount: 100 },
    };

    const config = planConfig[subscriptionPlan];
    if (!config) return res.status(400).json({ message: 'Invalid subscription plan' });

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        subscriptionPlan,
        trialPeriod: 0,
        nextBillingDate: calculateNextBillingDate(),
        apiRequestCount: 0,
        monthlyRequestCount: config.monthlyRequestCount,
        $addToSet: { payments: newPayment._id },
      },
      { new: true }
    );

    res.status(201).json({
      message: 'Payment verified, user updated',
      status: paymentIntent.status,
      updatedUser,
    });
  }),

  //! ✅ Handle Free Plan Renewal
  handleFreeSubscription: asyncHandler(async (req, res) => {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    if (!shouldRenewSubscriptionPlan(user)) {
      return res.status(403).json({ message: 'Subscription renewal not due yet!' });
    }

    user.subscriptionPlan = 'Free';
    user.monthlyRequestCount = 25;
    user.apiRequestCount = 0;
    user.nextBillingDate = calculateNextBillingDate();

    const newPayment = await Payment.create({
      user: user._id,
      subscriptionPlan: 'Free',
      amount: 0,
      status: 'success',
      reference: Math.random().toString(36).substring(7),
      monthlyRequestCount: 25,
      currency: 'usd',
    });

    user.payments.push(newPayment._id);
    await user.save();

    res.status(201).json({
      message: 'Subscription plan updated successfully',
      user,
    });
  }),
};

module.exports = stripePaymentCtrl;
