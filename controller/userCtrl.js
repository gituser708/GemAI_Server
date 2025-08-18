const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require("../models/User");
const { admin } = require('../firebase/firebase');

const userCtrl = {
    register: asyncHandler(async (req, res) => {
        try {
            const { username, email, password } = req.body;

            if (!username || !email || !password) {
                res.status(400);
                throw new Error('All fields is required!');
            };

            const userExists = await User.findOne({ email });

            if (userExists) {
                res.status(400);
                throw new Error('User already exist!');
            };

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

          const createUser = new User({
                username,
                email,
                password: hashedPassword,
          });
            
            createUser.trialExpires = new Date(
                new Date().getTime() + createUser.trialPeriod * 24 * 60 * 60 * 1000
            );

            await createUser.save();

            res.status(201).json({
                message: 'User has been created.',
            });
        } catch (error) {
            res.json({ message: error.message });
            console.log(error);
            
        };
    }),

    login: asyncHandler(async (req, res) => {
        try {
            const { email, password } = req.body;
            const user = await User.findOne({ email });

            if (!user) {
                res.status(400);
                throw new Error('Invalid email or password!');
            };
            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                res.status(400);
                throw new Error('Invalid email or password');
            };
            const token = jwt.sign({ id: user?._id }, process.env.JWT_SECRET_KEY, {
                expiresIn: "30d"
            });
            
            res.cookie("token", token, {
                httpOnly: true,
                secure: true,
                sameSite: "strict",
                maxAge: 30 * 24 * 60 * 60 * 1000
            });

            res.status(200).json({ message: "Login success", });

        } catch (error) {
            res.json({ message: error.message });
            console.log(error);
        };
    }),

    logout: asyncHandler(async (req, res) => {
        try {
            res.cookie("token", "", { maxAge: 1 });
            res.status(200).json({ message: 'You are logged out' });
        } catch (error) {
            res.json({ message: error.message });
            console.log(error);
        };
    }),

    profile: asyncHandler(async (req, res) => {
        try {
            const user = await User.findById(req.user.id).select("-password")
                .populate('payments')
                .populate('history');
            
            if (user) {
                res.status(200).json({user});
            } else {
                res.status(404);
                throw new Error("User not found");
            }
        } catch (error) {
            res.json({ message: error.message });
            console.log(error);
        };
    }),

    checkAuth: asyncHandler(async (req, res) => {
        const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET_KEY);
        if (decoded) {
            res.json({
                isAuthenticated: true
            });
        } else {
            res.json({
                isAuthenticated: false
            });
        };
    }),

    googleLogin: asyncHandler(async (req,res) => {
        try {
      const { idToken } = req.body;
      if (!idToken) {
        res.status(400);
        throw new Error("ID token required");
      }

      // 1. Verify Firebase token
      const decoded = await admin.auth().verifyIdToken(idToken);
      const { uid, email, name, picture } = decoded;

      // 2. Find or create Mongo user
      let user = await User.findOne({ email });
      if (!user) {
        user = new User({
          email,
          username: name,
          provider: "google",
          providerId: uid,
          profileImage: picture,
        });
        user.trialExpires = new Date(
          Date.now() + user.trialPeriod * 24 * 60 * 60 * 1000
        );
        await user.save();
      } else {
        user.provider = "google";
        user.providerId = uid;
        user.profileImage = picture;
        await user.save();
      }

      // 3. Create JWT
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
        expiresIn: "30d",
      });

      // 4. Store JWT in cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: true, 
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({ message: "Google login success" });
    } catch (error) {
      res.json({ message: error.message });
      console.log(error);
        };
    }),
};

module.exports = userCtrl;