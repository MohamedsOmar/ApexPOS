DECLARE
    pending_records          NUMBER;
    l_def_accs_count          NUMBER;
    l_user_id         NUMBER;
    l_rows_affected   NUMBER := 0;
    l_error_message   VARCHAR2(4000); 
    -- l_as_of_date  DATE := to_date(apex_application.g_x01, 'yyy-mm-dd');
    l_create_accounting_comment   Varchar(255):= apex_application.g_x02;
BEGIN
    l_user_id := NULL;
    l_error_message := NULL;

BEGIN
    SELECT COUNT(*) 
    INTO l_def_accs_count
    FROM APP_ACCOUNTS_MAPPING aam 
    WHERE aam.ACC_INT_NAME_ID IN('EMP_BONUS_ACCOUNT', 'EMP_LOANS_ACCOUNT','EMP_PENALTY_ACCOUNT', 'EMP_FINANCIAL_CUSTODY','EMP_PURCHASING_ACCOUNT');
END;
IF l_def_accs_count <> 5 THEN
        apex_json.open_object;
            apex_json.write('status', 'Error');
            apex_json.write('rowsProccessed', 0);
            apex_json.write('message','Some Of default Accounts not Defined');
        apex_json.close_object;
        Return;
END IF;

    -- Get Records Created
    SELECT COUNT(*)
    INTO pending_records
    FROM EMP_TRANSACTIONS
    WHERE POSTED_REC <> 1 
    OR PAID_TRX_POSTED_REC <> 1;
    IF pending_records = 0 THEN
        apex_json.open_object;
            apex_json.write('status', 'Success');
            apex_json.write('rowsProccessed', 0);
            apex_json.write('message','No Records Pending for Posting');
        apex_json.close_object;
        Return;
    END IF;

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

    -- Bulk INSERT Bouns for Employees Debit Side
    INSERT INTO APP_Ledger(POSTED_REC,ENTRY_ACC,TRX_DATE,DEBIT_SIDE,ENTRY_DESCRIPTION,ENTRY_SRC,CREATED_BY,UPDATED_BY,POST_DATE,COMPANY_ID)
    SELECT 
        1,TRX_ACCOUNT, TRUNC(sysdate), TRX_AMOUNT, 'Employees Transactions, '|| TRUNC(sysdate) || ' - ' || l_create_accounting_comment,
        'Employees Transactions Accounting Porcess',l_user_id, l_user_id, SYSDATE, EMP_BRANCH
    FROM (
        SELECT
            et.TRX_DATE,
            et.TRX_TYPE,
            et.TRX_AMOUNT,
            et.POSTED_REC,
            aam.ACC_ID TRX_ACCOUNT,
            au.EMP_BRANCH,
            et.C_CHILD_ACCOUNT Cash_Account
        FROM EMP_TRANSACTIONS et, APP_ACCOUNTS_MAPPING aam, APP_USERS au
        where 1=1 
            and au.EMP_ID = et.EMP_ID
            and et.TRX_TYPE = aam.ACC_INT_NAME_ID
            and et.POSTED_REC <> 1
            and et.TRX_TYPE IN('EMP_BONUS_ACCOUNT')
    );
    l_rows_affected := SQL%ROWCOUNT + l_rows_affected;
    -- Bulk INSERT Bouns for Employees Credit Side
    INSERT INTO APP_Ledger(POSTED_REC,ENTRY_ACC,TRX_DATE,CREDIT_SIDE,ENTRY_DESCRIPTION,ENTRY_SRC,CREATED_BY,UPDATED_BY,POST_DATE,COMPANY_ID)
    SELECT 
        1,Cash_Account, TRUNC(sysdate), TRX_AMOUNT, 'Employees Transactions, '|| TRUNC(sysdate) || ' - ' || l_create_accounting_comment,
        'Employees Transactions Accounting Porcess',l_user_id, l_user_id, SYSDATE, EMP_BRANCH
    FROM (
        SELECT
            et.TRX_DATE,
            et.TRX_TYPE,
            et.TRX_AMOUNT,
            et.POSTED_REC,
            aam.ACC_ID TRX_ACCOUNT,
            au.EMP_BRANCH,
            et.C_CHILD_ACCOUNT Cash_Account
        FROM EMP_TRANSACTIONS et, APP_ACCOUNTS_MAPPING aam, APP_USERS au
        where 1=1 
            and au.EMP_ID = et.EMP_ID
            and et.TRX_TYPE = aam.ACC_INT_NAME_ID
            and et.POSTED_REC <> 1
            and et.TRX_TYPE IN('EMP_BONUS_ACCOUNT')
    );
    l_rows_affected := SQL%ROWCOUNT + l_rows_affected;


    -- Bulk INSERT Penalty for Employees Debit Side
    INSERT INTO APP_Ledger(POSTED_REC,ENTRY_ACC,TRX_DATE,DEBIT_SIDE,ENTRY_DESCRIPTION,ENTRY_SRC,CREATED_BY,UPDATED_BY,POST_DATE,COMPANY_ID)
    SELECT 
        1,Cash_Account, TRUNC(sysdate), TRX_AMOUNT, 'Employees Transactions, '|| TRUNC(sysdate) || ' - ' || l_create_accounting_comment,
        'Employees Transactions Accounting Porcess',l_user_id, l_user_id, SYSDATE, EMP_BRANCH
    FROM (
        SELECT
            et.TRX_DATE,
            et.TRX_TYPE,
            et.TRX_AMOUNT,
            et.POSTED_REC,
            aam.ACC_ID TRX_ACCOUNT,
            au.EMP_BRANCH,
            et.C_CHILD_ACCOUNT Cash_Account
        FROM EMP_TRANSACTIONS et, APP_ACCOUNTS_MAPPING aam, APP_USERS au
        where 1=1 
            and au.EMP_ID = et.EMP_ID
            and et.TRX_TYPE = aam.ACC_INT_NAME_ID
            and et.POSTED_REC <> 1
            and et.TRX_TYPE IN('EMP_PENALTY_ACCOUNT')
    );
    -- Bulk INSERT Penalty for Employees Credit Side
    INSERT INTO APP_Ledger(POSTED_REC,ENTRY_ACC,TRX_DATE,CREDIT_SIDE ,ENTRY_DESCRIPTION,ENTRY_SRC,CREATED_BY,UPDATED_BY,POST_DATE,COMPANY_ID)
    SELECT 
        1,TRX_ACCOUNT, TRUNC(sysdate), TRX_AMOUNT, 'Employees Transactions, '|| TRUNC(sysdate) || ' - ' || l_create_accounting_comment,
        'Employees Transactions Accounting Porcess',l_user_id, l_user_id, SYSDATE, EMP_BRANCH
    FROM (
        SELECT
            et.TRX_DATE,
            et.TRX_TYPE,
            et.TRX_AMOUNT,
            et.POSTED_REC,
            aam.ACC_ID TRX_ACCOUNT,
            au.EMP_BRANCH,
            et.C_CHILD_ACCOUNT Cash_Account
        FROM EMP_TRANSACTIONS et, APP_ACCOUNTS_MAPPING aam, APP_USERS au
        where 1=1 
            and au.EMP_ID = et.EMP_ID
            and et.TRX_TYPE = aam.ACC_INT_NAME_ID
            and et.POSTED_REC <> 1
            and et.TRX_TYPE IN('EMP_PENALTY_ACCOUNT')
    );
    l_rows_affected := SQL%ROWCOUNT + l_rows_affected;

    -- Bulk INSERT Other Trxs for Employees Debit Side
    INSERT INTO APP_Ledger(POSTED_REC,ENTRY_ACC,TRX_DATE,DEBIT_SIDE ,ENTRY_DESCRIPTION,ENTRY_SRC,CREATED_BY,UPDATED_BY,POST_DATE,COMPANY_ID)
    SELECT 
        1,TRX_ACCOUNT, TRUNC(sysdate), TRX_AMOUNT, 'Employees Transactions, '|| TRUNC(sysdate) || ' - ' || l_create_accounting_comment,
        'Employees Transactions Accounting Porcess',l_user_id, l_user_id, SYSDATE, EMP_BRANCH
    FROM (
        SELECT
            et.TRX_DATE,
            et.TRX_TYPE,
            et.TRX_AMOUNT,
            et.POSTED_REC,
            aam.ACC_ID TRX_ACCOUNT,
            au.EMP_BRANCH,
            et.C_CHILD_ACCOUNT Cash_Account
        FROM EMP_TRANSACTIONS et, APP_ACCOUNTS_MAPPING aam, APP_USERS au
        where 1=1 
            and au.EMP_ID = et.EMP_ID
            and et.TRX_TYPE = aam.ACC_INT_NAME_ID
            and et.POSTED_REC <> 1
            and et.TRX_TYPE  IN('EMP_LOANS_ACCOUNT','EMP_FINANCIAL_CUSTODY','EMP_PURCHASING_ACCOUNT')
    );
    l_rows_affected := SQL%ROWCOUNT + l_rows_affected;
    -- Bulk INSERT Other Trxs for Employees Credit Side
    INSERT INTO APP_Ledger(POSTED_REC,ENTRY_ACC,TRX_DATE, CREDIT_SIDE  ,ENTRY_DESCRIPTION,ENTRY_SRC,CREATED_BY,UPDATED_BY,POST_DATE,COMPANY_ID)
    SELECT 
        1,Cash_Account, TRUNC(sysdate), TRX_AMOUNT, 'Employees Transactions, '|| TRUNC(sysdate) || ' - ' || l_create_accounting_comment,
        'Employees Transactions Accounting Porcess',l_user_id, l_user_id, SYSDATE, EMP_BRANCH
    FROM (
        SELECT
            et.TRX_DATE,
            et.TRX_TYPE,
            et.TRX_AMOUNT,
            et.POSTED_REC,
            aam.ACC_ID TRX_ACCOUNT,
            au.EMP_BRANCH,
            et.C_CHILD_ACCOUNT Cash_Account
        FROM EMP_TRANSACTIONS et, APP_ACCOUNTS_MAPPING aam, APP_USERS au
        where 1=1 
            and au.EMP_ID = et.EMP_ID
            and et.TRX_TYPE = aam.ACC_INT_NAME_ID
            and et.POSTED_REC <> 1
            and et.TRX_TYPE  IN('EMP_LOANS_ACCOUNT','EMP_FINANCIAL_CUSTODY','EMP_PURCHASING_ACCOUNT')
    );
    l_rows_affected := SQL%ROWCOUNT + l_rows_affected;

    -- Bulk INSERT Other Trxs for Employees Debit Side (Paid Trxs)
    INSERT INTO APP_Ledger(POSTED_REC,ENTRY_ACC,TRX_DATE,DEBIT_SIDE  ,ENTRY_DESCRIPTION,ENTRY_SRC,CREATED_BY,UPDATED_BY,POST_DATE,COMPANY_ID)
    SELECT 
        1,Cash_Account, TRUNC(sysdate), TRX_AMOUNT, 'Employees Transactions, '|| TRUNC(sysdate) || ' - ' || l_create_accounting_comment,
        'Employees Transactions Accounting Porcess',l_user_id, l_user_id, SYSDATE, EMP_BRANCH
    FROM (
        SELECT
            et.TRX_DATE,
            et.TRX_TYPE,
            et.TRX_AMOUNT,
            et.POSTED_REC,
            aam.ACC_ID TRX_ACCOUNT,
            au.EMP_BRANCH,
            et.C_CHILD_ACCOUNT Cash_Account
        FROM EMP_TRANSACTIONS et, APP_ACCOUNTS_MAPPING aam, APP_USERS au
        where 1=1 
            and au.EMP_ID = et.EMP_ID
            and et.TRX_TYPE = aam.ACC_INT_NAME_ID
            and et.PAID_TRX_POSTED_REC <> 1
            and et.EMP_PAID_TRX = 1
            and et.TRX_TYPE  IN('EMP_LOANS_ACCOUNT','EMP_FINANCIAL_CUSTODY','EMP_PURCHASING_ACCOUNT')
    );
    l_rows_affected := SQL%ROWCOUNT + l_rows_affected;

    -- Bulk INSERT Other Trxs for Employees Credit Side (Paid Trxs)
    INSERT INTO APP_Ledger(POSTED_REC,ENTRY_ACC,TRX_DATE,CREDIT_SIDE ,ENTRY_DESCRIPTION,ENTRY_SRC,CREATED_BY,UPDATED_BY,POST_DATE,COMPANY_ID)
    SELECT 
        1,TRX_ACCOUNT, TRUNC(sysdate), TRX_AMOUNT, 'Employees Transactions, '|| TRUNC(sysdate) || ' - ' || l_create_accounting_comment,
        'Employees Transactions Accounting Porcess',l_user_id, l_user_id, SYSDATE, EMP_BRANCH
    FROM (
        SELECT
            et.TRX_DATE,
            et.TRX_TYPE,
            et.TRX_AMOUNT,
            et.POSTED_REC,
            aam.ACC_ID TRX_ACCOUNT,
            au.EMP_BRANCH,
            et.C_CHILD_ACCOUNT Cash_Account
        FROM EMP_TRANSACTIONS et, APP_ACCOUNTS_MAPPING aam, APP_USERS au
        where 1=1 
            and au.EMP_ID = et.EMP_ID
            and et.TRX_TYPE = aam.ACC_INT_NAME_ID
            and et.PAID_TRX_POSTED_REC <> 1
            and et.EMP_PAID_TRX = 1
            and et.TRX_TYPE  IN('EMP_LOANS_ACCOUNT','EMP_FINANCIAL_CUSTODY','EMP_PURCHASING_ACCOUNT')
    );
    l_rows_affected := SQL%ROWCOUNT + l_rows_affected;

    -- Updating Post Status for Records in sales Invoice Paymnets
    BEGIN
        UPDATE EMP_TRANSACTIONS SET  POSTED_REC = 1;
        UPDATE EMP_TRANSACTIONS SET  PAID_TRX_POSTED_REC = 1 WHERE EMP_PAID_TRX = 1;
    END;
    BEGIN
        UPDATE EMP_TRANSACTIONS et SET et.PAID_TRX_POSTED_REC = 1 
        where 1=1 
            and et.POSTED_REC = 1
            and et.TRX_TYPE IN('EMP_BONUS_ACCOUNT','EMP_PENALTY_ACCOUNT');
    END;

    -- Log successful processing
    INSERT INTO APP_LOG(LOG_FOR, LOG_ERR_BY, LOG_PAGE_ID, LOG_FILE, LOG_ERR, LOG_SHIFT, LOG_USER, CREATION_DATE,LOG_STATUS) 
    VALUES('PL/SQL', 'Post GL Entries', 'Post Process POS_PAYMENT', 'Process', 'Success: ' || l_rows_affected || ' rows inserted', 0, l_user_id, SYSDATE,'Success: Create Accounting for POS_PAYMENTS PL/SQL');
    COMMIT;
    -- Return JSON to JS
    apex_json.open_object;
        apex_json.write('status', 'Success');
        apex_json.write('rowsProccessed', l_rows_affected);
        apex_json.write('message','Create Accounting Process Ended Successfully');
    apex_json.close_object;

EXCEPTION
    WHEN NO_DATA_FOUND THEN
        ROLLBACK;
        l_error_message := 'No data found in one of the SELECT statements';
    -- Return JSON to JS
        apex_json.open_object;
        apex_json.write('status', 'Success');
        apex_json.write('rowsProccessed', 0);
        apex_json.write('message', l_error_message);
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
        apex_json.write('rowsProccessed', 0);
        apex_json.write('message', l_error_message);
        apex_json.close_object;
END;