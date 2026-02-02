DECLARE
    l_ACC_ID          NUMBER;
    l_PAGE_ID         NUMBER;
    l_ACC_INT_NAME_ID VARCHAR2(255);
    l_user_id         NUMBER;
    l_rows_affected   NUMBER := 0;
    l_error_message   VARCHAR2(4000); 
    -- l_as_of_date  DATE := to_date(apex_application.g_x01, 'yyy-mm-dd');
    l_create_accounting_comment   Varchar(255):= apex_application.g_x02;
BEGIN
    l_user_id := NULL;
    l_error_message := NULL;
    -- Get account
    BEGIN
        SELECT ACC_INT_NAME_ID, ACC_ID, PAGE_ID
        INTO l_ACC_INT_NAME_ID, l_ACC_ID, l_PAGE_ID
        FROM APP_ACCOUNTS_MAPPING
        WHERE ACC_INT_NAME_ID = 'POS_PAYMENT_ACC'
        AND ROWNUM = 1;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            l_error_message := 'POS_PAYMENT_ACC not found in APP_ACCOUNTS_MAPPING';
            RAISE_APPLICATION_ERROR(-20001, l_error_message);
        WHEN TOO_MANY_ROWS THEN
            l_error_message := 'Multiple POS_PAYMENT_ACC records found';
            RAISE_APPLICATION_ERROR(-20002, l_error_message);
    END;
    -- Get user ID
    BEGIN
        SELECT EMP_ID
        INTO l_user_id
        FROM APP_USERS 
        WHERE UPPER(EMP_NAME) = UPPER(:APP_USER)
        AND ROWNUM = 1;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            l_error_message := 'User ' || :APP_USER || ' not found in APP_USERS';
            RAISE_APPLICATION_ERROR(-20003, l_error_message);
        WHEN TOO_MANY_ROWS THEN
            l_error_message := 'Multiple users with name ' || :APP_USER || ' found';
            RAISE_APPLICATION_ERROR(-20004, l_error_message);
    END;
    -- Bulk INSERT
    INSERT INTO APP_Ledger(POST_DATE, TRX_DATE, DEBIT_SIDE, ENTRY_DESCRIPTION, ENTRY_SRC, CREATED_BY, UPDATED_BY, POSTED_REC, ENTRY_ACC)
    SELECT SYSDATE, TRUNC(PAYMENT_DATE), PAYMENT_AMT, 
        'POS Payments, ' || l_create_accounting_comment, 'POS Page', 
        l_user_id, l_user_id, 1, l_ACC_ID
    FROM (
        SELECT 
            TRUNC(PAYMENT_DATE) AS PAYMENT_DATE,
            SUM(PAYMENT_AMT) AS PAYMENT_AMT
        FROM SALES_INV_PAY
        WHERE POSTED_REC <> 1
            AND DELETED <> 1
        GROUP BY TRUNC(PAYMENT_DATE)
        HAVING SUM(PAYMENT_AMT) <> 0
    );
    l_rows_affected := SQL%ROWCOUNT;
    -- Log successful processing
    INSERT INTO APP_LOG(LOG_FOR, LOG_ERR_BY, LOG_PAGE_ID, LOG_FILE, LOG_ERR, LOG_SHIFT, LOG_USER, CREATION_DATE,LOG_STATUS) VALUES(
        'PL/SQL', 
        'Post GL Entries', 
        'Post Process POS_PAYMENT', 
        'Process', 
        'Success: ' || l_rows_affected || ' rows inserted', 
        0, 
        l_user_id, 
        SYSDATE,
        'Success: Create Accounting for POS_PAYMENTS PL/SQL'
    );
    -- DBMS_OUTPUT.PUT_LINE('Process completed successfully. Rows inserted: ' || l_rows_affected);
    BEGIN
        FOR rec IN (
            SELECT ROWID as rid FROM SALES_INV_PAY
            WHERE POSTED_REC <> 1
                AND DELETED <> 1
                AND PAYMENT_AMT IS NOT NULL
                AND PAYMENT_AMT <> 0
        ) LOOP
            UPDATE SALES_INV_PAY SET POSTED_REC = 1 WHERE ROWID = rec.rid;
        END LOOP;
        COMMIT;
    END;

    COMMIT;

  -- Return JSON to JS
    apex_json.open_object;
    apex_json.write('status', 'SUCCESS');
    apex_json.write('rows_proccessed', l_rows_affected);
    apex_json.close_object;

EXCEPTION
    WHEN NO_DATA_FOUND THEN
        ROLLBACK;
        l_error_message := 'No data found in one of the SELECT statements';
        -- DBMS_OUTPUT.PUT_LINE(l_error_message);
        
        INSERT INTO APP_LOG(LOG_FOR, LOG_ERR_BY, LOG_PAGE_ID, LOG_FILE, LOG_ERR, LOG_SHIFT, LOG_USER, CREATION_DATE,LOG_STATUS) 
        VALUES('PL/SQL', 'Post GL Entries', 'Post Process POS_PAYMENT', 'Process', l_error_message, 0, NVL(l_user_id, 0), SYSDATE,'Error: Create Accounting for POS_PAYMENTS PL/SQL');
        COMMIT;
    -- Return JSON to JS
        apex_json.open_object;
        apex_json.write('status', 'Error');
        apex_json.write('rows_proccessed', 0);
        apex_json.close_object;
        
    WHEN TOO_MANY_ROWS THEN
        ROLLBACK;
        l_error_message := 'Multiple rows found where only one was expected';
        DBMS_OUTPUT.PUT_LINE(l_error_message);
        
        INSERT INTO APP_LOG(LOG_FOR, LOG_ERR_BY, LOG_PAGE_ID, LOG_FILE, LOG_ERR, LOG_SHIFT, LOG_USER, CREATION_DATE,LOG_STATUS)
        VALUES('PL/SQL', 'Post GL Entries', 'Post Process POS_PAYMENT', 'Process', l_error_message, 0, NVL(l_user_id, 0), SYSDATE,'Error: Create Accounting for POS_PAYMENTS PL/SQL');
        COMMIT;

    -- Return JSON to JS
        apex_json.open_object;
        apex_json.write('status', 'Error');
        apex_json.write('err', l_error_message);
        apex_json.close_object;

    WHEN OTHERS THEN
        ROLLBACK;
        l_error_message := 'Error: ' || SQLERRM;
        DBMS_OUTPUT.PUT_LINE(l_error_message);
        INSERT INTO APP_LOG(LOG_FOR, LOG_ERR_BY, LOG_PAGE_ID, LOG_FILE, LOG_ERR, LOG_SHIFT, LOG_USER, CREATION_DATE,LOG_STATUS) 
        VALUES('PL/SQL', 'Post GL Entries', 'Post Process POS_PAYMENT', 'Process', l_error_message,  0, NVL(l_user_id, 0), SYSDATE,'Error: Create Accounting for POS_PAYMENTS PL/SQL');
        COMMIT;
        RAISE_APPLICATION_ERROR(-20005, l_error_message);
    -- Return JSON to JS
        apex_json.open_object;
        apex_json.write('status', 'Error');
        apex_json.write('err', l_error_message);
        apex_json.close_object;
END;