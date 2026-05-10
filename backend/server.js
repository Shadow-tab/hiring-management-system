const express = require('express');
const cors    = require('cors');
const db      = require('./db');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// ── Health Check ──────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({ message: 'Hiring Management System API is running.' });
});


// ============================================================
// CANDIDATES
// ============================================================

app.get('/api/candidates', async (req, res) => {
    let conn;
    try {
        conn = await db.getConnection();
        const result = await conn.execute(
            `SELECT candidate_id, first_name, last_name, email, phone, location, skills
             FROM CANDIDATE ORDER BY candidate_id`
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) await conn.close();
    }
});

app.get('/api/candidates/:id', async (req, res) => {
    let conn;
    try {
        conn = await db.getConnection();
        const result = await conn.execute(
            `SELECT * FROM CANDIDATE WHERE candidate_id = :id`,
            { id: req.params.id }
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Candidate not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) await conn.close();
    }
});

app.post('/api/candidates', async (req, res) => {
    let conn;
    const { id, first_name, last_name, email, phone, location, skills } = req.body;
    try {
        conn = await db.getConnection();
        await conn.execute(
            `BEGIN SP_ADD_CANDIDATE(:id,:first,:last,:email,:phone,:loc,:skills); END;`,
            { id, first: first_name, last: last_name, email, phone, loc: location, skills }
        );
        await conn.commit();
        res.status(201).json({ message: 'Candidate added successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) await conn.close();
    }
});

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

app.get('/api/companies', async (req, res) => {
    let conn;
    try {
        conn = await db.getConnection();
        const result = await conn.execute(`SELECT * FROM COMPANY ORDER BY company_id`);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) await conn.close();
    }
});

app.post('/api/companies', async (req, res) => {
    let conn;
    const { company_id, name, location, website, industry } = req.body;
    try {
        conn = await db.getConnection();
        await conn.execute(
            `INSERT INTO COMPANY (company_id, name, location, website, industry)
             VALUES (:p1, :p2, :p3, :p4, :p5)`,
            { p1: company_id, p2: name, p3: location||null, p4: website||null, p5: industry||null }
        );
        await conn.commit();
        res.status(201).json({ message: 'Company added successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) await conn.close();
    }
});

app.delete('/api/companies/:id', async (req, res) => {
    let conn;
    try {
        conn = await db.getConnection();
        const id = req.params.id;
        await conn.execute(`DELETE FROM PHONE_SCREEN WHERE interview_id IN (SELECT I.interview_id FROM INTERVIEW I JOIN APPLICATION A ON I.application_id = A.application_id JOIN JOB_POSTING J ON A.job_id = J.job_id WHERE J.company_id = :id)`, { id });
        await conn.execute(`DELETE FROM TECH_INTERVIEW WHERE interview_id IN (SELECT I.interview_id FROM INTERVIEW I JOIN APPLICATION A ON I.application_id = A.application_id JOIN JOB_POSTING J ON A.job_id = J.job_id WHERE J.company_id = :id)`, { id });
        await conn.execute(`DELETE FROM PANEL_INTERVIEW WHERE interview_id IN (SELECT I.interview_id FROM INTERVIEW I JOIN APPLICATION A ON I.application_id = A.application_id JOIN JOB_POSTING J ON A.job_id = J.job_id WHERE J.company_id = :id)`, { id });
        await conn.execute(`DELETE FROM PHONE_SCREEN WHERE interview_id IN (SELECT interview_id FROM INTERVIEW WHERE interviewer_id IN (SELECT interviewer_id FROM INTERVIEWER WHERE company_id = :id))`, { id });
        await conn.execute(`DELETE FROM TECH_INTERVIEW WHERE interview_id IN (SELECT interview_id FROM INTERVIEW WHERE interviewer_id IN (SELECT interviewer_id FROM INTERVIEWER WHERE company_id = :id))`, { id });
        await conn.execute(`DELETE FROM PANEL_INTERVIEW WHERE interview_id IN (SELECT interview_id FROM INTERVIEW WHERE interviewer_id IN (SELECT interviewer_id FROM INTERVIEWER WHERE company_id = :id))`, { id });
        await conn.execute(`DELETE FROM INTERVIEW WHERE interviewer_id IN (SELECT interviewer_id FROM INTERVIEWER WHERE company_id = :id)`, { id });
        await conn.execute(`DELETE FROM INTERVIEW WHERE application_id IN (SELECT application_id FROM APPLICATION WHERE job_id IN (SELECT job_id FROM JOB_POSTING WHERE company_id = :id))`, { id });
        await conn.execute(`DELETE FROM HIRING_DECISION WHERE application_id IN (SELECT application_id FROM APPLICATION WHERE job_id IN (SELECT job_id FROM JOB_POSTING WHERE company_id = :id))`, { id });
        await conn.execute(`DELETE FROM OFFER WHERE application_id IN (SELECT application_id FROM APPLICATION WHERE job_id IN (SELECT job_id FROM JOB_POSTING WHERE company_id = :id))`, { id });
        await conn.execute(`DELETE FROM APPLICATION WHERE job_id IN (SELECT job_id FROM JOB_POSTING WHERE company_id = :id)`, { id });
        await conn.execute(`DELETE FROM JOB_POSTING WHERE company_id = :id`, { id });
        await conn.execute(`DELETE FROM INTERVIEWER WHERE company_id = :id`, { id });
        await conn.execute(`DELETE FROM COMPANY WHERE company_id = :id`, { id });
        await conn.commit();
        res.json({ message: 'Company deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) await conn.close();
    }
});


// ============================================================
// JOB POSTINGS
// ============================================================

app.get('/api/jobs', async (req, res) => {
    let conn;
    try {
        conn = await db.getConnection();
        const result = await conn.execute(`SELECT * FROM VW_OPEN_JOBS ORDER BY posted_date DESC`);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) await conn.close();
    }
});

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

app.post('/api/jobs', async (req, res) => {
    let conn;
    const { job_id, title, department, emp_type, posted_date,
            closing_date, status, description, salary_range,
            required_skills, company_id } = req.body;
    try {
        conn = await db.getConnection();
        await conn.execute(
            `INSERT INTO JOB_POSTING (job_id, title, department, emp_type, posted_date,
             closing_date, status, description, salary_range, required_skills, company_id)
             VALUES (:p1, :p2, :p3, :p4,
             TO_DATE(:p5,'YYYY-MM-DD'), TO_DATE(:p6,'YYYY-MM-DD'),
             :p7, :p8, :p9, :p10, :p11)`,
            { p1: job_id, p2: title, p3: department||null, p4: emp_type||null,
              p5: posted_date, p6: closing_date,
              p7: status||'Open', p8: description||null, p9: salary_range||null,
              p10: required_skills||null, p11: company_id }
        );
        await conn.commit();
        res.status(201).json({ message: 'Job posting added successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) await conn.close();
    }
});

app.delete('/api/jobs/:id', async (req, res) => {
    let conn;
    try {
        conn = await db.getConnection();
        const id = req.params.id;
        await conn.execute(`DELETE FROM PHONE_SCREEN WHERE interview_id IN (SELECT I.interview_id FROM INTERVIEW I JOIN APPLICATION A ON I.application_id = A.application_id WHERE A.job_id = :id)`, { id });
        await conn.execute(`DELETE FROM TECH_INTERVIEW WHERE interview_id IN (SELECT I.interview_id FROM INTERVIEW I JOIN APPLICATION A ON I.application_id = A.application_id WHERE A.job_id = :id)`, { id });
        await conn.execute(`DELETE FROM PANEL_INTERVIEW WHERE interview_id IN (SELECT I.interview_id FROM INTERVIEW I JOIN APPLICATION A ON I.application_id = A.application_id WHERE A.job_id = :id)`, { id });
        await conn.execute(`DELETE FROM INTERVIEW WHERE application_id IN (SELECT application_id FROM APPLICATION WHERE job_id = :id)`, { id });
        await conn.execute(`DELETE FROM HIRING_DECISION WHERE application_id IN (SELECT application_id FROM APPLICATION WHERE job_id = :id)`, { id });
        await conn.execute(`DELETE FROM OFFER WHERE application_id IN (SELECT application_id FROM APPLICATION WHERE job_id = :id)`, { id });
        await conn.execute(`DELETE FROM APPLICATION WHERE job_id = :id`, { id });
        await conn.execute(`DELETE FROM JOB_POSTING WHERE job_id = :id`, { id });
        await conn.commit();
        res.json({ message: 'Job posting deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) await conn.close();
    }
});


// ============================================================
// APPLICATIONS
// ============================================================

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

app.post('/api/applications', async (req, res) => {
    let conn;
    const { app_id, candidate_id, job_id, resume_id, cover_letter } = req.body;
    try {
        conn = await db.getConnection();
        await conn.execute(
            `BEGIN SP_SUBMIT_APPLICATION(:app_id,:cand_id,:job_id,:resume_id,:cover); END;`,
            { app_id, cand_id: candidate_id, job_id, resume_id, cover: cover_letter }
        );
        await conn.commit();
        res.status(201).json({ message: 'Application submitted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) await conn.close();
    }
});

app.put('/api/applications/:id/status', async (req, res) => {
    let conn;
    const { status } = req.body;
    try {
        conn = await db.getConnection();
        await conn.execute(
            `BEGIN SP_UPDATE_APP_STATUS(:id,:status); END;`,
            { id: req.params.id, status }
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
// INTERVIEWS — supertype GET
// ============================================================

app.get('/api/interviews', async (req, res) => {
    let conn;
    try {
        conn = await db.getConnection();
        const result = await conn.execute(
            `SELECT I.interview_id, I.interview_type,
                C.first_name || ' ' || C.last_name AS candidate_name,
                IV.name                             AS interviewer_name,
                IV.job_title                        AS interviewer_title,
                CO.name                             AS company_name,
                J.title                             AS job_title,
                A.status                            AS application_status
             FROM INTERVIEW I
             JOIN APPLICATION A  ON I.application_id = A.application_id
             JOIN CANDIDATE   C  ON A.candidate_id   = C.candidate_id
             JOIN INTERVIEWER IV ON I.interviewer_id = IV.interviewer_id
             JOIN COMPANY     CO ON IV.company_id    = CO.company_id
             JOIN JOB_POSTING J  ON A.job_id         = J.job_id
             ORDER BY I.interview_id`
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) await conn.close();
    }
});

// POST interview supertype
app.post('/api/interviews', async (req, res) => {
    let conn;
    const { interview_id, application_id, interviewer_id, interview_type } = req.body;
    try {
        conn = await db.getConnection();
        await conn.execute(
            `INSERT INTO INTERVIEW (interview_id, interview_type, application_id, interviewer_id)
             VALUES (:p1, :p2, :p3, :p4)`,
            { p1: interview_id, p2: interview_type, p3: application_id, p4: interviewer_id }
        );
        await conn.commit();
        res.status(201).json({ message: 'Interview created' });
    } catch (err) { res.status(500).json({ error: err.message }); }
    finally { if (conn) await conn.close(); }
});

// POST phone screen subtype
app.post('/api/interviews/phone', async (req, res) => {
    let conn;
    const { interview_id, duration_mins } = req.body;
    try {
        conn = await db.getConnection();
        await conn.execute(
            `INSERT INTO PHONE_SCREEN (interview_id, duration_mins) VALUES (:p1, :p2)`,
            { p1: interview_id, p2: duration_mins||null }
        );
        await conn.commit();
        res.status(201).json({ message: 'Phone screen created' });
    } catch (err) { res.status(500).json({ error: err.message }); }
    finally { if (conn) await conn.close(); }
});

// POST tech interview subtype
app.post('/api/interviews/tech', async (req, res) => {
    let conn;
    const { interview_id, platform } = req.body;
    try {
        conn = await db.getConnection();
        await conn.execute(
            `INSERT INTO TECH_INTERVIEW (interview_id, platform) VALUES (:p1, :p2)`,
            { p1: interview_id, p2: platform||null }
        );
        await conn.commit();
        res.status(201).json({ message: 'Tech interview created' });
    } catch (err) { res.status(500).json({ error: err.message }); }
    finally { if (conn) await conn.close(); }
});

// POST panel interview subtype
app.post('/api/interviews/panel', async (req, res) => {
    let conn;
    const { interview_id, panel_size } = req.body;
    try {
        conn = await db.getConnection();
        await conn.execute(
            `INSERT INTO PANEL_INTERVIEW (interview_id, panel_size) VALUES (:p1, :p2)`,
            { p1: interview_id, p2: panel_size||null }
        );
        await conn.commit();
        res.status(201).json({ message: 'Panel interview created' });
    } catch (err) { res.status(500).json({ error: err.message }); }
    finally { if (conn) await conn.close(); }
});


// ============================================================
// INTERVIEWERS
// ============================================================

app.get('/api/interviewers', async (req, res) => {
    let conn;
    try {
        conn = await db.getConnection();
        const result = await conn.execute(
            `SELECT IV.interviewer_id, IV.name, IV.email, IV.department,
                    IV.job_title, IV.company_id, C.name AS company_name
             FROM INTERVIEWER IV
             JOIN COMPANY C ON IV.company_id = C.company_id
             ORDER BY IV.interviewer_id`
        );
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
    finally { if (conn) await conn.close(); }
});

app.post('/api/interviewers', async (req, res) => {
    let conn;
    const { interviewer_id, name, email, department, job_title, company_id } = req.body;
    try {
        conn = await db.getConnection();
        await conn.execute(
            `INSERT INTO INTERVIEWER (interviewer_id, name, email, department, job_title, company_id)
             VALUES (:p1, :p2, :p3, :p4, :p5, :p6)`,
            { p1: interviewer_id, p2: name, p3: email, p4: department||null, p5: job_title||null, p6: company_id }
        );
        await conn.commit();
        res.status(201).json({ message: 'Interviewer added successfully' });
    } catch (err) { res.status(500).json({ error: err.message }); }
    finally { if (conn) await conn.close(); }
});

app.delete('/api/interviewers/:id', async (req, res) => {
    let conn;
    try {
        conn = await db.getConnection();
        const id = req.params.id;
        await conn.execute(`DELETE FROM PHONE_SCREEN WHERE interview_id IN (SELECT interview_id FROM INTERVIEW WHERE interviewer_id = :id)`, { id });
        await conn.execute(`DELETE FROM TECH_INTERVIEW WHERE interview_id IN (SELECT interview_id FROM INTERVIEW WHERE interviewer_id = :id)`, { id });
        await conn.execute(`DELETE FROM PANEL_INTERVIEW WHERE interview_id IN (SELECT interview_id FROM INTERVIEW WHERE interviewer_id = :id)`, { id });
        await conn.execute(`DELETE FROM INTERVIEW WHERE interviewer_id = :id`, { id });
        await conn.execute(`DELETE FROM INTERVIEWER WHERE interviewer_id = :id`, { id });
        await conn.commit();
        res.json({ message: 'Interviewer deleted successfully' });
    } catch (err) { res.status(500).json({ error: err.message }); }
    finally { if (conn) await conn.close(); }
});


// ============================================================
// RESUMES
// ============================================================

app.get('/api/resumes', async (req, res) => {
    let conn;
    try {
        conn = await db.getConnection();
        const result = await conn.execute(
            `SELECT R.resume_id, R.file_url, R.summary, R.version_label,
                    R.upload_date, R.candidate_id,
                    C.first_name || ' ' || C.last_name AS candidate_name
             FROM RESUME R
             JOIN CANDIDATE C ON R.candidate_id = C.candidate_id
             ORDER BY R.resume_id`
        );
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
    finally { if (conn) await conn.close(); }
});

app.post('/api/resumes', async (req, res) => {
    let conn;
    const { resume_id, file_url, summary, version_label, candidate_id } = req.body;
    try {
        conn = await db.getConnection();
        await conn.execute(
            `INSERT INTO RESUME (resume_id, file_url, summary, version_label, upload_date, candidate_id)
             VALUES (:p1, :p2, :p3, :p4, SYSDATE, :p5)`,
            { p1: resume_id, p2: file_url||null, p3: summary||null, p4: version_label||null, p5: candidate_id }
        );
        await conn.commit();
        res.status(201).json({ message: 'Resume added successfully' });
    } catch (err) { res.status(500).json({ error: err.message }); }
    finally { if (conn) await conn.close(); }
});

app.delete('/api/resumes/:id', async (req, res) => {
    let conn;
    try {
        conn = await db.getConnection();
        await conn.execute(`UPDATE APPLICATION SET resume_id = NULL WHERE resume_id = :id`, { id: req.params.id });
        await conn.execute(`DELETE FROM RESUME WHERE resume_id = :id`, { id: req.params.id });
        await conn.commit();
        res.json({ message: 'Resume deleted successfully' });
    } catch (err) { res.status(500).json({ error: err.message }); }
    finally { if (conn) await conn.close(); }
});


// ============================================================
// OFFERS
// ============================================================

app.get('/api/offers', async (req, res) => {
    let conn;
    try {
        conn = await db.getConnection();
        const result = await conn.execute(
            `SELECT O.offer_id, O.offer_date, O.base_salary, O.benefits_summary,
                    O.start_date, O.status, O.application_id,
                    C.first_name || ' ' || C.last_name AS candidate_name,
                    J.title AS job_title
             FROM OFFER O
             JOIN APPLICATION A ON O.application_id = A.application_id
             JOIN CANDIDATE   C ON A.candidate_id   = C.candidate_id
             JOIN JOB_POSTING J ON A.job_id         = J.job_id
             ORDER BY O.offer_id`
        );
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
    finally { if (conn) await conn.close(); }
});

app.post('/api/offers', async (req, res) => {
    let conn;
    const { offer_id, offer_date, base_salary, benefits_summary, start_date, status, application_id } = req.body;
    try {
        conn = await db.getConnection();
        await conn.execute(
            `INSERT INTO OFFER (offer_id, offer_date, base_salary, benefits_summary, start_date, status, application_id)
             VALUES (:p1, TO_DATE(:p2,'YYYY-MM-DD'), :p3, :p4, TO_DATE(:p5,'YYYY-MM-DD'), :p6, :p7)`,
            { p1: offer_id, p2: offer_date, p3: base_salary,
              p4: benefits_summary||null, p5: start_date, p6: status, p7: application_id }
        );
        await conn.commit();
        res.status(201).json({ message: 'Offer added successfully' });
    } catch (err) { res.status(500).json({ error: err.message }); }
    finally { if (conn) await conn.close(); }
});

app.put('/api/offers/:id/status', async (req, res) => {
    let conn;
    const { status } = req.body;
    try {
        conn = await db.getConnection();
        await conn.execute(
            `UPDATE OFFER SET status = :p1 WHERE offer_id = :p2`,
            { p1: status, p2: req.params.id }
        );
        await conn.commit();
        res.json({ message: 'Offer status updated' });
    } catch (err) { res.status(500).json({ error: err.message }); }
    finally { if (conn) await conn.close(); }
});


// ============================================================
// HIRING DECISIONS
// ============================================================

app.get('/api/decisions', async (req, res) => {
    let conn;
    try {
        conn = await db.getConnection();
        const result = await conn.execute(
            `SELECT HD.decision_id, HD.decision_date, HD.outcome,
                    HD.rationale, HD.status, HD.application_id, HD.offer_id,
                    C.first_name || ' ' || C.last_name AS candidate_name,
                    J.title AS job_title
             FROM HIRING_DECISION HD
             JOIN APPLICATION A ON HD.application_id = A.application_id
             JOIN CANDIDATE   C ON A.candidate_id    = C.candidate_id
             JOIN JOB_POSTING J ON A.job_id          = J.job_id
             ORDER BY HD.decision_id`
        );
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
    finally { if (conn) await conn.close(); }
});

app.post('/api/decisions', async (req, res) => {
    let conn;
    const { decision_id, decision_date, outcome, rationale, status, application_id, offer_id } = req.body;
    try {
        conn = await db.getConnection();
        await conn.execute(
            `INSERT INTO HIRING_DECISION (decision_id, decision_date, outcome, rationale, status, application_id, offer_id)
             VALUES (:p1, TO_DATE(:p2,'YYYY-MM-DD'), :p3, :p4, :p5, :p6, :p7)`,
            { p1: decision_id, p2: decision_date, p3: outcome,
              p4: rationale||null, p5: status, p6: application_id, p7: offer_id }
        );
        await conn.commit();
        res.status(201).json({ message: 'Hiring decision added successfully' });
    } catch (err) { res.status(500).json({ error: err.message }); }
    finally { if (conn) await conn.close(); }
});


// ============================================================
// DASHBOARD STATS
// ============================================================

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
// USERS — Admin only
// ============================================================

app.get('/api/users', async (req, res) => {
    let conn;
    try {
        conn = await db.getConnection();
        const result = await conn.execute(
            `SELECT user_id, name, email, role, entity_id, created_at
             FROM USERS ORDER BY user_id`
        );
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
    finally { if (conn) await conn.close(); }
});


// ============================================================
// AUTH — LOGIN + REGISTER
// ============================================================

app.post('/api/auth/login', async (req, res) => {
    let conn;
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    try {
        conn = await db.getConnection();
        const result = await conn.execute(
            `SELECT user_id, name, email, role, entity_id
             FROM USERS WHERE email = :p1 AND password = :p2`,
            { p1: email, p2: password }
        );
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const u = result.rows[0];
        res.json({
            user_id:   u.USER_ID,
            name:      u.NAME,
            email:     u.EMAIL,
            role:      u.ROLE,
            entity_id: u.ENTITY_ID
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
    finally { if (conn) await conn.close(); }
});

app.post('/api/auth/register', async (req, res) => {
    let conn;
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'Name, email, password and role are required' });
    }
    if (!['COMPANY','INTERVIEWER','CANDIDATE'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }
    try {
        conn = await db.getConnection();

        const check = await conn.execute(
            `SELECT COUNT(*) AS cnt FROM USERS WHERE email = :p1`, { p1: email }
        );
        if (check.rows[0].CNT > 0) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        const idRes = await conn.execute(`SELECT NVL(MAX(user_id),0)+1 AS nid FROM USERS`);
        const user_id = idRes.rows[0].NID;
        let entity_id = null;

        if (role === 'CANDIDATE') {
            const cidRes = await conn.execute(`SELECT NVL(MAX(candidate_id),0)+1 AS nid FROM CANDIDATE`);
            entity_id = cidRes.rows[0].NID;
            const { phone, location, skills } = req.body;
            const fname = name.split(' ')[0];
            const lname = name.split(' ').slice(1).join(' ') || '-';
            await conn.execute(
                `INSERT INTO CANDIDATE (candidate_id, first_name, last_name, email, phone, location, reg_date, skills)
                 VALUES (:p1, :p2, :p3, :p4, :p5, :p6, SYSDATE, :p7)`,
                { p1: entity_id, p2: fname, p3: lname,
                  p4: email, p5: phone||null, p6: location||null, p7: skills||null }
            );
        }

        if (role === 'COMPANY') {
            const coRes = await conn.execute(`SELECT NVL(MAX(company_id),0)+1 AS nid FROM COMPANY`);
            entity_id = coRes.rows[0].NID;
            const { location, website, industry } = req.body;
            await conn.execute(
                `INSERT INTO COMPANY (company_id, name, location, website, industry)
                 VALUES (:p1, :p2, :p3, :p4, :p5)`,
                { p1: entity_id, p2: name, p3: location||null, p4: website||null, p5: industry||null }
            );
        }

        if (role === 'INTERVIEWER') {
            const ivRes = await conn.execute(`SELECT NVL(MAX(interviewer_id),0)+1 AS nid FROM INTERVIEWER`);
            entity_id = ivRes.rows[0].NID;
            const { department, job_title, company_id } = req.body;
            if (!company_id) return res.status(400).json({ error: 'Company ID required for interviewer signup' });
            await conn.execute(
                `INSERT INTO INTERVIEWER (interviewer_id, name, email, department, job_title, company_id)
                 VALUES (:p1, :p2, :p3, :p4, :p5, :p6)`,
                { p1: entity_id, p2: name, p3: email, p4: department||null, p5: job_title||null, p6: company_id }
            );
        }

        await conn.execute(
            `INSERT INTO USERS (user_id, name, email, password, role, entity_id, created_at)
             VALUES (:p1, :p2, :p3, :p4, :p5, :p6, SYSDATE)`,
            { p1: user_id, p2: name, p3: email, p4: password, p5: role, p6: entity_id }
        );

        await conn.commit();
        res.status(201).json({ message: 'Account created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) await conn.close();
    }
});


// ============================================================
// ROLE-SPECIFIC ENDPOINTS — /api/my/...
// ============================================================

app.get('/api/my/applications', async (req, res) => {
    let conn;
    try {
        conn = await db.getConnection();
        const result = await conn.execute(
            `SELECT A.application_id, A.applied_date, A.status AS application_status,
                    A.days_in_pipeline, A.cover_letter,
                    J.title AS job_title, CO.name AS company_name
             FROM APPLICATION A
             JOIN JOB_POSTING J ON A.job_id = J.job_id
             JOIN COMPANY CO ON J.company_id = CO.company_id
             WHERE A.candidate_id = :p1
             ORDER BY A.applied_date DESC`,
            { p1: req.query.candidate_id }
        );
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
    finally { if (conn) await conn.close(); }
});

app.get('/api/my/resumes', async (req, res) => {
    let conn;
    try {
        conn = await db.getConnection();
        const result = await conn.execute(
            `SELECT * FROM RESUME WHERE candidate_id = :p1 ORDER BY upload_date DESC`,
            { p1: req.query.candidate_id }
        );
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
    finally { if (conn) await conn.close(); }
});

app.get('/api/my/interviews', async (req, res) => {
    let conn;
    try {
        conn = await db.getConnection();
        const result = await conn.execute(
            `SELECT I.interview_id, I.interview_type,
                    IV.name AS interviewer_name, J.title AS job_title,
                    A.status AS application_status
             FROM INTERVIEW I
             JOIN APPLICATION A  ON I.application_id = A.application_id
             JOIN JOB_POSTING J  ON A.job_id = J.job_id
             JOIN INTERVIEWER IV ON I.interviewer_id = IV.interviewer_id
             WHERE A.candidate_id = :p1`,
            { p1: req.query.candidate_id }
        );
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
    finally { if (conn) await conn.close(); }
});

app.get('/api/my/offers', async (req, res) => {
    let conn;
    try {
        conn = await db.getConnection();
        const result = await conn.execute(
            `SELECT O.offer_id, O.base_salary, O.status, O.offer_date,
                    O.start_date, O.benefits_summary, J.title AS job_title
             FROM OFFER O
             JOIN APPLICATION A ON O.application_id = A.application_id
             JOIN JOB_POSTING J ON A.job_id = J.job_id
             WHERE A.candidate_id = :p1`,
            { p1: req.query.candidate_id }
        );
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
    finally { if (conn) await conn.close(); }
});

app.get('/api/my/jobs', async (req, res) => {
    let conn;
    try {
        conn = await db.getConnection();
        const result = await conn.execute(
            `SELECT * FROM JOB_POSTING WHERE company_id = :p1 ORDER BY posted_date DESC`,
            { p1: req.query.company_id }
        );
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
    finally { if (conn) await conn.close(); }
});

app.get('/api/my/company-applications', async (req, res) => {
    let conn;
    try {
        conn = await db.getConnection();
        const result = await conn.execute(
            `SELECT A.application_id, A.applied_date, A.status AS application_status,
                    C.first_name || ' ' || C.last_name AS candidate_name,
                    J.title AS job_title
             FROM APPLICATION A
             JOIN CANDIDATE   C ON A.candidate_id = C.candidate_id
             JOIN JOB_POSTING J ON A.job_id = J.job_id
             WHERE J.company_id = :p1
             ORDER BY A.applied_date DESC`,
            { p1: req.query.company_id }
        );
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
    finally { if (conn) await conn.close(); }
});

app.get('/api/my/interviewers', async (req, res) => {
    let conn;
    try {
        conn = await db.getConnection();
        const result = await conn.execute(
            `SELECT * FROM INTERVIEWER WHERE company_id = :p1`,
            { p1: req.query.company_id }
        );
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
    finally { if (conn) await conn.close(); }
});

app.get('/api/my/company-offers', async (req, res) => {
    let conn;
    try {
        conn = await db.getConnection();
        const result = await conn.execute(
            `SELECT O.offer_id, O.base_salary, O.status, O.offer_date,
                    C.first_name || ' ' || C.last_name AS candidate_name,
                    J.title AS job_title
             FROM OFFER O
             JOIN APPLICATION A ON O.application_id = A.application_id
             JOIN CANDIDATE   C ON A.candidate_id = C.candidate_id
             JOIN JOB_POSTING J ON A.job_id = J.job_id
             WHERE J.company_id = :p1`,
            { p1: req.query.company_id }
        );
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
    finally { if (conn) await conn.close(); }
});

app.get('/api/my/interviewer-interviews', async (req, res) => {
    let conn;
    try {
        conn = await db.getConnection();
        const result = await conn.execute(
            `SELECT I.interview_id, I.interview_type,
                    C.first_name || ' ' || C.last_name AS candidate_name,
                    J.title AS job_title,
                    A.status AS application_status
             FROM INTERVIEW I
             JOIN APPLICATION A ON I.application_id = A.application_id
             JOIN CANDIDATE   C ON A.candidate_id = C.candidate_id
             JOIN JOB_POSTING J ON A.job_id = J.job_id
             WHERE I.interviewer_id = :p1`,
            { p1: req.query.interviewer_id }
        );
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
    finally { if (conn) await conn.close(); }
});


// COMPANY — interviews for jobs posted by this company
app.get('/api/my/company-interviews', async (req, res) => {
    let conn;
    try {
        conn = await db.getConnection();
        const result = await conn.execute(
            `SELECT I.interview_id, I.interview_type,
                    C.first_name || ' ' || C.last_name AS candidate_name,
                    IV.name AS interviewer_name,
                    J.title AS job_title,
                    A.status AS application_status
             FROM INTERVIEW I
             JOIN APPLICATION A  ON I.application_id = A.application_id
             JOIN CANDIDATE   C  ON A.candidate_id   = C.candidate_id
             JOIN INTERVIEWER IV ON I.interviewer_id  = IV.interviewer_id
             JOIN JOB_POSTING J  ON A.job_id          = J.job_id
             WHERE J.company_id = :cid`,
            { cid: req.query.company_id }
        );
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
    finally { if (conn) await conn.close(); }
});

// COMPANY — hiring decisions for jobs posted by this company
app.get('/api/my/company-decisions', async (req, res) => {
    let conn;
    try {
        conn = await db.getConnection();
        const result = await conn.execute(
            `SELECT HD.decision_id, HD.decision_date, HD.outcome,
                    HD.rationale, HD.status, HD.application_id, HD.offer_id,
                    C.first_name || ' ' || C.last_name AS candidate_name,
                    J.title AS job_title
             FROM HIRING_DECISION HD
             JOIN APPLICATION A  ON HD.application_id = A.application_id
             JOIN CANDIDATE   C  ON A.candidate_id    = C.candidate_id
             JOIN JOB_POSTING J  ON A.job_id          = J.job_id
             WHERE J.company_id = :cid`,
            { cid: req.query.company_id }
        );
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
    finally { if (conn) await conn.close(); }
});


// ============================================================
// START SERVER
// ============================================================
async function startServer() {
    await db.initialize();
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
}

startServer();