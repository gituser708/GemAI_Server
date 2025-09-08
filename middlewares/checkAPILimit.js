const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const checkAPILimit = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authorized!" });
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "User not found!" });
  }

  // Trial logic
  if (user.trialActive && user.apiRequestCount >= user.monthlyRequestCount) {
    return res.status(403).json({ message: "Trial limit reached. Please upgrade." });
  }

  // Paid plan logic
  if (user.subscription === "basic" || user.subscription === "premium") {
    if (user.credits <= 0) {
      return res.status(403).json({ message: "Out of credits. Please top up." });
    }
  }

  // Free tier logic
  if (!user.trialActive && user.subscription === "free") {
    const FREE_LIMIT = 5;
    if (user.apiRequestCount >= FREE_LIMIT) {
      return res.status(403).json({ message: "Free tier limit reached. Please subscribe." });
    }
  }

  next();
});

module.exports = checkAPILimit;
