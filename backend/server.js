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

// FIX: delete now uses corrected procedure that handles FK chain properly
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

// POST add new company
app.post('/api/companies', async (req, res) => {
    let conn;
    const { company_id, name, location, website, industry } = req.body;
    try {
        conn = await db.getConnection();
        await conn.execute(
            `INSERT INTO COMPANY VALUES (:cid, :name, :loc, :web, :ind)`,
            { cid: company_id, name, loc: location, web: website, ind: industry }
        );
        await conn.commit();
        res.status(201).json({ message: 'Company added successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) await conn.close();
    }
});

// DELETE company — cleans up all linked data first
app.delete('/api/companies/:id', async (req, res) => {
    let conn;
    try {
        conn = await db.getConnection();
        const id = req.params.id;
        // Clean up jobs posted by this company (full chain)
        await conn.execute(`DELETE FROM PHONE_SCREEN WHERE interview_id IN (SELECT I.interview_id FROM INTERVIEW I JOIN APPLICATION A ON I.application_id = A.application_id JOIN JOB_POSTING J ON A.job_id = J.job_id WHERE J.company_id = :id)`, { id });
        await conn.execute(`DELETE FROM TECH_INTERVIEW WHERE interview_id IN (SELECT I.interview_id FROM INTERVIEW I JOIN APPLICATION A ON I.application_id = A.application_id JOIN JOB_POSTING J ON A.job_id = J.job_id WHERE J.company_id = :id)`, { id });
        await conn.execute(`DELETE FROM PANEL_INTERVIEW WHERE interview_id IN (SELECT I.interview_id FROM INTERVIEW I JOIN APPLICATION A ON I.application_id = A.application_id JOIN JOB_POSTING J ON A.job_id = J.job_id WHERE J.company_id = :id)`, { id });
        // Interviews conducted by this company interviewers
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

// POST add new job posting
app.post('/api/jobs', async (req, res) => {
    let conn;
    const { job_id, title, department, emp_type, posted_date,
            closing_date, status, description, salary_range,
            required_skills, company_id } = req.body;
    try {
        conn = await db.getConnection();
        await conn.execute(
            `INSERT INTO JOB_POSTING VALUES (
                :jid, :title, :dept, :etype,
                TO_DATE(:pdate,'YYYY-MM-DD'), TO_DATE(:cdate,'YYYY-MM-DD'),
                :status, :desc, :salary, :skills, :cid
             )`,
            {
                jid: job_id, title, dept: department, etype: emp_type,
                pdate: posted_date, cdate: closing_date,
                status, desc: description, salary: salary_range,
                skills: required_skills, cid: company_id
            }
        );
        await conn.commit();
        res.status(201).json({ message: 'Job posting added successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) await conn.close();
    }
});

// DELETE job posting — cleans up full child chain first
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
// INTERVIEWS
// ============================================================

// FIX: removed broken JOIN COMPANY CO ON I.company_id
// company reached via INTERVIEWER → COMPANY chain
app.get('/api/interviews', async (req, res) => {
    let conn;
    try {
        conn = await db.getConnection();
        const result = await conn.execute(
            `SELECT
                I.interview_id,
                I.interview_type,
                C.first_name || ' ' || C.last_name   AS candidate_name,
                IV.name                               AS interviewer_name,
                IV.job_title                          AS interviewer_title,
                CO.name                               AS company_name,
                J.title                               AS job_title,
                A.status                              AS application_status
             FROM INTERVIEW I
             JOIN APPLICATION  A   ON I.application_id = A.application_id
             JOIN CANDIDATE    C   ON A.candidate_id   = C.candidate_id
             JOIN INTERVIEWER  IV  ON I.interviewer_id = IV.interviewer_id
             JOIN COMPANY      CO  ON IV.company_id    = CO.company_id
             JOIN JOB_POSTING  J   ON A.job_id         = J.job_id
             ORDER BY I.interview_id`
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

app.get('/api/stats', async (req, res) => {
    let conn;
    try {
        conn = await db.getConnection();
        const candidates   = await conn.execute(`SELECT COUNT(*) AS total FROM CANDIDATE`);
        const openJobs     = await conn.execute(`SELECT COUNT(*) AS total FROM JOB_POSTING WHERE status = 'Open'`);
        const applications = await conn.execute(`SELECT COUNT(*) AS total FROM APPLICATION`);
        const interviews   = await conn.execute(`SELECT COUNT(*) AS total FROM INTERVIEW`);

        res.json({
            total_candidates:    candidates.rows[0].TOTAL,
            open_jobs:           openJobs.rows[0].TOTAL,
            total_applications:  applications.rows[0].TOTAL,
            total_interviews:    interviews.rows[0].TOTAL
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
    await db.initialize();
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
}

startServer();

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
            `INSERT INTO INTERVIEWER VALUES (:iid,:name,:email,:dept,:jt,:cid)`,
            { iid: interviewer_id, name, email, dept: department, jt: job_title, cid: company_id }
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
        // Delete interview subtypes then interviews conducted by this interviewer
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
            `INSERT INTO RESUME VALUES (:rid,:furl,:summ,:vlabel,SYSDATE,:cid)`,
            { rid: resume_id, furl: file_url, summ: summary, vlabel: version_label, cid: candidate_id }
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
        // First detach resume from any applications referencing it
        await conn.execute(
            `UPDATE APPLICATION SET resume_id = NULL WHERE resume_id = :id`,
            { id: req.params.id }
        );
        // Now safe to delete
        await conn.execute(
            `DELETE FROM RESUME WHERE resume_id = :id`,
            { id: req.params.id }
        );
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
             JOIN APPLICATION A  ON O.application_id = A.application_id
             JOIN CANDIDATE   C  ON A.candidate_id   = C.candidate_id
             JOIN JOB_POSTING J  ON A.job_id         = J.job_id
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
            `INSERT INTO OFFER VALUES (
                :oid, TO_DATE(:odate,'YYYY-MM-DD'), :salary,
                :benefits, TO_DATE(:sdate,'YYYY-MM-DD'), :status, :appid
             )`,
            { oid: offer_id, odate: offer_date, salary: base_salary,
              benefits: benefits_summary, sdate: start_date, status, appid: application_id }
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
            `UPDATE OFFER SET status = :status WHERE offer_id = :id`,
            { status, id: req.params.id }
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
             JOIN APPLICATION A  ON HD.application_id = A.application_id
             JOIN CANDIDATE   C  ON A.candidate_id    = C.candidate_id
             JOIN JOB_POSTING J  ON A.job_id          = J.job_id
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
            `INSERT INTO HIRING_DECISION VALUES (
                :did, TO_DATE(:ddate,'YYYY-MM-DD'),
                :outcome, :rationale, :status, :appid, :oid
             )`,
            { did: decision_id, ddate: decision_date, outcome,
              rationale, status, appid: application_id, oid: offer_id }
        );
        await conn.commit();
        res.status(201).json({ message: 'Hiring decision added successfully' });
    } catch (err) { res.status(500).json({ error: err.message }); }
    finally { if (conn) await conn.close(); }
});

// ============================================================
// INTERVIEW — supertype + subtype insert endpoints
// ============================================================

// POST interview supertype
app.post('/api/interviews', async (req, res) => {
    let conn;
    const { interview_id, application_id, interviewer_id, interview_type } = req.body;
    try {
        conn = await db.getConnection();
        await conn.execute(
            `INSERT INTO INTERVIEW VALUES (:iid, :type, :appid, :ivid)`,
            { iid: interview_id, type: interview_type, appid: application_id, ivid: interviewer_id }
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
            `INSERT INTO PHONE_SCREEN VALUES (:iid, :dur)`,
            { iid: interview_id, dur: duration_mins || null }
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
            `INSERT INTO TECH_INTERVIEW VALUES (:iid, :plat)`,
            { iid: interview_id, plat: platform || null }
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
            `INSERT INTO PANEL_INTERVIEW VALUES (:iid, :ps)`,
            { iid: interview_id, ps: panel_size || null }
        );
        await conn.commit();
        res.status(201).json({ message: 'Panel interview created' });
    } catch (err) { res.status(500).json({ error: err.message }); }
    finally { if (conn) await conn.close(); }
});