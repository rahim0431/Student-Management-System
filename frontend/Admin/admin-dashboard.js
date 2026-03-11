const API_URL = 'http://127.0.0.1:8000/api';
    const token = localStorage.getItem("token");
    const SECTION_TITLES = {
        dashboard: "Dashboard",
        students: "Students",
        teachers: "Teachers"
    };
    let currentSection = "dashboard";
    let latestStudents = [];
    let latestTeachers = [];

    document.addEventListener("DOMContentLoaded", function(){
        const role = localStorage.getItem("role");

        if(!token || role !== "admin"){
            alert("Access denied. Please login as admin.");
            window.location.href = "admin-login.html";
            return;
        }

        // Initial Load
        updateHeaderSection(currentSection);
        setWelcomeMessage(role);
        refreshDashboard();

        // Logout Handler
        document.getElementById('logoutBtn').addEventListener('click', () => {
            localStorage.removeItem("token");
            window.location.href = 'admin-login.html';
        });

        // Form Handlers
        document.getElementById('addStudentForm').addEventListener('submit', (e) => handleAdd(e, 'student'));
        document.getElementById('addTeacherForm').addEventListener('submit', (e) => handleAdd(e, 'teacher'));
        document.getElementById('editStudentForm').addEventListener('submit', (e) => handleUpdate(e, 'student'));
        document.getElementById('editTeacherForm').addEventListener('submit', (e) => handleUpdate(e, 'teacher'));

        // Search Handlers
        const studentSearch = document.getElementById('studentSearch');
        if (studentSearch) {
            studentSearch.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const filtered = latestStudents.filter(s => 
                    (s.user.first_name + ' ' + s.user.last_name).toLowerCase().includes(term) ||
                    s.user.email.toLowerCase().includes(term) ||
                    (s.course && s.course.toLowerCase().includes(term))
                );
                renderStudentsTable(filtered);
            });
        }

        const teacherSearch = document.getElementById('teacherSearch');
        if (teacherSearch) {
            teacherSearch.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const filtered = latestTeachers.filter(t => 
                    (t.user.first_name + ' ' + t.user.last_name).toLowerCase().includes(term) ||
                    t.user.email.toLowerCase().includes(term) ||
                    (t.department && t.department.toLowerCase().includes(term))
                );
                renderTeachersTable(filtered);
            });
        }
    });

    // --- NAVIGATION ---
    function showSection(id, navEl) {
        currentSection = id;
        document.querySelectorAll('.section').forEach(el => el.classList.remove('active'));
        document.getElementById(id).classList.add('active');
        
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        if (navEl) navEl.classList.add('active');
        updateHeaderSection(id);
    }

    function updateHeaderSection(sectionId) {
        const headerSectionLink = document.getElementById('headerSectionLink');
        if (!headerSectionLink) return;
        headerSectionLink.textContent = SECTION_TITLES[sectionId] || "Dashboard";
    }

    function goToCurrentSection(event) {
        event.preventDefault();
        const navEl = document.querySelector(`.nav-item[data-section="${currentSection}"]`);
        showSection(currentSection, navEl);
    }

    function openModal(id) { 
        document.getElementById(id).style.display = 'flex'; 
        document.body.classList.add('modal-open');
    }
    function closeModal(id) { 
        document.getElementById(id).style.display = 'none'; 
        document.body.classList.remove('modal-open');
    }

    function refreshDashboard() {
        fetchStats();
        fetchStudents();
        fetchTeachers();
    }

    function setWelcomeMessage(role) {
        const welcomeGreeting = document.getElementById('welcomeGreeting');
        const welcomeRole = document.getElementById('welcomeRole');
        const welcomeSubtitle = document.getElementById('welcomeSubtitle');
        if (!welcomeGreeting || !welcomeRole || !welcomeSubtitle) return;

        const hour = new Date().getHours();
        let greeting = "Welcome back";
        if (hour < 12) greeting = "Good morning";
        else if (hour < 17) greeting = "Good afternoon";
        else greeting = "Good evening";

        const roleLabel = role ? role.charAt(0).toUpperCase() + role.slice(1) : "Admin";
        welcomeGreeting.textContent = greeting;
        welcomeRole.textContent = roleLabel;
        welcomeSubtitle.textContent = "Here is your campus overview for today.";
    }

    function handleAuthError() {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        alert("Session expired. Please login again.");
        window.location.href = "admin-login.html";
    }

    // --- API CALLS ---

    async function fetchStats() {
        try {
            const res = await fetch(`${API_URL}/admin/dashboard`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
            });
            if (res.status === 401) {
                handleAuthError();
                return;
            }
            const data = await res.json();
            if(data.stats) {
                document.getElementById('total-students').textContent = data.stats.total_students;
                document.getElementById('total-teachers').textContent = data.stats.total_teachers;
            }
        } catch(e) { console.error(e); }
    }

    async function fetchStudents() {
        const res = await fetch(`${API_URL}/admin/students`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        if (res.status === 401) {
            handleAuthError();
            return;
        }
        const data = await res.json();
        latestStudents = Array.isArray(data) ? data : [];
        renderMiniUsers();
        renderGrowthChart();
        renderStudentsTable(latestStudents);
    }

    function renderStudentsTable(students) {
        const tbody = document.getElementById('studentsTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';
        
        students.forEach(student => {
            // Note: student.user contains the name/email from Users table
            const row = `<tr>
                <td>${student.user.first_name} ${student.user.last_name}</td>
                <td>${student.user.email}</td>
                <td>${student.phone}</td>
                <td>${student.course || '-'}</td>
                <td>${student.year}</td>
                <td class="actions-cell">
                    <button class="btn-action btn-edit" onclick="openEditModal('Student', ${student.id})">Edit</button>
                    <button class="btn-action btn-view" onclick="openViewModal('Student', ${student.id})">View</button>
                    <button class="btn-action btn-delete" onclick="deleteItem('student', ${student.id})">Delete</button>
                </td>
            </tr>`;
            tbody.innerHTML += row;
        });
    }

    async function fetchTeachers() {
        const res = await fetch(`${API_URL}/admin/teachers`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        if (res.status === 401) {
            handleAuthError();
            return;
        }
        const data = await res.json();
        latestTeachers = Array.isArray(data) ? data : [];
        renderMiniUsers();
        renderGrowthChart();
        renderTeachersTable(latestTeachers);
    }

    function renderTeachersTable(teachers) {
        const tbody = document.getElementById('teachersTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';
        
        teachers.forEach(teacher => {
            const row = `<tr>
                <td>${teacher.user.first_name} ${teacher.user.last_name}</td>
                <td>${teacher.user.email}</td>
                <td>${teacher.user.phone || '-'}</td>
                <td>${teacher.department}</td>
                <td>${teacher.experience}</td>
                <td class="actions-cell">
                    <button class="btn-action btn-edit" onclick="openEditModal('Teacher', ${teacher.id})">Edit</button>
                    <button class="btn-action btn-view" onclick="openViewModal('Teacher', ${teacher.id})">View</button>
                    <button class="btn-action btn-delete" onclick="deleteItem('teacher', ${teacher.id})">Delete</button>
                </td>
            </tr>`;
            tbody.innerHTML += row;
        });
    }

    function renderMiniUsers() {
        const tbody = document.getElementById('miniUsersTableBody');
        if (!tbody) return;

        const combined = [
            ...latestTeachers.map(teacher => ({
                id: teacher.id,
                name: `${teacher.user.first_name} ${teacher.user.last_name}`,
                email: teacher.user.email,
                role: 'Teacher'
            })),
            ...latestStudents.map(student => ({
                id: student.id,
                name: `${student.user.first_name} ${student.user.last_name}`,
                email: student.user.email,
                role: 'Student'
            }))
        ];

        const rows = combined;
        if (rows.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4">No users found.</td></tr>`;
            return;
        }

        tbody.innerHTML = rows.map(user => `
            <tr>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td><button type="button" class="mini-edit-btn" onclick="openEditModal('${user.role}', ${user.id})"><i class="fi fi-ss-pencil"></i> Edit</button></td>
            </tr>
        `).join('');
    }

    function renderGrowthChart() {
        // 1. Prepare buckets for the current calendar year
        const months = [];
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const today = new Date();
        const currentYear = today.getFullYear();

        // Update pill text
        const growthPill = document.getElementById('growthPill');
        if(growthPill) growthPill.textContent = `Year ${currentYear}`;
        
        for (let i = 0; i < 12; i++) {
            months.push({
                label: monthNames[i],
                month: i,
                year: currentYear,
                students: 0,
                teachers: 0
            });
        }

        // 2. Fill buckets
        const countUser = (user, type) => {
            // Try to get created_at from root object or nested user object
            const dateStr = user.created_at || (user.user ? user.user.created_at : null);
            if (!dateStr) return;
            
            const d = new Date(dateStr);
            // Only count users from the current year for this chart
            if (d.getFullYear() === currentYear) {
                const bucket = months.find(m => m.month === d.getMonth());
                if (bucket) {
                    if (type === 'student') bucket.students++;
                    else bucket.teachers++;
                }
            }
        };

        latestStudents.forEach(u => countUser(u, 'student'));
        latestTeachers.forEach(u => countUser(u, 'teacher'));

        // 3. Determine Y-Axis Scale
        let maxVal = 0;
        months.forEach(m => {
            if (m.students > maxVal) maxVal = m.students;
            if (m.teachers > maxVal) maxVal = m.teachers;
        });
        
        // Round up to nearest 5, with a minimum of 10
        let yMax = Math.ceil(maxVal / 5) * 5;
        if (yMax < 10) yMax = 10;

        // 4. Update Y-Axis Labels
        const yLabels = document.getElementById('yAxisLabels');
        if (yLabels) {
            // The last label is '0', so we skip it.
            const texts = Array.from(yLabels.querySelectorAll('text')).slice(0, -1);
            texts.forEach((text, index) => {
                const ratio = 1 - (index / texts.length);
                text.textContent = Math.round(yMax * ratio);
            });
        }

        // 5. Update X-Axis Labels & Generate Paths
        const xLabels = document.getElementById('xAxisLabels');
        if (xLabels) xLabels.innerHTML = '';

        const generatePath = (dataKey) => {
            let d = "";
            const numPoints = months.length;
            const chartWidth = 290; // from 40 to 330
            const startX = 40;
            const stepX = chartWidth / (numPoints - 1);

            months.forEach((m, index) => {
                const val = m[dataKey];
                const x = startX + (index * stepX);
                // Y range: 180 (0) to 30 (yMax). Height 150.
                const y = 180 - ((val / yMax) * 150);
                
                d += (index === 0 ? "M" : "L") + `${x},${y} `;

                // Add X Label for every other month to avoid overlap
                if (dataKey === 'students' && xLabels && index % 2 === 0) {
                    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
                    text.setAttribute("x", x);
                    text.setAttribute("y", 205);
                    text.setAttribute("text-anchor", "middle");
                    text.textContent = m.label;
                    xLabels.appendChild(text);
                }

                // Add Point
                const pointGroup = document.getElementById(`${dataKey}Points`);
                if (pointGroup) {
                    if (index === 0) pointGroup.innerHTML = ''; // Clear on first iteration
                    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                    circle.setAttribute("cx", x);
                    circle.setAttribute("cy", y);
                    circle.setAttribute("r", 4);
                    const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
                    title.textContent = `${m.label}: ${val}`;
                    circle.appendChild(title);
                    pointGroup.appendChild(circle);
                }
            });
            return d;
        };

        const sPath = generatePath('students');
        const tPath = generatePath('teachers');

        // Update Lines and Areas
        const sLine = document.getElementById('studentsLine');
        const tLine = document.getElementById('teachersLine');
        const sArea = document.getElementById('studentsArea');
        const tArea = document.getElementById('teachersArea');

        if(sLine) sLine.setAttribute('d', sPath);
        if(tLine) tLine.setAttribute('d', tPath);
        if(sArea) sArea.setAttribute('d', sPath + " L 330,180 L 40,180 Z");
        if(tArea) tArea.setAttribute('d', tPath + " L 330,180 L 40,180 Z");
    }

    async function handleAdd(e, type) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const payload = Object.fromEntries(formData.entries());
        
        try {
            const res = await fetch(`${API_URL}/admin/add-${type}`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            if(res.ok) {
                alert(`${type} added successfully`);
                closeModal(`${type}Modal`);
                e.target.reset();
                if(type === 'student') fetchStudents();
                else fetchTeachers();
                fetchStats();
            } else {
                if (res.status === 401) {
                    handleAuthError();
                    return;
                }
                const err = await res.json();
                alert('Error: ' + (err.message || 'Failed'));
            }
        } catch(err) { alert('Network error'); }
    }

    
    async function deleteItem(type, id) {
        if(!confirm('Are you sure? This cannot be undone.')) return;
        
        try {
            const res = await fetch(`${API_URL}/admin/${type}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
            });
            
            if(res.ok) {
                if(type === 'student') fetchStudents();
                else fetchTeachers();
                fetchStats();
            } else {
                if (res.status === 401) {
                    handleAuthError();
                    return;
                }
                alert('Failed to delete');
            }
        } catch(e) { alert('Error deleting'); }
    }

    function openViewModal(role, id) {
        const type = role.toLowerCase();
        const collection = type === 'student' ? latestStudents : latestTeachers;
        const item = collection.find(i => i.id === id);

        if (!item) {
            alert('User not found!');
            return;
        }

        const modalId = `view${role}Modal`;
        const modal = document.getElementById(modalId);

        // Populate modal
        modal.querySelector('[name="first_name"]').value = item.user.first_name;
        modal.querySelector('[name="last_name"]').value = item.user.last_name;
        modal.querySelector('[name="email"]').value = item.user.email;
        modal.querySelector('[name="phone"]').value = item.user.phone || '';
        
        if (type === 'student') {
            modal.querySelector('[name="course"]').value = item.course;
            modal.querySelector('[name="year"]').value = item.year;
        } else { // teacher
            modal.querySelector('[name="department"]').value = item.department;
            modal.querySelector('[name="experience"]').value = item.experience;
        }

        openModal(modalId);
    }

    function openEditModal(role, id) {
        const type = role.toLowerCase();
        const collection = type === 'student' ? latestStudents : latestTeachers;
        const item = collection.find(i => i.id === id);

        if (!item) {
            alert('User not found!');
            return;
        }

        const modalId = `edit${role}Modal`;
        const form = document.getElementById(`edit${role}Form`);

        // Populate form
        form.querySelector('[name="id"]').value = item.id;
        form.querySelector('[name="first_name"]').value = item.user.first_name;
        form.querySelector('[name="last_name"]').value = item.user.last_name;
        form.querySelector('[name="email"]').value = item.user.email;
        form.querySelector('[name="phone"]').value = item.user.phone || '';
        
        if (type === 'student') {
            form.querySelector('[name="course"]').value = item.course;
            form.querySelector('[name="year"]').value = item.year;
        } else { // teacher
            form.querySelector('[name="department"]').value = item.department;
            form.querySelector('[name="experience"]').value = item.experience;
        }

        // Clear password field for security
        form.querySelector('[name="password"]').value = '';

        openModal(modalId);
    }

    async function handleUpdate(e, type) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const payload = Object.fromEntries(formData.entries());
        const id = payload.id;
        
        if (!payload.password) delete payload.password;

        try {
            const res = await fetch(`${API_URL}/admin/${type}/${id}`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            if(res.ok) {
                alert('Updated successfully');
                const modalType = type.charAt(0).toUpperCase() + type.slice(1);
                closeModal(`edit${modalType}Modal`);
                e.target.reset();
                
                if(type === 'student') fetchStudents();
                else fetchTeachers();
                fetchStats();
            } else {
                if (res.status === 401) {
                    handleAuthError();
                    return;
                }
                const err = await res.json();
                alert('Error: ' + (err.message || 'Update failed'));
            }
        } catch(e) { alert('Network error'); }
    }
