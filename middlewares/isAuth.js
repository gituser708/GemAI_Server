const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const User = require("../models/User");


const isAuth = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            res.status(401);
            throw new Error('Not authorized, no token found!');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

        // ✅ Fix here: use decoded.id
        req.user = await User.findById(decoded.id).select("-password");

        if (!req.user) {
            res.status(404);
            throw new Error("User not found");
        }

        next();
    } catch (error) {
        res.status(401).json({ message: error.message });
    }
});

module.exports = isAuth;