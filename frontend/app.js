// ============================================================
// FILE: frontend/app.js
// PURPOSE: Shared utilities used across all pages
// HOW IT WORKS: Every HTML page loads this file first,
//   so these functions are available everywhere
// ============================================================

// ── API Base URL ─────────────────────────────────────────
// During development this points to your local Node.js server
// When deployed, change this to your Railway URL
const API = 'https://hiring-management-system-production.up.railway.app';

// ── Fetch Helper ─────────────────────────────────────────
// Wraps fetch() so every page doesn't repeat error handling
// Usage: const data = await get('/api/candidates');
async function get(path) {
    try {
        const res = await fetch(API + path);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error('GET error:', err);
        return null;
    }
}

async function post(path, body) {
    try {
        const res = await fetch(API + path, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        return await res.json();
    } catch (err) {
        console.error('POST error:', err);
        return null;
    }
}

async function put(path, body) {
    try {
        const res = await fetch(API + path, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        return await res.json();
    } catch (err) {
        console.error('PUT error:', err);
        return null;
    }
}

async function del(path) {
    try {
        const res = await fetch(API + path, { method: 'DELETE' });
        return await res.json();
    } catch (err) {
        console.error('DELETE error:', err);
        return null;
    }
}

// ── Toast Notification ────────────────────────────────────
// Shows a small notification at the bottom right of screen
// Usage: showToast('Candidate added!', 'success');
//        showToast('Something went wrong', 'error');
function showToast(message, type = 'success') {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── Badge HTML Helper ─────────────────────────────────────
// Converts a status string to a colored badge
// Usage: badge('Open') → <span class="badge badge-open">Open</span>
function badge(text) {
    if (!text) return '-';
    const cls = text.toLowerCase().replace(/\s+/g, '-');
    return `<span class="badge badge-${cls}">${text}</span>`;
}

// ── Modal Helpers ─────────────────────────────────────────
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ── Mark Active Nav Item ──────────────────────────────────
// Highlights the current page in the sidebar
document.addEventListener('DOMContentLoaded', () => {
    const page = window.location.pathname.split('/').pop();
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.getAttribute('href') === page) {
            item.classList.add('active');
        }
    });
});