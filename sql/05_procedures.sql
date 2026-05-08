-- ============================================================
-- FILE: 05_procedures.sql
-- RUN AS: hiring_app
-- PURPOSE: Stored procedures for all business logic
-- ============================================================

-- ------------------------------------------------------------
-- PROCEDURE 1: Add a new Candidate
-- TYPE: INSERT
-- CALL: EXEC SP_ADD_CANDIDATE(6,'Ali','Raza','ali@gmail.com','0311-1234','Lahore','Java');
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
    DBMS_OUTPUT.PUT_LINE('Candidate added: ' || p_first || ' ' || p_last);
EXCEPTION
    WHEN DUP_VAL_ON_INDEX THEN
        DBMS_OUTPUT.PUT_LINE('ERROR: Email already exists.');
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('ERROR: ' || SQLERRM);
        ROLLBACK;
END SP_ADD_CANDIDATE;
/


-- ------------------------------------------------------------
-- PROCEDURE 2: Submit an Application
-- TYPE: INSERT
-- CALL: EXEC SP_SUBMIT_APPLICATION(6, 3, 1, 2, 'Cover letter text');
-- ------------------------------------------------------------
CREATE OR REPLACE PROCEDURE SP_SUBMIT_APPLICATION (
    p_app_id    IN NUMBER,
    p_cand_id   IN NUMBER,
    p_job_id    IN NUMBER,
    p_resume_id IN NUMBER,
    p_cover     IN VARCHAR2
)
AS
BEGIN
    INSERT INTO APPLICATION (
        application_id, applied_date, cover_letter,
        days_in_pipeline, status, candidate_id, job_id, resume_id
    )
    VALUES (
        p_app_id, SYSDATE, p_cover,
        0, 'Applied', p_cand_id, p_job_id, p_resume_id
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
-- TYPE: UPDATE
-- CALL: EXEC SP_UPDATE_APP_STATUS(1, 'Offered');
-- ------------------------------------------------------------
CREATE OR REPLACE PROCEDURE SP_UPDATE_APP_STATUS (
    p_app_id    IN NUMBER,
    p_status    IN VARCHAR2
)
AS
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM APPLICATION
    WHERE application_id = p_app_id;

    IF v_count = 0 THEN
        DBMS_OUTPUT.PUT_LINE('ERROR: Application not found: ' || p_app_id);
    ELSE
        UPDATE APPLICATION
        SET status = p_status
        WHERE application_id = p_app_id;
        COMMIT;
        DBMS_OUTPUT.PUT_LINE('Application ' || p_app_id || ' updated to: ' || p_status);
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('ERROR: ' || SQLERRM);
        ROLLBACK;
END SP_UPDATE_APP_STATUS;
/


-- ------------------------------------------------------------
-- PROCEDURE 4: Delete a Candidate
-- TYPE: DELETE
-- NOTE: Deletes all child rows in correct FK order first
-- CALL: EXEC SP_DELETE_CANDIDATE(6);
-- ------------------------------------------------------------
CREATE OR REPLACE PROCEDURE SP_DELETE_CANDIDATE (
    p_cand_id IN NUMBER
)
AS
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM CANDIDATE WHERE candidate_id = p_cand_id;

    IF v_count = 0 THEN
        DBMS_OUTPUT.PUT_LINE('ERROR: Candidate not found.');
    ELSE
        -- Step 1: Delete interview subtypes first
        DELETE FROM PHONE_SCREEN WHERE interview_id IN (
            SELECT I.interview_id FROM INTERVIEW I
            JOIN APPLICATION A ON I.application_id = A.application_id
            WHERE A.candidate_id = p_cand_id
        );
        DELETE FROM TECH_INTERVIEW WHERE interview_id IN (
            SELECT I.interview_id FROM INTERVIEW I
            JOIN APPLICATION A ON I.application_id = A.application_id
            WHERE A.candidate_id = p_cand_id
        );
        DELETE FROM PANEL_INTERVIEW WHERE interview_id IN (
            SELECT I.interview_id FROM INTERVIEW I
            JOIN APPLICATION A ON I.application_id = A.application_id
            WHERE A.candidate_id = p_cand_id
        );

        -- Step 2: Delete interviews
        DELETE FROM INTERVIEW WHERE application_id IN (
            SELECT application_id FROM APPLICATION
            WHERE candidate_id = p_cand_id
        );

        -- Step 3: Delete hiring decisions and offers
        DELETE FROM HIRING_DECISION WHERE application_id IN (
            SELECT application_id FROM APPLICATION
            WHERE candidate_id = p_cand_id
        );
        DELETE FROM OFFER WHERE application_id IN (
            SELECT application_id FROM APPLICATION
            WHERE candidate_id = p_cand_id
        );

        -- Step 4: Delete applications and resumes
        DELETE FROM APPLICATION WHERE candidate_id = p_cand_id;
        DELETE FROM RESUME      WHERE candidate_id = p_cand_id;

        -- Step 5: Delete candidate
        DELETE FROM CANDIDATE WHERE candidate_id = p_cand_id;

        COMMIT;
        DBMS_OUTPUT.PUT_LINE('Candidate ' || p_cand_id || ' deleted.');
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('ERROR: ' || SQLERRM);
        ROLLBACK;
END SP_DELETE_CANDIDATE;
/


-- ============================================================
-- TEST:
-- SET SERVEROUTPUT ON;
-- EXEC SP_ADD_CANDIDATE(6,'Test','User','test@mail.com','0300-0000000','Lahore','Testing');
-- EXEC SP_SUBMIT_APPLICATION(6, 6, 1, 1, 'Test cover letter');
-- EXEC SP_UPDATE_APP_STATUS(6, 'Screening');
-- EXEC SP_DELETE_CANDIDATE(6);
-- ============================================================