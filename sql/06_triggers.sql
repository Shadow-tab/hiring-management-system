-- ============================================================
-- FILE: 06_triggers.sql
-- RUN AS: hiring_app
-- PURPOSE: Automatic actions that fire on data changes
-- WHAT IS A TRIGGER: Code that Oracle runs automatically when
--   something happens to a table (INSERT, UPDATE, DELETE).
--   You don't call it — it fires on its own.
-- ============================================================


-- ------------------------------------------------------------
-- TRIGGER 1: Auto-update days_in_pipeline on status change
-- FIRES ON: UPDATE on APPLICATION table
-- PURPOSE: Every time an application's status is updated,
--   recalculate how many days it has been in the pipeline
--   (from applied_date to today).
-- WHY THIS IS USEFUL: You never have to manually calculate
--   days_in_pipeline — Oracle keeps it accurate automatically.
-- ------------------------------------------------------------
CREATE OR REPLACE TRIGGER TRG_UPDATE_PIPELINE_DAYS
BEFORE UPDATE OF status ON APPLICATION
FOR EACH ROW
BEGIN
    -- Calculate days from when they applied until today
    :NEW.days_in_pipeline := TRUNC(SYSDATE) - TRUNC(:OLD.applied_date);

    DBMS_OUTPUT.PUT_LINE(
        'Trigger fired: Application ' || :NEW.application_id ||
        ' pipeline days updated to ' || :NEW.days_in_pipeline
    );
END TRG_UPDATE_PIPELINE_DAYS;
/


-- ------------------------------------------------------------
-- TRIGGER 2: Prevent applying to a closed job
-- FIRES ON: INSERT on APPLICATION table
-- PURPOSE: If someone tries to apply to a job with status
--   'Closed', Oracle will automatically reject the insert
--   and raise an error.
-- WHY THIS IS USEFUL: Enforces business rule at DB level —
--   no application code can bypass this rule.
-- ------------------------------------------------------------
CREATE OR REPLACE TRIGGER TRG_BLOCK_CLOSED_JOB_APPLICATION
BEFORE INSERT ON APPLICATION
FOR EACH ROW
DECLARE
    v_job_status VARCHAR2(50);
BEGIN
    -- Look up the status of the job being applied to
    SELECT status INTO v_job_status
    FROM JOB_POSTING
    WHERE job_id = :NEW.job_id;

    -- Block the insert if job is closed
    IF v_job_status = 'Closed' THEN
        RAISE_APPLICATION_ERROR(
            -20001,
            'Cannot apply: Job posting is Closed.'
        );
    END IF;
END TRG_BLOCK_CLOSED_JOB_APPLICATION;
/


-- ============================================================
-- TEST YOUR TRIGGERS:
-- ============================================================
-- Test Trigger 1 (pipeline days auto-update):
--   SET SERVEROUTPUT ON;
--   UPDATE APPLICATION SET status = 'Screening' WHERE application_id = 1;
--   SELECT application_id, status, days_in_pipeline FROM APPLICATION WHERE application_id = 1;

-- Test Trigger 2 (block closed job):
--   This should FAIL with our error message (job 4 is 'Closed'):
--   INSERT INTO APPLICATION VALUES (99, SYSDATE, 'Test', 0, 'Applied', 1, 4);
-- ============================================================