var  actionConfirmed = false
var logFor='JavaScript', pageID = 1, logFile ='home_page.js', logShift = 0, logUser = activeUser
/*================================================================ */
document.addEventListener("DOMContentLoaded", initPage);
async function initPage() {
    try {
        buildApp()
        await fetchUserAccess();
        await createNavBar(false, false)
        await createPageStructure()
    } catch (err) {
        console.error("initPage():", err);
        errLog(logFor,'initPage()',pageID, logFile,err,logShift,logUser)
    }
}
async function createPageStructure() {
try{
    if(!userPermissions){return}
    let apexContentContianer = document.querySelector('#PageContentContainer');
    let app = document.querySelector('#app')
    let contentContainer = document.createElement('div')
    contentContainer.id='contentContainer'
    contentContainer.classList.add('content-container','width-100','flow-h','bg-clr-1','t-clr-7')  
    let divContentWrapper = document.createElement('div');
    divContentWrapper.classList.add('content-wrapper','d-flex-c','cntnt-sb','h-100','w-100','d-flx-wrap','t-clr-7');
    divContentWrapper.innerHTML = `
    <div class="content-row d-flex h-100 d-flex-c flex-1 cntnt-sb gap-10 p-10  bx-shadow-s bg-clr-3">
        <div class="d-flex-r w-100 postion-r algn-i-c flow-h gap-10" style="height:25px">
            <div class="navigation-bar h-100" id="navigationBarMenueOpen">
                <div class="nav-bar h-100 d-flex algn-i-c cursor-p">
                    <span class="t-size-5 t-clr-5 fa fa-bars" aria-hidden="true"></span>
                </div>
            </div>
            <div class="d-flex-r gap-10 w-100 h-100 algn-i-c" style="height: 25px;font-size: 20px;font-family: auto;">
                <div class="h-100"><img src="${branchLogo}"/></div>
                <div>${branchName}</div>
            </div>
        </div>
    </div>
    <div id="cardsHolder" class="content-row d-flex h-100 d-flex-c flex-1 cntnt-sb gap-10 p-10" style="margin: 0 auto;padding: 30px 0;width: 90%;">
    </div>
    `;
    contentContainer.appendChild(divContentWrapper)
    app.appendChild(contentContainer)
    function moveApexContianer(){
        let appContainer = document.querySelector('#app');
        let contentContainer = appContainer.querySelector('#contentContainer');
        let container = contentContainer.querySelector('#cardsHolder');
        let div = document.createElement('div')
        div.classList.add('bx-shadow-s')
        // div.style.cssText='box-shadow: var(--box-shadow-sec);'
        container.appendChild(div)
        div.appendChild(apexContentContianer)
        apexContentContianer.style.cssText='display:block'
    }
    moveApexContianer()
}catch(err){
    console.error('Err', err)
    errLog(logFor,'createPageStructure()',pageID, logFile,err,logShift,logUser)
}
}

function openCreateAccountingPage(){
    let processName, processDispalyName, processEndDate, processComment
    try{
    createOverlay()
    let overlayConetent = document.querySelector('#overlay-content')
    let div = document.createElement('div')
    div.id = 'contentWrap'
    div.className = 'content-body-wrap'
    div.innerHTML=`
        <div class="content-body" style="width: 400px;height: auto;overflow: visible;">
        <div class="form-wrap">
            <div class="form-title">Create Accounting</div>
            <div class="form-data">
                <div class="content-wrapper d-flex-c w-100 gap-20 cntnt-c algn-i-c">
                    <div class="content-row d-flex gap-10 algn-i-c w-100">
                        <div class="inputGroup">
                            <label for="processEndDate">As Of Date</label>
                            <div class="datePickerContiner">
                                <div class="calendar-main">
                                    <div class="calendar-drop-main" id="calendar-backdrop">
                                        <span class="calendar-drop-text selected-date-text" id="processEndDate"></span>
                                        <svg fill="#fff" width="24px" height="24px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                                            <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                                            <g id="SVGRepo_iconCarrier">
                                                <path
                                                    d="m22 2.25h-3.25v-1.5c-.014-.404-.344-.726-.75-.726s-.736.322-.75.725v.001 1.5h-4.5v-1.5c-.014-.404-.344-.726-.75-.726s-.736.322-.75.725v.001 1.5h-4.5v-1.5c-.014-.404-.344-.726-.75-.726s-.736.322-.75.725v.001 1.5h-3.25c-1.104 0-2 .895-2 1.999v17.75c0 1.105.895 2 2 2h20c1.105 0 2-.895 2-2v-17.75c0-1.104-.896-1.999-2-1.999zm.5 19.75c0 .276-.224.499-.499.5h-20.001c-.276 0-.5-.224-.5-.5v-17.75c.001-.276.224-.499.5-.499h3.25v1.5c.014.404.344.726.75.726s.736-.322.75-.725v-.001-1.5h4.5v1.5c.014.404.344.726.75.726s.736-.322.75-.725v-.001-1.5h4.5v1.5c.014.404.344.726.75.726s.736-.322.75-.725v-.001-1.5h3.25c.276 0 .499.224.499.499z">
                                                </path>
                                                <path d="m5.25 9h3v2.25h-3z"></path>
                                                <path d="m5.25 12.75h3v2.25h-3z"></path>
                                                <path d="m5.25 16.5h3v2.25h-3z"></path>
                                                <path d="m10.5 16.5h3v2.25h-3z"></path>
                                                <path d="m10.5 12.75h3v2.25h-3z"></path>
                                                <path d="m10.5 9h3v2.25h-3z"></path>
                                                <path d="m15.75 16.5h3v2.25h-3z"></path>
                                                <path d="m15.75 12.75h3v2.25h-3z"></path>
                                                <path d="m15.75 9h3v2.25h-3z"></path>
                                            </g>
                                        </svg>
                                    </div>
                                    <div class="calendar-wrapper" id="calendar-wrapper">
                                        <div class="calendar-header">
                                            <div class="calendar-select-main">
                                                <div class="calendar-select-wrapper">
                                                    <div class="calendar-select">
                                                        <div id="selected-month" onclick="toggleDropdownMonth()">
                                                            Select month
                                                        </div>
                                                        <div class="calendar-select-list-wrap" id="month-select"></div>
                                                    </div>
                                                </div>
                                                <div class="calendar-select-wrapper">
                                                    <div class="calendar-select">
                                                        <div id="selected-year" onclick="toggleDropdownYear()">
                                                            Select year
                                                        </div>
                                                        <div class="calendar-select-list-wrap" id="year-select"></div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="icons">
                                                <span id="prevIcon" class="leftIcon">
                                                    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none"
                                                        xmlns="http://www.w3.org/2000/svg">
                                                        <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                                                        <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                                                        <g id="SVGRepo_iconCarrier">
                                                            <path
                                                                d="M14.9991 19L9.83911 14C9.56672 13.7429 9.34974 13.433 9.20142 13.0891C9.0531 12.7452 8.97656 12.3745 8.97656 12C8.97656 11.6255 9.0531 11.2548 9.20142 10.9109C9.34974 10.567 9.56672 10.2571 9.83911 10L14.9991 5"
                                                                stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                                                        </g>
                                                    </svg>
                                                </span>
                                                <span id="nextIcon" class="rightIcon">
                                                    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none"
                                                        xmlns="http://www.w3.org/2000/svg">
                                                        <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                                                        <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                                                        <g id="SVGRepo_iconCarrier">
                                                            <path
                                                                d="M9 5L14.15 10C14.4237 10.2563 14.6419 10.5659 14.791 10.9099C14.9402 11.2539 15.0171 11.625 15.0171 12C15.0171 12.375 14.9402 12.7458 14.791 13.0898C14.6419 13.4339 14.4237 13.7437 14.15 14L9 19"
                                                                stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                                                        </g>
                                                    </svg>
                                                </span>
                                            </div>
                                        </div>
                                        <div class="calendar">
                                            <ul class="weeks">
                                                <li>Su</li>
                                                <li>Mo</li>
                                                <li>Tu</li>
                                                <li>We</li>
                                                <li>th</li>
                                                <li>fr</li>
                                                <li>sa</li>
                                            </ul>
                                            <ul class="days"></ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="content-row d-flex gap-10 algn-i-c  w-100">
                        <div class="inputGroup">
                            <label for="cashamount">Create Accounting Process</label>
                            <div id="selectCreateAccountingProcess" class="ul-select-wrapper input" style="position: relative;">
                                <div class="li-selected" data-value="">Select Process</div>
                                <div class="dropdown-list" style="position: absolute;">
                                    <input placeholder="Search..." type="text" class="dropdown-menu-search">
                                    <ul class="ul-dropdown-inner">
                                        <li value="0" data-value="CREATE_ACCOUNTING_SALES_TRXS">Sales Transactions</li>
                                        <li value="0" data-value="CREATE_ACCOUNTING_REC_EXP">Recurring Expenses</li>
                                        <li value="0" data-value="CREATE_ACCOUNTING_ASSETS">Assets Transactions</li>
                                        <li value="0" data-value="CREATE_ACCOUNTING_PURCAHSING_TRXS">Purchasing Transactions</li>
                                        <li value="0" data-value="CREATE_ACCOUNTING_EMP_TRXS">Employees Transactions</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="content-row d-flex gap-10 algn-i-c  w-100">
                        <div class="inputGroup">
                            <input class="input" required="" autocomplete="off" type="text" id="entryComment">
                            <label for="entryComment">Comment</label>
                        </div>
                    </div>
                </div>
                <div class="btns-wrap d-flex gap-10 w-100 cntnt-c">
                    <button type="button" class="w-fc btn-style" id="createAccounting">Create Accounting</button>
                    <button type="button" class="btn-style" onclick="removerOverlay()">Cancel</button>
                </div>
            </div>
        </div></div>`
    overlayConetent.appendChild(div)
    let parentElement = overlayConetent.querySelector("#selectCreateAccountingProcess");
    setupCustomDropdown(parentElement)
    intializeDatePicker()
    overlayConetent.querySelector('#createAccounting').addEventListener('click',async ()=>{
        processName = overlayConetent.querySelector('#selectCreateAccountingProcess .li-selected').getAttribute('data-value')
        processDispalyName = overlayConetent.querySelector('#selectCreateAccountingProcess .li-selected').textContent
        processEndDate = overlayConetent.querySelector('#processEndDate').textContent
        processComment = overlayConetent.querySelector('#entryComment').value
        if(!processName || !processEndDate || !processComment)return;
        actionConfirmed = await confirmMsg(`Create Accounting for ${processDispalyName}?`)
        if(!actionConfirmed)return;
        removerOverlay()
        sideMessage(`Create Accounting Process Submitted`,'info')
        let res = await creatAccounting(processName, processEndDate, processComment)
        let rowsCount = res.rowsProccessed
        let msg = res.message
        if(res.status =='Error'){
            sideMessage(`Error: ${msg}`,'error')
            return;
        }
        if(processName=='CREATE_ACCOUNTING_SALES_TRXS'){
            res = await creatAccounting('CREATE_ACCOUNTING_SALES_TRXS_SOLD_ITEMS_SUB_PROCESS', processEndDate, processComment)
            rowsCount = rowsCount + res.rowsProccessed
            msg = res.message
            if(res.status =='Error'){
                sideMessage(`Error: ${msg}`,'error')
                return;
            }
        }
        sideMessage(`Create Accounting Process Ended for ${processDispalyName} Successfully - ${rowsCount} Rows Inserted`,'success')
        document.querySelector('#R33157145134648825_search_button').click()
    });
    }catch(err){
        sideMessage(`Create Accounting Process for ${processDispalyName} Ended with Errors`,'error')
        errLog(logFor, `openCreateAccountingPage()`, pageID, logFile, err, logShift, logUser);
    }
}
async function  creatAccounting(processName, processEndDate, processComment) {
    try{
        let response = await apex.server.process(processName,{x01: processEndDate, x02: processComment},{dataType: 'json'})
        return response
    }
    catch(err){
        errLog(logFor, `creatAccounting(${processName}, ${processEndDate}, ${processComment})`, pageID, logFile, err, logShift, logUser);
    }
}
document.querySelector('#createAccounting').addEventListener('click',()=>{
    openCreateAccountingPage()
})
/*================================================================ */
//------------------- Document Elements Events
/*================================================================*/
$(document).on("click", "#navigationBarMenueOpen", () => {
    document.querySelector('#appNavBar').classList.add('nav-active')
});
$(document).on("click", "#navigationBarMenueClose", () => {
    document.querySelector('#appNavBar').classList.remove('nav-active')
});
