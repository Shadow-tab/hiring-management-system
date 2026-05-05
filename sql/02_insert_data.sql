-- ============================================================
-- FILE: 02_insert_data.sql
-- RUN AS: hiring_app
-- PURPOSE: Insert sample data into all 13 tables
-- ORDER MATTERS: Always insert parent rows before child rows
-- ============================================================

-- ------------------------------------------------------------
-- COMPANY (3 rows)
-- ------------------------------------------------------------
INSERT INTO COMPANY VALUES (1, 'TechNova Solutions', 'Lahore, Pakistan', 'www.technova.pk', 'Software');
INSERT INTO COMPANY VALUES (2, 'DataBridge Corp', 'Karachi, Pakistan', 'www.databridge.io', 'Data Analytics');
INSERT INTO COMPANY VALUES (3, 'CloudSphere Inc', 'Islamabad, Pakistan', 'www.cloudsphere.pk', 'Cloud Services');

-- ------------------------------------------------------------
-- INTERVIEWER (4 rows — belong to companies above)
-- ------------------------------------------------------------
INSERT INTO INTERVIEWER VALUES (1, 'Ahmed Raza',    'ahmed.raza@technova.pk',    'Engineering',  'Senior Engineer',  1);
INSERT INTO INTERVIEWER VALUES (2, 'Sara Khan',     'sara.khan@technova.pk',     'HR',           'HR Manager',       1);
INSERT INTO INTERVIEWER VALUES (3, 'Omar Sheikh',   'omar.sheikh@databridge.io', 'Data Science', 'Lead Analyst',     2);
INSERT INTO INTERVIEWER VALUES (4, 'Nadia Malik',   'nadia.malik@cloudsphere.pk','DevOps',       'DevOps Lead',      3);

-- ------------------------------------------------------------
-- JOB_POSTING (4 rows — posted by companies)
-- ------------------------------------------------------------
INSERT INTO JOB_POSTING VALUES (
    1, 'Backend Developer', 'Engineering', 'Full-Time',
    TO_DATE('2025-01-10','YYYY-MM-DD'), TO_DATE('2025-03-10','YYYY-MM-DD'),
    'Open', 'Build and maintain REST APIs using Node.js and Oracle.',
    '80000-120000', 'Node.js, SQL, REST APIs', 1
);
INSERT INTO JOB_POSTING VALUES (
    2, 'Data Analyst', 'Analytics', 'Full-Time',
    TO_DATE('2025-01-15','YYYY-MM-DD'), TO_DATE('2025-03-15','YYYY-MM-DD'),
    'Open', 'Analyze large datasets and build dashboards.',
    '70000-100000', 'Python, SQL, Power BI', 2
);
INSERT INTO JOB_POSTING VALUES (
    3, 'Cloud Engineer', 'DevOps', 'Contract',
    TO_DATE('2025-02-01','YYYY-MM-DD'), TO_DATE('2025-04-01','YYYY-MM-DD'),
    'Open', 'Manage cloud infrastructure on AWS.',
    '90000-130000', 'AWS, Docker, Terraform', 3
);
INSERT INTO JOB_POSTING VALUES (
    4, 'Frontend Developer', 'Engineering', 'Part-Time',
    TO_DATE('2025-02-10','YYYY-MM-DD'), TO_DATE('2025-04-10','YYYY-MM-DD'),
    'Closed', 'Build responsive UIs using HTML, CSS, JavaScript.',
    '50000-75000', 'HTML, CSS, JavaScript', 1
);

-- ------------------------------------------------------------
-- CANDIDATE (5 rows)
-- ------------------------------------------------------------
INSERT INTO CANDIDATE VALUES (
    1, 'Bilal', 'Hassan', 'bilal.hassan@gmail.com', '0321-1234567',
    'Faisalabad', TO_DATE('2025-01-05','YYYY-MM-DD'), 'Node.js, SQL, JavaScript'
);
INSERT INTO CANDIDATE VALUES (
    2, 'Zara', 'Ahmed', 'zara.ahmed@gmail.com', '0300-9876543',
    'Lahore', TO_DATE('2025-01-08','YYYY-MM-DD'), 'Python, SQL, Tableau'
);
INSERT INTO CANDIDATE VALUES (
    3, 'Hamza', 'Ali', 'hamza.ali@gmail.com', '0333-4567890',
    'Karachi', TO_DATE('2025-01-12','YYYY-MM-DD'), 'AWS, Docker, Linux'
);
INSERT INTO CANDIDATE VALUES (
    4, 'Ayesha', 'Siddiqui', 'ayesha.sid@gmail.com', '0345-1122334',
    'Islamabad', TO_DATE('2025-01-20','YYYY-MM-DD'), 'HTML, CSS, JavaScript, React'
);
INSERT INTO CANDIDATE VALUES (
    5, 'Usman', 'Tariq', 'usman.tariq@gmail.com', '0312-5566778',
    'Lahore', TO_DATE('2025-02-01','YYYY-MM-DD'), 'SQL, Python, Machine Learning'
);

-- ------------------------------------------------------------
-- RESUME (one per candidate, some have two)
-- ------------------------------------------------------------
INSERT INTO RESUME VALUES (1, 'files/bilal_resume_v1.pdf',   'Experienced backend developer with 3 years in Node.js', 'v1', TO_DATE('2025-01-05','YYYY-MM-DD'), 1);
INSERT INTO RESUME VALUES (2, 'files/bilal_resume_v2.pdf',   'Updated resume with Oracle project', 'v2', TO_DATE('2025-01-20','YYYY-MM-DD'), 1);
INSERT INTO RESUME VALUES (3, 'files/zara_resume_v1.pdf',    'Data analyst with Power BI expertise', 'v1', TO_DATE('2025-01-08','YYYY-MM-DD'), 2);
INSERT INTO RESUME VALUES (4, 'files/hamza_resume_v1.pdf',   'Cloud and DevOps specialist', 'v1', TO_DATE('2025-01-12','YYYY-MM-DD'), 3);
INSERT INTO RESUME VALUES (5, 'files/ayesha_resume_v1.pdf',  'Frontend developer with React experience', 'v1', TO_DATE('2025-01-20','YYYY-MM-DD'), 4);
INSERT INTO RESUME VALUES (6, 'files/usman_resume_v1.pdf',   'ML enthusiast with strong SQL background', 'v1', TO_DATE('2025-02-01','YYYY-MM-DD'), 5);

-- ------------------------------------------------------------
-- APPLICATION (5 rows — candidates applying to jobs)
-- ------------------------------------------------------------
INSERT INTO APPLICATION VALUES (1, TO_DATE('2025-01-20','YYYY-MM-DD'), 'I am excited to apply for the Backend Developer role.', 15, 'Interview', 1, 1);
INSERT INTO APPLICATION VALUES (2, TO_DATE('2025-01-22','YYYY-MM-DD'), 'Data analysis is my passion.', 10, 'Screening', 2, 2);
INSERT INTO APPLICATION VALUES (3, TO_DATE('2025-02-05','YYYY-MM-DD'), 'I have 4 years of AWS experience.', 8,  'Interview', 3, 3);
INSERT INTO APPLICATION VALUES (4, TO_DATE('2025-02-12','YYYY-MM-DD'), 'Frontend development is what I love.', 5, 'Applied',   4, 4);
INSERT INTO APPLICATION VALUES (5, TO_DATE('2025-02-15','YYYY-MM-DD'), 'I bring strong ML and SQL skills.', 3,  'Applied',   5, 2);

-- ------------------------------------------------------------
-- INTERVIEW (base rows)
-- ------------------------------------------------------------
INSERT INTO INTERVIEW VALUES (1, 1, 1, 1, 'PHONE');
INSERT INTO INTERVIEW VALUES (2, 1, 1, 1, 'TECH');
INSERT INTO INTERVIEW VALUES (3, 3, 4, 3, 'PANEL');

-- ------------------------------------------------------------
-- PHONE_SCREEN (subtype row for interview 1)
-- ------------------------------------------------------------
INSERT INTO PHONE_SCREEN VALUES (1, 30, 'Google Meet');

-- ------------------------------------------------------------
-- TECH_INTERVIEW (subtype row for interview 2)
-- ------------------------------------------------------------
INSERT INTO TECH_INTERVIEW VALUES (2, 90, 'HackerRank');

-- ------------------------------------------------------------
-- PANEL_INTERVIEW (subtype row for interview 3)
-- ------------------------------------------------------------
INSERT INTO PANEL_INTERVIEW VALUES (3, 60, 3);

-- ------------------------------------------------------------
-- OFFER (for application 1 — Bilal got an offer)
-- ------------------------------------------------------------
INSERT INTO OFFER VALUES (
    1, TO_DATE('2025-02-10','YYYY-MM-DD'),
    95000, 'Health insurance, 15 days annual leave, remote work option',
    TO_DATE('2025-03-01','YYYY-MM-DD'), 'Pending', 1
);

-- ------------------------------------------------------------
-- HIRING_DECISION
-- ------------------------------------------------------------
INSERT INTO HIRING_DECISION VALUES (
    1, TO_DATE('2025-02-12','YYYY-MM-DD'),
    'Hired', 'Strong technical skills and good communication.', 'Final', 1, 1
);
INSERT INTO HIRING_DECISION VALUES (
    2, TO_DATE('2025-02-08','YYYY-MM-DD'),
    'Rejected', 'Did not meet technical requirements for the role.', 'Final', 2, NULL
);

-- ============================================================
-- IMPORTANT: Save all inserts permanently
-- ============================================================
COMMIT;

-- ============================================================
-- VERIFICATION: Quick row counts to confirm data is in
-- ============================================================
-- SELECT 'COMPANY' AS tbl, COUNT(*) AS rows FROM COMPANY
-- UNION ALL SELECT 'JOB_POSTING',   COUNT(*) FROM JOB_POSTING
-- UNION ALL SELECT 'CANDIDATE',     COUNT(*) FROM CANDIDATE
-- UNION ALL SELECT 'APPLICATION',   COUNT(*) FROM APPLICATION
-- UNION ALL SELECT 'INTERVIEW',     COUNT(*) FROM INTERVIEW;