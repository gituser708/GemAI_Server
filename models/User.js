const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: function () {
      return this.provider !== "google"; // ✅ no password required for Google
    }
  },
  provider: {
    type: String,
    enum: ["local", "google"],
    default: "local"
  },
  providerId: {
    type: String, // Firebase UID for Google users
  },
  profileImage: {
    type: String,
  },
  trialPeriod: {
    type: Number,
    default: 3
  },
  trialActive: {
    type: Boolean,
    default: true
  },
  trialExpires: {
    type: Date,
  },
  subscriptionPlan: {
    type: String,
    enum: ['Trial', 'Free', 'Basic', 'Premium'],
    default: 'Trial'
  },
  apiRequestCount: {
    type: Number,
    default: 0
  },
  monthlyRequestCount: {
    type: Number,
    default: 10 //! 100 credit //3days
  },
  nextBillingDate: Date,
  payments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment'
    },
  ],
  history: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ContentHistory',
    },
  ],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

//! Add virtual property
userSchema.virtual("isTrialActive").get(function () {
  return this.trialActive && new Date() < this.trialExpires;
});

const User = mongoose.model('User', userSchema);
module.exports = User;
