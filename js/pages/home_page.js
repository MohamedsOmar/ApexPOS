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
    let app = document.querySelector('#app')
    let pos = document.createElement('div')
    pos.id='pos-container'
    pos.classList.add('pos-conatiner','width-100','flow-h','bg-clr-1','t-clr-7')  
    let divposWrapper = document.createElement('div');
    divposWrapper.classList.add('pos-wrapper','d-flex','cntnt-sb','h-100','w-100','d-flx-wrap','t-clr-7');
    divposWrapper.innerHTML = `
    <div class="pos-select d-flex h-100 d-flex-c flex-1 cntnt-sb gap-10 p-10">
        <div class="search-cat d-flex-r w-100 postion-r" id="search-items">
            <div class="navigation-bar h-100" id="navigationBarMenueOpen">
                <div class="nav-bar h-100 d-flex algn-i-c cursor-p">
                    <span class="t-size-5 t-clr-5 fa fa-bars" aria-hidden="true"></span>
                </div>
            </div>
            <div class="input-group flex-1">
                <input type="text" placeholder="Search..." class="item-search-input">
                <span class="fa fa-search t-clr-5" aria-hidden="true"></span>
            </div>
        </div>
    </div>
    `;
    pos.appendChild(divposWrapper)
    app.appendChild(pos)
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
