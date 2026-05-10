// ============================================================
// FILE: frontend/auth.js
// PURPOSE: Shared auth utilities used by every page
// HOW: Every HTML page loads this after app.js
//      It checks localStorage for a logged-in user and
//      redirects to login if not found or wrong role
// ============================================================

// Save user to localStorage after login
function saveUser(user) {
    localStorage.setItem('hms_user', JSON.stringify(user));
}

// Get current logged-in user
function getUser() {
    const u = localStorage.getItem('hms_user');
    return u ? JSON.parse(u) : null;
}

// Log out — clear localStorage and go to login
function logout() {
    localStorage.removeItem('hms_user');
    window.location.href = 'login.html';
}

// Require login — call at top of every page
// Pass allowed roles as array e.g. requireAuth(['ADMIN','COMPANY'])
// Pass empty array [] to allow any logged-in user
function requireAuth(allowedRoles = []) {
    const user = getUser();
    if (!user) {
        window.location.href = 'login.html';
        return null;
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        // Wrong role — send to their own dashboard
        window.location.href = dashboardFor(user.role);
        return null;
    }
    return user;
}

// Get the correct dashboard URL for a role
function dashboardFor(role) {
    const map = {
        ADMIN:       'index.html',
        COMPANY:     'dashboard-company.html',
        INTERVIEWER: 'dashboard-interviewer.html',
        CANDIDATE:   'dashboard-candidate.html'
    };
    return map[role] || 'login.html';
}

// Build sidebar based on role
// Call this in every page's DOMContentLoaded
function buildSidebar(activePage) {
    const user = getUser();
    if (!user) return;

    // Pages each role can see
    const navMap = {
        ADMIN: [
            { href: 'index.html',         label: 'Dashboard' },
            { href: 'candidates.html',     label: 'Candidates' },
            { href: 'resumes.html',        label: 'Resumes' },
            { href: 'jobs.html',           label: 'Job Postings' },
            { href: 'applications.html',   label: 'Applications' },
            { href: 'interviews.html',     label: 'Interviews' },
            { href: 'interviewers.html',   label: 'Interviewers' },
            { href: 'offers.html',         label: 'Offers' },
            { href: 'decisions.html',      label: 'Hiring Decisions' },
            { href: 'companies.html',      label: 'Companies' },
            { href: 'users.html',          label: 'Users' },
        ],
        COMPANY: [
            { href: 'dashboard-company.html',  label: 'Dashboard' },
            { href: 'my-jobs.html',            label: 'My Job Postings' },
            { href: 'my-applications.html',    label: 'Applications Received' },
            { href: 'my-interviewers.html',    label: 'My Interviewers' },
            { href: 'my-interviews.html',      label: 'Interviews' },
            { href: 'my-offers.html',          label: 'Offers Made' },
            { href: 'my-decisions.html',       label: 'Hiring Decisions' },
        ],
        INTERVIEWER: [
            { href: 'dashboard-interviewer.html', label: 'Dashboard' },
            { href: 'my-interviews.html',         label: 'My Interviews' },
            { href: 'my-applications.html',       label: 'Applications' },
        ],
        CANDIDATE: [
            { href: 'dashboard-candidate.html', label: 'Dashboard' },
            { href: 'my-profile.html',          label: 'My Profile' },
            { href: 'my-resumes.html',          label: 'My Resumes' },
            { href: 'browse-jobs.html',         label: 'Browse Jobs' },
            { href: 'my-applications.html',     label: 'My Applications' },
            { href: 'my-offers.html',           label: 'My Offers' },
        ]
    };

    const pages = navMap[user.role] || [];
    const navEl = document.querySelector('.sidebar-nav');
    if (!navEl) return;

    navEl.innerHTML = `<span class="nav-label">Navigation</span>` +
        pages.map(p => `<a href="${p.href}" class="nav-item${p.href === activePage ? ' active' : ''}">${p.label}</a>`).join('');

    // Add logout button at bottom of sidebar
    const footer = document.querySelector('.sidebar-footer');
    if (footer) {
        footer.innerHTML = `
            <div style="margin-bottom:10px;font-size:12px;color:rgba(255,255,255,0.5)">${user.name}</div>
            <div style="font-size:11px;color:rgba(255,255,255,0.3);margin-bottom:12px">${user.role}</div>
            <button onclick="logout()" class="btn btn-ghost" style="width:100%;font-size:12px;padding:7px">Logout</button>
        `;
    }
}