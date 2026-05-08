// ============================================================
// FILE: backend/server.js
// PURPOSE: Main Express server — all API endpoints live here
// HOW IT WORKS:
//   - Express listens on a port (3000 locally, Railway assigns one in cloud)
//   - Each route (e.g. GET /api/candidates) queries Oracle and returns JSON
//   - Frontend fetches these URLs to get/send data
// ============================================================

const express = require('express');
const cors    = require('cors');
const db      = require('./db');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────
// express.json()  → lets Express read JSON from request body (POST/PUT)
// cors()          → allows frontend on a different port/domain to call this API
app.use(express.json());
app.use(cors());

// ── Health Check ─────────────────────────────────────────
// Simple route to confirm server is running
// Visit http://localhost:3000/ in browser to test
app.get('/', (req, res) => {
    res.json({ message: '✅ Hiring Management System API is running.' });
});


// ============================================================
// CANDIDATES
// ============================================================

// GET all candidates
// URL: GET /api/candidates
app.get('/api/candidates', async (req, res) => {
    let conn;
    try {
        conn = await db.getConnection();
        const result = await conn.execute(
            `SELECT candidate_id, first_name, last_name, email, phone, location, skills
             FROM CANDIDATE
             ORDER BY candidate_id`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) await conn.close();
    }
});

// GET single candidate by ID
// URL: GET /api/candidates/1
app.get('/api/candidates/:id', async (req, res) => {
    let conn;
    try {
        conn = await db.getConnection();
        const result = await conn.execute(
            `SELECT * FROM CANDIDATE WHERE candidate_id = :id`,
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Candidate not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) await conn.close();
    }
});

// POST add new candidate (calls stored procedure)
// URL: POST /api/candidates
// BODY: { id, first_name, last_name, email, phone, location, skills }
app.post('/api/candidates', async (req, res) => {
    let conn;
    const { id, first_name, last_name, email, phone, location, skills } = req.body;
    try {
        conn = await db.getConnection();
        await conn.execute(
            `BEGIN SP_ADD_CANDIDATE(:id, :first, :last, :email, :phone, :loc, :skills); END;`,
            {
                id:     id,
                first:  first_name,
                last:   last_name,
                email:  email,
                phone:  phone,
                loc:    location,
                skills: skills
            }
        );
        await conn.commit();
        res.status(201).json({ message: 'Candidate added successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) await conn.close();
    }
});

// DELETE candidate (calls stored procedure)
// URL: DELETE /api/candidates/1
app.delete('/api/candidates/:id', async (req, res) => {
    let conn;
    try {
        conn = await db.getConnection();
        await conn.execute(
            `BEGIN SP_DELETE_CANDIDATE(:id); END;`,
            { id: req.params.id }
        );
        await conn.commit();
        res.json({ message: 'Candidate deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) await conn.close();
    }
});


// ============================================================
// COMPANIES
// ============================================================

// GET all companies
app.get('/api/companies', async (req, res) => {
    let conn;
    try {
        conn = await db.getConnection();
        const result = await conn.execute(
            `SELECT * FROM COMPANY ORDER BY company_id`
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) await conn.close();
    }
});


// ============================================================
// JOB POSTINGS
// ============================================================

// GET all open jobs (uses view VW_OPEN_JOBS)
app.get('/api/jobs', async (req, res) => {
    let conn;
    try {
        conn = await db.getConnection();
        const result = await conn.execute(
            `SELECT * FROM VW_OPEN_JOBS ORDER BY posted_date DESC`
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) await conn.close();
    }
});

// GET all jobs including closed ones
app.get('/api/jobs/all', async (req, res) => {
    let conn;
    try {
        conn = await db.getConnection();
        const result = await conn.execute(
            `SELECT J.*, C.name AS company_name
             FROM JOB_POSTING J
             JOIN COMPANY C ON J.company_id = C.company_id
             ORDER BY J.posted_date DESC`
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) await conn.close();
    }
});


// ============================================================
// APPLICATIONS
// ============================================================

// GET full application pipeline (uses view VW_APPLICATION_PIPELINE)
app.get('/api/applications', async (req, res) => {
    let conn;
    try {
        conn = await db.getConnection();
        const result = await conn.execute(
            `SELECT * FROM VW_APPLICATION_PIPELINE ORDER BY applied_date DESC`
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) await conn.close();
    }
});

// POST submit new application (calls stored procedure)
// URL: POST /api/applications
// BODY: { app_id, candidate_id, job_id, resume_id, cover_letter }
app.post('/api/applications', async (req, res) => {
    let conn;
    const { app_id, candidate_id, job_id, resume_id, cover_letter } = req.body;
    try {
        conn = await db.getConnection();
        await conn.execute(
            `BEGIN SP_SUBMIT_APPLICATION(:app_id, :cand_id, :job_id, :resume_id, :cover); END;`,
            {
                app_id:     app_id,
                cand_id:    candidate_id,
                job_id:     job_id,
                resume_id:  resume_id,
                cover:      cover_letter
            }
        );
        await conn.commit();
        res.status(201).json({ message: 'Application submitted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) await conn.close();
    }
});

// PUT update application status (calls stored procedure)
// URL: PUT /api/applications/1/status
// BODY: { status: 'Interview' }
app.put('/api/applications/:id/status', async (req, res) => {
    let conn;
    const { status } = req.body;
    try {
        conn = await db.getConnection();
        await conn.execute(
            `BEGIN SP_UPDATE_APP_STATUS(:id, :status); END;`,
            { id: req.params.id, status: status }
        );
        await conn.commit();
        res.json({ message: 'Status updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) await conn.close();
    }
});


// ============================================================
// INTERVIEWS
// ============================================================

// GET all interviews with full details
app.get('/api/interviews', async (req, res) => {
    let conn;
    try {
        conn = await db.getConnection();
        const result = await conn.execute(
            `SELECT
                I.interview_id,
                I.interview_type,
                C.first_name || ' ' || C.last_name  AS candidate_name,
                IV.name                              AS interviewer_name,
                CO.name                              AS company_name,
                A.status                             AS application_status
             FROM INTERVIEW I
             JOIN APPLICATION A   ON I.application_id  = A.application_id
             JOIN CANDIDATE C     ON A.candidate_id    = C.candidate_id
             JOIN INTERVIEWER IV  ON I.interviewer_id  = IV.interviewer_id
             JOIN COMPANY CO      ON I.company_id      = CO.company_id`
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) await conn.close();
    }
});


// ============================================================
// DASHBOARD STATS
// ============================================================

// GET summary numbers for the dashboard cards
// URL: GET /api/stats
app.get('/api/stats', async (req, res) => {
    let conn;
    try {
        conn = await db.getConnection();

        const candidates   = await conn.execute(`SELECT COUNT(*) AS total FROM CANDIDATE`);
        const openJobs     = await conn.execute(`SELECT COUNT(*) AS total FROM JOB_POSTING WHERE status = 'Open'`);
        const applications = await conn.execute(`SELECT COUNT(*) AS total FROM APPLICATION`);
        const interviews   = await conn.execute(`SELECT COUNT(*) AS total FROM INTERVIEW`);

        res.json({
            total_candidates:   candidates.rows[0].TOTAL,
            open_jobs:          openJobs.rows[0].TOTAL,
            total_applications: applications.rows[0].TOTAL,
            total_interviews:   interviews.rows[0].TOTAL
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) await conn.close();
    }
});


// ============================================================
// START SERVER
// ============================================================
async function startServer() {
    await db.initialize();     // connect to Oracle first
    app.listen(PORT, () => {
        console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
}

startServer();