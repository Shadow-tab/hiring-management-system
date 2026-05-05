-- ============================================================
-- FILE: 05_procedures.sql
-- RUN AS: hiring_app
-- PURPOSE: Stored procedures for business logic
-- WHAT IS A PROCEDURE: A named block of PL/SQL code stored in
--   the database. You call it by name and pass parameters.
--   Think of it like a function in programming.
-- ============================================================


-- ------------------------------------------------------------
-- PROCEDURE 1: Add a new Candidate
-- PURPOSE: Insert a new candidate record safely
-- PARAMETERS:
--   p_id         → candidate ID (you provide it)
--   p_first      → first name
--   p_last       → last name
--   p_email      → email address
--   p_phone      → phone number
--   p_location   → city/location
--   p_skills     → comma-separated skills
-- HOW TO CALL:
--   EXEC SP_ADD_CANDIDATE(6,'Ali','Raza','ali@gmail.com','0311-1234','Lahore','Java, Spring Boot');
-- ------------------------------------------------------------
CREATE OR REPLACE PROCEDURE SP_ADD_CANDIDATE (
    p_id        IN NUMBER,
    p_first     IN VARCHAR2,
    p_last      IN VARCHAR2,
    p_email     IN VARCHAR2,
    p_phone     IN VARCHAR2,
    p_location  IN VARCHAR2,
    p_skills    IN VARCHAR2
)
AS
BEGIN
    INSERT INTO CANDIDATE (
        candidate_id, first_name, last_name,
        email, phone, location, reg_date, skills
    )
    VALUES (
        p_id, p_first, p_last,
        p_email, p_phone, p_location, SYSDATE, p_skills
    );

    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Candidate added successfully: ' || p_first || ' ' || p_last);

EXCEPTION
    -- If email already exists (UNIQUE constraint), catch the error
    WHEN DUP_VAL_ON_INDEX THEN
        DBMS_OUTPUT.PUT_LINE('ERROR: A candidate with this email already exists.');
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('ERROR: ' || SQLERRM);
        ROLLBACK;
END SP_ADD_CANDIDATE;
/


-- ------------------------------------------------------------
-- PROCEDURE 2: Submit an Application
-- PURPOSE: Insert a new application linking candidate to job
-- PARAMETERS:
--   p_app_id     → application ID
--   p_cand_id    → which candidate is applying
--   p_job_id     → which job they are applying to
--   p_cover      → cover letter text
-- HOW TO CALL:
--   EXEC SP_SUBMIT_APPLICATION(6, 3, 1, 'I would love to join your team.');
-- ------------------------------------------------------------
CREATE OR REPLACE PROCEDURE SP_SUBMIT_APPLICATION (
    p_app_id    IN NUMBER,
    p_cand_id   IN NUMBER,
    p_job_id    IN NUMBER,
    p_cover     IN VARCHAR2
)
AS
BEGIN
    INSERT INTO APPLICATION (
        application_id, applied_date, cover_letter,
        days_in_pipeline, status, candidate_id, job_id
    )
    VALUES (
        p_app_id, SYSDATE, p_cover,
        0, 'Applied', p_cand_id, p_job_id
    );

    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Application submitted. ID: ' || p_app_id);

EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('ERROR: ' || SQLERRM);
        ROLLBACK;
END SP_SUBMIT_APPLICATION;
/


-- ------------------------------------------------------------
-- PROCEDURE 3: Update Application Status
-- PURPOSE: Move an application through the hiring pipeline
-- PARAMETERS:
--   p_app_id     → which application to update
--   p_status     → new status (Screening / Interview / Offered / Rejected)
-- HOW TO CALL:
--   EXEC SP_UPDATE_APP_STATUS(1, 'Offered');
-- ------------------------------------------------------------
CREATE OR REPLACE PROCEDURE SP_UPDATE_APP_STATUS (
    p_app_id    IN NUMBER,
    p_status    IN VARCHAR2
)
AS
    v_count NUMBER;
BEGIN
    -- First check the application actually exists
    SELECT COUNT(*) INTO v_count
    FROM APPLICATION
    WHERE application_id = p_app_id;

    IF v_count = 0 THEN
        DBMS_OUTPUT.PUT_LINE('ERROR: No application found with ID ' || p_app_id);
    ELSE
        UPDATE APPLICATION
        SET status = p_status
        WHERE application_id = p_app_id;

        COMMIT;
        DBMS_OUTPUT.PUT_LINE('Application ' || p_app_id || ' status updated to: ' || p_status);
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('ERROR: ' || SQLERRM);
        ROLLBACK;
END SP_UPDATE_APP_STATUS;
/


-- ------------------------------------------------------------
-- PROCEDURE 4: Delete a Candidate (and their applications)
-- PURPOSE: Remove a candidate record from the system
-- NOTE: We delete applications first because of foreign key
--   constraints — you can't delete a parent row while
--   child rows still reference it.
-- HOW TO CALL:
--   EXEC SP_DELETE_CANDIDATE(6);
-- ------------------------------------------------------------
CREATE OR REPLACE PROCEDURE SP_DELETE_CANDIDATE (
    p_cand_id IN NUMBER
)
AS
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM CANDIDATE
    WHERE candidate_id = p_cand_id;

    IF v_count = 0 THEN
        DBMS_OUTPUT.PUT_LINE('ERROR: Candidate not found.');
    ELSE
        -- Delete child records first
        DELETE FROM APPLICATION WHERE candidate_id = p_cand_id;
        DELETE FROM RESUME      WHERE candidate_id = p_cand_id;

        -- Now safe to delete the candidate
        DELETE FROM CANDIDATE   WHERE candidate_id = p_cand_id;

        COMMIT;
        DBMS_OUTPUT.PUT_LINE('Candidate ' || p_cand_id || ' deleted successfully.');
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('ERROR: ' || SQLERRM);
        ROLLBACK;
END SP_DELETE_CANDIDATE;
/


-- ============================================================
-- TEST YOUR PROCEDURES:
-- ============================================================
-- SET SERVEROUTPUT ON;
-- EXEC SP_ADD_CANDIDATE(6,'Test','User','test@mail.com','0300-0000000','Lahore','Testing');
-- EXEC SP_SUBMIT_APPLICATION(6, 6, 1, 'Test cover letter');
-- EXEC SP_UPDATE_APP_STATUS(6, 'Screening');
-- EXEC SP_DELETE_CANDIDATE(6);