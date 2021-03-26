const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  fullname: String,
  role: String,
  email: String,
  password: String,
  customer: String,
  schoolid: String,
  districtid: String,
  approved: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  planid: String,
  notify: Boolean,
  plan: {
    item: String,
    amount: String,
    invoicelink: String,
    created: String,
    status: String,
    when: String,
    renewal: Number,
  },
  extraInfo: {
    phoneNumber: String,
    country: String,
    district: String,
    city: String,
    province: String,
    status: {
      type: String,
      enum: ['Current', 'Expired', 'Trial'],
      default: 'Current',
    },
    expiryDate: Date,
    reference: String,
    userType: {
      type: String,
      enum: ['District Admin', 'School Admin', 'Home', 'Trial'],
      default: 'Home',
    },
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model('User', UserSchema);
module.exports = User;
