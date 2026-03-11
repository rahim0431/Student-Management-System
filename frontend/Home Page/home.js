(function() {
const adminBtn = document.getElementById('adminBtn');
const teacherBtn = document.getElementById('teacherBtn');
const studentBtn = document.getElementById('studentBtn');
const studentOptions = document.getElementById('studentOptions');
const closeOptions = document.getElementById('closeStudentOptions');
const studentLogin = document.getElementById('studentLoginOption');
const studentRegister = document.getElementById('studentRegisterOption');

adminBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    window.location.href = '../Admin/admin-login.html';
});

teacherBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    window.location.href = 'teacherlogin.html';
});

studentBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    studentOptions.classList.toggle('show');
});

closeOptions.addEventListener('click', (e) => {
    e.stopPropagation();
    studentOptions.classList.remove('show');
});

studentLogin.addEventListener('click', (e) => {
    e.stopPropagation();
    window.location.href = 'login.html';
});

studentRegister.addEventListener('click', (e) => {
    e.stopPropagation();
    window.location.href = 'registration.html';
});

document.addEventListener('click', function(event) {
    const studentCard = document.getElementById('studentCard');
    if (!studentCard.contains(event.target) && studentOptions.classList.contains('show')) {
        studentOptions.classList.remove('show');
    }
});

studentOptions.addEventListener('click', (e) => e.stopPropagation());

// Card clicks for admin/teacher
document.getElementById('adminCard').addEventListener('click', (e) => {
    if (!e.target.closest('button')) {
        window.location.href = '../Admin/admin-login.html';
    }
});
document.getElementById('teacherCard').addEventListener('click', (e) => {
    if (!e.target.closest('button')) {
        window.location.href = 'teacherlogin.html';
    }
});
})();