-- ============================================================
-- FILE: 07_seed_data.sql
-- RUN AS: hiring_app
-- PURPOSE: Clean up junk data, restore missing rows, and add
--          rich sample data so every page looks presentable.
-- ============================================================


-- ============================================================
-- STEP 1 — CLEANUP JUNK DATA
-- (test signups and accidental inserts from development)
-- ============================================================

-- Junk user linked to blank company 6
DELETE FROM USERS WHERE user_id = 2;

-- Junk interviewer "daddy"
DELETE FROM INTERVIEWER WHERE interviewer_id = 5;

-- Junk test-signup candidates (no applications or resumes)
DELETE FROM CANDIDATE WHERE candidate_id IN (5, 6);

-- Junk companies from test signups
DELETE FROM COMPANY WHERE company_id IN (5, 6);

-- Fill in missing fields on Company 4 (added via test)
UPDATE COMPANY
SET location = 'Multan, Pakistan', website = 'www.acmecorp.pk'
WHERE company_id = 4;

COMMIT;


-- ============================================================
-- STEP 2 — RESTORE DELETED CANDIDATES & THEIR DATA
-- (Zara was deleted; Usman was overwritten by signup)
-- ============================================================

INSERT INTO CANDIDATE VALUES (2, 'Zara',  'Ahmed', 'zara.ahmed@gmail.com',  '0300-9876543', 'Lahore',  TO_DATE('2025-01-08','YYYY-MM-DD'), 'Python, SQL, Tableau, Power BI');
INSERT INTO CANDIDATE VALUES (5, 'Usman', 'Tariq', 'usman.tariq@gmail.com', '0312-5566778', 'Lahore',  TO_DATE('2025-02-01','YYYY-MM-DD'), 'SQL, Python, Machine Learning');

-- Restore deleted resumes
INSERT INTO RESUME VALUES (3, 'files/zara_v1.pdf',   'Data analyst skilled in Power BI and Tableau visualisations', 'v1', TO_DATE('2025-01-08','YYYY-MM-DD'), 2);
INSERT INTO RESUME VALUES (5, 'files/ayesha_v1.pdf', 'Frontend developer with responsive design and UX experience',  'v1', TO_DATE('2025-01-20','YYYY-MM-DD'), 4);
INSERT INTO RESUME VALUES (6, 'files/usman_v1.pdf',  'ML enthusiast with strong Python and SQL background',           'v1', TO_DATE('2025-02-01','YYYY-MM-DD'), 5);

-- Restore deleted applications
INSERT INTO APPLICATION VALUES (2, TO_DATE('2025-01-22','YYYY-MM-DD'), 'Data analysis is my passion. I have hands-on experience with Tableau and Power BI.',  10, 'Screening', 2, 2, 3);
INSERT INTO APPLICATION VALUES (5, TO_DATE('2025-02-15','YYYY-MM-DD'), 'I bring strong ML and SQL skills to data-driven problems.',                             3,  'Applied',   5, 2, 6);

COMMIT;


-- ============================================================
-- STEP 3 — NEW COMPANY
-- ============================================================

INSERT INTO COMPANY VALUES (5, 'DevForge Labs', 'Lahore, Pakistan', 'www.devforge.pk', 'IT Consulting');

COMMIT;


-- ============================================================
-- STEP 4 — NEW CANDIDATES
-- ============================================================

INSERT INTO CANDIDATE VALUES (6, 'Fatima', 'Malik',   'fatima.malik@gmail.com', '0322-3344556', 'Islamabad', TO_DATE('2025-02-10','YYYY-MM-DD'), 'Node.js, Express, MongoDB');
INSERT INTO CANDIDATE VALUES (7, 'Ali',    'Shah',    'ali.shah@gmail.com',     '0301-7788990', 'Peshawar',  TO_DATE('2025-02-15','YYYY-MM-DD'), 'Java, Spring Boot, MySQL');

COMMIT;


-- ============================================================
-- STEP 5 — NEW INTERVIEWERS
-- ============================================================

INSERT INTO INTERVIEWER VALUES (5, 'Hira Jamil',  'hira.jamil@acmecorp.pk',   'Engineering', 'Lead Frontend Developer', 4);
INSERT INTO INTERVIEWER VALUES (6, 'Noman Baig',  'noman.baig@devforge.pk',   'Engineering', 'CTO',                     5);

COMMIT;


-- ============================================================
-- STEP 6 — NEW JOB POSTINGS
-- ============================================================

INSERT INTO JOB_POSTING VALUES (5, 'DevOps Engineer',      'Infrastructure', 'Full-Time',
    TO_DATE('2026-04-01','YYYY-MM-DD'), TO_DATE('2026-06-30','YYYY-MM-DD'),
    'Open', 'Manage CI/CD pipelines and cloud deployments using Docker and Jenkins.',
    '75000-110000', 'Docker, Jenkins, AWS', 1);

INSERT INTO JOB_POSTING VALUES (6, 'ML Engineer',          'AI Research',    'Full-Time',
    TO_DATE('2026-03-15','YYYY-MM-DD'), TO_DATE('2026-06-15','YYYY-MM-DD'),
    'Open', 'Build and deploy machine learning models at scale with Python and TensorFlow.',
    '100000-150000', 'Python, TensorFlow, SQL', 2);

INSERT INTO JOB_POSTING VALUES (7, 'Full Stack Developer', 'Engineering',    'Contract',
    TO_DATE('2026-04-10','YYYY-MM-DD'), TO_DATE('2026-07-10','YYYY-MM-DD'),
    'Open', 'Develop end-to-end web applications using React and Node.js.',
    '80000-115000', 'React, Node.js, MongoDB', 5);

INSERT INTO JOB_POSTING VALUES (8, 'React Developer',      'Engineering',    'Part-Time',
    TO_DATE('2026-05-01','YYYY-MM-DD'), TO_DATE('2026-07-31','YYYY-MM-DD'),
    'Open', 'Build React-based SPAs and internal dashboards.',
    '60000-85000', 'React, Redux, TypeScript', 4);

COMMIT;


-- ============================================================
-- STEP 7 — NEW RESUMES
-- ============================================================

INSERT INTO RESUME VALUES (7, 'files/fatima_v1.pdf', 'Full-stack developer with 2 years of MERN stack experience', 'v1', TO_DATE('2025-02-10','YYYY-MM-DD'), 6);
INSERT INTO RESUME VALUES (8, 'files/ali_v1.pdf',    'Java backend developer specialising in Spring Boot microservices', 'v1', TO_DATE('2025-02-15','YYYY-MM-DD'), 7);

COMMIT;


-- ============================================================
-- STEP 8 — NEW APPLICATIONS  (various statuses for variety)
-- app 6: Fatima  → DevOps Engineer   at TechNova   (Offered)
-- app 7: Usman   → ML Engineer       at DataBridge (Screening)
-- app 8: Ali     → Full Stack Dev    at DevForge   (Applied)
-- app 9: Ayesha  → React Developer   at Acme       (Interview)
-- ============================================================

INSERT INTO APPLICATION VALUES (6,  TO_DATE('2026-04-20','YYYY-MM-DD'), 'Passionate about DevOps automation and continuous deployment.',           20, 'Offered',    6, 5, 7);
INSERT INTO APPLICATION VALUES (7,  TO_DATE('2026-05-01','YYYY-MM-DD'), 'ML is my core passion. I want to build models that create real impact.', 9,  'Screening',  5, 6, 6);
INSERT INTO APPLICATION VALUES (8,  TO_DATE('2026-05-02','YYYY-MM-DD'), 'Full-stack is my forte — MERN stack end to end.',                         8,  'Applied',    7, 7, 8);
INSERT INTO APPLICATION VALUES (9,  TO_DATE('2026-05-03','YYYY-MM-DD'), 'I love crafting pixel-perfect React interfaces.',                         7,  'Interview',  4, 8, 5);

COMMIT;


-- ============================================================
-- STEP 9 — NEW INTERVIEWS
-- int 4: PHONE  — Zara   (app 2)  → Omar Sheikh  (DataBridge)
-- int 5: PHONE  — Fatima (app 6)  → Sara Khan    (TechNova)
-- int 6: TECH   — Fatima (app 6)  → Ahmed Raza   (TechNova)
-- int 7: PANEL  — Usman  (app 7)  → Omar Sheikh  (DataBridge)
-- int 8: PHONE  — Ayesha (app 9)  → Hira Jamil   (Acme)
-- ============================================================

INSERT INTO INTERVIEW VALUES (4, 'PHONE', 2, 3);
INSERT INTO INTERVIEW VALUES (5, 'PHONE', 6, 2);
INSERT INTO INTERVIEW VALUES (6, 'TECH',  6, 1);
INSERT INTO INTERVIEW VALUES (7, 'PANEL', 7, 3);
INSERT INTO INTERVIEW VALUES (8, 'PHONE', 9, 5);

-- subtypes
INSERT INTO PHONE_SCREEN   VALUES (4, 20);
INSERT INTO PHONE_SCREEN   VALUES (5, 30);
INSERT INTO TECH_INTERVIEW VALUES (6, 'LeetCode');
INSERT INTO PANEL_INTERVIEW VALUES (7, 4);
INSERT INTO PHONE_SCREEN   VALUES (8, 15);

COMMIT;


-- ============================================================
-- STEP 10 — NEW OFFERS
-- offer 2: Fatima (app 6) — Accepted
-- ============================================================

INSERT INTO OFFER VALUES (
    2,
    TO_DATE('2026-05-05','YYYY-MM-DD'),
    85000,
    'Health insurance, 15 days annual leave, remote work option',
    TO_DATE('2026-06-01','YYYY-MM-DD'),
    'Accepted',
    6
);

COMMIT;


-- ============================================================
-- STEP 11 — NEW HIRING DECISION
-- decision 3: Fatima (app 6) — Hired, Final
-- ============================================================

INSERT INTO HIRING_DECISION VALUES (
    3,
    TO_DATE('2026-05-06','YYYY-MM-DD'),
    'Hired',
    'Strong DevOps skills, proactive attitude and excellent culture fit.',
    'Final',
    6,
    2
);

COMMIT;


-- ============================================================
-- STEP 12 — USER ACCOUNTS  (enables role-based login for demo)
-- ============================================================

-- Company accounts
INSERT INTO USERS VALUES (2,  'TechNova Solutions',  'technova@hms.com',       'tech1234',   'COMPANY',     1, SYSDATE);
INSERT INTO USERS VALUES (3,  'DataBridge Corp',     'databridge@hms.com',     'data1234',   'COMPANY',     2, SYSDATE);
INSERT INTO USERS VALUES (4,  'CloudSphere Inc',     'cloud@hms.com',          'cloud1234',  'COMPANY',     3, SYSDATE);
INSERT INTO USERS VALUES (5,  'Acme Corp',           'acme@hms.com',           'acme1234',   'COMPANY',     4, SYSDATE);
INSERT INTO USERS VALUES (6,  'DevForge Labs',       'devforge@hms.com',       'dev1234',    'COMPANY',     5, SYSDATE);

-- Candidate accounts
INSERT INTO USERS VALUES (7,  'Bilal Hassan',        'bilal.hassan@gmail.com', 'bilal123',   'CANDIDATE',   1, SYSDATE);
INSERT INTO USERS VALUES (8,  'Zara Ahmed',          'zara.ahmed@gmail.com',   'zara123',    'CANDIDATE',   2, SYSDATE);
INSERT INTO USERS VALUES (9,  'Hamza Ali',           'hamza.ali@gmail.com',    'hamza123',   'CANDIDATE',   3, SYSDATE);
INSERT INTO USERS VALUES (10, 'Ayesha Siddiqui',     'ayesha.sid@gmail.com',   'ayesha123',  'CANDIDATE',   4, SYSDATE);
INSERT INTO USERS VALUES (11, 'Usman Tariq',         'usman.tariq@gmail.com',  'usman123',   'CANDIDATE',   5, SYSDATE);
INSERT INTO USERS VALUES (12, 'Fatima Malik',        'fatima.malik@gmail.com', 'fatima123',  'CANDIDATE',   6, SYSDATE);

-- Interviewer accounts
INSERT INTO USERS VALUES (13, 'Ahmed Raza',          'ahmed.raza@technova.pk',        'ahmed123',  'INTERVIEWER', 1, SYSDATE);
INSERT INTO USERS VALUES (14, 'Sara Khan',           'sara.khan@technova.pk',         'sara123',   'INTERVIEWER', 2, SYSDATE);
INSERT INTO USERS VALUES (15, 'Omar Sheikh',         'omar.sheikh@databridge.io',     'omar123',   'INTERVIEWER', 3, SYSDATE);
INSERT INTO USERS VALUES (16, 'Nadia Malik',         'nadia.malik@cloudsphere.pk',    'nadia123',  'INTERVIEWER', 4, SYSDATE);
INSERT INTO USERS VALUES (17, 'Hira Jamil',          'hira.jamil@acmecorp.pk',        'hira123',   'INTERVIEWER', 5, SYSDATE);
INSERT INTO USERS VALUES (18, 'Noman Baig',          'noman.baig@devforge.pk',        'noman123',  'INTERVIEWER', 6, SYSDATE);

COMMIT;
