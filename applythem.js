
#WORKSPACE_FILES#main#MIN#.js

applySavedTheme()

#WORKSPACE_FILES#normailize#MIN#.css
#WORKSPACE_FILES#main#MIN#.css



form#wwvFlowForm {
    min-height: 100vh;
    background-color: var(--bg-clr-1);
    color: var(--t-clr-1);
}

delete-btn
apply-btn

btn-style-wa

UPDATE_DEFAULT_VALUE
BEGIN
    IF :P25_MAIN_BRANCH = 'Y' THEN
        UPDATE COMPANY_BRANCHES 
        SET MAIN_BRANCH = 'N';
 
        UPDATE COMPANY_BRANCHES 
        SET MAIN_BRANCH = 'Y' 
        WHERE BRANCH_ID = :P25_BRANCH_ID;
    END IF;
END;

SELECT EMP_ID
FROM app_users
WHERE UPPER(:APP_USER) = UPPER(EMP_NAME)


WHERE tr.DELETED <> 1
DECODE(tr.DEFAULT_VALUE, 'Y','Yes','No') "Default",
DECODE(tr.TR_ENABLED, 'Y', 'Active','Inactive') Status
(select cb.BRANCH_NAME from COMPANY_BRANCHES cb where cb.BRANCH_ID = u.EMP_BRANCH) EMP_BRANCH,
(select au.EMP_NAME from app_users au where au.EMP_ID = u.CREATED_BY) CREATED_BY,
(select au.EMP_NAME from app_users au where au.EMP_ID = u.UPDATED_BY) UPDATED_BY,