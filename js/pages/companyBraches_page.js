var  actionConfirmed = false
var logFor='JavaScript', pageID = 1, logFile ='masterdata_page.js', logShift = 0, logUser = activeUser
let apexContentContianer
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
    apexContentContianer = document.querySelector('#companyBranchesTable');
    let companyBranchesTable_search_button = document.querySelector('#companyBranchesTable_search_button')
        companyBranchesTable_search_button?.click()
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
    <div id="cardsHolder" class="content-row d-flex h-100 d-flex-c flex-1 cntnt-sb gap-10 p-10" style="max-width:100%">
    </div>
    `;
    contentContainer.appendChild(divContentWrapper)
    app.appendChild(contentContainer)
    function moveApexContianer(){
        let appContainer = document.querySelector('#app');
        let contentContainer = appContainer.querySelector('#contentContainer');
        let container = contentContainer.querySelector('#cardsHolder');
        let div = document.createElement('div')
        div.style.cssText='box-shadow: var(--box-shadow-sec);'
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

/*================================================================ */
//------------------- Document Elements Events
/*================================================================*/
$(document).on("click", "#navigationBarMenueOpen", () => {
    document.querySelector('#appNavBar').classList.add('nav-active')
});
$(document).on("click", "#navigationBarMenueClose", () => {
    document.querySelector('#appNavBar').classList.remove('nav-active')
});
