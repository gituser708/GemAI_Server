require('dotenv').config({ quiet: true });
const PORT = process.env.PORT || 5000;
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const cron = require('node-cron');
require('./db/db')();
const userRouter = require('./routes/userRouter');
const myAIRouter = require('./routes/myAIRouter');
const stripePaymentRouter = require('./routes/stripePaymentRouter');
const User = require('./models/User');

const app = express();

//! cors setup
app.use(cors({
    origin: 'https://gemai-web-app.onrender.com',
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use('/api', userRouter);
app.use('/api', myAIRouter);
app.use('/api', stripePaymentRouter);


app.listen(PORT, () => {
    console.log(`Server is running on: ${PORT}`);
});


//! setup cron for free trial period run every single 
cron.schedule("0 0 * * * *", async () => {
    try {
        //^ get the current date
        const today = new Date();
         await User.updateMany(
            {
                trialActive: true,
                trialExpires: { $lt: today }
            },
            {
                trialActive: false,
                subscriptionPlan: 'Free',
                monthlyRequestCount: 0
            }
        );
    } catch (error) {
        console.log(error);
    };
});

//! setup cron for free plan run at end of the every month
cron.schedule("0 0 1 * * *", async () => {
    try {
        //^ get the current date
        const today = new Date();
         await User.updateMany(
              {
                subscriptionPlan: 'Free',
                nextBillingDate: { $lt: today }
            },
            {
                monthlyRequestCount: 0
            }
        );
        
    } catch (error) {
        console.log(error);
    };
});


//! cron set up for paid plan (Basic plan)
cron.schedule("0 0 1 * * *", async () => {
    try {
        //^ get the current date
        const today = new Date();
         await User.updateMany(
            {
                subscriptionPlan: 'Basic',
                nextBillingDate: { $lt: today }
            },
            {
                monthlyRequestCount: 0
            }
        );
    } catch (error) {
        console.log(error);
    };
});

//! cron set up for paid plan (Premium plan)
cron.schedule("0 0 1 * * *", async () => {
    try {
        //^ get the current date
        const today = new Date();
         await User.updateMany(
            {
                subscriptionPlan: 'Premium',
                nextBillingDate: { $lt: today }
            },
            {
                monthlyRequestCount: 0
            }
        );
    } catch (error) {
        console.log(error);
    };
});




