DECLARE
    l_cogs_ACC_ID          NUMBER;
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
        SELECT ACC_ID
        INTO l_cogs_ACC_ID
        FROM APP_ACCOUNTS_MAPPING
        WHERE ACC_INT_NAME_ID = 'COGS_ACCOUNT'
        AND ROWNUM = 1;
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

    -- Bulk INSERT COGS & Lower Inventory
    INSERT INTO APP_Ledger(POSTED_REC,ENTRY_ACC,TRX_DATE,CREDIT_SIDE ,ENTRY_DESCRIPTION,ENTRY_SRC,CREATED_BY,UPDATED_BY,POST_DATE,COMPANY_ID)
    SELECT 
        1,C_CHILD_ACCOUNT, TRUNC(INV_DATE), LINE_COGS, 'POS Payments, '|| TRUNC(INV_DATE) || ' - ' || l_create_accounting_comment,'POS Page',l_user_id, l_user_id, SYSDATE, INV_BRANCH
    FROM (
        SELECT INV_DATE, INV_BRANCH, C_CHILD_ACCOUNT, SUM(LINE_COGS) LINE_COGS
        FROM(
            SELECT 
                TRUNC(sih.INV_DATE)  INV_DATE,
                sih.INV_BRANCH,
                NVL(si.C_CHILD_ACCOUNT, (SELECT ACC_ID FROM APP_ACCOUNTS_MAPPING WHERE ACC_INT_NAME_ID = 'INVENTORY_DEFAULT_ACCOUNT')) C_CHILD_ACCOUNT,
                si.ITEM_COST * sil.QTY LINE_COGS 
            FROM SALES_INVOICE_LINES sil,
                SALES_INV_HEADER sih,
                SALES_ITEMS si
            WHERE 1=1 
                and sil.INV_ID = sih.INV_ID
                and si.ITEM_ID = sil.ITEM_ID
                and sil.INV_ID = sih.INV_ID
                and sih.DELETED     <> 1
                AND sih.POSTED_REC  <> 1
                AND sih.INV_CLOSED  <> 0
                AND sil.DELETED     <> 1
                AND sil.POSTED_REC  <> 1
        )
        GROUP BY INV_DATE, INV_BRANCH, C_CHILD_ACCOUNT
        HAVING SUM(LINE_COGS) <> 0
    );
    l_rows_affected := SQL%ROWCOUNT + l_rows_affected;
    -- Bulk Crediting Inventory
    INSERT INTO APP_Ledger(POSTED_REC,ENTRY_ACC,TRX_DATE,DEBIT_SIDE,ENTRY_DESCRIPTION,ENTRY_SRC,CREATED_BY,UPDATED_BY,POST_DATE,COMPANY_ID)
    SELECT 
        1,l_cogs_ACC_ID, TRUNC(INV_DATE), LINE_COGS, 'POS Payments, '|| TRUNC(INV_DATE) || ' - ' || l_create_accounting_comment,'POS Page',l_user_id, l_user_id, SYSDATE, INV_BRANCH
    FROM (
        SELECT INV_DATE, INV_BRANCH, SUM(LINE_COGS) LINE_COGS
        FROM(
            SELECT 
                TRUNC(sih.INV_DATE)  INV_DATE,
                sih.INV_BRANCH,
                NVL(si.C_CHILD_ACCOUNT, (SELECT ACC_ID FROM APP_ACCOUNTS_MAPPING WHERE ACC_INT_NAME_ID = 'INVENTORY_DEFAULT_ACCOUNT')) C_CHILD_ACCOUNT,
                si.ITEM_COST * sil.QTY LINE_COGS 
            FROM SALES_INVOICE_LINES sil,
                SALES_INV_HEADER sih,
                SALES_ITEMS si
            WHERE 1=1 
                and sil.INV_ID = sih.INV_ID
                and si.ITEM_ID = sil.ITEM_ID
                and sil.INV_ID = sih.INV_ID
                and sih.DELETED     <> 1
                AND sih.POSTED_REC  <> 1
                AND sih.INV_CLOSED  <> 0
                AND sil.DELETED     <> 1
                AND sil.POSTED_REC  <> 1
        )
        GROUP BY INV_DATE, INV_BRANCH
        HAVING SUM(LINE_COGS) <> 0
    );
    l_rows_affected := SQL%ROWCOUNT + l_rows_affected;

    -- Updating Post Status for Records in sales Invoice Paymnets
    BEGIN
        UPDATE SALES_INV_HEADER sih
        SET    POSTED_REC = 1
        WHERE  sih.DELETED     <> 1
        AND  sih.POSTED_REC  <> 1
        AND  sih.INV_CLOSED  <> 0;

        UPDATE SALES_INVOICE_LINES sil
        SET    POSTED_REC = 1
        WHERE  sil.DELETED    <> 1
        AND  sil.POSTED_REC <> 1
        AND  EXISTS (
            SELECT 1
            FROM   SALES_INV_HEADER sih
            WHERE  sih.INV_ID      = sil.INV_ID
            AND  sih.DELETED     <> 1
            AND  sih.POSTED_REC  <> 1  
            AND  sih.INV_CLOSED  <> 0   
        );
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