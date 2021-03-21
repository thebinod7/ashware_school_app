const mongoose = require('mongoose')

const SchoolSchema = new mongoose.Schema({
    schoolname: String,
    districtid: String,
    schooladminname: String,
    status: String,
    teachers: [{
        fullname: String,
        email: String,
        status: String,
        passwordv: String,
        about: String
    }],
    students: [{
        fullname: String,
        email: String,
        status: String,
        passwordv: String,
        about: String
    }],
    classes: [{
        name: String,
        section: String,
        quiz: [{
            name: String
        }],
        lessons: [{
           title: String,
           link: String 
        }],
        students: [],
    }],
   
    date: {
        type: Date,
        default: Date.now
    },
})



const School = mongoose.model('School', SchoolSchema);
module.exports = School;