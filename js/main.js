let userPermissions, 
    sessionID = apex.env.APP_SESSION,
    appID = apex.env.APP_ID,
    activeUser = apex.env.APP_USER
let branchLogo, branchID,branchName,branchRegNum,branchTaxNum, branchCurrencySymbole, allowZeroItemSelling
let baseUrl = `https://g6d02ee2f2519a5-financeapp.adb.ca-toronto-1.oraclecloudapps.com/ords/api/app/`
var logFor='JavaScript', pageID = 0, logFile ='main.js', logShift = 0, logUser = activeUser
// console.log(apex.env.APP_PAGE_ID)
let discountAccess = false,
    createCashAccess = false,
    createCustomerAccess = false,
    posCashierOnlyAccess = false,
    overRideTaxAccess = false,
    posCashierAdmin = false

const accessRoles = {
    SUPER_USER:       "96268806872996572510171386761347521866",
    CREATE_CUSTOMER: "95959979848418912790978149798646558686",
    POS_CASHIER:     "95950591706144986175657814674178211076",
    CREATE_CASH:     "95960885256253348064994365834003120777",
    DISCOUNT:        "95945194037845973039104600264428639250",
    OVERRIDE_TAX:    "96158064198195796792531173456791398221"
};
const pages = {
    companyBranches: `/ords/r/api/carved/company-profile-page?session=${sessionID}`,
    homePage: `/ords/r/api/carved/home-page?session=${sessionID}`,
    masterDataPage: `/ords/r/api/carved/master-data-page?session=${sessionID}`,
    salesInvoicePage :`/ords/r/api/carved/sales-invoice-page?=${sessionID}`,
    posPage :`/ords/r/api/carved/pos-si-page?session=${sessionID}`,
    accountingPage :`/ords/r/api/carved/accounting?session=${sessionID}`,
    employeeTrxsPage :`/ords/r/api/carved/employees-transactions-page?session=${sessionID}`,
    logOutUrl :`apex_authentication.logout?p_app_id=101&p_session_id=${sessionID}`,
}
async function getBranchData(){
    let option = `?q={"empinternalname":"${activeUser}"}`
    let endPoint = `appUsers${option}`
    let res = await fetchAPI(endPoint)
        res = res[0]
    let branchid = res.branchid
    endPoint = `companyInfo/${branchid}`
    res = await fetchAPI(endPoint)
    res = res[0]
    branchLogo = res.branchLogo
    branchID = res.branchID
    branchName = res.branchName
    branchRegNum = res.branchRegNum
    branchTaxNum = res.branchTaxNum
    branchCurrencySymbole = res.branchCurrencySymbole
    allowZeroItemSelling =  res.allowZeroItemSelling =='Y' ? true : false
}
function buildApp(){
    let div = document.createElement('div')
    div.id = 'app'
    div.style.cssText = 'width:auto;height:auto;position:relative'
    document.body.appendChild(div)
    let divMessage = document.createElement('div')
    divMessage.id = 'sideMessage'
    divMessage.classList.add('postion-a','cntnt-c','algn-i-c','p-20','t-bold')
    divMessage.innerHTML = `
    <div class="msgContent-wrap d-flex-r gap-10 algn-i-c cntnt-c"> 
        <div class="msgIcon"><span class="fa "></span></div>
        <div class="msgContent"></div>
    </div>`
    div.appendChild(divMessage)
}
async function fetchUserAccess() {
try{
    // let data = await apex.server.process('GET_USER_ACCESS',{},{dataType: 'json'})
        userPermissions = await fetchAPI(`userAccess/${activeUser.toUpperCase()}`)|| [];
    if (userPermissions.length) {
        const grantedRoles = new Set(userPermissions.map(item => item.roleid));
        posCashierAdmin = grantedRoles.has(accessRoles.SUPER_USER);
        createCustomerAccess   = posCashierAdmin || grantedRoles.has(accessRoles.CREATE_CUSTOMER);
        posCashierOnlyAccess   = grantedRoles.has(accessRoles.POS_CASHIER);
        createCashAccess       = posCashierAdmin || grantedRoles.has(accessRoles.CREATE_CASH);
        discountAccess         = posCashierAdmin || grantedRoles.has(accessRoles.DISCOUNT);
        overRideTaxAccess      = posCashierAdmin || grantedRoles.has(accessRoles.OVERRIDE_TAX);
        console.log("User Access →", {
            createCustomerAccess,
            posCashierOnlyAccess,
            createCashAccess,
            discountAccess,
            overRideTaxAccess,
            posCashierAdmin
        });
        // if(posCashierOnlyAccess){
        //     document.querySelector('.t-Body .t-Body-nav').style.display = 'none'
        //     document.querySelector('.t-Header .t-Header-controls').style.display = 'none'
        //     document.querySelector('.t-Header .t-Header-logo .t-Header-logo-link').removeAttribute('href')
        // }
    } else {
        userPermissions = null;
    }
}catch(err){
    console.error('Err:', err);
    errLog(logFor,'fetchUserAccess()',pageID, logFile,err,logShift,logUser)
    apex.message.alert('Server error while fetching user access');
}
}
async function createNavBar(closeShift, cashEntry){
    await getBranchData()
    let app = document.querySelector('#app')
    let appNavBar = document.createElement('div')
        appNavBar.id = 'appNavBar'
        appNavBar.classList.add('appNavBar','t-clr-7')
    let div = document.createElement('div')
    div.classList.add('nav-bar-wrapper','bx-shadow-s','p-10','h-100','bg-clr-3');
    div.innerHTML=`
        <div class="nav-bar-content d-flex-c cntnt-sb gap-10 h-100 postion-r flow-h">
            <div id="navigationBarMenueClose" class="postion-a click-btn d-flex algn-i-c cntnt-c cursor-p t-clr-5">
                <span class="fa fa-times-circle t-size-5 t-clr-9" aria-hidden="true"></span>
            </div>
            <div class="nav-logo d-flex-c gap-10">
                <div class="d-flex-c algn-i-c cntnt-c t-size-4 gap-10">
                    <div class="img-holder" style="width: 120px;height: 120px;">
                        <!--<img src="r/carved/101/files/static/v6/icons/app-icon-256-rounded.png"/> -->
                        <img src="${branchLogo}"/>
                    </div>
                    <div>${branchName}</div>
                    <div class="t-size-t">User: ${activeUser}</div>
                </div>
            </div>
            <ul class="nav-pages d-flex-c gap-10 flex-1">
                <li class="d-flex hover-brdr-btn p-10 brdr-r-m t-size-m click-btn">
                    <a href=${pages.homePage} class=" t-clr-5 d-flex w-100 algn-i-c cntnt-fs gap-10">
                        <span class="fa fa fa-home" aria-hidden="true"></span>
                        <span>Dashboard</span>
                    </a>
                </li>
                <li class="d-flex hover-brdr-btn p-10 brdr-r-m t-size-m click-btn">
                    <a href=${pages.companyBranches} class=" t-clr-5 d-flex w-100 algn-i-c cntnt-fs gap-10">
                        <span class="fa fa fa-home" aria-hidden="true"></span>
                        <span>Company Branches</span>
                    </a>
                </li>
                <li class="d-flex hover-brdr-btn p-10 brdr-r-m t-size-m click-btn">
                    <a href=${pages.masterDataPage} class=" t-clr-5 d-flex w-100 algn-i-c cntnt-fs gap-10">
                        <span class="fa fa fa-home" aria-hidden="true"></span>
                        <span>Master Data</span>
                    </a>
                </li>
                <li class="d-flex hover-brdr-btn p-10 brdr-r-m t-size-m click-btn">
                    <a href=${pages.accountingPage} class=" t-clr-5 d-flex w-100 algn-i-c cntnt-fs gap-10">
                        <span class="fa fa fa-home" aria-hidden="true"></span>
                        <span>Accounting</span>
                    </a>
                </li>
                <li class="d-flex hover-brdr-btn p-10 brdr-r-m t-size-m click-btn">
                    <a href=${pages.employeeTrxsPage} class=" t-clr-5 d-flex w-100 algn-i-c cntnt-fs gap-10">
                        <span class="fa fa fa-home" aria-hidden="true"></span>
                        <span>Employees Transactions</span>
                    </a>
                </li>
                <li class="d-flex hover-brdr-btn p-10 brdr-r-m t-size-m click-btn">
                    <a href=${pages.salesInvoicePage} class=" t-clr-5 d-flex w-100 algn-i-c cntnt-fs gap-10">
                        <span class="fa fa fa-home" aria-hidden="true"></span>
                        <span>Sales Invoice Page</span>
                    </a>
                </li>
                <li class="d-flex hover-brdr-btn p-10 brdr-r-m t-size-m click-btn">
                    <a href=${pages.posPage}  class=" t-clr-5 d-flex w-100 algn-i-c cntnt-fs gap-10">
                        <span class="fa fa fa-home" aria-hidden="true"></span>
                        <span>POS Page</span>
                    </a>
                <li class="d-flex hover-brdr-btn p-10 brdr-r-m t-size-m click-btn" onclick="openModelPages('Create Customer', 7)">
                    <div class=" t-clr-5 d-flex w-100 algn-i-c cntnt-fs gap-10">
                        <span class="fa fa fa-home" aria-hidden="true"></span>
                        <span>SI-Invoice</span>
                    </div>
                </li>
            </ul>
            <div class="nav-actions d-flex-c gap-10 p-10 t-size-4 t-clr-5">
                ${createCashAccess && cashEntry ? `
                    <div class="w-100 btn-style-brdr d-flex algn-i-c cntnt-c gap-10 hover-brdr-btn p-10 brdr-r-m t-size-m click-btn" 
                        id="createCashEntryBtn" onclick="createCashEnrty()">
                        <span class="t-size-m fa fa-bitcoin" aria-hidden="true"></span>
                        <span>Cash In/Out</span>
                    </div>
                ` : ''}

                <div class="toggle-wrapper">
                    <label for="switch" class="toggle">
                        <input type="checkbox" class="input" id="switch" />
                        <div class="icon icon--moon" onclick="toggleTheme()">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
                                <path fill-rule="evenodd"
                                d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z"
                                clip-rule="evenodd" ></path>
                            </svg>
                        </div>
                        <div class="icon icon--sun" onclick="toggleTheme()">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
                                <path
                                d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"
                                ></path>
                            </svg>
                        </div>
                    </label>
                </div>
                ${closeShift? 
                `<div class="w-100 btn-style d-flex-r gap-10 cntnt-c algn-i-c t-size-m hover-brdr-btn click-btn p-10 brdr-r-m" 
                    onclick="closeOpenShift()">
                    <span class="fa fa-times-square" aria-hidden="true"></span>
                    <div>Close Shift</div>
                </div>`:''}
                <a href=${pages.logOutUrl} class="delete-btn w-100 d-flex-r gap-10 cntnt-c algn-i-c t-size-m click-btn p-10 brdr-r-m">
                    <span class="fa fa-sign-out" aria-hidden="true"></span>
                    <div>Log Out</div>
                </a>
            </div>
        </div>
    `
    appNavBar.appendChild(div)
    app.appendChild(appNavBar)
    applySavedTheme()
    document.querySelector('#appNavBar').addEventListener('click',(e)=>{
        let ele = e.target.id
        if(ele !='appNavBar')return
        document.querySelector('#appNavBar').classList.remove('nav-active')
    })
}
$(document).on("click", "#navigationBarMenueOpen", () => {
    // Open Navigation Bar
    document.querySelector('#appNavBar').classList.add('nav-active')
});
$(document).on("click", "#navigationBarMenueClose", () => {
    // Close Navigation Bar
    document.querySelector('#appNavBar').classList.remove('nav-active')
});
// /*================================================================ */
// //------------------------- Callback Functions
// /*================================================================*/
async function openModelPages(ptitle,pageId){
    try{
        let pData = await  apex.server.process("GET_MODEL_PAGE_URL",{x01: pageId},{dataType: "text"})
        apex.navigation.dialog(pData,{
            title: ptitle,         
            width: '100vw',
            // height: 'auto',          
            modal: true,
            resizable: "yes",
            draggable: "yes",
            dialogOptions: {
                open: function() {
                    setTimeout(adjustHeight, 100);
                }
            }
        });
        function adjustHeight(){
            let modelPageContainer = document.querySelector('.ui-dialog.ui-draggable')
                modelPageContainer.style.height ='100vh'
        }
    }
    catch(err){
        console.error(`Err: ${err}`)
        errLog(logFor,`openModelPages(${ptitle},${pageId})`,pageID, logFile,err,logShift,logUser)
    }
}
function toggleTheme() {
    const html = document.documentElement;
    const current = html.classList.contains('dark') ? 'light' : 'dark';
    html.classList.remove('light', 'dark');
    html.classList.add(current);
    localStorage.setItem('theme', current);
    const icon = document.querySelector('#switch');
    icon.checked  = current == 'dark' ? false : true
}
function applySavedTheme(){
try{
    let saved = localStorage.getItem('theme');
    if (!saved) {
        saved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.classList.add(saved);
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem('theme')) {
            document.documentElement.classList.toggle('dark', e.matches);
        }
    });
    const icon = document.querySelector('#switch');
    if(icon){
        icon.checked  = saved == 'dark' ? false : true
    }
}catch(err){}
};
/*================================================================ */
//------------------------- Callback Functions
/*================================================================*/
async function fetchAPI(endPoint){
    try{
        const apiUrl = `${baseUrl}${endPoint}`; 
        const response = await fetch(apiUrl);
        if (!response.ok) {
            errLog(logFor, `fetchAPI(${endPoint})`, pageID, logFile, `${response.status}`, logShift, logUser);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const res = await response.json();
        let hasMore = res.hasMore
        const items = res.items;
        return items; 
    } catch(err){
        console.error(err);
        if (typeof errLog === 'function') {
            errLog(logFor, `fetchAPI(${endPoint})`, pageID, logFile, err, logShift, logUser);
        }
        throw err; 
    }
}

function createCashEnrty(){
    if(!openShiftID){openNewShift(); return}
    createOverlay()
    let posOverlay = document.getElementById('overlay-container');
        posOverlay.style.backgroundColor = '#00000040'
    let overlayConetent = document.querySelector('#overlay-content')
    let div = document.createElement('div')
    div.id = 'contentWrap'
    div.className = 'content-body-wrap'
    div.innerHTML=`
        <div class="content-body" style="width: 400px;height: auto">
        <div class="form-wrap">
            <div class="form-title">Create Cash In/Out</div>
            <div class="form-data">
                <div class="content-wrapper d-flex-c w-100 gap-20 cntnt-c algn-i-c">
                    <div class="content-row d-flex gap-10 algn-i-c  w-100">
                        <div class="inputGroup">
                            <label for="cashamount">Entry Type</label>
                            <div id="selectCashEntryType" class="ul-select-wrapper input" style="position: relative;">
                                <div class="li-selected" data-value="cash out">Cash Out</div>
                                <div class="dropdown-list" style="position: absolute;">
                                    <input placeholder="Search..." type="text" class="dropdown-menu-search">
                                    <ul class="ul-dropdown-inner">
                                        <li value="0" data-value="cash out">Cash Out</li>
                                        <li value="0" data-value="cash In">Cash In</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="content-row d-flex gap-10 algn-i-c w-100">
                        <div class="inputGroup">
                            <input class="input" required="" autocomplete="off" type="number" >
                            <label for="cashamount">Amount</label>
                        </div>
                    </div>
                    <div class="content-row d-flex gap-10 algn-i-c  w-100">
                        <div class="inputGroup">
                            <input class="input" required="" autocomplete="off" type="text" id="entryDescription">
                            <label for="cashamount">Description</label>
                        </div>
                    </div>
                </div>
                <div class="btns-wrap d-flex gap-10 w-100 cntnt-c">
                    <button type="button" class="btn-style" id="createCashEntry">Create</button>
                    <button type="button" class="btn-style" onclick="removerOverlay()">Cancel</button>
                </div>
            </div>
        </div></div>`
    overlayConetent.appendChild(div)
    const parentElement = overlayConetent.querySelector("#selectCashEntryType");
    setupCustomDropdown(parentElement)

    overlayConetent.querySelector('#createCashEntry').addEventListener('click', postCashEntry);
    function postCashEntry(){
        let type = overlayConetent.querySelector('#selectCashEntryType .li-selected').getAttribute('data-value');
        let amount = overlayConetent.querySelector('input[type="number"]').value;
        let description = overlayConetent.querySelector('#entryDescription').value;
        if(!type || !amount || !description){
            const existingError = overlayConetent.querySelector('.err-message');
            const shiftEle = overlayConetent.querySelector('.content-wrapper');
            if (existingError) {
                existingError.remove();
            }
            let errorDiv = document.createElement('div')
            errorDiv.className = 'err-message'
            errorDiv.textContent = '**You Must Enter a Value for All Fields'
            shiftEle.parentNode.insertBefore(errorDiv, shiftEle.nextSibling);
            return 
        };
        apex.server.process(
        "CREATE_CASH_ENTRY",
        {
            x01: openShiftID,
            x02: type,
            x03: amount,
            x04: description
        },
        {
            dataType: "json",
            success: function (data) {
                if(data.status =='SUCCESS'){
                    successMessage(`Entry ${data.entryNo} Created Successfully`)
                    removerOverlay()
                }
            },
            error: function (err) {
            removerOverlay()
            console.error(err);
            apex.message.alert("Server error while saving line");
            },
        });
    }

}
function formatAccounting(value) {
    if(typeof value == 'undefined'){value= 0};
    return new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}
function createOverlay(){
    let div = document.createElement('div')
    div.classList.add('overlay-container','d-flex','cntnt-c','algn-i-c')
    div.id ='overlay-container'
    div.innerHTML =` <div class="overlay-content" id="overlay-content"></div>`
    document.body.appendChild(div)
    document.body.style.overflow = 'hidden'
}
function removerOverlay(){
    let posOverlay = document.getElementById('overlay-container')
    posOverlay.remove()
    document.body.style.overflow = 'auto'
}
function removeElementWithID(eleID){
    let eleToRemove = document.getElementById(eleID)
    eleToRemove.remove()
}
//------------------------- Error Message
function showLoader(elementToAppend){
    elementToAppend.style.position = 'relative';
    let div = document.createElement('div');
    div.classList.add('loading-animation')
    div.id = 'loadingAnimation'
    div.style.cssText=`position: absolute;width: 100%;height: 100%;top: 0;background: #00000000;left: 50%;
                        top: 50%;transform: translate(-50%, -50%);height: 100%;display: flex;justify-content: center;
                        align-items: center;`
    div.innerHTML=`
        <div id="wifi-loader">
            <svg class="circle-outer" viewBox="0 0 86 86">
                <circle class="back" cx="43" cy="43" r="40"></circle>
                <circle class="front" cx="43" cy="43" r="40"></circle>
                <circle class="new" cx="43" cy="43" r="40"></circle>
            </svg>
            <svg class="circle-middle" viewBox="0 0 60 60">
                <circle class="back" cx="30" cy="30" r="27"></circle>
                <circle class="front" cx="30" cy="30" r="27"></circle>
            </svg>
            <svg class="circle-inner" viewBox="0 0 34 34">
                <circle class="back" cx="17" cy="17" r="14"></circle>
                <circle class="front" cx="17" cy="17" r="14"></circle>
            </svg>
            <div class="text" data-text="Loading"></div>
        </div>`
    
    elementToAppend.appendChild(div)
}
function removeLaoder(appendedParent){
    appendedParent.style.position = null;
    let posLoading = document.getElementById('loadingAnimation')
    posLoading.remove()
}
function sideMessage(msg, msgType){
    let types = {
        error :  {icon:'fa-exclamation-circle', bgColor:'#f11313', tColor:'#fff'},
        warning: {icon:'fa-warning', bgColor:'#ffee00', tColor:'#fff'},
        success: {icon:'fa-check-circle', bgColor:'#13f168', tColor:'#fff'},
        info :   {icon:'fa-info-circle', bgColor:'#05a3ff', tColor:'#fff'},
    }  
    let selectedType = types[msgType];
    let sideMessage = document.querySelector('#sideMessage')
    let msgContent = sideMessage.querySelector('.msgContent')
    let msgIcon = sideMessage.querySelector('.msgIcon span')
    sideMessage.style.cssText = `background-color:${selectedType.bgColor}; color:${selectedType.tColor}`

    msgContent.textContent = msg
    msgIcon.classList.remove('fa-exclamation-circle','fa-warning','fa-check-circle','fa-info-circle')
    msgIcon.classList.add(selectedType.icon)
    sideMessage.style.display = 'flex'
    sideMessage.addEventListener('click',()=>{
        sideMessage.style.display = 'none';
    })
    // setTimeout(() => {
    //     sideMessage.style.display = 'none';
    // }, 3000);
}
function confirmMsg(msg, title = "Confirm") {
    return new Promise((resolve) => {
        const div = document.createElement('div');
        div.classList.add('overlay-container', 'd-flex', 'cntnt-c', 'algn-i-c');
        div.id = 'overlay-container';
        div.innerHTML = `
            <div class="overlay-content" id="overlay-content">
                <div id="confirmMsg" class="content-body-wrap" style="z-index: 2;">
                    <div class="content-body" style="width: auto; height:auto; z-index: 2;">
                        <div class="form-wrap wrap d-flex-c gap-10 cntnt-sb">
                            <div class="form-title">${title}</div>
                            <div class="form-data">
                                <div class="content-wrapper d-flex-c gap-10 p-10 cntnt-c">
                                    <div class="content-row d-flex-c gap-10 algn-i-c">
                                        ${msg}
                                    </div>
                                </div>
                                <div class="btns-wrap d-flex gap-10 w-100 cntnt-c p-10">
                                    <button type="button" class="btn-style" id="confirmedOk">Ok</button>
                                    <button type="button" class="btn-style" id="confirmedCancel">Cancel</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(div);
        const close = () => {div.remove();};
        const okBtn    = div.querySelector('#confirmedOk');
        const cancelBtn = div.querySelector('#confirmedCancel');
        okBtn.addEventListener('click', () => {
            close();
            resolve(true);
        }, { once: true});
        cancelBtn.addEventListener('click', () => {
            close();
            resolve(false);
        },{ once: true});
        const onEscape = (e) => {
            if (e.key === 'Escape') {
                close();
                resolve(false);
                document.removeEventListener('keydown', onEscape);
            }
        };
        document.addEventListener('keydown', onEscape);
    });
}
//------------------------- Error Log
async function errLog(logFor,errFunction,pageID, logFile,logErr,logShift,logUser){
    try{
        let errorTxt = logErr
        if(typeof errorTxt =='object'){
            errorTxt= `Status Text: ${errorTxt.statusText}, Response Text: ${errorTxt.responseText}`
        }
        await apex.server.process('POST_LOG_ERR',{x01: logFor,x02: errFunction,x03: pageID,x04: logFile,x05: errorTxt,x06: logShift,x07: logUser},{dataType:'json'})
    }
    catch(err){
        console.error(`errLog(): ` , err)
    }
}

/*================================================================ */
//------------------------- Components
/*================================================================*/

/*============================= Date Picker Comp ===================================*/
document.addEventListener("DOMContentLoaded", ()=>{
    let datePickerContiners = document.querySelectorAll(".datePickerContiner");
    datePickerContiners.forEach((ele) => {
    if (ele) {
        intializeDatePicker();
    }
    });
});
function intializeDatePicker() {
    const monthSelect = document.getElementById("month-select");
    const yearSelect = document.getElementById("year-select");
    const daysTag = document.querySelector(".days");
    const prevNextIcons = document.querySelectorAll(".icons span");
    let date = new Date(),
    currentYear = date.getFullYear(),
    currentMonth = date.getMonth();
    let selectedDateObj = null;
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

    for (let i = 0; i < months.length; i++) {
        let option = document.createElement("div");
        option.classList += " calendar-select-list";
        option.id = `option-${i}`;
        option.value = i;
        if (currentMonth === i) {
            option.classList += " month active";
        }
        option.addEventListener("click", function () {
            toggleDropdownMonth(i, months[i]);
        });
        option.textContent = months[i];
        monthSelect.appendChild(option);
    }

    for (let i = currentYear - 50; i <= currentYear + 50; i++) {
    let option = document.createElement("div");
    option.classList += " calendar-select-list";
    option.value = i;
    option.id = `option-${i}`;
    if (currentYear === i) {
        option.classList += " year active";
    }
    option.textContent = i;
    option.addEventListener("click", function () {
        toggleDropdownYear(i);
    });
    yearSelect.appendChild(option);
    }
    const backdrop = document.getElementById("calendar-backdrop");
    const calendarWrapper = document.getElementById("calendar-wrapper");
    backdrop.addEventListener("click", (e) => {
        e.stopPropagation();
        calendarWrapper.classList.add("show-calender");
    });

    document.addEventListener("click", (e) => {
    if (!calendarWrapper.contains(e.target) && !backdrop.contains(e.target)) {
        calendarWrapper.classList.remove("show-calender");
        monthSelect.classList.remove("show-dropdown");
        yearSelect.classList.remove("show-dropdown");
    }
    });

    monthSelect.value = currentMonth;
    yearSelect.value = currentYear;
    const toggleCalender = () => {
        const div = document.getElementById("calendar-wrapper");
        div.classList.toggle("show-calender");
    };
    const toggleDropdownMonth = (index, month) => {
        const div = document.getElementById("month-select");
        const year_div = document.getElementById("year-select");
        year_div.classList.remove("show-dropdown");
        if (month) {
            currentMonth = index;
            document
            .querySelectorAll(".calendar-select-list.month.active")
            .forEach((el) => {
                el.classList.remove("active");
            });
            const div_option = document.getElementById(`option-${index}`);
            div_option.classList += " month active";
            renderCalendar();
        }
        div.classList.toggle("show-dropdown");
    };

    const toggleDropdownYear = (year) => {
    const div = document.getElementById("year-select");
    const month_div = document.getElementById("month-select");
    month_div.classList.remove("show-dropdown");
    if (year) {
        currentYear = year;
        document
        .querySelectorAll(".calendar-select-list.year.active")
        .forEach((el) => {
            el.classList.remove("active");
        });
        const div_option = document.getElementById(`option-${year}`);
        div_option.classList += " year active";
        renderCalendar();
    }
    div.classList.toggle("show-dropdown");
    };
    const renderCalendar = () => {
        let firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
        let lastDateOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        let lastDayOfMonth = new Date(
            currentYear,
            currentMonth,
            lastDateOfMonth,
        ).getDay();
        const dropdown_month = document.getElementById("selected-month");
        dropdown_month.innerText = months[currentMonth];
        const dropdown_year = document.getElementById("selected-year");
        dropdown_year.innerText = currentYear;
        let lastDateOfLastMonth = new Date(currentYear, currentMonth, 0).getDate();
        let liDayTag = "";

        for (let i = firstDayOfMonth; i > 0; i--) {
            liDayTag += `<li class="inactive">${lastDateOfLastMonth - i + 1}</li>`;
        }

        for (let i = 1; i <= lastDateOfMonth; i++) {
            let isToday = "";
            if (selectedDateObj) {
            if (
                i === selectedDateObj.getDate() &&
                currentMonth === selectedDateObj.getMonth() &&
                currentYear === selectedDateObj.getFullYear()
            ) {
                isToday = 'class="active selectDate"';
            }
            } else {
            if (
                i === date.getDate() &&
                currentMonth === new Date().getMonth() &&
                currentYear === new Date().getFullYear()
            ) {
                isToday = 'class="active selectDate"';
            }
            }
        //   liDayTag += `<li ${isToday} onclick="selectDate(${i})" class="selectDate">${i}</li>`;
            liDayTag += `<li ${isToday} class="selectDate">${i}</li>`;
        }

        for (let i = lastDayOfMonth; i < 6; i++) {
            liDayTag += `<li class="inactive">${i - lastDayOfMonth + 1}</li>`;
        }

        daysTag.innerHTML = liDayTag;

        let days = daysTag.querySelectorAll('.selectDate')
        days.forEach((day)=>{
            day.addEventListener('click',(e)=>{
                console.log(e.target.textContent)
                selectDate(e.target.textContent)
            })
        })
    };
    renderCalendar(currentMonth, currentYear);

    monthSelect.addEventListener("change", (e) => {
        currentMonth = parseInt(e.target.value);
        renderCalendar();
    });

    yearSelect.addEventListener("change", (e) => {
        currentYear = parseInt(e.target.value);
        renderCalendar();
    });
    prevNextIcons.forEach((icon) => {
        icon.addEventListener("click", () => {
            currentMonth =
            icon.id === "prevIcon" ? currentMonth - 1 : currentMonth + 1;

            if (currentMonth < 0 || currentMonth > 11) {
            date = new Date(currentYear, currentMonth);
            currentYear = date.getFullYear();
            currentMonth = date.getMonth();
            return;
            } else {
            date = new Date();
            }

            renderCalendar();
        });
    });

    function selectDate(day){
        const selectedDateText = document.querySelector(".selected-date-text");
        // Format: DD/MM/YYYY
        const formattedDate = `${day}/${currentMonth + 1}/${currentYear}`;
        selectedDateText.innerText = formattedDate;

        selectedDateObj = new Date(currentYear, currentMonth, day);
        renderCalendar();

        // Close calendar
        const calendarWrapper = document.getElementById("calendar-wrapper");
        calendarWrapper.classList.remove("show-calender");

        // Close dropdowns if open (just in case)
        monthSelect.classList.remove("show-dropdown");
        yearSelect.classList.remove("show-dropdown");
    };
}
/*============================= Custom Drop Down List ===================================*/
function setupCustomDropdown(parentElement) {
    let wrapper = parentElement;
    let selectedDiv = wrapper.querySelector('.li-selected');
    let dropdown = wrapper.querySelector('.dropdown-list');
    let searchInput = dropdown.querySelector('.dropdown-menu-search');
    let ul = wrapper.querySelector('.ul-dropdown-inner');
    let lis = ul.querySelectorAll('li');

    // Toggle dropdown open/close when clicking the selected div
    selectedDiv.addEventListener('click', () => {
        dropdown.classList.toggle('open'); 
        if (dropdown.classList.contains('open')) {
            searchInput.focus();
        } else {
            searchInput.value = '';
            filterOptions(''); 
        }
    });
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) {
            dropdown.classList.remove('open');
            searchInput.value = '';
            filterOptions('');
        }
    });

    // Search/filter functionality
    searchInput.addEventListener('input', (e) => {
        filterOptions(e.target.value.toLowerCase());
    });

    function filterOptions(searchTerm) {
        lis.forEach((li) => {
            const text = li.textContent.toLowerCase();
            li.style.display = text.includes(searchTerm) ? 'block' : 'none';
        });
    }

    // Select an option when clicking an <li>
    ul.addEventListener('click', (e) => {
        const li = e.target.closest('li');
        if (li) {
            const dataValue = li.dataset.value;
            const value = li.value;
            const text = li.textContent;
            lis.forEach((ele)=>{
                ele.classList.remove("li-is-select")
            })
            li.classList.add("li-is-select")
            selectedDiv.dataset.value = dataValue;
            selectedDiv.textContent = text;
            selectedDiv.setAttribute('value',value)

            dropdown.classList.remove('open'); // Close dropdown
            searchInput.value = '';
            filterOptions(''); // Reset filter
        }
    });
    // selectedDiv.textContent = 'Selected Value'; 
    // selectedDiv.dataset.value = '';
    // dropdown.classList.remove('open');
}