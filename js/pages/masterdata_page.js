var  actionConfirmed = false
var logFor='JavaScript', pageID = 1, logFile ='masterdata_page.js', logShift = 0, logUser = activeUser
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
    let apexContentContianer = document.querySelector('#masterDataAPEXContainer');
    let app = document.querySelector('#app')
    let contentContainer = document.createElement('div')
    contentContainer.id='contentContainer'
    contentContainer.classList.add('content-container','width-100','flow-h','bg-clr-1','t-clr-7')  
    let divContentWrapper = document.createElement('div');
    divContentWrapper.classList.add('content-wrapper','d-flex-c','cntnt-sb','h-100','w-100','d-flx-wrap','t-clr-7');
    divContentWrapper.innerHTML = `
    <div class="content-row d-flex h-100 d-flex-c flex-1 cntnt-sb gap-10 p-10">
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
        container.appendChild(div)
        let ul = document.createElement('ul')
            ul.classList.add('d-grid','d-flx-wrap','gap-20')
            ul.style.cssText='grid-template-columns: repeat(auto-fill, minmax(390px, 1fr));' 
        apexContentContianer.querySelectorAll('ul li').forEach(ele=>{
            let hrefL = ele.querySelector('a').getAttribute('href');
            let textContent = ele.querySelector('.t-Card-title')?.textContent
            let li = document.createElement('li')
            li.classList.add('flex-1','d-flex','cntnt-c','algn-i-c')  
            // li.style.cssText='min-width:500px' 
            li.innerHTML = `<a class="card-item w-100 h-100 gap-10 d-flex-c cntnt-c algn-i-c hover-brdr-btn hover-btn click-btn flex-1" style="height: 150px;"
                href=${hrefL}><span style="font-size: inherit;font-weight: inherit;" class="fa fa-users" aria-hidden="true"></span> ${textContent}</a>`
            ul.appendChild(li)
        })
        div.appendChild(ul)
    }
    moveApexContianer()
}catch(err){
    console.error('Err', err)
    errLog(logFor,'createPageStructure()',pageID, logFile,err,logShift,logUser)
}
}
