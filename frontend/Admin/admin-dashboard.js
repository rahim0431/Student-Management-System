const API_URL = 'http://127.0.0.1:8000/api';
    const token = localStorage.getItem("token");
    const SECTION_TITLES = {
        dashboard: "Dashboard",
        students: "Students",
        teachers: "Teachers",
        "demo-requests": "Demo Requests"
    };
    let currentSection = "dashboard";
    let latestStudents = [];
    let latestTeachers = [];
    let currentStudentPage = 1;
    let currentTeacherPage = 1;
    let demoRequests = [];
    const ITEMS_PER_PAGE = 6;

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

        // Refresh Button Handler
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', refreshDashboard);
        }

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
                currentStudentPage = 1;
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
                currentTeacherPage = 1;
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

        if (id === 'demo-requests' && demoRequests.length === 0) {
            fetchDemoRequests();
        }
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

    async function refreshDashboard() {
        const refreshBtn = document.getElementById('refreshBtn');
        console.log("Refresh started"); // Check console to see if this appears
        let originalText = '';

        if (refreshBtn) {
            originalText = refreshBtn.innerHTML;
            refreshBtn.innerHTML = 'Loading...';
            refreshBtn.disabled = true;
        }

        document.body.style.cursor = 'wait';

        // Show loading indicators in the dashboard widgets
        const totalStudents = document.getElementById('total-students');
        const totalTeachers = document.getElementById('total-teachers');
        const miniUsersTable = document.getElementById('miniUsersTableBody');
        const growthPill = document.getElementById('growthPill');

        if (totalStudents) totalStudents.textContent = '...';
        if (totalTeachers) totalTeachers.textContent = '...';
        if (miniUsersTable) miniUsersTable.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:15px;">Loading data...</td></tr>';
        if (growthPill) growthPill.textContent = 'Updating...';

        // Enforce a minimum delay of 500ms so the user sees the loading state
        const minDelay = new Promise(resolve => setTimeout(resolve, 500));

        await Promise.all([
            fetchStats(),
            fetchStudents(),
            fetchTeachers(),
            fetchDemoRequests(),
            minDelay
        ]);

        document.body.style.cursor = 'default';

        if (refreshBtn) {
            refreshBtn.innerHTML = originalText;
            refreshBtn.disabled = false;
        }
        console.log("Refresh done");
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
        currentStudentPage = 1;
        renderMiniUsers();
        renderGrowthChart();
        renderStudentsTable(latestStudents);
    }

    function renderStudentsTable(students) {
        const tbody = document.getElementById('studentsTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        // Pagination Logic
        const totalItems = students.length;
        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
        if (currentStudentPage < 1) currentStudentPage = 1;
        if (currentStudentPage > totalPages) currentStudentPage = totalPages;
        
        const start = (currentStudentPage - 1) * ITEMS_PER_PAGE;
        const paginatedStudents = students.slice(start, start + ITEMS_PER_PAGE);
        
        paginatedStudents.forEach(student => {
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

        renderPaginationControls('student', totalItems, totalPages, currentStudentPage);
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
        currentTeacherPage = 1;
        renderMiniUsers();
        renderGrowthChart();
        renderTeachersTable(latestTeachers);
    }

    async function fetchDemoRequests() {
        const tbody = document.getElementById('demoRequestsTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:15px;">Loading demo requests...</td></tr>';
        }

        const res = await fetch(`${API_URL}/admin/demo-requests`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        if (res.status === 401) {
            handleAuthError();
            return;
        }
        const data = await res.json();
        demoRequests = Array.isArray(data) ? data : [];
        renderDemoRequestsTable(demoRequests);
    }

    function renderDemoRequestsTable(requests) {
        const tbody = document.getElementById('demoRequestsTableBody');
        if (!tbody) return;
        if (requests.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:15px;">No demo requests found.</td></tr>';
            return;
        }

        const escapeHtml = (value) => {
            return String(value ?? '-')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\"/g, '&quot;')
                .replace(/'/g, '&#39;');
        };

        const formatDate = (value) => {
            if (!value) return '-';
            const d = new Date(value);
            if (Number.isNaN(d.getTime())) return value;
            return d.toLocaleString();
        };

        tbody.innerHTML = requests.map((req) => `
            <tr class="demo-row" data-id="${req.id}">
                <td><span class="cell-truncate" title="${escapeHtml(req.full_name)}">${escapeHtml(req.full_name)}</span></td>
                <td class="email-cell"><span class="cell-truncate" title="${escapeHtml(req.email)}">${escapeHtml(req.email)}</span></td>
                <td><span class="cell-truncate" title="${escapeHtml(req.phone)}">${escapeHtml(req.phone)}</span></td>
                <td><span class="cell-truncate" title="${escapeHtml(req.institution_name)}">${escapeHtml(req.institution_name)}</span></td>
                <td><span class="demo-chip">${escapeHtml(req.institution_type)}</span></td>
                <td><span class="cell-truncate" title="${escapeHtml(req.campus_size)}">${escapeHtml(req.campus_size)}</span></td>
                <td><span class="demo-chip goal">${escapeHtml(req.primary_goal)}</span></td>
                <td class="message-cell"><span class="cell-wrap" title="${escapeHtml(req.message)}">${escapeHtml(req.message)}</span></td>
                <td><span class="cell-truncate" title="${escapeHtml(formatDate(req.created_at))}">${escapeHtml(formatDate(req.created_at))}</span></td>
            </tr>
            <tr class="demo-details-row" data-id="${req.id}">
                <td colspan="9" class="demo-details-cell">
                    <div class="demo-details">
                        <div class="detail-item">
                            <span class="detail-label">Name</span>
                            <span class="detail-value">${escapeHtml(req.full_name)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Email</span>
                            <span class="detail-value">${escapeHtml(req.email)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Phone</span>
                            <span class="detail-value">${escapeHtml(req.phone)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Institution</span>
                            <span class="detail-value">${escapeHtml(req.institution_name)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Type</span>
                            <span class="detail-value">${escapeHtml(req.institution_type)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Campus Size</span>
                            <span class="detail-value">${escapeHtml(req.campus_size)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Primary Goal</span>
                            <span class="detail-value">${escapeHtml(req.primary_goal)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Submitted</span>
                            <span class="detail-value">${escapeHtml(formatDate(req.created_at))}</span>
                        </div>
                        <div class="detail-item detail-message">
                            <span class="detail-label">Message</span>
                            <span class="detail-value">${escapeHtml(req.message)}</span>
                        </div>
                        <div class="detail-actions">
                            <button type="button" class="demo-delete-btn" data-delete-id="${req.id}">Delete Request</button>
                        </div>
                    </div>
                </td>
            </tr>
        `).join('');

        if (!tbody.dataset.demoToggleBound) {
            tbody.dataset.demoToggleBound = "true";
            tbody.addEventListener('click', (event) => {
                const deleteBtn = event.target.closest('.demo-delete-btn');
                if (deleteBtn) {
                    const deleteId = deleteBtn.dataset.deleteId;
                    deleteDemoRequest(deleteId);
                    return;
                }

                const row = event.target.closest('.demo-row');
                if (!row) return;
                const id = row.dataset.id;
                const detailsRow = tbody.querySelector(`.demo-details-row[data-id="${id}"]`);
                if (!detailsRow) return;
                const isOpen = detailsRow.classList.toggle('is-open');
                row.classList.toggle('is-open', isOpen);
            });
        }
    }

    async function deleteDemoRequest(id) {
        if (!id) return;
        if (!confirm("Delete this demo request?")) return;

        const res = await fetch(`${API_URL}/admin/demo-requests/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        if (res.status === 401) {
            handleAuthError();
            return;
        }
        if (!res.ok) {
            alert("Failed to delete the demo request.");
            return;
        }

        demoRequests = demoRequests.filter(req => String(req.id) !== String(id));
        renderDemoRequestsTable(demoRequests);
    }

    function renderTeachersTable(teachers) {
        const tbody = document.getElementById('teachersTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';
        
        // Pagination Logic
        const totalItems = teachers.length;
        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
        if (currentTeacherPage < 1) currentTeacherPage = 1;
        if (currentTeacherPage > totalPages) currentTeacherPage = totalPages;

        const start = (currentTeacherPage - 1) * ITEMS_PER_PAGE;
        const paginatedTeachers = teachers.slice(start, start + ITEMS_PER_PAGE);
        
        paginatedTeachers.forEach(teacher => {
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

        renderPaginationControls('teacher', totalItems, totalPages, currentTeacherPage);
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

    // --- PAGINATION HELPERS ---

    function renderPaginationControls(type, totalItems, totalPages, currentPage) {
        const tableBody = document.getElementById(`${type}sTableBody`);
        if (!tableBody) return;
        
        // Find or create pagination container
        const table = tableBody.closest('table');
        let container = document.getElementById(`${type}-pagination`);
        
        if (!container && table) {
            container = document.createElement('div');
            container.id = `${type}-pagination`;
            container.className = 'pagination-container';
            table.parentNode.insertBefore(container, table.nextSibling);
        }

        if (!container) return;

        if (totalItems === 0) {
            container.innerHTML = '';
            return;
        }

        const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
        const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

        let buttonsHtml = '';
        
        // Previous Button
        buttonsHtml += `<button class="btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage('${type}', ${currentPage - 1})">Prev</button>`;

        // Page Numbers (Simple version: show all or simple range)
        for (let i = 1; i <= totalPages; i++) {
            // Show first, last, current, and adjacent pages
            if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                buttonsHtml += `<button class="btn ${i === currentPage ? 'btn-primary-pag' : ''}" onclick="changePage('${type}', ${i})">${i}</button>`;
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                buttonsHtml += `<span style="padding: 0 5px;">...</span>`;
            }
        }

        // Next Button
        buttonsHtml += `<button class="btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage('${type}', ${currentPage + 1})">Next</button>`;

        container.innerHTML = `
            <div class="pagination-info">Showing ${startItem} to ${endItem} of ${totalItems} entries</div>
            <div class="pagination-buttons">${buttonsHtml}</div>
        `;
    }

    window.changePage = function(type, page) {
        if (type === 'student') {
            currentStudentPage = page;
            // Filter logic is inside existing listeners, but for pagination we assume current list is "latestStudents"
            // Note: If a search is active, we should technically paginate the filtered results. 
            // For simplicity in this implementation, we re-render the full list or we need to check search input.
            const searchVal = document.getElementById('studentSearch').value.toLowerCase();
            const students = searchVal ? latestStudents.filter(s => 
                (s.user.first_name + ' ' + s.user.last_name).toLowerCase().includes(searchVal) ||
                s.user.email.toLowerCase().includes(searchVal) ||
                (s.course && s.course.toLowerCase().includes(searchVal))
            ) : latestStudents;
            
            renderStudentsTable(students);
        } else if (type === 'teacher') {
            currentTeacherPage = page;
            const searchVal = document.getElementById('teacherSearch').value.toLowerCase();
            const teachers = searchVal ? latestTeachers.filter(t => 
                (t.user.first_name + ' ' + t.user.last_name).toLowerCase().includes(searchVal) ||
                t.user.email.toLowerCase().includes(searchVal) ||
                (t.department && t.department.toLowerCase().includes(searchVal))
            ) : latestTeachers;
            
            renderTeachersTable(teachers);
        }
    };

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
