const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  fullname: String,
  role: {
    type: String,
    enum: [
      'District admin',
      'School admin',
      'Trial account',
      'Parent', // Home user
      'Teacher',
      'Student',
      'Super admin',
    ],
  },
  creditCardPayment: { type: Boolean, default: true },
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
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model('User', UserSchema);
module.exports = User;
