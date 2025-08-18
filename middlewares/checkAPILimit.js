const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const checkAPILimit = asyncHandler(async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Not authorized!" });
    };
    //! Find user
    const user = await User.findById(req?.user?.id);
    if (!user) {
        return res.status(404).json({ message: 'User not found!' });
    };
    let requestLimit = 0;
    //! Check if the user is on a trial period
    if (user?.trialActive) {
        requestLimit = user?.monthlyRequestCount
    };
    //! Check user monthly request limit expire or not
    if (user?.apiRequestCount >= requestLimit) {
        throw new Error("Your reached the maximum limit of free tier! plase subscribe our paid plan.");
    };
    next();
});

module.exports = checkAPILimit;