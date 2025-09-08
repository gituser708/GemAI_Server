const checkAPILimit = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found!" });

  // Trial users
  if (user.trialActive && user.apiRequestCount >= user.monthlyRequestCount) {
    return res.status(403).json({ message: "Trial limit reached. Please upgrade." });
  }

  // Paid users
  if (user.subscription === "basic" || user.subscription === "premium") {
    if (user.credits <= 0) {
      return res.status(403).json({ message: "Out of credits. Please top up." });
    }
  }

  // Free users
  if (!user.trialActive && user.subscription === "free") {
    const FREE_LIMIT = 5;
    if (user.apiRequestCount >= FREE_LIMIT) {
      return res.status(403).json({ message: "Free tier limit reached. Please subscribe." });
    }
  }

  next();
});
