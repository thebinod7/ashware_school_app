const $ = document;
const alertSuccess = $.querySelector('.ui-alert-success-fixed');
const alertWarning = $.querySelector('.ui-alert-error-fixed');

$.querySelector('.preloader').classList.remove('hide');

function preloader() {
  $.querySelector('.preloader').classList.remove('hide');
  setTimeout(() => {
    $.querySelector('.preloader').classList.add('hide');
  }, 500);
}

preloader();

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    initWindow();
    $.querySelector('.preloader').classList.add('hide');
  }, 2000);
});

function initWindow() {
  let schoolID;
  const userRole = $.querySelector('#user-role--g').textContent;

  function setAttributes(el, attrs) {
    for (let key in attrs) {
      el.setAttribute(key, attrs[key]);
    }
  }

  const uialert = (dom, msg) => {
    dom.classList.remove('hide');
    dom.style.marginTop = '0%';
    dom.querySelector('.ui-alert-msg').innerHTML = msg;

    setTimeout(() => {
      dom.classList.add('hide');
      dom.style.marginTop = '-100%';
    }, 4000);
  };

  function navListselector() {
    $.querySelectorAll('.ui-sidebar a').forEach((el) => {
      el.classList.remove('active-navlist');
    });
  }

  $.querySelectorAll('.ui-sidebar a').forEach((el) => {
    el.addEventListener('click', () => {
      preloader();
      navListselector();
      el.classList.add('active-navlist');
    });
  });

  function copyValue(doc) {
    doc.querySelector('span').innerHTML = 'Copied!';
    doc.classList.add('copied');
    setTimeout(() => {
      doc.querySelector('span').innerHTML = 'Copy';
      doc.classList.remove('copied');
    }, 2000);
  }

  $.querySelector('.copy-brand-code').addEventListener('click', () => {
    let text = $.querySelector('#district-copy-id');
    text.select();
    $.execCommand('copy');
    copyValue($.querySelector('.copy-brand-code'));
  });

  const accountForm = document.querySelector('#main-account-settings');

  //@Save profile details
  accountForm.addEventListener('submit', (e) => {
    e.preventDefault();

    fetch('/update-account', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        schoold: schoolID,
        role: accountForm['role'].value,
        fullname: accountForm['fullname'].value,
        email: accountForm['email'].value,
        id: accountForm['userid'].value,
        notify: accountForm['notify'].checked ? true : false,
      }),
    }).then((res) => {
      uialert(alertSuccess, 'Account info updated!');
    });
  });

  //@Edit teacher n student
  const editTeaNStForm = $.querySelector('#modal-edit-accounts form');

  editTeaNStForm.addEventListener('submit', (e) => {
    e.preventDefault();
    fetch('/update-tsact-admin', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        schoolid: schoolID,
        fullname: editTeaNStForm['fullname'].value,
        status: editTeaNStForm['status'].value,
        about: editTeaNStForm['about'].value,
        id: editTeaNStForm['id'].value,
        role: editTeaNStForm['role'].value,
      }),
    }).then((res) => {
      UIkit.modal('#modal-edit-accounts').hide();
      uialert(alertSuccess, 'Account updated!');
      populateTeacher();
      populateStudent();
    });
  });

  function populateUserInfo(fn, em, rl, st, ab, uid) {
    editTeaNStForm['fullname'].value = fn;
    editTeaNStForm['email'].value = em;
    editTeaNStForm['role'].value = rl;
    editTeaNStForm['status'].value = st;
    editTeaNStForm['about'].value = ab == 'undefined' ? '' : ab;
    editTeaNStForm['id'].value = uid;
  }

  const activeTeachersDiv = document.querySelector('.active-teachers');
  const pendingTeachersDiv = document.querySelector('.pending-teachers');

  //@Populate teachers
  function populateTeacher() {
    fetch('/get-single-school', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        schoolid: schoolID,
      }),
    })
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        activeTeachersDiv.innerHTML = '';
        pendingTeachersDiv.innerHTML = '';

        const pending = res.doc.teachers.filter((el) => {
          return el.status === 'pending' && res.doc._id == schoolID;
        });
        const active = res.doc.teachers.filter((el) => {
          return el.status === 'active' && res.doc._id == schoolID;
        });

        pending.forEach((el) => {
          let li = document.createElement('li');
          setAttributes(li, {
            'data-id': el._id,
            'data-name': el.fullname,
            'data-email': el.email,
            'data-role': 'Teacher',
            'data-status': el.status,
            'data-about': el.about,
          });
          li.innerHTML = `
                <span>${el.fullname}</span>
                <span>${el.email}</span>
                <span class="${el.status}"><ion-icon name="time-outline"></ion-icon> ${el.status}</span>
                <div>
                 <a href="#" class="approve-account  use-stripe-btn">Approve account</a>
                 <a href="#modal-edit-accounts" uk-toggle class="use-stripe-btn">Edit</a>
               </div>
              `;
          pendingTeachersDiv.appendChild(li);
          li.querySelector('div:last-child').addEventListener('click', (e) => {
            let d = e.target.parentElement.parentElement;
            populateUserInfo(
              d.dataset.name,
              d.dataset.email,
              d.dataset.role,
              d.dataset.status,
              d.dataset.about,
              d.dataset.id
            );
          });
          li.querySelector('.approve-account').addEventListener(
            'click',
            (e) => {
              e.preventDefault();
              approveAccount(el._id, 'Teacher');
            }
          );
        });

        active.forEach((el) => {
          let li = document.createElement('li');
          setAttributes(li, {
            'data-id': el._id,
            'data-name': el.fullname,
            'data-email': el.email,
            'data-role': 'Teacher',
            'data-status': el.status,
            'data-about': el.about,
          });
          li.innerHTML = `
                <span>${el.fullname}</span>
                <span>${el.email}</span>
                <span class="${el.status}"><ion-icon name="checkmark-circle-outline"></ion-icon> ${el.status}</span>
                <div>
                 <a href="#" class="delete-account-ts  use-stripe-btn">Delete account</a>
                 <a href="#modal-edit-accounts" uk-toggle class="use-stripe-btn">Edit</a>
               </div>
              `;
          activeTeachersDiv.appendChild(li);
          li.querySelector('div:last-child').addEventListener('click', (e) => {
            let d = e.target.parentElement.parentElement;
            populateUserInfo(
              d.dataset.name,
              d.dataset.email,
              d.dataset.role,
              d.dataset.status,
              d.dataset.about,
              d.dataset.id
            );
          });
          li.querySelector('.delete-account-ts').addEventListener(
            'click',
            (e) => {
              e.preventDefault();
              UIkit.modal('#modal-delete-teacher').show();
              $.querySelector('.tik-delete-teacher').addEventListener(
                'click',
                () => {
                  deleteAccount(el._id, 'Teacher');
                }
              );
            }
          );
        });
      });
  }

  //@Approve account
  function approveAccount(id, role) {
    fetch('/approve-account-ts', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: id,
        role: role,
        schoolid: schoolID,
      }),
    }).then((res) => {
      populateTeacher();
      populateStudent();
    });
  }

  function deleteAccount(id, role) {
    fetch('/delete-account-ts', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: id,
        role: role,
        schoolid: schoolID,
      }),
    }).then((res) => {
      populateTeacher();
      populateStudent();
      UIkit.modal('#modal-delete-student').hide();
      UIkit.modal('#modal-delete-teacher').hide();
    });
  }

  if (document.querySelector('.tik-teachers')) {
    document.querySelector('.tik-teachers').addEventListener('click', (e) => {
      e.preventDefault();
      populateTeacher();
      if ($.querySelector('.tik-invite-teachers').disabled == true) {
        uialert(
          alertWarning,
          'No school selected! To invite teachers there must be at least one active school'
        );
      }
    });
    document
      .querySelector('.tik-invite-teachers')
      .addEventListener('click', () => {
        UIkit.modal('#modal-invite-teachers').show();
      });

    //@Students
    $.querySelector('.tik-students').addEventListener('click', (e) => {
      e.preventDefault();
      populateStudent();
      if ($.querySelector('.tik-invite-students').disabled == true) {
        uialert(
          alertWarning,
          'No school selected! To invite student there must be at least one active school'
        );
      }
    });
  }

  const activeStudentDiv = document.querySelector('.active-students');
  const pendingStudentDiv = document.querySelector('.pending-students');

  //@Populate student
  function populateStudent() {
    fetch('/get-single-school', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        schoolid: schoolID,
      }),
    })
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        activeStudentDiv.innerHTML = '';
        pendingStudentDiv.innerHTML = '';

        const pending = res.doc.students.filter((el) => {
          return el.status === 'pending' && res.doc._id == schoolID;
        });
        const active = res.doc.students.filter((el) => {
          return el.status === 'active' && res.doc._id == schoolID;
        });

        pending.forEach((el) => {
          let li = document.createElement('li');
          setAttributes(li, {
            'data-id': el._id,
            'data-name': el.fullname,
            'data-email': el.email,
            'data-role': 'Student',
            'data-status': el.status,
            'data-about': el.about,
          });

          li.innerHTML = `
                <span>${el.fullname}</span>
                <span>${el.email}</span>
                <span class="${el.status}"><ion-icon name="time-outline"></ion-icon> ${el.status}</span>
                <div>
                 <a href="#" class="approve-account  use-stripe-btn">Approve account</a>
                 <a href="#modal-edit-accounts" uk-toggle class="use-stripe-btn">Edit</a>
               </div>
              `;
          pendingStudentDiv.appendChild(li);
          li.querySelector('div:last-child').addEventListener('click', (e) => {
            let d = e.target.parentElement.parentElement;
            populateUserInfo(
              d.dataset.name,
              d.dataset.email,
              d.dataset.role,
              d.dataset.status,
              d.dataset.about,
              d.dataset.id
            );
          });
          li.querySelector('.approve-account').addEventListener(
            'click',
            (e) => {
              e.preventDefault();
              approveAccount(el._id, 'Student');
            }
          );
        });

        active.forEach((el) => {
          let li = document.createElement('li');
          setAttributes(li, {
            'data-id': el._id,
            'data-name': el.fullname,
            'data-email': el.email,
            'data-role': 'Student',
            'data-status': el.status,
            'data-about': el.about,
          });

          li.innerHTML = `
                <span>${el.fullname}</span>
                <span>${el.email}</span>
                <span class="${el.status}"><ion-icon name="checkmark-circle-outline"></ion-icon> ${el.status}</span>
                <div>
                 <a href="#" class="delete-account-ts  use-stripe-btn">Delete account</a>
                 <a href="#modal-edit-accounts" uk-toggle class="use-stripe-btn">Edit</a>
               </div>
              `;
          activeStudentDiv.appendChild(li);
          li.querySelector('div:last-child').addEventListener('click', (e) => {
            let d = e.target.parentElement.parentElement;
            populateUserInfo(
              d.dataset.name,
              d.dataset.email,
              d.dataset.role,
              d.dataset.status,
              d.dataset.about,
              d.dataset.id
            );
          });
          li.querySelector('.delete-account-ts').addEventListener(
            'click',
            (e) => {
              e.preventDefault();
              UIkit.modal('#modal-delete-student').show();
              $.querySelector('.tik-delete-student').addEventListener(
                'click',
                () => {
                  deleteAccount(el._id, 'Student');
                }
              );
            }
          );
        });
      });
  }

  let evpass = false;
  function validateEmail(array) {
    array = array.map(function (el) {
      return el.trim();
    });

    array.forEach((el) => {
      let regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
      let valid = regex.test(el);
      if (!valid) {
        alert('Please enter a valid email address');
        evpass = false;
        return;
      } else {
        evpass = true;
      }
    });
  }

  const inviteTform = document.querySelector('.invite-teach-form');
  const inviteSform = document.querySelector('.invite-student-form');

  //@Invite Teachers
  inviteTform.addEventListener('submit', (e) => {
    e.preventDefault();
    let array = inviteTform['email'].value.split(',');
    validateEmail(array);

    if (evpass === true) {
      fetch('/invite-teachers', {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schoolname: accountForm['schoolname'].value,
          schoolid: schoolID,
          email: array,
        }),
      }).then((res) => {
        setTimeout(() => {
          uialert(
            alertSuccess,
            'Hurray! Your invitation was sent successfully!'
          );
          UIkit.modal('#modal-invite-teachers').hide();
          inviteTform.reset();
        }, 1000);
      });
    }
  });

  //@Invite student
  inviteSform.addEventListener('submit', (e) => {
    e.preventDefault();
    let array = inviteSform['email'].value.split(',');
    validateEmail(array);

    if (evpass === true) {
      fetch('/invite-students', {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schoolname: accountForm['schoolname'].value,
          schoolid: schoolID,
          email: array,
        }),
      }).then((res) => {
        setTimeout(() => {
          UIkit.modal('#modal-invite-students').hide();
          inviteSform.reset();
          uialert(
            alertSuccess,
            'Invitation sent! Student details will appear on here on they register an account'
          );
        }, 1000);
      });
    }
  });

  //@If its disctrict admin
  if (document.querySelector('#distadmin-schools')) {
    const distadminschool = document.querySelector('#distadmin-schools');

    function districtAdminConfig() {
      fetch('/get-multiple-school', {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          districtid: accountForm['districtid'].value,
        }),
      })
        .then((res) => {
          return res.json();
        })
        .then((res) => {
          if (res.doc.length == 0) {
            $.querySelectorAll(
              '.tik-invite-teachers, .tik-invite-students, .tik-add-students'
            ).forEach((btns) => {
              btns.disabled = true;
            });
            uialert(
              alertWarning,
              'No school found! To invite teachers or students, there must be at least one active school'
            );
            return;
          }

          res.doc.forEach((el) => {
            let option = document.createElement('option');
            option.value = el._id;
            option.innerHTML = el.schoolname;
            distadminschool.appendChild(option);
          });
          schoolID = distadminschool.value;
        });
    }
    districtAdminConfig();

    distadminschool.addEventListener('change', () => {
      schoolID = distadminschool.value;
      populateStudent();
      populateTeacher();
    });

    $.querySelector('.tik-schools').addEventListener('click', (e) => {
      e.preventDefault();
      UIkit.modal('#modal-school').show();
      poplulateSchools();
    });
  }

  //@Populate school
  const activeDiv = $.querySelector('.active-schools');
  const pendingDiv = $.querySelector('.pending-schools');

  function poplulateSchools() {
    fetch('/get-multiple-school', {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        districtid: accountForm['districtid'].value,
      }),
    })
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        activeDiv.innerHTML = '';
        pendingDiv.innerHTML = '';

        const pending = res.doc.filter((el) => {
          return el.status === 'pending';
        });
        const active = res.doc.filter((el) => {
          return el.status === 'active';
        });

        pending.forEach((el) => {
          let li = document.createElement('li');
          li.innerHTML = `
           <span>${el.schoolname}</span>
           <span><strong>school admin:</strong> ${el.schooladminname}</span>                    <span class="${el.status}"><ion-icon name="time-outline"></ion-icon> ${el.status}</span>
           <a href="#" class="approve-school use-stripe-btn">Approve school</a>
         `;
          pendingDiv.appendChild(li);
          li.querySelector('.approve-school').addEventListener('click', (e) => {
            e.preventDefault();
            approveSchool(el._id);
          });
          li.addEventListener('click', (e) => {
            if (
              !e.target.classList.contains('approve-school') &&
              !e.target.classList.contains('delete-school')
            ) {
              schoolDetailsView(el._id, res.doc);
            }
          });
        });

        active.forEach((el) => {
          let li = document.createElement('li');
          li.innerHTML = `
           <span>${el.schoolname}</span>
           <span><strong>school admin:</strong> ${el.schooladminname}</span>
           <span class="${el.status}"><ion-icon name="checkmark-circle-outline"></ion-icon> ${el.status}</span>
           <a href="#" class="delete-school  use-stripe-btn">Delete school</a>
         `;
          activeDiv.appendChild(li);
          li.querySelector('.delete-school').addEventListener('click', (e) => {
            e.preventDefault();
            UIkit.modal('#modal-delete-school').show();
            $.querySelector('.tik-delete-school').addEventListener(
              'click',
              () => {
                deleteSchool(el._id);
              }
            );
          });
          li.addEventListener('click', (e) => {
            if (
              !e.target.classList.contains('approve-school') &&
              !e.target.classList.contains('delete-school')
            ) {
              schoolDetailsView(el._id, res.doc);
            }
          });
        });
      });
  }

  //@Schoool details
  function schoolDetailsView(id, doc) {
    doc.forEach((sch) => {
      if (sch._id !== id) return;
      $.querySelector('#modal-overview').classList.remove('hide');

      ($.querySelector('.ui-header--stat').innerHTML = sch.schoolname),
        ($.querySelector('.domain-status').innerHTML = sch.status);
      $.querySelector('.domain-date').innerHTML = moment(sch.date).format(
        'MMM YYYY'
      );
      $.querySelector('.domain-admin').innerHTML = sch.schooladminname;
      $.querySelector(
        '.numb-teachers'
      ).innerHTML = `${sch.teachers.length} teacher(s)`;
      $.querySelector(
        '.numb-students'
      ).innerHTML = `${sch.students.length} student(s)`;
      $.querySelector('.domain-url-host').innerHTML = sch.districtid;
      $.querySelector(
        '.numb-classes'
      ).innerHTML = `${sch.classes.length} classes`;

      const teacherTab = $.querySelector('.teachers-tabs');
      teacherTab.innerHTML = '';
      sch.teachers.forEach((teac) => {
        let li = document.createElement('li');
        li.innerHTML = `
              <span>${teac.fullname}</span>
              <span>${teac.email}</span>
              <span><a href="#">Open <ion-icon name="open-outline"></ion-icon></a></span>
            `;
        teacherTab.appendChild(li);
      });
      //============
      const studentTab = $.querySelector('.students-tabs');
      studentTab.innerHTML = '';
      sch.students.forEach((teac) => {
        let li = document.createElement('li');
        li.innerHTML = `
              <span>${teac.fullname}</span>
              <span>${teac.email}</span>
              <span><a href="#">Open <ion-icon name="open-outline"></ion-icon></a></span>
            `;
        studentTab.appendChild(li);
      });
      //=======Classes
      const classTab = $.querySelector('.sch-classes-tabs');
      classTab.innerHTML = '';
      sch.classes.forEach((clas) => {
        let li = document.createElement('li');
        li.innerHTML = `
              <span>${clas.name}</span>
              <span>${!clas.section ? 'N/A' : clas.section}</span>
              <span><a href="#">Open <ion-icon name="open-outline"></ion-icon></a></span>
            `;
        classTab.appendChild(li);
      });

      //========
      $.querySelector('.tik-pop-delete-school__modal').addEventListener(
        'click',
        () => {
          UIkit.modal('#modal-delete-school').show();
          $.querySelector('.tik-delete-school').addEventListener(
            'click',
            () => {
              deleteSchool(id);
              UIkit.modal('#modal-delete-school').hide();
              UIkit.modal('#modal-overview').hide();
              uialert(alertWarning, 'School deleted!');
            }
          );
        }
      );
    });

    $.querySelector('.tik-close-school-view').addEventListener('click', (e) => {
      e.preventDefault();
      $.querySelector('#modal-overview').classList.add('hide');
    });
  }

  //@Delete schools
  function deleteSchool(id) {
    fetch('/delete-school', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: id }),
    }).then((res) => {
      UIkit.modal('#modal-delete-school').hide();
      poplulateSchools();
    });
  }
  function approveSchool(id) {
    fetch('/approve-school', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: id }),
    }).then((res) => {
      poplulateSchools();
    });
  }

  //@Add school
  if ($.querySelector('.tik-schools')) {
    const addSchform = $.querySelector('.add-school-form');
    addSchform.addEventListener('submit', (e) => {
      e.preventDefault();

      fetch('/add-school', {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolname: addSchform['schoolname'].value,
          adminemail: addSchform['adminemail'].value,
          schooladminname: addSchform['schooladminname'].value,
          districtid: accountForm['districtid'].value,
        }),
      }).then((res) => {
        UIkit.modal('#modal-add-school').hide();
        addSchform.reset();
        poplulateSchools();
      });
    });
  }

  //@CSV function for students

  let CVSset = [];
  let inviteMailArrays = [];

  $.querySelector('#csv-students').addEventListener('change', (e) => {
    CVSset = [];
    inviteMailArrays = [];
    uialert(alertWarning, 'Hold your horses while we process your file...');
    e.target.disabled = true;
    Papa.parse(e.target.files[0], {
      complete: function (results) {
        let filtArray = results.data.filter((el) => {
          return el != '';
        });
        let values = filtArray;
        let suspect = true;
        for (let i = 0; i < values.length; i++) {
          if (values.length == 0 || !values[i][0] || !values[i][1]) {
            e.target.disabled = false;
            uialert(alertWarning, 'Invalid CSV format');
            return;
          }
          if (values[i].length > 2) {
            uialert(alertWarning, 'Invalid CSV format');
            e.target.disabled = false;
            return;
          }
          CVSset.push({
            fullname: values[i][0],
            email: values[i][1],
            status: 'pending',
          });
          inviteMailArrays.push(values[i][1]);

          suspect = false;
        }

        if (suspect == true) return;
        setTimeout(() => {
          addCVSstudents();
          e.target.disabled = false;
        }, 3000);
      },
    });
  });

  //@Push to School students
  function addCVSstudents() {
    fetch('/add-students-cvs', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        schoolid: schoolID,
        students: CVSset,
        schoolname: accountForm['schoolname'].value,
      }),
    }).then((res) => {
      populateStudent();
      UIkit.modal('#modal-add-students').hide();
      uialert(alertSuccess, 'Students invited');
    });
  }

  if (userRole == 'Parent' || userRole == 'Trial account') {
    $.querySelector('.sch-name').classList.add('hide');
    $.querySelectorAll(
      '.search-criteria a[data-el="schools"], search-criteria a[data-el="teachers"]'
    ).forEach((el) => el.classList.add('hide'));
  }

  if (
    userRole == 'Teacher' ||
    userRole == 'Student' ||
    userRole == 'School admin'
  ) {
    schoolID = $.querySelector('#school_id').textContent;
    populateStudent();
    if (userRole == 'Student') {
      $.querySelector('.reveal-on-student').classList.remove('hide');
      $.querySelector('.tik-create-class').classList.add('hide');
    }
  }

  if (userRole == 'Teacher' || userRole == 'Student') {
    $.querySelector('.subscription-link').classList.add('hide');
    $.querySelectorAll(
      '.search-criteria a[data-el="schools"], search-criteria a[data-el="teachers"]'
    ).forEach((el) => el.classList.add('hide'));
  }

  //@Render classes
  let ClassId,
    docs,
    ClassAssignStudentArray = [];
  const editClassForm = $.querySelector('#edit-class form');

  function renderClasses() {
    const classlistbody = $.querySelector('.list-of-classes');

    fetch('/get-single-school', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        schoolid: schoolID,
      }),
    })
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        docs = res.doc;
        classlistbody.innerHTML = '';
        res.doc.classes.forEach((el) => {
          let li = $.createElement('li');
          li.innerHTML = `
               <span>${el.name}</span>
               <span>${el.students.length} Students</span>
               <span>${el.lessons.length} Lessons</span>
               <a href="#" class="use-stripe-btn">View class</a>
             `;
          classlistbody.appendChild(li);
          UIkit.util.on('#edit-class', 'show', function () {
            if (el._id == ClassId) {
              editClassForm['title'].value = el.name;
              editClassForm['section'].value = !el.section ? '' : el.section;
              editClassForm['id'].value = el._id;
            }
          });
          li.addEventListener('click', () => {
            $.querySelector('#modal-class-overview .class-title').innerHTML =
              el.name;
            $.querySelector('#modal-class-overview').classList.remove('hide');
            ClassId = el._id;
            renderReadyClassData(docs.classes);
          });
        });
      });
  }

  //@View a single class
  function renderReadyClassData(doc) {
    const classLessons = $.querySelector('.classes-lessons');
    const classstudents = $.querySelector('.classes-students');

    doc.forEach((el) => {
      if (el._id == ClassId) {
        classstudents.innerHTML = '';
        classLessons.innerHTML = '';

        el.lessons.forEach((les) => {
          let lis = $.createElement('li');
          lis.innerHTML = `
             <span>lesson #<i></i></span>
             <div>
               <span><a href="${les.link}#${schoolID}" class="use-stripe-btn" target="_blank">Go to page <ion-icon name="open-outline"></ion-icon></a></span>  
               <span><a href="#" id="${les._id}" class="use-stripe-btn tik-delete-lesson">delete</a></span>
             </div>
           `;
          classLessons.appendChild(lis);
          lis
            .querySelector('.tik-delete-lesson')
            .addEventListener('click', (e) => {
              deleteLessons(e.target.id);
              classLessons.removeChild(lis);
            });
          lis.querySelector('span i').innerHTML =
            Array.prototype.indexOf.call(classLessons.childNodes, lis) + 1;
        });

        //==============
        docs.students.forEach((elpeep) => {
          if (el.students.includes(elpeep._id)) {
            let lic = document.createElement('li');
            lic.innerHTML = `
           <span>${elpeep.fullname}</span>
           <span><a href="#" data-id="${elpeep._id}" class="use-stripe-btn">Revoke</a></span>
           `;
            classstudents.appendChild(lic);
            lic
              .querySelector('.use-stripe-btn')
              .addEventListener('click', (e) => {
                revokeStudentClassAccess(e.target.dataset.id);
                classstudents.removeChild(lic);
              });
          }
        });
      }
    });
  }

  $.querySelector('.tik-close-class--view').addEventListener('click', (e) => {
    e.preventDefault();
    $.querySelector('#modal-class-overview').classList.add('hide');
  });

  //@Render student to be assigned to class
  function showStudentforClassAssign() {
    const assignStudentClassUL = $.querySelector('.assign-student-class-peeps');
    fetch('/get-single-school', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        schoolid: schoolID,
      }),
    })
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        assignStudentClassUL.innerHTML = '';
        ClassAssignStudentArray = [];
        const classes = res.doc.classes.filter((el) => {
          return el._id == ClassId;
        });

        res.doc.students.forEach((el) => {
          if (classes[0].students.includes(el._id)) {
          } else {
            let li = document.createElement('li');
            li.innerHTML = `
                <span>${el.fullname}</span>
                <span> <a href="#" data-id="${el._id}" class="use-stripe-btn">Assign to class</a></span>
               `;
            assignStudentClassUL.appendChild(li);
            li.querySelector('a').addEventListener('click', (e) => {
              ClassAssignStudentArray.push(e.target.dataset.id);
              assignStudentToClass(ClassAssignStudentArray);
            });
          }
        });
      });
  }

  $.querySelector('.tik-open-assign-pop').addEventListener('click', () => {
    showStudentforClassAssign();
  });
  $.querySelector('#all-to-assign-students').addEventListener('change', (e) => {
    if (e.target.checked) {
      ClassAssignStudentArray = [];
      $.querySelector('.assign-student-class-peeps')
        .querySelectorAll('li a')
        .forEach((href) => {
          ClassAssignStudentArray.push(href.dataset.id);
        });
      assignStudentToClass(ClassAssignStudentArray);
    }
  });

  //@Assign Students to Class
  function assignStudentToClass(arr) {
    fetch('/assign-peepto-class', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        schoolid: schoolID,
        classId: ClassId,
        peeps: arr,
      }),
    }).then((res) => {
      renderClasses();
      showStudentforClassAssign();
      setTimeout(() => {
        renderReadyClassData(docs.classes);
        uialert(alertSuccess, 'Student assigned and notified by email!');
        ClassAssignStudentArray = [];
      }, 1000);
    });
  }

  //@Create Class
  const classForm = $.querySelector('.create-class-form');
  classForm.addEventListener('submit', (e) => {
    e.preventDefault();

    fetch('/create-class', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        schoolid: schoolID,
        name: classForm['title'].value,
        section: classForm['section'].value,
      }),
    }).then((res) => {
      renderClasses();
      UIkit.modal('#modal-create-class').hide();
      uialert(alertSuccess, 'Class created!');
    });
  });

  //@Edit class
  editClassForm.addEventListener('submit', (e) => {
    e.preventDefault();

    fetch('/edit-class', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        schoolid: schoolID,
        name: editClassForm['title'].value,
        section: editClassForm['section'].value,
        id: editClassForm['id'].value,
      }),
    }).then((res) => {
      renderClasses();
      UIkit.modal('#edit-class').hide();
      uialert(alertSuccess, 'Class updated!');
      $.querySelector('#modal-class-overview .class-title').innerHTML =
        editClassForm['title'].value;
    });
  });

  editClassForm
    .querySelector('.uk-button-danger')
    .addEventListener('click', () => {
      let prompt = window.confirm('Are you sure you want to do this?');
      if (prompt === true) {
        deleteClass();
      }
    });

  //@delete class
  function deleteClass() {
    fetch('/delete-class', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        schoolid: schoolID,
        id: editClassForm['id'].value,
      }),
    }).then((res) => {
      renderClasses();
      UIkit.modal('#edit-class').hide();
      $.querySelector('#modal-class-overview').classList.add('hide');
      uialert(alertSuccess, 'Class deleted!');
    });
  }
  //@Revoke Student Class access
  function revokeStudentClassAccess(id) {
    fetch('/revoke-peepfrom-class', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        schoolid: schoolID,
        classId: ClassId,
        peepId: id,
      }),
    }).then((res) => {
      setTimeout(() => {
        showStudentforClassAssign();
        uialert(alertSuccess, 'Student access revoked!');
        ClassAssignStudentArray = [];
      }, 1000);
    });
  }

  //@ Delete lesson
  function deleteLessons(id) {
    fetch('/delete-lessonfrom-class', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        schoolid: schoolID,
        classId: ClassId,
        lessonId: id,
      }),
    }).then((res) => {
      uialert(alertSuccess, 'Lesson deleted!');
    });
  }

  //@student tab on student side / claess assigne
  function studentTabClasses() {
    let id = accountForm['userid'].value;
    const classLessons = $.querySelector('.classes-lessons--student');

    fetch('/get-single-school', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        schoolid: schoolID,
      }),
    })
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        $.querySelector('.list-of-classes--student').innerHTML = '';

        res.doc.classes.forEach((el) => {
          if (el.students.includes(id)) {
            let li = $.createElement('li');
            li.innerHTML = `
               <span>${el.name}</span>
               <span>${el.students.length} Students</span>
               <span>${el.lessons.length} Lessons</span>
               <a href="#" class="use-stripe-btn">See lessons</a>
               `;
            $.querySelector('.list-of-classes--student').appendChild(li);
            li.addEventListener('click', () => {
              $.querySelector(
                '#modal-class-overview--student'
              ).classList.remove('hide');
              $.querySelector(
                '#modal-class-overview--student .class-title'
              ).innerHTML = el.name;
              classLessons.innerHTML = '';
              el.lessons.forEach((les) => {
                let lis = $.createElement('li');
                lis.innerHTML = `
                     <span>lesson #<i></i></span>
                     <a href="${les.link}" class="ui-link" target="_blank">Go to lesson page <ion-icon name="arrow-forward-outline"></ion-icon></a>
                   `;
                classLessons.appendChild(lis);
                lis.querySelector('span i').innerHTML =
                  Array.prototype.indexOf.call(classLessons.childNodes, lis) +
                  1;
              });
            });
          }
        });
        $.querySelector('.tik-close-lesson--view').addEventListener(
          'click',
          (e) => {
            e.preventDefault();
            $.querySelector('#modal-class-overview--student').classList.add(
              'hide'
            );
          }
        );
      });
  }

  $.querySelector('.tik-account-delete').addEventListener('click', () => {
    deleteAccountSelf(accountForm['userid'].value);
  });

  //@Delete account by user
  function deleteAccountSelf(id) {
    fetch('/delete-account', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: id,
        role: accountForm['role'].value,
        schoolid: schoolID,
      }),
    }).then((res) => {
      location.href = '/';
    });
  }

  //Nav tirggers
  if ($.querySelector('.tik-classes')) {
    $.querySelector('.tik-classes').addEventListener('click', () => {
      renderClasses();
    });
  }

  if ($.querySelector('.tik-lessons')) {
    $.querySelector('.tik-lessons').addEventListener('click', () => {
      studentTabClasses();
    });
  }

  //@Home
  $.querySelector('.tik-report').addEventListener('click', (e) => {
    e.preventDefault();
    UIkit.modal('#modal-school').hide();
    UIkit.modal('#modal-teacher').hide();
    UIkit.modal('#modal-student').hide();
    UIkit.modal('#modal-class').hide();
    UIkit.modal('#modal-lesson-assigned').hide();
    UIkit.modal('#modal-account').hide();
    $.querySelector('#modal-class-overview--student').classList.add('hide');
    $.querySelector('#modal-class-overview').classList.add('hide');
  });

  //@Set value if School admin
  setTimeout(() => {
    fetch('/get-single-school', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        schoolid: schoolID,
      }),
    })
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        if (!accountForm['schoolname'].value) {
          accountForm['schoolname'].value = res.doc.schoolname;
          $.querySelector('#district-copy-id').value = res.doc.districtid;
        }
      });
  }, 5000);

  //@ts-check
  if (userRole != 'Teacher' || userRole != 'Student') {
    let uuid;
    fetch('/valid-user', {
      method: 'get',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.json())
      .then((res) => {
        let user = res.user;
        uuid = user._id;
        $.querySelector('.subscription-renewal-text').innerHTML = moment
          .unix(user.plan.renewal)
          .format('MMM DD YYYY');
        $.querySelector('.invoice-link').href = user.plan.invoicelink;
        user.notify == true
          ? (accountForm['notify'].checked = true)
          : (accountForm['notify'].checked = false);
      });

    //@Cancel Subscription
    $.querySelector('.tik-cancel-plan').addEventListener('click', () => {
      fetch('/cancel-subscription', {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      }).then((res) => {
        location.reload();
      });
    });
  }

  if ($.querySelector('#custom-search')) {
    const customSearch = document.querySelector('#custom-search');

    let districtCopyId = $.querySelector('#district-copy-id'),
      searchCriteria = $.querySelector('.search-criteria'),
      inSearch = $.querySelector('.in-search');

    // let schid = userRole == 'District admin' ?
    // $.querySelector('#distadmin-schools').value : $.querySelector('#school_id').textContent

    let schoolSearch = [],
      teacherSearch = [],
      studentSearch = [],
      classSearch = [],
      portal,
      searching = false,
      tabElement,
      searchType;

    fetch('/get-multiple-school', {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        districtid: districtCopyId.value,
      }),
    })
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        res.doc.forEach((sch) => {
          schoolSearch.push({
            name: sch.schoolname,
            id: sch._id,
          });
        });
        //@Filter based on school Id
        const useSchool = res.doc.filter((el) => el._id == schoolID);

        if (!useSchool[0]) return;
        // console.log(useSchool[0]);
        useSchool[0].teachers.forEach((el) => {
          teacherSearch.push({
            name: el.fullname,
            id: el._id,
          });
        });
        useSchool[0].students.forEach((el) => {
          studentSearch.push({
            name: el.fullname,
            id: el._id,
          });
        });
        useSchool[0].classes.forEach((el) => {
          classSearch.push({
            name: el.name,
            id: el._id,
          });
        });
      });

    customSearch.addEventListener('click', () => {
      if (searching == true) return;
      searchCriteria.classList.remove('hide');
    });

    searchCriteria
      .querySelector('h3 span')
      .addEventListener('click', () => searchCriteria.classList.add('hide'));
    inSearch.addEventListener('click', () => {
      searching = false;
      inSearch.classList.add('hide');
      portal = [];
    });

    searchCriteria.querySelectorAll('a').forEach((elem) => {
      elem.addEventListener('click', (e) => {
        e.preventDefault();
        inSearch.querySelector('a').innerHTML = `in ${elem.dataset.el}`;
        inSearch.classList.remove('hide');
        searchCriteria.classList.add('hide');
        searchType = elem.dataset.el;
        scrollToTab(elem.dataset.el);
      });
    });

    function scrollToTab(tab) {
      searching = true;
      if (tab == 'schools') {
        UIkit.modal('#modal-school').show();
        poplulateSchools();
        portal = schoolSearch;
        tabElement = document.querySelector('#school-tab__list');
      } else if (tab == 'teachers') {
        UIkit.modal('#modal-teacher').show();
        populateTeacher();
        portal = teacherSearch;
        tabElement = document.querySelector('#teacher-tab__list');
      } else if (tab == 'students') {
        UIkit.modal('#modal-student').show();
        populateStudent();
        portal = studentSearch;
        tabElement = document.querySelector('#student-tab__list');
      } else if (tab == 'classes') {
        UIkit.modal('#modal-class').show();
        renderClasses();
        portal = classSearch;
        tabElement = document.querySelector('#class-tab__list');
      }

      waitPortal();
    }

    const waitPortal = () => {
      const options = { includeScore: true, keys: ['name', 'tags'] };
      const fuse = new Fuse(portal, options);

      //@Search event lister
      customSearch.addEventListener('keyup', () => {
        if (searching == false) return;
        const result = fuse.search(customSearch.value);

        tabElement.querySelectorAll('li div ul li').forEach((el) => {
          el.classList.add('hide');
          if (customSearch.value == '') return el.classList.remove('hide');

          result.forEach((al) => {
            if (al.item.name === el.querySelector('span').textContent) {
              el.classList.remove('hide');
              if (searchType == 'classes') return;

              //@Show / Toggle Tab
              if (el.parentElement.dataset.pos == 0) {
                UIkit.switcher(tabElement).show(0);
                tabElement.previousElementSibling
                  .querySelectorAll('li')
                  .forEach((prelsib) => {
                    prelsib.classList.remove('uk-active');
                    if (prelsib.querySelector('a').textContent == 'Active')
                      return prelsib.classList.add('uk-active');
                  });
              } else {
                UIkit.switcher(tabElement).show(1);
                tabElement.previousElementSibling
                  .querySelectorAll('li')
                  .forEach((prelsib) => {
                    prelsib.classList.remove('uk-active');
                    if (prelsib.querySelector('a').textContent == 'Pending')
                      return prelsib.classList.add('uk-active');
                  });
              }
            }
          });
        });
      });
    };
  }
}
