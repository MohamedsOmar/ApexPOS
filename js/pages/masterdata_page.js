var  actionConfirmed = false
var logFor='JavaScript', pageID = 1, logFile ='masterdata_page.js', logShift = 0, logUser = activeUser
let apexContentContianer
/*================================================================ */
document.addEventListener("DOMContentLoaded", initPage);
async function initPage() {
    try {
        apexContentContianer = document.querySelector('#masterDataAPEXContainer');
        apexContentContianer.style.cssText = 'display:none'
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
    let contentContainer = document.createElement('div')
    contentContainer.id='contentContainer'
    contentContainer.classList.add('content-container','width-100','flow-h','bg-clr-1','t-clr-7')  
    let divContentWrapper = document.createElement('div');
    divContentWrapper.classList.add('content-wrapper','d-flex-c','cntnt-sb','h-100','w-100','d-flx-wrap','t-clr-7');
    divContentWrapper.innerHTML = `
    <div class="content-row d-flex h-100 d-flex-c flex-1 cntnt-sb gap-10 p-10">
        <div class="search-cat d-flex-r w-100 postion-r" id="search-items">
            <div class="navigation-bar h-100" id="navigationBarMenueOpen">
                <div class="nav-bar h-100 d-flex algn-i-c cursor-p">
                    <span class="t-size-5 t-clr-5 fa fa-bars" aria-hidden="true"></span>
                </div>
            </div>
        </div>
    </div>
    <div id="cardsHolder" class="content-row d-flex h-100 d-flex-c flex-1 cntnt-sb gap-10 p-10">
    </div>
    `;
    contentContainer.appendChild(divContentWrapper)
    app.appendChild(contentContainer)
    function moveApexContianer(){
        let appContainer = document.querySelector('#app');
        let contentContainer = appContainer.querySelector('#contentContainer');
        let container = contentContainer.querySelector('#cardsHolder');
        let div = document.createElement('div')
        container.appendChild(div)
        let ul = document.createElement('ul')
            ul.classList.add('d-flex','d-flx-wrap','gap-20')
        apexContentContianer.querySelectorAll('ul li').forEach(ele=>{
            let hrefL = ele.querySelector('a').getAttribute('href');
            let textContent = ele.querySelector('.t-Card-title')?.textContent
            let li = document.createElement('li')
            li.classList.add('flex-1')  
            li.innerHTML = `<a class="card-item w-100 h-100 gap-10 d-flex cntnt-c algn-i-c hover-brdr-btn hover-btn click-btn flex-1"
             href=${hrefL}><span style="font-size: inherit;font-weight: inherit;" class="fa fa-users" aria-hidden="true"></span> ${textContent}</a>`
            ul.appendChild(li)
        })
        div.appendChild(ul)
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
