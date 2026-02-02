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
    console.log('Err', err)
    errLog(logFor,'createPageStructure()',pageID, logFile,err,logShift,logUser)
}
}


function openCreateAccountingPage(){
    try{
    createOverlay()
    let posOverlay = document.getElementById('overlay-container');
        // posOverlay.style.backgroundColor = '#00000040'
    let overlayConetent = document.querySelector('#overlay-content')
    let div = document.createElement('div')
    div.id = 'contentWrap'
    div.className = 'content-body-wrap'
    div.innerHTML=`
        <div class="content-body" style="width: 400px;height: auto">
        <div class="form-wrap">
            <div class="form-title">Create Accounting</div>
            <div class="form-data">
                <div class="content-wrapper d-flex-c w-100 gap-20 cntnt-c algn-i-c">
                    <div class="content-row d-flex gap-10 algn-i-c  w-100">
                        <div class="inputGroup">
                            <label for="cashamount">Create Accounting Process</label>
                            <div id="selectCreateAccountingProcess" class="ul-select-wrapper input" style="position: relative;">
                                <div class="li-selected" data-value="">Select Value</div>
                                <div class="dropdown-list" style="position: absolute;">
                                    <input placeholder="Search..." type="text" class="dropdown-menu-search">
                                    <ul class="ul-dropdown-inner">
                                        <li value="0" data-value="CREATE_ACCOUNTING_POS_PAYMENTS">POS Payment</li>
                                        <li value="0" data-value="CREATE_ACCOUNTING_POS_PAYMENTS">POS Payment</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="content-row d-flex gap-10 algn-i-c w-100">
                        <div class="inputGroup">
                            <input class="input" required="" autocomplete="off" type="date" id="processEndDate">
                            <label for="processEndDate">As Of Date</label>
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
    overlayConetent.querySelector('#createAccounting').addEventListener('click',async ()=>{
        let processName = overlayConetent.querySelector('#selectCreateAccountingProcess .li-selected').getAttribute('data-value')
        let processDispalyName = overlayConetent.querySelector('#selectCreateAccountingProcess .li-selected').textContent
        let processEndDate = overlayConetent.querySelector('#processEndDate').value
        let processComment = overlayConetent.querySelector('#entryComment').value
        if(!processName || !processEndDate || !processComment)return;
        actionConfirmed = await confirmMsg(`Create Accounting for ${processDispalyName}?`)
        if(!actionConfirmed)return;
        removerOverlay()
        sideMessage(`Create Accounting Process Submitted`,'info')
        let res = await creatAccounting(processName, processEndDate, processComment)
        console.log(res)
        sideMessage(`Create Accounting Process Ended for ${processDispalyName} Successfully`,'success')
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
