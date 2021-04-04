const mongoose = require('mongoose')

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
        renewal: Number
    },
    date: {
        type: Date,
        default: Date.now
    },
})



const User = mongoose.model('User', UserSchema);
module.exports = User;