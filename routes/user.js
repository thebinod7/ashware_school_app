const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const async = require('async');
const nodemailer = require('nodemailer');

const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
require('dotenv').config();
const moment = require('moment');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
//User model
const User = require('../modules/User');
const School = require('../modules/School');

const { ensureAuthenticated } = require('../config/auth');
const URLroute = 'https://ashware.herokuapp.com';
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

//================= School app ====================

//@Login / Registration / Reset Page
router.get('/login', (req, res) => res.render('./pages/login'));
router.get('/register', (req, res) => res.render('./pages/register'));
router.get('/reset', (req, res) => res.render('./pages/reset'));
router.get('/member-login', (req, res) => res.render('./pages/mregister'));

router.get('/subscription', ensureAuthenticated, (req, res) => {
  if (req.user.planid && req.user.planid != '') return res.redirect('/app');
  res.render('./pages/subscribe', { user: req.user });
});

//@Register Handle
router.post('/register', (req, res) => {
  const { fullname, email, password } = req.body;

  let errors = [];
  //Check required fields
  if (!fullname || !email || !password) {
    errors.push({ msg: 'Please fill in all fields' });
  }
  //Check password match
  // if (password !== password2) {
  //     errors.push({msg: 'Passwords does not match'})
  // }
  //Password length
  if (password.length < 8) {
    errors.push({ msg: 'Password should be at least 8 characters' });
  }

  if (errors.length > 0) {
    res.render('./pages/register', {
      errors,
      fullname,
      email,
      password,
    });
  } else {
    //Validate pass
    User.findOne({ email: email }).then((user) => {
      if (user) {
        //User already EXIST
        errors.push({ msg: 'Email is already registered' });
        res.render('./pages/register', {
          errors,
          fullname,
          email,
          password,
        });
      } else {
        async function createAccount() {
          const customer = await stripe.customers.create({
            email: email,
            name: fullname,
            description: `${fullname} w/ email: ${email}`,
          });

          let runWhenDone = setInterval(() => {
            if (customer && customer.id) {
              isDone(customer);
              clearInterval(runWhenDone);
            }
          }, 1000);

          function isDone(usecc) {
            const newUser = new User({
              fullname,
              email,
              password,
              customer: usecc.id,
            });
            //Hash Password
            bcrypt.genSalt(10, (err, salt) =>
              bcrypt.hash(newUser.password, salt, (err, hash) => {
                if (err) throw err;
                newUser.password = hash;
                newUser
                  .save()
                  .then((user) => {
                    req.flash(
                      'success_msg',
                      'You are now registered and can login'
                    );
                    res.redirect('/u/login');
                  })
                  .catch((err) => console.log(err));
              })
            );
          }
        }
        createAccount();
      }
    });
  }
});

//@Notify Admin on teacher and student regsitration
const notifyUser = (dsid, role) => {
  User.find({ districtid: dsid }).then((found) => {
    if (found) {
      found.forEach((el) => {
        if (el.notify === true) {
          let mailOptions = {
            from: brandMail,
            to: el.email,
            subject: `New ${role} registration`,
            text: '',
            html: `<h1 style="text-align:center; color:#a8c6df;">Hello ${el.fullname}</h1> 
                <div style="background-color:#1c293b; color:#fff; text-align:center; padding: 2rem;">
                    <h3 style="font-weight:700;">A new ${role} just registered an account in one of your school's district.</h3>
                    <h3 style="font-weight:700;">Please click on the button below to see their information</h3>
                </div>
                <div style="text-align:center; padding: 1rem 30%;">
                   <a href="${URLroute}/u/login" style="${button}">See more details</a>
                </div>
             `,
          };
          sendMail(mailOptions);
        }
      });
    }
  });
};

//@Register page ofor admin / student via CVS
router.get('/invite-register/:token', (req, res) => {
  let param = req.params.token;

  let p01 = param.split('!!');
  let p02 = p01[1].split('URE');
  let p03 = p02[1].split('UEM');

  let data = {
    districtid: p01[0],
    fullname: p02[0],
    role: p03[0],
    email: p03[1],
  };
  res.render('./pages/inviteregister', { user: data });
});

//@Handle Registriation from invite & CVS invite
router.post('/invite-register/:token', (req, res) => {
  const data = req.body;

  let errors = [];
  //Check required fields
  if (!data.fullname || !data.email || !data.role) {
    errors.push({
      msg: 'Unknown error, please contact support or just restart this process',
    });
  }
  //Check password match
  if (data.password !== data.password2) {
    errors.push({ msg: 'Passwords does not match' });
  }
  //Password length
  if (data.password.length < 8) {
    errors.push({ msg: 'Password should be at least 8 characters' });
  }

  if (errors.length > 0) {
    res.render('./pages/inviteregister', {
      errors,
      user: data,
    });
  } else {
    //Validate pass
    if (data.role == 'School admin') {
      User.findOne({ email: data.email }).then((user) => {
        if (user) {
          errors.push({ msg: 'Email is already registered' });
          res.render('./pages/inviteregister', { errors, user: data });
        } else {
          // const newUser = new User({
          //   fullname: data.fullname,
          //   email: data.email,
          //   password: data.password,
          //   role: data.role,
          //   schoolid: data.districtid
          // });
          // //Hash Password
          // bcrypt.genSalt(10, (err, salt) =>
          //     bcrypt.hash(newUser.password, salt, (err, hash) => {
          //         if (err) throw err;
          //         newUser.password = hash;
          //         newUser.save()
          //             .then(user => {
          //                 req.flash('success_msg', 'You are now registered and can login');
          //                 res.redirect('/u/login')
          //             })
          //         .catch(err => console.log(err))
          //     }));

          async function createAccount() {
            const customer = await stripe.customers.create({
              email: data.email,
              name: data.fullname,
              description: `${data.fullname} w/ email: ${data.email}`,
            });

            let runWhenDone = setInterval(() => {
              if (customer && customer.id) {
                isDone(customer);
                clearInterval(runWhenDone);
              }
            }, 1000);

            function isDone(usecc) {
              const newUser = new User({
                fullname: data.fullname,
                email: data.email,
                password: data.password,
                role: data.role,
                schoolid: data.districtid,
                customer: usecc.id,
              });
              //Hash Password
              bcrypt.genSalt(10, (err, salt) =>
                bcrypt.hash(newUser.password, salt, (err, hash) => {
                  if (err) throw err;
                  newUser.password = hash;
                  newUser
                    .save()
                    .then((user) => {
                      req.flash(
                        'success_msg',
                        'You are now registered and can login'
                      );
                      res.redirect('/u/login');
                    })
                    .catch((err) => console.log(err));
                })
              );
            }
          }
          createAccount();
        }
      });
    } else {
      if (data.role != 'Student') return res.redirect('/u/login');

      School.findOne({ 'students.email': data.email }).then((user) => {
        if (user) {
          let promise = 0;
          user.students.forEach((usergroup) => {
            promise++;
            if (
              usergroup.fullname == data.fullname &&
              !usergroup.passwordv &&
              usergroup.email == data.email
            ) {
              School.findOneAndUpdate(
                { _id: data.districtid, 'students.email': data.email },
                {
                  $set: {
                    'students.$.status': 'active',
                    'students.$.passwordv': data.password,
                  },
                }
              ).exec((err, docs) => {
                req.flash(
                  'success_msg',
                  'You are now registered and can login'
                );
                res.redirect('/u/member-login');
                notifyUser(user.districtid, 'Student');
              });
            } else {
              promise--;
            }
          });
          setTimeout(() => {
            if (promise === 0) {
              errors.push({
                msg:
                  'Invalid registration! Please contact the invitation sender',
              });
              res.render('./pages/inviteregister', { errors, user: data });
            }
          }, 2000);
        } else {
          errors.push({ msg: 'No user found with this criterials!' });
          res.render('./pages/inviteregister', { errors, user: data });
        }
      });
    }
  }
});

//@Render when invite w/ only email
router.get('/invite-register-empty/:token', (req, res) => {
  let param = req.params.token;
  let cutt = param.split('!!');
  let role = cutt[1].split('UEM');

  let user = {
    schoolid: cutt[0],
    role: role[0],
    email: role[1],
  };
  res.render('./pages/invite_empty', { user: user });
});

//@Handle Register when invite w/ only email
router.post('/invite-register-empty/:token', (req, res) => {
  let errors = [];
  const data = req.body;
  //Check password match
  if (data.password !== data.password2) {
    errors.push({ msg: 'Passwords does not match' });
  }
  if (!data.fullname || !data.email || !data.role) {
    errors.push({
      msg: 'Unknown error, please contact support or just restart this process',
    });
  }

  if (errors.length > 0) {
    res.render('./pages/invite_empty', { user: user, errors });
  } else {
    if (data.role == 'Student') {
      School.findOne({ 'students.email': data.email }).then((user) => {
        if (user) {
          errors.push({ msg: 'Email is already registered' });
          res.render('./pages/invite_empty', { errors, user: user });
        } else {
          const newStudent = {
            fullname: data.fullname,
            email: data.email,
            passwordv: data.password,
            status: 'pending',
          };
          School.findOneAndUpdate(
            { _id: data.schoolid },
            { $push: { students: newStudent } },
            { new: true }
          ).then((student) => {
            req.flash('success_msg', 'You are now registered and can login');
            res.redirect('/u/member-login');
            notifyUser(student.districtid, 'Student');
          });
        }
      });
      //@Teacher
    } else if (data.role == 'Teacher') {
      School.findOne({ 'teachers.email': data.email }).then((user) => {
        if (user) {
          errors.push({ msg: 'Email is already registered' });
          res.render('./pages/invite_empty', { errors, user: user });
        } else {
          const newTeacher = {
            fullname: data.fullname,
            email: data.email,
            passwordv: data.password,
            status: 'pending',
          };
          School.findOneAndUpdate(
            { _id: data.schoolid },
            { $push: { teachers: newTeacher } },
            { new: true }
          ).then((teach) => {
            req.flash('success_msg', 'You are now registered and can login');
            res.redirect('/u/member-login');
            notifyUser(teach.districtid, 'Teacher');
          });
        }
      });
    } else {
      res.redirect('/');
    }
  }
});

//@Login Teacher o Member
router.post('/member-login', (req, res) => {
  const data = req.body;

  if (data.role === 'Teacher') {
    School.findOne({
      'teachers.email': data.email,
      'teachers.passwordv': data.password,
    }).then((user) => {
      if (user) {
        res.send({ doc: user });
      } else {
        res.send({ feed: 'No teacher' });
      }
    });
  } else {
    School.findOne({
      'students.email': data.email,
      'students.passwordv': data.password,
    }).then((user) => {
      if (user) {
        res.send({ doc: user });
      } else {
        res.send({ feed: 'No student' });
      }
    });
  }
});

//@ Login Handler
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/app',
    failureRedirect: '/u/login',
    failureFlash: true,
  })(req, res, next);
});

//@Logout Handle
router.get('/logout', (req, res) => {
  req.logOut();
  req.flash('success_msg', 'You are logged out');
  res.redirect('/u/login');
});

//@ Comfirm Close Account
router.post('/delete-account', ensureAuthenticated, (req, res) => {
  User.findByIdAndRemove(
    req.user._id,
    { useFindAndModify: false },
    (err, doc) => {
      if (err) throw err;
      res.redirect('/');
    }
  );
});

//@============ FORGET PASSWORD ===============//

//@Forget password
router.post('/forgot', function (req, res, next) {
  async.waterfall(
    [
      function (done) {
        crypto.randomBytes(20, function (err, buf) {
          var token = buf.toString('hex');
          done(err, token);
        });
      },
      function (token, done) {
        User.findOne({ email: req.body.email }, function (err, user) {
          if (!user) {
            req.flash(
              'error_msg',
              'No account with that email address exists.'
            );
            return res.redirect('/u/forgot');
          }
          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
          user.save(function (err) {
            done(err, token, user);
          });
        });
      },
      function (token, user, done) {
        const msg = {
          to: user.email,
          from: 'anthonylannn@gmail.com',
          subject: 'Password Recovery',
          text: 'Hey there',
          html: `You are receiving this because you (or someone else) have requested the reset of the password for your account. Please click on the following link, or paste this into your browser to complete the process. http://${req.headers.host}/u/reset/${token} If you did not request this, please ignore this email and your password will remain unchanged.`,
        };
        sgMail.send(msg);
        req.flash(
          'success_msg',
          'An e-mail has been sent to ' +
            user.email +
            ' with further instructions.'
        );
        res.redirect('/u/forgot');
      },
    ],
    function (err) {
      console.log('this err' + ' ' + err);
      res.redirect('/');
    }
  );
});

//@Forget route
router.get('/forgot', (req, res) => {
  res.render('forgot', {
    User: req.user,
  });
});

//@Reset Get Post
router.get('/reset/:token', function (req, res) {
  User.findOne(
    {
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    },
    function (err, user) {
      if (!user) {
        req.flash(
          'error_msg',
          'Password reset token is invalid or has expired.'
        );
        return res.redirect('/u/forgot');
      }
      res.render('./pages/reset', {
        User: req.user,
      });
    }
  );
});

//@Reset Post Route
router.post('/reset/:token', function (req, res) {
  async.waterfall(
    [
      function (done) {
        User.findOne(
          {
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() },
          },
          function (err, user, next) {
            if (!user) {
              req.flash(
                'error_msg',
                'Password reset token is invalid or has expired.'
              );
              return res.redirect('/');
            }
            user.password = req.body.password;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            //Hash Password
            bcrypt.genSalt(10, (err, salt) =>
              bcrypt.hash(user.password, salt, (err, hash) => {
                if (err) throw err;
                //Set Password to hashed
                user.password = hash;
                //Save User
                user
                  .save()
                  .then((user) => {
                    req.flash('success_msg', 'Password changed!');
                    res.redirect('/u/login');
                  })
                  .catch((err) => console.log(err));
              })
            );
          }
        );
      },
    ],
    function (err) {
      res.redirect('/u/login');
    }
  );
});
//@======= END OF FORGET ========

module.exports = router;
