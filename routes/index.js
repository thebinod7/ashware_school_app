const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const moment = require('moment');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const { ensureAuthenticated } = require('../config/auth');
const User = require('../modules/User');
const School = require('../modules/School');

const URLroute = 'https://vast-reaches-84353.herokuapp.com';
const brandMail = 'marraineshop@gmail.com';

//@====== Setup Transport =========//
const globalTransport = nodemailer.createTransport({
  service: 'gmail',
  secure: false,
  host: 'smtp.gmail.com',
  auth: { user: process.env.EMAILUSER, pass: process.env.EMAILPASS },
  tls: { rejectUnauthorized: false },
});

function sendMail(opt) {
  globalTransport.sendMail(opt, (error, info) => {
    if (error) {
      console.log('Error:', error);
    } else {
      console.log('Message sent!');
    }
  });
}

//@Button styles
let button = `display: block; width: 200px; margin: 3rem auto; border: none; padding: 1rem 4rem;
margin: 0; text-decoration: none; background: #a8c6df;
color: #ffffff; font-family: sans-serif; font-size: 1rem;
cursor: pointer; text-align:center; text-decoration: none;`;

//@Set Global User for Class sharing
let globalUser;

router.get('/app', ensureAuthenticated, (req, res) => {
  //   if (!req.user.planid || req.user.planid == '')
  //     return res.redirect('/u/subscription');
  res.render('app', { user: req.user });
});

//@Get Sahre to Classroom
router.get('/share-class/:token', (req, res) => {
  res.render('./components/sharetoclass', { user: globalUser });
});

let verified;
const sendVerified = (ip, role, plan) => {
  verified = {
    ip: ip,
    user: role,
    plan: plan,
  };
};
router.post('/check-ip', (req, res) => {
  const data = req.body;
  sendVerified(data.ipaddress, data.role, data.plan);
  res.send(data);
});

router.get('/verify-content', (req, res) => {
  res.send({ doc: verified });
});
router.get('/verify-successful', (req, res) => {
  verified = null;
  res.send();
});

router.get('/', (req, res) => res.render('./pages/landing'));

router.get('/app/:schoolid', (req, res) => {
  const param = req.params.schoolid.split('@');

  School.findOne({ _id: param[0] }).then((sch) => {
    if (!sch) return res.redirect('/u/member-login');

    let user = {};
    function populateUser(el, doc) {
      user.fullname = el.fullname;
      user.email = el.email;
      user.role = param[1].split('URLT')[1];
      user.districtid = doc.districtid;
      user.schoolid = doc._id;
      user.schoolname = doc.schoolname;
      user._id = el._id;
    }

    if (param[1].split('URLT')[1] == 'Teacher') {
      if (sch.teachers.length == 0) return res.redirect('/u/member-login');
      sch.teachers.forEach((el) => {
        if (el._id == param[1].split('URLT')[0]) {
          populateUser(el, sch);
          res.render('app', { user: user });
          globalUser = user;
        } else {
          //res.redirect('/u/member-login')
        }
      });
    } else {
      if (sch.students.length == 0) return res.redirect('/u/member-login');
      sch.students.forEach((el) => {
        if (el._id == param[1].split('URLT')[0]) {
          populateUser(el, sch);
          res.render('app', { user: user });
          globalUser = user;
        } else {
          // res.redirect('/u/member-login')
        }
      });
    }
  });
});

//@Save role on init
router.post('/save-role', ensureAuthenticated, (req, res) => {
  const data = req.body;
  let districtId = data.role == 'School admin' ? data.districtid : uuidv4();

  User.findByIdAndUpdate(
    req.user._id,
    { role: data.role, districtid: districtId },
    { useFindAndModify: false },
    function (err, result) {
      if (err) return;
      res.send();
    }
  );
  if (data.role == 'School admin') {
    const newSchool = new School({
      schooladminname: req.user.fullname,
      districtid: districtId,
      schoolname: data.schoolname,
      status: 'pending',
    });
    newSchool.save().then((u) => {});
  }
});

//@Check district Id
router.post('/validate-districtid', (req, res) => {
  User.findOne({
    districtid: req.body.districtid,
    role: 'District admin',
  }).then((user) => {
    if (user) {
      res.send({ doc: user });
    } else {
      res.send({
        fail:
          'That District ID does not exist, please try contacting the district admin',
      });
    }
  });
});

//@Get school single
router.post('/get-single-school', (req, res) => {
  School.findOne({ _id: req.body.schoolid }).then((user) => {
    if (user) {
      res.send({ doc: user });
    }
  });
});

//@Approve school
router.post('/approve-school', ensureAuthenticated, (req, res) => {
  School.findByIdAndUpdate(
    req.body.id,
    { status: 'active' },
    { useFindAndModify: false },
    function (err, doc) {
      res.send();
    }
  );
});

//@Delete school
router.post('/delete-school', ensureAuthenticated, (req, res) => {
  School.findByIdAndRemove(
    req.body.id,
    { useFindAndModify: false },
    (err, doc) => {
      if (err) throw err;
      res.send();
    }
  );
});

//@Add school via invite
router.post('/add-school', ensureAuthenticated, (req, res) => {
  const data = req.body;

  const newSchool = new School({
    districtid: data.districtid,
    schoolname: data.schoolname,
    schooladminname: data.schooladminname,
    status: 'pending',
  });
  newSchool.save().then((u) => {
    let mailOptions = {
      from: brandMail,
      to: data.adminemail,
      subject: `You have been invited to ${data.schoolname}`,
      text: '',
      html: `<h1 style="text-align:center; color:#a8c6df;">Hi, ${data.schooladminname}</h1> 
                <div style="background-color:#1c293b; color:#fff; text-align:center; padding: 2rem;">
                    <h3 style="font-weight:700;">You have been invited to create an account as a school admin at ${data.schoolname}.</h3>
                    <h3 style="font-weight:700;">Please click on the button below to register your account</h3>
                </div>
                <div style="text-align:center; padding: 1rem 30%;">
                    <a href="${URLroute}/u/invite-register/${u._id}!!${data.schooladminname}URESchool adminUEM${data.adminemail}" style="${button}">Register your account</a>
                </div>
             `,
    };
    sendMail(mailOptions);
    res.send(u);
  });
});
//@Get school multiple
router.post('/get-multiple-school', (req, res) => {
  School.find({ districtid: req.body.districtid }).then((user) => {
    if (user) {
      res.send({ doc: user });
    }
  });
});

//@Query User account
router.get('/valid-user', ensureAuthenticated, (req, res) => {
  User.findOne({ email: req.user.email }).then((user) => {
    if (user) {
      res.send({ user: user });
    } else {
      res.send({ err: 'No user found' });
    }
  });
});

//@Aprrove Teacher n Student account
router.post('/approve-account-ts', (req, res) => {
  const data = req.body;

  if (data.role == 'Teacher') {
    School.findOneAndUpdate(
      { _id: data.schoolid, 'teachers._id': data.id },
      { $set: { 'teachers.$.status': 'active' } }
    ).exec((err, docs) => {
      res.send();
    });
  } else {
    School.findOneAndUpdate(
      { _id: data.schoolid, 'students._id': data.id },
      { $set: { 'students.$.status': 'active' } }
    ).exec((err, docs) => {
      res.send();
    });
  }
});

//@ Delete Student n  Teacher
router.post('/delete-account-ts', (req, res) => {
  const data = req.body;

  if (data.role == 'Teacher') {
    School.updateOne(
      { _id: data.schoolid },
      { $pull: { teachers: { _id: data.id } } },
      { safe: true },
      (err, obj) => {
        if (err) return;
        res.send();
      }
    );
  } else {
    School.updateOne(
      { schooladminid: data.schooladminid },
      { $pull: { students: { _id: data.id } } },
      { safe: true },
      (err, obj) => {
        if (err) return;
        res.send();
      }
    );
  }
});

//@Invite Teachers
router.post('/invite-teachers', (req, res) => {
  const data = req.body;

  data.email.forEach((m) => {
    let mailOptions = {
      from: brandMail,
      to: m,
      subject: `You have been invited to ${data.schoolname}`,
      text: '',
      html: `<h1 style="text-align:center; color:#a8c6df;">Hello</h1> 
                <div style="background-color:#1c293b; color:#fff; text-align:center; padding: 2rem;">
                    <h3 style="font-weight:700;">You have been invited to create an account as teacher in ${data.schoolname}.</h3>
                    <h3 style="font-weight:700;">Please click on the button below to register your account</h3>
                </div>
                <div style="text-align:center; padding: 1rem 30%;">
                <a href="${URLroute}/u/invite-register-empty/${data.schoolid}!!TeacherUEM${m}" style="${button}">Register your account</a>
                </div>
             `,
    };
    sendMail(mailOptions);
  });
  res.send();
});

//@Invite students
router.post('/invite-students', (req, res) => {
  const data = req.body;

  data.email.forEach((m) => {
    let mailOptions = {
      from: brandMail,
      to: m,
      subject: `You have been invited to ${data.schoolname}`,
      text: '',
      html: `<h1 style="text-align:center; color:#a8c6df;">Hello</h1> 
                <div style="background-color:#1c293b; color:#fff; text-align:center; padding: 2rem;">
                    <h3 style="font-weight:700;">You have been invited to create an account as student in ${data.schoolname}.</h3>
                    <h3 style="font-weight:700;">Please click on the button below to register your account</h3>
                </div>
                <div style="text-align:center; padding: 1rem 30%;">
                <a href="${URLroute}/u/invite-register-empty/${data.schoolid}!!StudentUEM${m}" style="${button}">Register your account</a>
                </div>
             `,
    };
    sendMail(mailOptions);
  });
  res.send();
});

//=================== TODO ============//

//@Add students via CVS
router.post('/add-students-cvs', (req, res) => {
  const data = req.body;

  data.students.forEach((stud) => {
    const newStudent = {
      fullname: stud.fullname,
      email: stud.email,
      status: stud.status,
    };
    School.findOneAndUpdate(
      { _id: data.schoolid },
      { $push: { students: newStudent } },
      { new: true }
    ).then((student) => {});
    //@Send Invites
    let mailOptions = {
      from: brandMail,
      to: stud.email,
      subject: `You have been invited to ${data.schoolname}`,
      text: '',
      html: `<h1 style="text-align:center; color:#a8c6df;">Hi, ${stud.fullname}</h1> 
                <div style="background-color:#1c293b; color:#fff; text-align:center; padding: 2rem;">
                    <h3 style="font-weight:700;">You have been invited to create an account as a Student at ${data.schoolname}.</h3>
                    <h3 style="font-weight:700;">Please click on the button below to register your account</h3>
                </div>
                <div style="text-align:center; padding: 1rem 30%;">
                    <a href="${URLroute}/u/invite-register/${data.schoolid}!!${stud.fullname}UREStudentUEM${stud.email}" style="${button}">Register your account</a>
                </div>
             `,
    };
    sendMail(mailOptions);
  });
  res.send();
});

//@Add classes
router.post('/create-class', (req, res) => {
  const data = req.body;
  const newClass = { name: data.name, section: data.section };
  School.findOneAndUpdate(
    { _id: data.schoolid },
    { $push: { classes: newClass } },
    { new: true }
  ).then((feed) => {
    res.send(feed);
  });
});

//@Update classes
router.post('/edit-class', (req, res) => {
  const data = req.body;
  School.findOneAndUpdate(
    { _id: data.schoolid, 'classes._id': data.id },
    { $set: { 'classes.$.name': data.name, 'classes.$.section': data.section } }
  ).exec((err, docs) => {
    res.send();
  });
});

//@Delete classes
router.post('/delete-class', (req, res) => {
  const data = req.body;
  School.updateOne(
    { _id: data.schoolid },
    { $pull: { classes: { _id: data.id } } },
    { safe: true },
    (err, obj) => {
      res.send();
    }
  );
});

//@Assign lesson to class
router.post('/assign-lesson-class', (req, res) => {
  const data = req.body;
  const newlesson = { title: '', link: data.url };
  School.findOneAndUpdate(
    { _id: data.schoolid, 'classes._id': data.classId },
    { $push: { 'classes.$.lessons': newlesson } },
    { new: true }
  ).then((feed) => {
    res.send(feed);
  });
});

//@Assign student to class
router.post('/assign-peepto-class', (req, res) => {
  const data = req.body;
  data.peeps.forEach((peep) => {
    School.findOneAndUpdate(
      { _id: data.schoolid, 'classes._id': data.classId },
      { $push: { 'classes.$.students': peep } },
      { new: true }
    ).then((feed) => {});
  });
  res.send();
});

//@ Revoke student assign
router.post('/revoke-peepfrom-class', (req, res) => {
  const data = req.body;
  School.updateOne(
    { _id: data.schoolid, 'classes._id': data.classId },
    { $pull: { 'classes.$.students': data.peepId } },
    { safe: true },
    (err, obj) => {
      res.send();
    }
  );
});

//@ Delete lesson from class
router.post('/delete-lessonfrom-class', (req, res) => {
  const data = req.body;
  School.updateOne(
    { _id: data.schoolid, 'classes._id': data.classId },
    { $pull: { 'classes.$.lessons': { _id: data.lessonId } } },
    { safe: true },
    (err, obj) => {
      res.send();
    }
  );
});

//@Update Account Profile
router.post('/update-account', (req, res) => {
  const data = req.body;

  if (data.role == 'Teacher') {
    School.findOneAndUpdate(
      { _id: data.schoolid, 'teachers._id': data.id },
      { $set: { 'teachers.$.fullname': data.fullname } }
    ).exec((err, docs) => {
      res.send();
    });
  } else if (data.role == 'Student') {
    School.findOneAndUpdate(
      { _id: data.schoolid, 'students._id': data.id },
      { $set: { 'students.$.fullname': data.fullname } }
    ).exec((err, docs) => {
      res.send();
    });
  } else {
    User.findByIdAndUpdate(
      data.id,
      { fullname: data.fullname, email: data.email, notify: data.notify },
      { useFindAndModify: false },
      function (err, result) {
        res.send();
      }
    );
  }
});

router.post('/update-tsact-admin', (req, res) => {
  const data = req.body;

  if (data.role == 'Teacher') {
    School.findOneAndUpdate(
      { _id: data.schoolid, 'teachers._id': data.id },
      {
        $set: {
          'teachers.$.fullname': data.fullname,
          'teachers.$.status': data.status,
          'teachers.$.about': data.about,
        },
      }
    ).exec((err, docs) => {
      res.send();
    });
  } else {
    School.findOneAndUpdate(
      { _id: data.schoolid, 'students._id': data.id },
      {
        $set: {
          'students.$.fullname': data.fullname,
          'students.$.status': data.status,
          'students.$.about': data.about,
        },
      }
    ).exec((err, docs) => {
      res.send();
    });
  }
});

//@Delete account Self
router.post('/delete-account', (req, res) => {
  const data = req.body;

  if (data.role == 'Teacher') {
    School.updateOne(
      { _id: data.schoolid },
      { $pull: { teachers: { _id: data.id } } },
      { safe: true },
      (err, obj) => {
        res.send();
      }
    );
  } else if (data.role == 'Student') {
    School.updateOne(
      { _id: data.schoolid },
      { $pull: { students: { _id: data.id } } },
      { safe: true },
      (err, obj) => {
        res.send();
      }
    );
  } else {
    User.findByIdAndRemove(data.id, { useFindAndModify: false }, (err, doc) => {
      res.send();
    });
    if (data.role == 'District admin') {
      School.findByIdAndRemove(
        data.schoolid,
        { useFindAndModify: false },
        (err, doc) => {
          res.send();
        }
      );
    }
  }
});

//@Confirm Subscription
router.post('/confirm-payment', ensureAuthenticated, async (req, res) => {
  const data = req.body;
  const priceId =
    data.when == 'monthly'
      ? 'price_1ICXNVJEDKLFQJCTteWwGYN0'
      : 'price_1ICXP9JEDKLFQJCTGMMTJL90';

  try {
    const paymentMethod = req.body.paymentId;
    await stripe.paymentMethods.attach(paymentMethod, {
      customer: req.user.customer,
    });
    await stripe.customers.update(req.user.customer, {
      invoice_settings: { default_payment_method: paymentMethod },
    });

    //@Update Subscription
    const subscription = await stripe.subscriptions.create({
      customer: req.user.customer,
      items: [{ price: priceId }],
      expand: ['latest_invoice.payment_intent'],
    });
    res.send({ success: subscription });

    const newtransaction = {
      item: 'Premium',
      renewal: subscription.current_period_end,
      when: data.when,
      amount: data.when == 'yearly' ? '$99' : '$9.99',
      invoicelink: subscription.latest_invoice.hosted_invoice_url,
      created: moment().format('ddd MMM YYYY'),
      status: 'active',
    };
    User.findOneAndUpdate(
      { email: req.user.email },
      {
        $set: { role: 'Parent', plan: newtransaction, planid: subscription.id },
      },
      { new: true }
    ).then((doc) => {});
  } catch (err) {
    //console.log('This is an err', err);
    res.send({ failed: err.raw });
  }
});

//@Cancel plan
router.post('/cancel-subscription', ensureAuthenticated, async (req, res) => {
  const data = req.user;
  if (!data.planid) return;

  const deleted = await stripe.subscriptions.del(data.planid);
  if (deleted) {
    User.findOneAndUpdate(
      { email: req.user.email },
      { $set: { planid: '' } }
    ).then((doc) => {
      res.send();
    });
  }
});

module.exports = router;
