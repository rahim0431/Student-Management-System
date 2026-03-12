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

// to handle request form
const requestForm = document.getElementById("request_form");
if (requestForm) {
    requestForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);

        // Clear previous messages
        const prevMsg = e.target.querySelector(".status-msg");
        if (prevMsg) prevMsg.remove();

        // Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^\d{10}$/;

        // Check if any field is empty
        if (Object.values(data).some(val => typeof val === 'string' && !val.trim())) {
            e.target.insertAdjacentHTML("afterbegin", '<div class="status-msg" style="text-align: center; color: red; padding: 20px;"><h3>All fields are required.</h3></div>');
            return;
        }
        // Check Email
        if (data.email && !emailRegex.test(data.email)) {
            e.target.insertAdjacentHTML("afterbegin", '<div class="status-msg" style="text-align: center; color: red; padding: 20px;"><h3>Email must be valid.</h3></div>');
            return;
        }
        // Check Phone
        if (data.phone && !phoneRegex.test(data.phone)) {
            e.target.insertAdjacentHTML("afterbegin", '<div class="status-msg" style="text-align: center; color: red; padding: 20px;"><h3>Phone must be 10 digits.</h3></div>');
            return;
        }

        const response = await fetch("http://127.0.0.1:8000/api/request-demo", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            e.target.reset();
            e.target.insertAdjacentHTML("afterbegin", '<div class="status-msg" style="text-align: center; color: #2c666e; padding: 20px;"><h3>Thank you! Your demo request has been submitted.</h3></div>');
        }
    });
}
})();
