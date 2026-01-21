let userPermissions, 
    sessionID = apex.env.APP_SESSION,
    appID = apex.env.APP_ID,
    activeUser = apex.env.APP_USER
let invoiceID, openShiftID, headerSrcDataContainer, srcValuesHolder, selectedValues, posCategoriesContainer
let discountAccess = false, createCashAccess = false, createCustomerAccess = false, posCashierOnlyAccess = false, overRideTaxAccess = false,posCashierAdmin = false
let invoiceLinesItems = []
const accessRoles = {
    SUPER_USER:       "96268806872996572510171386761347521866",
    CREATE_CUSTOMER: "95959979848418912790978149798646558686",
    POS_CASHIER:     "95950591706144986175657814674178211076",
    CREATE_CASH:     "95960885256253348064994365834003120777",
    DISCOUNT:        "95945194037845973039104600264428639250",
    OVERRIDE_TAX:    "96158064198195796792531173456791398221"
};
const pages = {
    logOutUrl :`apex_authentication.logout?p_app_id=101&p_session_id=${sessionID}`,
    masterDataPage: `/ords/r/carved/carved/master-data-page?session=${sessionID}`,
    posPage :`/ords/r/carved/carved/pos-si-page?session=${sessionID}`,
}
function openModelPages(ptitle,pageId){
    try{
        apex.server.process(
            "GET_MODEL_PAGE_URL",
            {x01: pageId},
            {
                success: function(pData) {
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
                },
                dataType: "text"
            }
            
        );

        function adjustHeight(){
            console.log('adjustHeight()')
            let modelPageContainer = document.querySelector('.ui-dialog.ui-draggable')
                modelPageContainer.style.height ='100vh'
        }
    }
    catch(err){
        console.error(`Err: ${err}`)
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
function applySavedTheme (){
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
          icon.checked  = saved == 'dark' ? false : true

};
/*================================================================ */
//------------------- Get User Access
/*================================================================*/
document.addEventListener("DOMContentLoaded", initPOS);
async function initPOS() {
    try {
        const perms = await fetchUserAccess();
    } catch (err) {
        console.error("POS init failed:", err);
    }
}
async function fetchUserAccess() {
    return new Promise((resolve, reject) => {
        apex.server.process(
            'GET_USER_ACCESS',
            {},
            {
                dataType: 'json',
                success: function (data) {
                    if (data.found == 'Y') {
                        userPermissions = data.items || [];
                        const grantedRoles = new Set(userPermissions.map(item => item.roleID));
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
                        createPageStructure()
                            .then(() => resolve(userPermissions))   
                            .catch(reject);
                        createNavBar()
                    } else {
                        userPermissions = null;
                        createPageStructure().catch(console.error);
                        resolve(null);
                    }
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    console.error("APEX process error:", textStatus, errorThrown, jqXHR);
                    apex.message.alert('Server error while fetching user access');
                    reject(new Error("Failed to fetch user access"));
                }
            }
        );
    });
}
function createNavBar(){
    let appNavBar = document.querySelector('#appNavBar')
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
                        <img src="r/carved/101/files/static/v6/icons/app-icon-256-rounded.png"/>
                    </div>
                    <div>Meme Gallery</div>
                    <div class="t-size-t">User: ${activeUser}</div>
                </div>
            </div>
            <ul class="nav-pages d-flex-c gap-10 flex-1">
                <li class="d-flex hover-brdr-btn p-10 brdr-r-m t-size-m click-btn">
                    <a href=${pages.posPage} class="d-flex w-100 algn-i-c cntnt-fs gap-10">
                        <span class="fa fa fa-home" aria-hidden="true"></span>
                        <span>POS Page</span>
                    </a>
                </li>
                <li class="d-flex hover-brdr-btn p-10 brdr-r-m t-size-m click-btn">
                    <a href=${pages.posPage} class="d-flex w-100 algn-i-c cntnt-fs gap-10">
                        <span class="fa fa fa-home" aria-hidden="true"></span>
                        <span>POS Page</span>
                    </a>
                </li>
                <li class="d-flex hover-brdr-btn p-10 brdr-r-m t-size-m click-btn">
                    <a href=${pages.posPage}  class="d-flex w-100 algn-i-c cntnt-fs gap-10">
                        <span class="fa fa fa-home" aria-hidden="true"></span>
                        <span>POS Page</span>
                    </a>
                <li class="d-flex algn-i-c cntnt-fs gap-10 hover-brdr-btn p-10 brdr-r-m t-size-m click-btn" onclick="openModelPages('Create Customer', 7)">
                    <span class="fa fa fa-home" aria-hidden="true"></span>
                    <span>SI-Invoice</span>
                </li>
                <li class="d-flex hover-brdr-btn p-10 brdr-r-m t-size-m click-btn">
                    <a href=${pages.masterDataPage}  class="d-flex w-100 algn-i-c cntnt-fs gap-10">
                        <span class="fa fa fa-home" aria-hidden="true"></span>
                        <span>POS Page</span>
                    </a>
                </li>
            </ul>
            <div class="nav-actions d-flex-c gap-10 p-10 t-size-4 t-clr-5">
                ${createCashAccess ? `
                    <div class="d-flex algn-i-c cntnt-fs gap-10 hover-brdr-btn p-10 brdr-r-m t-size-m click-btn t-clr-7" 
                        id="createCashEntryBtn">
                        <span class="fa fa-bitcoin" aria-hidden="true"></span>
                        <span>Cash In/Out</span>
                    </div>
                ` : ''}

                <div class="toggle-wrapper">
                    <label for="switch" class="toggle">
                        <input type="checkbox" class="input" id="switch" />
                        <div class="icon icon--moon" onclick="toggleTheme()">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                width="32"
                                height="32"
                            >
                                <path
                                fill-rule="evenodd"
                                d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z"
                                clip-rule="evenodd"
                                ></path>
                            </svg>
                        </div>

                        <div class="icon icon--sun" onclick="toggleTheme()">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                width="32"
                                height="32"
                            >
                                <path
                                d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"
                                ></path>
                            </svg>
                        </div>
                    </label>
                </div>
                <div class="w-100 btn-style d-flex-r gap-10 cntnt-c algn-i-c t-size-m hover-brdr-btn click-btn p-10 brdr-r-m" 
                    onclick="closeOpenShift()">
                    <span class="fa fa-times-square" aria-hidden="true"></span>
                    <div>Close Shift</div>
                </div>
                <a href=${pages.logOutUrl} class="w-100 btn-style d-flex-r gap-10 cntnt-c algn-i-c t-size-m hover-brdr-btn click-btn p-10 brdr-r-m bg-clr-9">
                    <span class="fa fa-sign-out" aria-hidden="true"></span>
                    <div>Log Out</div>
                </a>
            </div>
        </div>
    `
    appNavBar.appendChild(div)
    applySavedTheme()
}
async function createPageStructure() {
    if(!userPermissions){return}
    const pos = document.querySelector('#pos-container');
    if (!pos) {
        console.warn("#pos-container not found");
        return;
    }
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
        <div class="pos-categories d-flex postion-r algn-i-c w-100 " id="pos-categories">
        </div>
        <div class="pos-items flex-1 brdr-r-m flow-h" id="pos-items">
            <div class="items-conatiner gap-10 scrol-bar-w-0 cntnt-se scroll-y d-grid p-10 algn-i-c"></div>         
        </div>
        <div class="pos-open-invoices algn-i-c d-flex cntnt-fs" id="pos-open-invoices"></div>
    </div>
    <div class="pos-t-container p-10 d-flex-c bg-clr-3 algn-i-c cntnt-sb bg-clr-3 bx-shadow-s">
        <div class="w-100">
            <div class="inv-header d-flex-r algn-i-c w-100">
                <div class="inv-header-wrap d-flex-r cntnt-sb algn-i-fs w-100" style="padding: 10px 17px;">
                    <h4 class="invoice-h t-bold margn-0">No Invoice Selected</h4>
                    <h4 class="invoice-customer margn-0 cursor-p margn-0 brdr-r-m"></h4>
                </div>
            </div>  
            <hr style="width: 87%; border-color: #0000001f;">
        </div>
        <div class="inv-table scroll-y flex-1 w-100 scrol-bar-w-0">
            <div id="pos-Table" class="items-table postion-r w-100">
                <div id="pos-table-body" class="d-flex-c"></div>
            </div>
        </div>
        <div class="numbers d-flex-c gap-10 p-20 bg-clr-1 w-100 postion-r brdr-r-m flow-h">
            <div class="d-flex-c gap-10 t-size-m">
                <div class="number d-flex cntnt-sb algn-i-c"><span>Sub-Total</span><span></span></div>
                <div class="number d-flex cntnt-sb algn-i-c"><span>Tax</span><span></span></div>
            </div>
            <div class="postion-r">
                <div style="display: flex;align-items: center;justify-content: space-between;" class="number t-bold t-size-m d-flex cntnt-sb algn-i-c"><span>Total</span><span></span></div>
                <div style="position: absolute;width: 89%;height: 1px;border: 1px dashed #00000070;left: 25px;top: -4px;"></div>
            </div>
        </div>
        <div class="inv-btns w-100 d-flex d-flx-wrap gap-10 cntnt-sb algn-i-c">
            <button class="btn-style flex-1 t-size-m" type="button" onclick="cashOutInvoice()" style="padding: 17px;transform: translateY(-18px);">Proceed</button>
            <button class="btn-style-brdr flex-1 t-size-m" type="button" onclick="cashOutInvoice()" style="padding: 17px;transform: translateY(-18px);">Save</button>
        </div>
    </div>
    `;

/*
    <div onclick="createNewInvoice()"class="create-new-invoice invoice-row click-btn hover-brdr-btn t-algn-c t-clr-3
        bg-clr-5 postion-r h-100 brdr-r-m bx-shadow-s cursor-p d-flex-c algn-i-c p-10 gap-3 t-nwrap t-bold cntnt-c t-size-m"
        id="createNewInvoice"
        style="margin-right: 15px;"
        title="Create New Invoice"> + 
    </div>
*/
    pos.appendChild(divposWrapper)
    document.querySelector('#search-items').addEventListener('keyup', (e)=>{
        let textValue = (e.target.value).toUpperCase()
        let activeCat = document.querySelector('.is-cat-active.category-row')
        let catID = activeCat.querySelector('.cat-id').textContent
        let items = document.querySelectorAll('.item-row');
        items.forEach(item=>{
            let itemCatID = item.querySelector('.item_catID').textContent
            let itemName = (item.querySelector('.item_name').textContent).toUpperCase()
            if((catID == itemCatID && textValue =='') || (catID == 0 && textValue =='')){
                item.style.display='block'
            }else if(catID == itemCatID &&  itemName.includes(textValue)){
                item.style.display='block'
            }else if(catID == 0 &&  itemName.includes(textValue)){
                item.style.display='block'
            }else{
                item.style.display='none'
            }
        })
    })
    getOpenShift()
    posCategoriesContainer = document.getElementById("pos-categories");
}
function getOpenShift(){
    if(!userPermissions){return}
    apex.server.process(
        'GET_OPEN_SHIFT',
        {},
        {
            dataType: 'json',
            success: function (data) {
                console.log(data)
                if (data.found == 'Y') {
                    openShiftID = data.open_shift
                    fetchSrcData()
                    fetchCategories()
                    fetchItems()
                }
                else{
                    openNewShift();
                }
            },
            error: function (err) {
                console.error(err);
                apex.message.alert('Server error while fetching item');
            }
        }
    );
}
/*================================================================ */
//------------------- Functions Runs on Page Load
/*================================================================*/
/* ------------------------ Get Items ------------------------ */
function fetchSrcData(){
    let divContainer = document.createElement('div')
        divContainer.style.display = 'none' 
        divContainer.id = 'headerSrcDataContainer'
    let div = document.createElement('div')
        div.id = 'srcValuesHolder'
    divContainer.appendChild(div)
    div = document.createElement('div')
    div.id = 'selectedValues'
    div.innerHTML=`
                    <div id="sInvID" data-value=""></div>
                    <div id="sInvNo" data-value=""></div>
                    <div id="sOpenShifID" data-value="${openShiftID}"></div>
                    <div id="sEmpBranch" data-value=""></div>
                    <div id="sInvType" data-value=""></div>
                    <div id="sInvDate" data-value=""></div>
                    <div id="sCustomerId" data-value=""></div>
                    <div id="sInvVat" data-value=""></div>
                    <div id="sTaxRateID" data-value=""></div>
                    <div id="sInvPayMethod" data-value=""></div>
                    <div id="sInvDiscount" data-value=""></div>
                    <div id="sInvSubTotal" data-value=""></div>
                    <div id="sInvTaxAmt" data-value=""></div>
                    <div id="sInvTotal" data-value=""></div>
                    <div id="sInvFinalTotal" data-value=""></div>
                    <div id="sInvremaningAmt" data-value=""></div>`
    divContainer.appendChild(div)
    document.body.appendChild(divContainer)
    headerSrcDataContainer = document.querySelector('#headerSrcDataContainer')
    srcValuesHolder = headerSrcDataContainer.querySelector('#srcValuesHolder')
    selectedValues = headerSrcDataContainer.querySelector('#selectedValues')
    fetchOpenInvoices()
    fetchPaymentMethods()
    fetchTaxRates()
    fetchCustomers()
}
function fetchCategories() {
    apex.server.process(
        'GET_ITEMS_CATEGORIES',
        {},
        {
            dataType: 'json',
            success: function (data) {
                if (data.found === 'Y') {
                    posCategoriesContainer.innerHTML=''
                    let jsonData = data.items
                    const categoriesContainer = document.createElement("div");
                    categoriesContainer.classList.add('categories-container','w-100','p-10','d-flex','gap-10','scroll-x','scrol-bar-w-0','h-100','postion-r','t-nwrap')
                    const div = document.createElement("div");
                    div.classList.add('category-row','hover-brdr-btn','bg-clr-3','click-btn','hover-btn','is-cat-active','t-bold','d-flex-c','cntnt-c','algn-i-c','h-100','brdr-r-m','t-algn-c','t-wrap','cursor-p','p-10','t-font-fam-n','t-size-m','bx-shadow-s')
                    div.innerHTML = `
                        <div class="cat-id" style="display: none;">0</div>
                        <div>All</div>`
                        categoriesContainer.appendChild(div)
                    posCategoriesContainer.appendChild(categoriesContainer)
                    div.addEventListener('click', ()=>{
                        let items = document.querySelectorAll('.item-row');
                        let cats = document.querySelectorAll('.category-row');
                        cats.forEach(cat=> cat.classList.remove('is-cat-active'))
                        div.classList.add('is-cat-active')
                        items.forEach(item=>{
                            item.style.display='block'
                        })
                    })

                    let soldCat = document.createElement("div");
                    soldCat.classList.add('category-row','hover-brdr-btn','bg-clr-3','click-btn','hover-btn','t-bold','d-flex-c','cntnt-c','algn-i-c','h-100','brdr-r-m','t-algn-c','t-wrap','cursor-p','p-10','t-font-fam-n','t-size-m','bx-shadow-s')
                    soldCat.innerHTML = `
                        <div class="cat-id" style="display: none;" id="btn-sold-items">-1</div>
                        <div>Sold</div>`
                    categoriesContainer.appendChild(soldCat)
                    soldCat.addEventListener('click', ()=>{
                        let items = document.querySelectorAll('.item-row');
                        let cats = document.querySelectorAll('.category-row');
                        cats.forEach(cat=> cat.classList.remove('is-cat-active'))
                        soldCat.classList.add('is-cat-active')
                        items.forEach(item => {
                            const itemID = item.querySelector('.item_id').textContent.trim(); 
                            if (invoiceLinesItems.includes(itemID)) {
                                item.style.display = 'block';
                            } else {
                                item.style.display = 'none';
                            }
                        });
                    })

                    let prevCat = document.createElement('div')
                        prevCat.innerHTML=`<span style="font-size:25px" class="click-btn fa fa-chevron-circle-left"></span>`
                        prevCat.style.cssText='height: 100%;border-radius: 50%;left: 18px;'
                        prevCat.classList.add('prev-cat', 'item-c')
                    posCategoriesContainer.appendChild(prevCat)

                    let nextCat = document.createElement('div')
                        nextCat.innerHTML=`<span style="font-size:25px" class="click-btn fa fa-chevron-circle-right"></span>`
                        nextCat.style.cssText='height: 100%;border-radius: 50%;right: -10px;'
                        nextCat.classList.add('next-cat', 'item-c')
                    posCategoriesContainer.appendChild(nextCat)

                    let catIndex = 0;
                    let items = [];  
                    function updateItemsAndButtons() {
                        items = document.querySelectorAll('.pos-categories .categories-container .category-row');
                        prevCat.style.opacity = (catIndex <= 0) ? '0.4' : '1';
                        nextCat.style.opacity = (catIndex >= items.length - 1) ? '0.4' : '1';
                    }
                    nextCat.addEventListener('click', () => {
                        if (catIndex >= items.length - 1) return;
                        catIndex++;
                        items[catIndex].scrollIntoView({
                            behavior: 'smooth',
                            inline: 'center',    
                            block: 'nearest'      
                        });
                        updateItemsAndButtons();
                    });
                    prevCat.addEventListener('click', () => {
                        if (catIndex <= 0) return;
                        catIndex--;
                        items[catIndex].scrollIntoView({
                            behavior: 'smooth',
                            inline: 'center',
                            block: 'nearest'
                        });
                        updateItemsAndButtons();
                    });
                    jsonData.forEach((item)=>{
                        const div = document.createElement("div");
                        div.classList.add('category-row','hover-brdr-btn','bg-clr-3','click-btn','hover-btn','t-bold','d-flex-c','cntnt-c','algn-i-c','h-100','brdr-r-m','t-algn-c','t-wrap','cursor-p','p-10','t-font-fam-n','t-size-m','gap-3','bx-shadow-s')
                        div.innerHTML = `
                        <div class="cat-id" style="display: none;">${item.cat_id}</div>
                        <div>${item.cat_name}</div>`
                        categoriesContainer.appendChild(div)
                        posCategoriesContainer.appendChild(categoriesContainer)
                        div.addEventListener('click', (e)=>{
                            let catID = e.currentTarget.querySelector('.cat-id').textContent
                            let items = document.querySelectorAll('.item-row');
                            let cats = document.querySelectorAll('.category-row');
                            cats.forEach(cat=> cat.classList.remove('is-cat-active'))
                            div.classList.add('is-cat-active')
                            items.forEach(item=>{
                                let itemCatID = item.querySelector('.item_catID').textContent
                                if(catID == itemCatID){
                                    item.style.display='block'
                                }else{
                                    item.style.display='none'
                                }
                            })
                        })
                    });
                    updateItemsAndButtons();
                }
            },
            error: function (err) {
                console.error(err);
                apex.message.alert('Server error while fetching item');
            }
        }
    );
}
function fetchItems() {
    let posItemsContainer = document.querySelector("#pos-items")
    showLoader(posItemsContainer)
    apex.server.process(
        "GET_ITEMS",
        {},
        {
        dataType: "json",
        success: function (data) {
                if (data.found === 'Y') {
                    const container = document.querySelector(".items-conatiner");
                    container.innerHTML = "";
                    let jsonData = data.items
                    jsonData.forEach((item)=>{
                        let itemTag = item.item_balance > item.item_stockCheck ? 'Available' : 
                                    item.item_balance < item.item_stockCheck && item.item_balance > 0  ? 'Low Stock' : 'Not Available';  
                        const div = document.createElement("div");
                        div.classList.add('item-row','p-10','w-100', 'h-100','click-btn','hover-brdr-btn','cursor-p','d-flex','brdr-r-m','bx-shadow-s','t-algn-c','bg-clr-3','t-wrap','algn-i-c','postion-r')
                        div.innerHTML = `
                            <div class="item_id" style="display: none;">${item.item_id}</div>
                            <div class="item_uom"  style="display:none">${item.item_uom}</div>
                            <div class="item_catID"  style="display:none">${item.item_CAT_ID}</div>
                            <div class="item_balance"  style="display:none">${item.item_balance}</div>
                            <div class="item-wrapper w-100 h-100">
                                <div class="img-holder w-100 flow-h brdr-r-m">
                                        <img src="${item.item_img}" />
                                </div>
                                <div class="item_description flow-h t-nwrap d-flex-c cntnt-fs t-bold algn-i-fs">
                                    <div class="item_name">${item.item_name}</div>
                                </div>
                                <div class="d-flex-r cntnt-sb w-100" style="padding: 5px 10px;" >
                                    <div class="item_price">${formatAccounting(item.item_price)}
                                        <span>LE</span>
                                    </div>
                                    <div class="item-tag d-flex-r algn-i-c cntnt-c t-algn-l t-size-s brdr-r-m w-fc t-font-fam-s ${itemTag.replace(' ','-')}">
                                        <span class="fa fa-tag" aria-hidden="true"></span>
                                        <span style="padding-left: 3px;">${itemTag}</span>
                                    </div>
                                </div>
                            </div>
                            `;
                            document.querySelector(".items-conatiner").appendChild(div);
                        });
                        
                        // document.querySelector(".items-conatiner").appendChild(div);
                }
                removeLaoder(posItemsContainer)
        },
        error: function (err) {
            removeLaoder(posItemsContainer)
            console.error(err);
            apex.message.alert('Server error while fetching item');
        }
      }
    );
};
/* ------------------------ Fetch Data On Page Load and Save It In Hidden Div ------------------------ */
function fetchOpenInvoices() {
    apex.server.process(
        'GET_OPEN_INVS',
        {},
        {
            dataType: 'json',
            success: function (data) {
                let posInoivces = document.querySelector('#pos-open-invoices');
                $('#pos-open-invoices').empty()
                let invoiceContianer = document.createElement('div')
                    invoiceContianer.classList.add('invoices-contianer','mar-20','d-flex','flex-1','postion-r','cntnt-fs','algn-i-c','h-100','d-flex','cntnt-sb','algn-i-c');
                posInoivces.appendChild(invoiceContianer)

                let prevInvoices = document.createElement('div')
                    prevInvoices.classList.add('item-c');
                    prevInvoices.style.cssText='height: 100%;border-radius: 50%;left: -5px;'
                    prevInvoices.innerHTML=`<span style="font-size:25px" class="click-btn fa fa-chevron-circle-left"></span>`;
                    invoiceContianer.appendChild(prevInvoices)

                let invoiceWrapper = document.createElement('div')
                    invoiceWrapper.classList.add('invoices-wrapper','postion-r','flow-h','flex-1','w-100','h-100');
                invoiceContianer.appendChild(invoiceWrapper)

                let nextInvoices = document.createElement('div')
                    nextInvoices.classList.add('next-invoice', 'item-c');
                    nextInvoices.style.cssText='height: 100%;border-radius: 50%;right: -29px;'
                    nextInvoices.innerHTML=`<span style="font-size:25px" class="click-btn fa fa-chevron-circle-right"></span>`;
                invoiceContianer.appendChild(nextInvoices)
                    
                let invoicsContent = document.createElement('div')
                    invoicsContent.classList.add('invoices-content','postion-r','d-flex','gap-10','scroll-x','scrol-bar-w-0','h-100','w-100','p-10','t-nwrap');
                invoiceWrapper.appendChild(invoicsContent)

                let currentIndex = 0;
                let items = [];  
                function updateItemsAndButtons() {
                    items = document.querySelectorAll('.invoices-content .invoice-row');
                    prevInvoices.style.opacity = (currentIndex <= 0) ? '0.4' : '1';
                    nextInvoices.style.opacity = (currentIndex >= items.length - 1) ? '0.4' : '1';
                }
                nextInvoices.addEventListener('click', () => {
                    if (currentIndex >= items.length - 1) return;
                    currentIndex++;
                    items[currentIndex].scrollIntoView({
                        behavior: 'smooth',
                        inline: 'center',    
                        block: 'nearest'      
                    });
                    updateItemsAndButtons();
                });
                prevInvoices.addEventListener('click', () => {
                    if (currentIndex <= 0) return;
                    currentIndex--;
                    items[currentIndex].scrollIntoView({
                        behavior: 'smooth',
                        inline: 'center',
                        block: 'nearest'
                    });
                    updateItemsAndButtons();
                });

                if (data.found === 'Y' && Array.isArray(data.items)) {
                    data.items.forEach(item => {
                    let option = document.createElement('div');
                        option.classList.add('invoice-row','click-btn','hover-brdr-btn','t-algn-c','bg-clr-3','postion-r','h-100',
                            'd-flex','brdr-r-m','bx-shadow-s','cursor-p','d-flex-c','algn-i-c','p-10','cntnt-fs','gap-3','t-nwrap');
                        option.dataset.value = item.invID;
                        option.dataset.invTotal = item.invTotal;
                        option.dataset.customer = item.cutomerName;
                        option.innerHTML=`
                                <div class="d-flex-r algn-i-c w-100 cntnt-sb">
                                    <div class="customer flow-h t-bold">${item.cutomerName}</div>
                                    <div class="invoice t-clr-5" >#${item.invNo}</div>
                                </div>
                                <div class="inv-summary t-clr-5 postion-a w-fc" style="left: 0;margin: 10px;bottom: 0">
                                    <span>${item.invItemsCount} item | ${formatAccounting(item.invTotal)} LE</span>
                                </div>`
                        invoicsContent.appendChild(option);
                        option.addEventListener('click',(e)=>{
                            let inv = e.target.closest('.invoice-row')
                            invoiceID = inv.getAttribute('data-value')
                            let cutomer = inv.getAttribute('data-customer')
                            let invNum = inv.querySelector('.invoice')?.textContent
                            let invoices = document.querySelectorAll('.invoices-wrapper .invoices-content .invoice-row')
                            invoices.forEach(ele=>{
                                ele.classList.remove('selected-invoice')
                            })
                            inv.classList.add('selected-invoice')
                            document.querySelector('.inv-header .inv-header-wrap .invoice-h').textContent = `Invoice# ${invNum.replace('#','')}`
                            document.querySelector('.inv-header .inv-header-wrap .invoice-customer').textContent = `${cutomer}`
                            triggerChangedInvoice()
                        })
                    });
                }
                updateItemsAndButtons();
                triggerChangedInvoice()
                if(invoiceID){
                    document.querySelectorAll('.invoices-content .invoice-row').forEach((ele)=>{
                        let invId =ele.getAttribute('data-value')
                        if(invId == invoiceID){
                            ele.classList.add('selected-invoice')
                        }
                    })
                }
            },
            error: function (err) {
                console.error(err);
                apex.message.alert('Server error while fetching item');
            }
        }
    );
}
function fetchPaymentMethods() {
    let div = document.createElement('div')
    div.classList.add('inv-head-row')
    div.innerHTML=`<div id="invPayMethods" class="ul-select-wrapper input" style="position: relative;">
                    <div class="li-selected" data-value=""  value="''" ></div>
                    <div class="dropdown-list"  style="position: absolute;">
                        <input placeholder="Search..." type="text" class="dropdown-menu-search" style="color:white;">
                        <ul class="ul-dropdown-inner"></ul>
                    </div>
                </div>`
    srcValuesHolder.appendChild(div)
    apex.server.process(
        'GET_PAYMENT_METHODS',
        {},
        {
            dataType: 'json',
            success: function (data) {
                if (data.found === 'Y') {
                    let jsonData = data.items
                    const parentElement = document.querySelector("#invPayMethods");
                    const selectList = parentElement.querySelector(".ul-dropdown-inner");
                    jsonData.forEach((item) => {
                        const option = document.createElement('li');
                            option.dataset.value = item.methodID;
                            option.value = item.methodName
                            option.textContent = item.methodName;
                        selectList.appendChild(option);
                    });
                }
            },
            error: function (err) {
                console.error(err);
                apex.message.alert('Server error while fetching item');
            }
        }
    );
}
function fetchTaxRates() {
    let div = document.createElement('div')
    div.classList.add('inv-head-row')
    div.innerHTML=`<div id="invTaxRates" class="ul-select-wrapper input" style="position: relative;">
                    <div class="li-selected" data-value="''" value="''"></div>
                    <div class="dropdown-list"  style="position: absolute;">
                        <input placeholder="Search..." type="text" class="dropdown-menu-search">
                        <ul class="ul-dropdown-inner"></ul>
                    </div>
                </div>`
    srcValuesHolder.appendChild(div)
    apex.server.process(
        'GET_TAX_RATES',
        {},
        {
            dataType: 'json',
            success: function (data) {
                if (data.found === 'Y') {
                    let jsonData = data.items
                    const parentElement = document.querySelector("#invTaxRates");
                    const selectList = parentElement.querySelector(".ul-dropdown-inner");
                    jsonData.forEach((item) => {
                        const option = document.createElement('li');
                            option.value = item.taxRate ;
                            option.dataset.value = item.taxID;
                            option.textContent = item.taxName;
                        selectList.appendChild(option);
                    });
                }
            },
            error: function (err) {
                console.error(err);
                apex.message.alert('Server error while fetching item');
            }
        }
    );
}
function fetchCustomers(){
    let div = document.createElement('div')
    div.classList.add('inv-head-row')
    div.innerHTML=`<div id="customerIds" class="ul-select-wrapper input" style="position: relative;">
                    <div class="li-selected" data-value=""></div>
                    <div class="dropdown-list"  style="position: absolute;">
                        <input placeholder="Search..." type="text" class="dropdown-menu-search">
                        <ul class="ul-dropdown-inner"></ul>
                    </div>
                </div>`
    srcValuesHolder.appendChild(div)
    apex.server.process(
        'GET_CUSTOMERS',
        {},
        {
            dataType: 'json',
            success: function (data) {
                if (data.found === 'Y') {
                    let jsonData = data.items
                    const parentElement = document.querySelector("#customerIds");
                    const selectList = parentElement.querySelector(".ul-dropdown-inner");
                    jsonData.forEach((item) => {
                        const option = document.createElement('li');
                            option.dataset.value = item.customer_id;
                            option.value = item.customer_name 
                            option.textContent = item.customer_name;
                        selectList.appendChild(option);
                    });
                }
            },
            error: function (err) {
                console.error(err);
                apex.message.alert('Server error while fetching item');
            }
        }
    );
}
/*-------------- Open Customers Page and Create New Customer ------------------*/
function openCustomersPage(){
    if(!invoiceID){
        errMessage('No Invoice Selected')
        return
    }
    createOverlay()
    let posOverlay = document.getElementById('pos-overlay');
    let overlayConetent = document.querySelector('#overlay-content')
        posOverlay.style.backgroundColor = '#00000040'
    let div = document.createElement('div')
    div.className = 'content-body-04'
    div.id = 'content-body-04'
    div.innerHTML=`
            <div class="form-wrap wrap" style="width:80vw;height: 80vw;position:relative">
                <div class="h1" style="margin: 0;top: 9px;letter-spacing: 3px;position: absolute;left: 23px;">Customers </div>
                <div class="inputs" style="margin-top: 30px;">
                    <div class="content" style="max-height: 72vh;overflow: hidden;overflow-y: auto;scrollbar-width: none;">
                        <div class="content-wrapper" style="">
                        </div>
                    </div>
                    <div class="btns-wrap d-flex gap-10 w-100 cntnt-c" style="margin-top:10px">
                        ${!createCustomerAccess ? '' : `<button type="button" class="btn-style"  id="OpenCreateNewCustomer">Create New</button>`}
                        <button type="button" class="btn-style"  onclick="removerOverlay()">Cancel</button>
                    </div>
                </div>
            </div>`
    overlayConetent.appendChild(div)
    apex.server.process(
        'GET_CUSTOMERS',
        {},
        {
            dataType: 'json',
            success: function (data) {
                if (data.found === 'Y') {
                    let jsonData = data.items
                    const parentElement = document.querySelector("#content-body-04 .inputs .content-wrapper");
                    const option = document.createElement('div');
                    // option.style.cssText= 'position: fixed;top: 15.5%;text-wrap: nowrap;display: flex;width: 71%;'
                    option.innerHTML =`
                    <div style="position: relative;height: 30px;width: 100%;">
                        <div style="display: flex;position: fixed;text-wrap: nowrap;width: 72%;background: #2c2c2c;">
                            <div style="width:25%">Customer Name</div>
                            <div style="width:25%">Phone Number</div>
                            <div style="width:25%">Address</div>
                            <div style="width:25%">Default Customer</div> </div>">
                        </div>
                    </div>`
                    parentElement.appendChild(option);
                    parentElement.appendChild(option);
                    jsonData.forEach((item) => {
                        const option = document.createElement('div');
                        option.classList.add('customer-row')
                        option.dataset.value = item.customer_id;
                        option.innerHTML =`
                                        <div style="width:25%" class="name">${item.customer_name ? item.customer_name : ''}</div>
                                        <div style="width:25%">${item.customerPhone ? item.customer_name : ''}</div>
                                        <div style="width:25%">${item.customerAddress? item.customerAddress : ''} </div>
                                        <div style="width:25%">${item.customerIsDefault ? 'Yes' : 'No'}</div>`
                        parentElement.appendChild(option);
                        option.addEventListener('click',(e)=>{
                            let row = e.target.closest('.customer-row')
                            let customerID  = row.getAttribute('data-value')
                            let customerName  = row.querySelector('.name').textContent
                            document.querySelector('.inv-header .inv-header-wrap .invoice-customer').textContent = `${customerName}`
                            document.querySelector('#sCustomerId').setAttribute('data-value',customerID)
                            let sInvID = document.querySelector('#sInvID').getAttribute('data-value')
                            document.querySelectorAll('.invoices-content .invoice-row').forEach(ele=>{
                                let invID = ele.getAttribute('data-value')
                                if(invID ==sInvID){
                                    ele.setAttribute('data-customer', customerName)
                                    ele.querySelector('.customer').textContent= customerName
                                }
                            })
                            removerOverlay()
                            saveInvoiceHeader(0)
                        })
                    });
                }
            },
            error: function (err) {
                console.error(err);
                apex.message.alert('Server error while fetching item');
            }
        }
    );
    overlayConetent.querySelector('#OpenCreateNewCustomer')?.addEventListener('click', ()=> {
        createCustomer()
    })

}
function createCustomer(){
    let customerName, customerAddress, customerPhone;
    let overlayConetent = document.getElementById('overlay-content')
    if(!overlayConetent){return}
    let div = document.createElement('div')
    div.className = 'content-body-02'
    div.id = 'content-body-02'
    div.innerHTML=`
        <div class="form-wrap wrap d-flex-c gap-10 cntnt-sb" style="width:40vw">
            <div class="h1">Create Customer</div>
            <div class="inputs">
                <div class="content-row d-flex gap-10 algn-i-c">
                    <div class="inputGroup">
                        <input class="input" required="" autocomplete="off" type="text" id="new-customer-name">
                        <label for="cashamount">Customer Name</label>
                    </div>
                </div>
                <div class="content-row d-flex gap-10 algn-i-c">
                    <div class="inputGroup">
                        <input class="input" required="" autocomplete="off" type="text" id="new-customer-phone">
                        <label for="cashamount">Address</label>
                    </div>
                </div>
                <div class="content-row d-flex gap-10 algn-i-c">
                    <div class="inputGroup">
                        <input class="input" required="" autocomplete="off" type="text" id="new-customer-adreess">
                        <label for="cashamount">Phone Number</label>
                    </div>
                </div>
                <div class="btns-wrap d-flex gap-10 w-100 ontent-c">
                    <button type="button"class="btn-style" id="createNewCustomer">Create</button>
                    <button type="button"class="btn-style" onclick="removeElementWithID('content-body-02')">Cancel</button>
                </div>
            </div>
        </div>`
    overlayConetent.appendChild(div)
    overlayConetent.querySelector('#createNewCustomer')?.addEventListener('click', ()=>{
        customerName = overlayConetent.querySelector('#new-customer-name')
        customerAddress = overlayConetent.querySelector('#new-customer-adreess')?.value
        customerPhone = overlayConetent.querySelector('#new-customer-phone')?.value
        if(!customerName?.value){
            const existingError = overlayConetent.querySelector('.err-message');
            if (existingError) {
                existingError.remove();
            }
            let errorDiv = document.createElement('div')
            errorDiv.className = 'err-message'
            errorDiv.textContent = '*You Must Enter a Value'
            const inputGroup = customerName.closest('.content-row');
            inputGroup.insertAdjacentElement('afterend', errorDiv);
            customerName.focus()
            return 
        };
        postCustomerData()
    });
    function postCustomerData(){
        apex.server.process(
        "CREATE_NEW_CUSTOMER",
        {
            x01: customerName,
            x02: customerPhone,
            x03: customerAddress,
        },
        {
            dataType: "json",
            success: function (data) {
                if (data.status !== "SUCCESS") {
                    apex.message.alert(data.message || "Error saving invoice");
                    return;
                }else{
                    console.log(data)
                    if(data.customerExist){
                        let overlayConetent = document.getElementById('overlay-content')
                        let customerName = overlayConetent.querySelector('#new-customer-name')
                        const existingError = overlayConetent.querySelector('.err-message');
                        if (existingError) {
                            existingError.remove();
                        }
                        let errorDiv = document.createElement('div')
                        errorDiv.className = 'err-message'
                        errorDiv.textContent = '*Customer Exists'
                        const inputGroup = customerName.closest('.content-row');
                        inputGroup.insertAdjacentElement('afterend', errorDiv);
                        customerName.focus()
                        return 
                    }
                    removeElementWithID('content-body-02')
                }
            },
            error: function (err) {
            console.error(err);
            apex.message.alert("Server error while saving line");
            },
        });
    }
}
/* ------------------------ Get Selected Invoice Header Details ------------------------ */
/* ------------------------ Get Selected Invoice Details ------------------------ */
function triggerChangedInvoice(){
    if(!invoiceID){
        invoiceID = 0
        return
    }
    getInvoiceDataDetails()
    renderInvoiceRows();
}
function getInvoiceDataDetails(){
    apex.server.process(
    'GET_INVOICE_HEADER_DATA',
    { x01: invoiceID },
    {
    dataType: 'json',
    success: function (data) {
        if(data.found=='N'){
            headerSrcDataContainer.querySelector("#sInvDate").setAttribute('data-value',"");
            headerSrcDataContainer.querySelector("#sInvNo").setAttribute('data-value', '');
            headerSrcDataContainer.querySelector("#sEmpBranch").setAttribute('data-value',""); 
            headerSrcDataContainer.querySelector("#sInvType").setAttribute('data-value',"")
            headerSrcDataContainer.querySelector("#sCustomerId").setAttribute('data-value',"")
            headerSrcDataContainer.querySelector("#sInvVat").setAttribute('data-value',"")
            headerSrcDataContainer.querySelector("#sInvPayMethod").setAttribute('data-value',"")
            headerSrcDataContainer.querySelector("#sInvDiscount").setAttribute('data-value',"")
            headerSrcDataContainer.querySelector("#sInvSubTotal").setAttribute('data-value',"")
            headerSrcDataContainer.querySelector("#sInvTaxAmt").setAttribute('data-value', '');
            headerSrcDataContainer.querySelector("#sInvTotal").setAttribute('data-value', '');
            headerSrcDataContainer.querySelector("#sTaxRateID").setAttribute('data-value', '');

            // headerSrcDataContainer.querySelector("#customerIds .li-selected").setAttribute('data-value', '');
            headerSrcDataContainer.querySelector("#invTaxRates .li-selected").setAttribute('data-value', '');
            headerSrcDataContainer.querySelector("#invPayMethods .li-selected").setAttribute('data-value', '');
            // headerSrcDataContainer.querySelector("#customerIds .li-selected").textContent ='';
            headerSrcDataContainer.querySelector("#invTaxRates .li-selected").textContent ='';
            headerSrcDataContainer.querySelector("#invPayMethods .li-selected").textContent ='';

            const numbers = document.querySelectorAll('.pos-t-container .numbers .number');
                numbers[0].querySelector('span:nth-child(2)').textContent = '00.00 LE';
                numbers[1].querySelector('span:nth-child(1)').textContent = `Tax`;
                numbers[1].querySelector('span:nth-child(2)').textContent = '00.00 LE';
                numbers[2].querySelector('span:nth-child(2)').textContent = '00.00 LE';

        }else{
            let header = data.header
            const options = {year: 'numeric',month: 'long', day: '2-digit', weekday: 'long'};
            let invHeaderDate = new Date(header.invDate)
            headerSrcDataContainer.querySelector("#sInvID").setAttribute('data-value', invoiceID);
            headerSrcDataContainer.querySelector("#sInvNo").setAttribute('data-value', header.invNo);
            headerSrcDataContainer.querySelector("#sInvDate").setAttribute('data-value',header.invDate);
            headerSrcDataContainer.querySelector("#sEmpBranch").setAttribute('data-value',header.invBranch); 
            headerSrcDataContainer.querySelector("#sInvType").setAttribute('data-value', header.invType)
            headerSrcDataContainer.querySelector("#sInvVat").setAttribute('data-value',header.invTaxRateValue)
            headerSrcDataContainer.querySelector("#sInvTaxAmt").setAttribute('data-value', header.invTaxAmt);
            headerSrcDataContainer.querySelector("#sInvDiscount").setAttribute('data-value',header.discount)
            headerSrcDataContainer.querySelector("#sInvSubTotal").setAttribute('data-value',header.invTotalLessDiscount)
            headerSrcDataContainer.querySelector("#sInvTotal").setAttribute('data-value', header.invTotal);
            headerSrcDataContainer.querySelector("#sInvFinalTotal").setAttribute('data-value', header.invFinalTotal);
            headerSrcDataContainer.querySelector("#sInvPayMethod").setAttribute('data-value',  header.payMethodID);
            headerSrcDataContainer.querySelector("#sCustomerId").setAttribute('data-value',header.customerID)
            headerSrcDataContainer.querySelector("#sTaxRateID").setAttribute('data-value', header.invTaxID);

            // headerSrcDataContainer.querySelector("#customerIds .li-selected").setAttribute('data-value', header.customerID);
            // headerSrcDataContainer.querySelector("#invTaxRates .li-selected").setAttribute('data-value', header.invTaxRateValue);
            // headerSrcDataContainer.querySelector("#invPayMethods .li-selected").setAttribute('data-value', header.pay_method);
            // headerSrcDataContainer.querySelector("#invDate").value = new Intl.DateTimeFormat('en-US', options).format(invHeaderDate);

            // headerSrcDataContainer.querySelector("#customerIds .li-selected").setAttribute('data-value',header.customerID );
            headerSrcDataContainer.querySelector("#invTaxRates .li-selected").setAttribute('data-value', header.invTaxID);
            headerSrcDataContainer.querySelector("#invPayMethods .li-selected").setAttribute('data-value', header.payMethodID);

            const numbers = document.querySelectorAll('.pos-t-container .numbers .number');
                numbers[0].querySelector('span:nth-child(2)').textContent = `${formatAccounting(header.invTotal)} LE`;
                numbers[1].querySelector('span:nth-child(1)').textContent = `Tax (${header.invTaxRateValue}%)`;
                numbers[1].querySelector('span:nth-child(2)').textContent = `${formatAccounting(header.invTaxAmt)} LE`;
                numbers[2].querySelector('span:nth-child(2)').textContent = `${formatAccounting(header.invFinalTotal)} LE`;

            document.querySelectorAll('.invoices-content .invoice-row').forEach((ele)=>{
                let invID = ele.getAttribute('data-value')
                if(!invoiceID){return}
                if(invID ==invoiceID){
                    ele.querySelector('.inv-summary').textContent = `${header.invLinesCount} item | ${formatAccounting(header.invFinalTotal)} LE`
                }
            })
        }
        },
        error: function (err) {
            console.error(err);
        }
    }
    );
}
/* ---- Render invoice rows related to selected invoice */
function renderInvoiceRows() {
    $('#pos-table-body').empty();
    let itemsRow = 0
    if (!invoiceID) {
        return;
    }
    let posItemsContainer = document.querySelector(".pos-t-container")
    showLoader(posItemsContainer)

    apex.server.process(
    'GET_INV_LINES',
    { x01: invoiceID },
    {
    dataType: 'json',
    success: function (data) {
        if (data.found !== 'Y') {
            let div = `<div style="text-align: center;">No Data Found</div>`
            $('#pos-table-body').append(div);
            removeLaoder(posItemsContainer)
            return;
        }
        invoiceLinesItems = []
        data.items.forEach((item, index) => {
                itemsRow = index + 1
                invoiceLinesItems.push(item.itemID)
            var newRow = `
                <div class="s-item-row d-flex gap-10 p-10 bg-clr-3">
                    <div class="inv-line-id" style="display: none;">${item.invLineID}</div>
                    <div class="inv-id" style="display: none;">${item.invID}</div>
                    <div class="item-id" style="display: none;">${item.itemID}</div>
                    <div style="display: none;">${itemsRow}</div>
                    <div style="display: none;" class="item-name" title="${item.item_name}">${item.item_name}</div>
                    <div style="display: none;" class="price">${formatAccounting(item.price)}</div>
                    <div style="display: none;" class="uom">${item.uom}</div>
                    <div style="display: none;" class="amount">${formatAccounting(item.total_before_tax)}</div>
                    
                    <div class="item-img d-flex cntnt-c algn-i-c">
                        <div class="img-holder flow-h postion-r brdr-r-m d-flex cntnt-c algn-i-c bx-shadow-s">
                            <span style="position:absolute;" aria-hidden="true" class="fa fa-trash"></span>
                            <img class="w-100 h-100" src=${item.item_img}>
                        </div>
                    </div>
                    <div class="d-flex flex-1 cntnt-sb algn-i-c t-nwrap">
                        <div class="item-disc cntnt-fs t-algn-l t-nwrap p-10 d-flex-c t-bold d-flex flow-h">
                            <div>${item.item_name}</div> 
                            <div>${formatAccounting(item.price)} LE</div>
                        </div>
                        <div class="qty-col cntnt-c algn-i-c postion-r d-flex gap-10 cntnt-fs">
                            <div class="qty-row postion-r bx-shadow-s">
                                <div class="qty-less item-c"><span aria-hidden="true" class="click-btn t-clr-9 fa fa-minus-circle"></span></div>
                                    <input type="number" class="qty t-algn-c" value=${item.qty} disabled=true>
                                <div class="qty-plus item-c"><span class="click-btn fa fa-plus-circle" aria-hidden="true"></span></div>
                            </div>
                            <div class="amount">${formatAccounting(item.total_before_tax)} LE</div>
                        </div>
                    </div>
                </div>`;
            $('#pos-table-body').append(newRow);
        });
        removeLaoder(posItemsContainer)
        let soldItems = document.querySelector('.category-row.is-cat-active')
        let selectedCat = soldItems.querySelector('.cat-id')
        if(selectedCat?.textContent ==-1){selectedCat.click();}

    },
    error: function (err) {
        console.error(err);
        removeLaoder(posItemsContainer)
        apex.message.alert('renderInvoiceRows() Server error while fetching items');
    }
    }
    );
}
// /*================================================================ */
// //------------------- Create and Save Invoice
// /*================================================================*/
function createNewInvoice(){
    apex.message.confirm('Create New Invoice?', function(ok){
        if(!ok) return;
        apex.server.process(
        'CREATE_NEW_INVOICE',
        { x01: openShiftID},
        {
            dataType: 'json',
            success: function(data){
                if(data.status !== 'SUCCESS'){
                    apex.message.alert('Error: ' + data.message || 'Error creating invoice');
                    return;
                }
                let invNo = data.inv_no;
                $('#pos-table-body').empty();
                fetchOpenInvoices()
                successMessage('Invoice ' + invNo + ' Created')
            },
            error: function(err){
            console.error(err);
            apex.message.alert('Server error creating invoice');
            }
        }
        );
    });
}
function cashOutInvoice(){
    if(!invoiceID){
        errMessage('No Invoice Selected')
        return
    }
    createOverlay()
    let posOverlay = document.getElementById('pos-overlay');
        posOverlay.style.backgroundColor = '#00000040'
    let invoiceNo =headerSrcDataContainer.querySelector("#sInvNo").getAttribute('data-value');
    let overlayConetent = document.querySelector('#overlay-content')
    let empBranch =    selectedValues.querySelector("#sEmpBranch").getAttribute("data-value");
    let invoiceType =  selectedValues.querySelector("#sInvType").getAttribute("data-value");
    let invDateValue = selectedValues.querySelector("#sInvDate").getAttribute("data-value");
    let invTotal =  selectedValues.querySelector("#sInvTotal").getAttribute("data-value");
    let invTaxAmt =    selectedValues.querySelector("#sInvTaxAmt").getAttribute("data-value");
    let invFinalTotal =  selectedValues.querySelector("#sInvFinalTotal").getAttribute("data-value");
    let customerName =  document.querySelector(".invoice-row.selected-invoice").getAttribute("data-customer");

    let taxesDiv=  srcValuesHolder.querySelector("#invTaxRates").cloneNode(true);
    let payMethodDiv= srcValuesHolder.querySelector("#invPayMethods").cloneNode(true);
        taxesDiv.id = 'invTaxRatesCash'
        payMethodDiv.id = 'invPayMethodsCash'

    let div = document.createElement('div')
    div.className = 'content-body'
    div.innerHTML=`
            <div class="form-wrap wrap data-form">
                <div class="h1">${invoiceType}# ${invoiceNo}</div>
                <div class="inputs">
                    <div class="content-wrapper">
                        <div class="content-row d-flex gap-10 algn-i-c">
                            <div class="inputGroup">
                                <input class="input" type="text" required="" autocomplete="off" value=${invDateValue}>
                                <label for="cashamount">Invoice Date</label>
                                <div class="block-entry"></div>
                            </div>
                            <div class="inputGroup">
                                <input class="input" type="text" required="" autocomplete="off" value=${empBranch}>
                                <label for="cashamount">Branch</label>
                                <div class="block-entry"></div>
                            </div>
                        </div>
                        <div class="content-row d-flex gap-10 algn-i-c">
                            <div class="inputGroup">
                                <label for="cashamount">Payment Method</label>
                                ${payMethodDiv.outerHTML}
                            </div>
                            <div class="inputGroup">
                                <input class="input" type="text" required="" autocomplete="off" value="${customerName}"> 
                                <label for="cashamount">Customer</label>
                                <div class="block-entry"></div>
                            </div>
                        </div>
                        <div class="content-row d-flex gap-10 algn-i-c">
                            <div class="inputGroup">
                                <input class="input" type="text" required="" autocomplete="off" value=${invTotal} id="invSubTotal">
                                <label for="cashamount">Sub-Total</label>
                                <div class="block-entry"></div>
                            </div>
                            <div class="inputGroup">
                                <input class="input" id="invDiscount" type="text" required="" autocomplete="off" value=0>
                                <label for="cashamount">Discount</label>
                                ${!discountAccess ? `<div class="block-entry"></div>` : ''}
                            </div>
                        </div>
                        <div class="content-row d-flex gap-10 algn-i-c">
                            <div class="inputGroup">
                                <label for="cashamount">Tax Rate</label>
                                ${taxesDiv.outerHTML}
                                ${!overRideTaxAccess ? `<div class="block-entry"></div>` : ''}
                            </div>
                            <div class="inputGroup">
                                <input class="input" type="text" required="" autocomplete="off" value=${invTaxAmt} id="taxValueDiv">
                                <label for="cashamount">Tax Amount</label>
                                <div class="block-entry"></div>
                            </div>
                        </div>
                        <div class="content-row d-flex gap-10 algn-i-c">
                            <div class="inputGroup">
                                <input class="input" type="text" required="" autocomplete="off" value=${invFinalTotal} id="totalInvValueDiv">
                                <label for="cashamount">Total</label>
                                <div class="block-entry"></div>
                            </div>
                        </div>
                        <div class="content-row d-flex gap-10 algn-i-c">
                            <div class="inputGroup">
                                <input class="input" id="paid-amt" type="text" required="" autocomplete="off" value=${invFinalTotal}>
                                <label for="cashamount">Cash Amount</label>
                            </div>
                            <div class="inputGroup">
                                <input class="input" id="inv-remaning-amt" type="text" required="" autocomplete="off" value=0>
                                <label for="cashamount">Remaning</label>
                                <div class="block-entry"></div>
                            </div>
                        </div>
                    </div>
                    <div class="btns-wrap d-flex gap-10 w-100 ontent-c">
                        <button type="button" class="btn-style" id="btn-cash-Invoice">Cash Out</button>
                        <button type="button" class="btn-style" onclick="removerOverlay()" >Cancel</button>
                    </div>
                </div>
            </div>`
    overlayConetent.appendChild(div)

    setupCustomDropdown(overlayConetent.querySelector("#invTaxRatesCash"))
    setupCustomDropdown(overlayConetent.querySelector("#invPayMethodsCash"))
    overlayConetent.querySelectorAll('.ul-dropdown-inner').forEach(ul=>{
        let parentDiv = ul.closest('.ul-select-wrapper')
        let selectedValue = parentDiv.querySelector('.li-selected').getAttribute('data-value')
        ul.querySelectorAll('li').forEach(li=>{
            if(li.getAttribute('data-value')==selectedValue){
                parentDiv.querySelector('.li-selected').textContent = li.textContent
                parentDiv.querySelector('.li-selected').setAttribute('value', li.getAttribute('value')) 
            }
        })
    })

    overlayConetent.querySelector('#btn-cash-Invoice').addEventListener('click', ()=> {
        saveInvoiceHeader(1);
    });
    overlayConetent.querySelector('#paid-amt').focus()
    overlayConetent.querySelector('#paid-amt').select()
    overlayConetent.querySelector('#paid-amt').addEventListener('keyup', calcRemaining);
    function calcRemaining() {
        let remaningInput = document.querySelector("#inv-remaning-amt");
        let paidInput = document.querySelector("#paid-amt");
        let paidAmount = parseFloat(paidInput.value) || 0;
        let totalAmount = parseFloat(invFinalTotal.replace(/,/g, '')) || 0;
        let remainingAmount = paidAmount - totalAmount;
        remaningInput.value = formatAccounting(remainingAmount);
    }
}
function saveInvoiceHeader(invClosed){
    if(!invoiceID){
        errMessage('No Invoice Selected')
        return
    }
    let invDiscount, invTaxID, payMethodID
    let invoiceNo =headerSrcDataContainer.querySelector("#sInvNo").getAttribute('data-value');
    let overlayConetent = document.querySelector('#overlay-content')
    let empBranch = selectedValues.querySelector("#sEmpBranch").getAttribute("data-value");
    let invType = selectedValues.querySelector("#sInvType").getAttribute("data-value");
    let invDate = selectedValues.querySelector("#sInvDate").getAttribute("data-value");
    let invPayment = selectedValues.querySelector("#sInvFinalTotal").getAttribute("data-value");
    let customerID = selectedValues.querySelector("#sCustomerId").getAttribute("data-value");

    if(overlayConetent){
        invDiscount = overlayConetent.querySelector("#invDiscount").value ;
        invTaxID = overlayConetent.querySelector("#invTaxRatesCash .li-selected").getAttribute("data-value");
        payMethodID = overlayConetent.querySelector("#invPayMethodsCash .li-selected").getAttribute("data-value");
    }else{
        invDiscount = selectedValues.querySelector("#sInvDiscount").getAttribute("data-value");
        invTaxID = selectedValues.querySelector("#sTaxRateID").getAttribute("data-value");
        payMethodID = selectedValues.querySelector("#sInvPayMethod").getAttribute("data-value");
    }

    if(!invoiceID || !customerID || !payMethodID || !invTaxID){
        errMessage('Invoice Header Must be Completed for Saving')
        return;
    }
    apex.server.process(
        "SAVE_INV_HEADER_DATA",
        {
            x01: invoiceID,
            x02: customerID,
            x03: payMethodID,
            x04: invDate,
            x05: empBranch,
            x06: invType,
            x07: invTaxID, 
            x08: invClosed,
            x09: parseFloat(invDiscount.replace(/,/g, '')),
            x10: parseFloat(invPayment.replace(/,/g, '')),
        },
        {
            dataType: "json",
            success: function (data) {
                if (data.status !== "SUCCESS") {
                    apex.message.alert(data.message || "Error saving invoice");
                    return;
                }
                if(invClosed ==1){
                    invoiceID =''
                    $('#pos-table-body').empty()
                    document.querySelector('.inv-header .inv-header-wrap .invoice-h').textContent = `No Invoice Selected`
                    document.querySelector('.inv-header .inv-header-wrap .invoice-customer').textContent =''
                    removerOverlay()
                    triggerChangedInvoice()
                    fetchOpenInvoices()
                    successMessage(`Invoice ${invoiceNo} Closed Successfully`)
                }
            },
            error: function (err) {
                console.error(err);
                apex.message.alert("Server error while saving line");
            },
        }
    );
}
/*================================================================ */
//------------------- Open and Close Shifts
/*================================================================*/
function closeOpenShift(){
    let invoicesCount = document.querySelectorAll(".invoices-content .invoice-row").length
    console.log(`Open Invoices: ${invoicesCount}`)
    if(invoicesCount != 0 ){
        errMessage(`Close Open Invoices - ${invoicesCount} Invoice(s)`)
        return
    }
    createOverlay()
    let overlayConetent = document.getElementById('overlay-content')
    let div = document.createElement('div')
    div.className = 'content-body'
    div.innerHTML=`
            <div class="form-wrap wrap" style="width:30vw;">
                <div class="h1">Close Shift</div>
                <div class="inputs">
                    <div class="inputGroup">
                        <input class="input" required="" autocomplete="off" type="number">
                        <label for="cashamount">Cashier Amount</label>
                    </div>
                    <div class="btns-wrap d-flex gap-10 w-100 ontent-c">
                        <button type="button" class="btn-style" id="btn-close-shift">Close Shift</button>
                        <button type="button" class="btn-style" onclick="removerOverlay()" >Cancel</button>
                    </div>
                </div>
            </div>`
    overlayConetent.appendChild(div)

    overlayConetent.querySelector('#btn-close-shift').addEventListener('click', ()=>{closeShift()});
    function closeShift(){
        let overlayConetent = document.getElementById('overlay-content');
        let shiftAmount = overlayConetent.querySelector('input[type="number"]').value;
        if(!shiftAmount){
            const existingError = overlayConetent.querySelector('.err-message');
            const shiftEle = overlayConetent.querySelector('.inputGroup');
            if (existingError) {
                existingError.remove();
            }
            let errorDiv = document.createElement('div')
            errorDiv.className = 'err-message'
            errorDiv.textContent = '*You Must Enter a Number'
            shiftEle.parentNode.insertBefore(errorDiv, shiftEle.nextSibling);
            return 
        };
        shiftAmount = String(shiftAmount).replace(/,/g, '')
        apex.server.process(
            "CLOSE_OPEN_SHIFT",
            {
                x01: openShiftID,
                x02: shiftAmount,
            },
            {
            dataType: "json",
            success: function (data) {
                if (data.status !== "SUCCESS") {
                    removerOverlay()
                    apex.message.alert(data.message || "Error Closing Shift");
                    return;
                }
                openShiftID=''
                removerOverlay()
                successMessage(`Shift Closed Successfully`)
                getOpenShift()
            },
            error: function (err) {
                removerOverlay()
                console.error(err);
                apex.message.alert("Server error while saving line");
            },
            }
        );
    }
}
function openNewShift(){
    if(openShiftID){
        errMessage(`Close Open Shift First`)
        return
    }
    createOverlay()
    let overlayConetent = document.getElementById('overlay-content')
    let div = document.createElement('div')
    div.className = 'content-body'
    div.innerHTML=`
            <div class="form-wrap wrap">
                <div class="h1">Open Shift</div>
                <div class="inputs">
                    <div class="inputGroup">
                        <input class="input" required="" autocomplete="off" type="number">
                        <label for="cashamount">Cashier Amount</label>
                    </div>
                    <div class="btns-wrap d-flex gap-10 w-100 ontent-c">
                        <button type="button" class="btn-style" id="btn-open-shift">Open Shift</button>
                    </div>
                </div>
            </div>`
    overlayConetent.appendChild(div)
    overlayConetent.querySelector('#btn-open-shift').addEventListener('click', openShift);
    function openShift(){
        let shiftAmount = overlayConetent.querySelector('input[type="number"]').value;
        if(!shiftAmount){return};
        shiftAmount = String(shiftAmount).replace(/,/g, '')
        apex.server.process(
            "OPEN_NEW_SHIFT",
            {
                x01: shiftAmount,
            },
            {
            dataType: "json",
            success: function (data) {
                if (data.status !== "SUCCESS") {
                    removerOverlay()
                    apex.message.alert(data.message || "Error Opening Shift");
                    return;
                }
                triggerChangedInvoice()
                getOpenShift()
                removerOverlay()
                successMessage(`Shift Opened Successfully`)
            },
            error: function (err) {
                removerOverlay()
                console.error(err);
                apex.message.alert("Server error while saving line");
            },
            }
        );
    }
}
function createCashEnrty(){
    createOverlay()
    let posOverlay = document.getElementById('pos-overlay');
        posOverlay.style.backgroundColor = '#00000040'
    let overlayConetent = document.querySelector('#overlay-content')
    let div = document.createElement('div')
    div.className = 'content-body-06'
    div.id = 'content-body-06'
    div.innerHTML=`
        <div class="form-wrap wrap" style="width:40vw">
            <div class="h1">Create Cash Entry</div>
            <div class="inputs">
                <div class="content-row d-flex gap-10 algn-i-c">
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
                    <div class="inputGroup">
                        <input class="input" required="" autocomplete="off" type="number" >
                        <label for="cashamount">Amount</label>
                    </div>
                </div>
                <div class="content-row d-flex gap-10 algn-i-c">
                    <div class="inputGroup">
                        <input class="input" required="" autocomplete="off" type="text" id="entryDescription">
                        <label for="cashamount">Description</label>
                    </div>
                </div>
            </div>
            <div class="btns-wrap d-flex gap-10 w-100 ontent-c">
                <button type="button" class="btn-style" id="createCashEntry">Create</button>
                <button type="button" class="btn-style" onclick="removerOverlay()">Cancel</button>
            </div>
        </div>`
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
            const shiftEle = overlayConetent.querySelector('.inputs');
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
/* ------------------------ Append Item to sales table ------------------------ */
let itemFound = false;
let existingRow = null;
let lastPromise = Promise.resolve();
$(document).on("click", ".item-row",function(event) {
    const clickedRow = event.target.closest('.item-row');
    if (!clickedRow) return;
    lastPromise = lastPromise.finally(async () => {
        await handleItemClick(clickedRow);
    });
});
async function handleItemClick(clickedRow) {
    clickedRow.style.opacity = '0.6';
    clickedRow.style.pointerEvents = 'none';
    try {
        // if (!invoiceID) {
        //     errMessage('No Invoice Selected');
        //     return;
        // }
        const row = clickedRow;
        const itemID   = row.querySelector(".item_id").textContent.trim();
        if (!itemID) return;
        const itemName = row.querySelector(".item_name").textContent.trim();
        const itemPrice = parseFloat(row.querySelector(".item_price").textContent.replace(/,/g, '')) || 0;
        const itemUOM  = row.querySelector(".item_uom").textContent.trim();
        let itemImg = row.querySelector('img').getAttribute("src")?.trim() || "";
            itemImg = itemImg.replace(/\n/g, '').trim();
        // ── Look for existing row in POS table ──────────────────────────────
        itemFound = false;
        existingRow = null;
        invoiceLinesItems.forEach((invItemID)=> {
            if (invItemID === itemID) {
                itemFound = true;
                const rows = document.querySelectorAll('.items-table .s-item-row');
                for (const ele of rows) {
                    if (ele.querySelector('.item-id').textContent == invItemID) {
                        existingRow = ele;
                        break;
                    }
                }
                return false; 
            }
        });
        if (itemFound && existingRow && invoiceID) {
            const qtyInput = existingRow.querySelector("input.qty");
            let currentQty = parseInt(qtyInput.value || "0") + 1;
            qtyInput.value=currentQty;
            posTableLines(existingRow, currentQty);
            return;
        }
        // ── Add new row ─────────────────────────────────────────────────────
        const itemsRowCount = $("#pos-table-body .s-item-row").length; 
        invoiceLinesItems.push(itemID)
        let newRowHtml = document.createElement('div')
        newRowHtml.classList.add('s-item-row')
        newRowHtml.innerHTML = `
                <div class="s-item-row d-flex gap-10 p-10 bg-clr-3">
                    <div class="inv-line-id" style="display: none;"></div>
                    <div class="inv-id" style="display: none;">invoiceID</div>
                    <div class="item-id" style="display: none;">${itemID}</div>
                    <div style="display: none;">${itemsRowCount}</div>
                    <div style="display: none;" class="item-name" title="${itemName}">${itemName}</div>
                    <div style="display: none;" class="price">${formatAccounting(itemPrice)}</div>
                    <div style="display: none;" class="uom">${itemUOM}</div>
                    <div style="display: none;" class="amount">${formatAccounting(itemPrice)}</div>
                    
                    <div class="item-img d-flex cntnt-c algn-i-c">
                        <div class="img-holder flow-h postion-r brdr-r-m d-flex cntnt-c algn-i-c bx-shadow-s">
                            <span style="position:absolute;" aria-hidden="true" class="fa fa-trash"></span>
                            <img class="w-100 h-100" src=${itemImg}>
                        </div>
                    </div>
                    <div class="d-flex flex-1 cntnt-sb algn-i-c t-nwrap">
                        <div class="item-disc cntnt-fs t-algn-l t-nwrap p-10 d-flex-c t-bold d-flex flow-h">
                            <div>${itemName}</div> 
                            <div>${formatAccounting(itemPrice)} LE</div>
                        </div>
                        <div class="qty-col cntnt-c algn-i-c postion-r d-flex gap-10 cntnt-fs">
                            <div class="qty-row postion-r bx-shadow-s">
                                <div class="qty-less item-c"><span aria-hidden="true" class="click-btn t-clr-9 fa fa-minus-circle"></span></div>
                                    <input type="number" class="qty t-algn-c" value=1 disabled=true>
                                <div class="qty-plus item-c"><span class="click-btn fa fa-plus-circle" aria-hidden="true"></span></div>
                            </div>
                            <div class="amount">${formatAccounting(itemPrice)} LE</div>
                        </div>
                    </div>
                </div>`;
        posTableLines(newRowHtml, 1);
        // getInvoiceDataDetails();
        // fetchOpenInvoices();
    } catch (err) {
        console.error("Error in handleItemClick:", err);
    } finally {
        clickedRow.style.opacity = '';
        clickedRow.style.pointerEvents = '';
    }
    function posTableLines(trSelected, currentQty) {
        const row = trSelected; 
        const itemID    = row.querySelector(".item-id")?.textContent.trim();
        const invLineID = row.querySelector(".inv-line-id")?.textContent.trim();
        const priceText = row.querySelector(".price")?.textContent.replace(/[^0-9.-]+/g, "");
        const qty       = Number(currentQty);
        const price     = Number(priceText) || 0;
        const amount    = qty * price;
        row.querySelectorAll(".amount").forEach(ele=>ele.textContent=formatAccounting(amount.toFixed(2)));
        if (invoiceID) {
            if(invLineID){
                console.log(`invoiceID: ${invoiceID}`)
                updateLine(itemID, qty, price, amount, invLineID);
            }else {
                console.log(`invoiceID: ${invoiceID}`)
                saveLine(row, 1, price, price);
            }
        }
        if(!invoiceID){
            if(!itemFound){
                document.querySelector('#pos-table-body').appendChild(row);
            }else{
                const qtyInput = existingRow.querySelector("input.qty");
                let currentQty = parseInt(qtyInput.value || "0") + 1;
                qtyInput.value=currentQty;
            }
        }
    }
}
/* ------------------------ Save Line to DB ------------------------ */
function saveLine(row, qty, price, amount) {
    var itemID = row.querySelector(".item-id").textContent;
    let invType = ''
    let lineType = invType =='Return Invoice' ? 'RI' :'SI'
    apex.server.process(
        "ADD_INV_LINE_TO_DB",
        {x01: itemID,x02: qty,x03: price,x04: amount,x05: invoiceID,x06: lineType},
        {
            dataType: "json",
            success: function (data) {
                if (data.status !== "SUCCESS") {
                    apex.message.alert(data.message || "Error saving line");
                    return;
                }
                let invLineID = data.l_inv_line_id;
                row.querySelector(".inv-line-id").textContent = invLineID
                document.querySelector('#pos-table-body').appendChild(row);
                getInvoiceDataDetails()
            },
            error: function (err) {
                console.error(err);
                apex.message.alert("Server error while saving line");
            },
        }
    );
}
/* ------------------------ Update DB Line ------------------------- */
function updateLine(itemID, qty, price, amount, invLineID) {
    apex.server.process(
        "UPDATE_INV_LINE",
        {x01: itemID,x02: qty,x03: price,x04: amount,x05: invLineID,},
        {
            dataType: "json",
            success: function (data) {
            if (data.status !== "SUCCESS") {
                apex.message.alert(data.message || "Error saving line");
                return;
            }
            getInvoiceDataDetails()
            },
            error: function (err) {
            console.error(err);
            apex.message.alert("Server error while saving line");
            },
        }
    );
}
/* ------------------------ Delete Line ------------------------ */
function deleteLine(lineId) {
    if (!lineId) return;
    apex.server.process(
        "DELETE_INV_LINE",
        { x01: lineId },
        {
            dataType: "json",
            success: function () {
                getInvoiceDataDetails()
            },
        }
    );
};
/*================================================================ */
//------------------- Document Elements Events
/*================================================================*/
$(document).on("click", "#navigationBarMenueOpen", () => {
    document.querySelector('#appNavBar').classList.add('nav-active')
});
$(document).on("click", "#navigationBarMenueClose", () => {
    document.querySelector('#appNavBar').classList.remove('nav-active')
});
// Invoice Rows Evenets Qty Increase and Decrease - Delete Line 
$(document).on("click", ".s-item-row .qty-row .qty-plus", (e) => {
    const itemRow = e.target.closest('.s-item-row');
    const lineId = itemRow.querySelector('.inv-line-id')?.textContent;
    const priceText = itemRow.querySelector('.price')?.textContent.replace('LE','').trim();
    const itemID = itemRow.querySelector(".item-id").textContent;

    const amountElements = itemRow.querySelectorAll('.amount'); 
    const qtyInput = itemRow.querySelector('.qty');
    const price = parseFloat(priceText?.replace(/[^0-9.-]/g, '')) || 0;
    const currentQty = parseFloat(qtyInput?.value) || 0;
    const newQty = currentQty + 1;
    if (qtyInput) {
        qtyInput.value = newQty;
    }
    let newAmount = price * newQty  
    amountElements.forEach(element => {
        element.textContent = `${formatAccounting(newAmount)} LE` ;
    });
    updateLine(itemID, newQty, price, newAmount, lineId)
});
$(document).on("click", ".s-item-row .qty-row .qty-less", (e) => {
    const itemRow = e.target.closest('.s-item-row');
    const lineId = itemRow.querySelector('.inv-line-id')?.textContent;
    const priceText = itemRow.querySelector('.price')?.textContent.replace('LE','').trim();
    const itemID = itemRow.querySelector(".item-id").textContent;
    const amountElements = itemRow.querySelectorAll('.amount'); 
    const qtyInput = itemRow.querySelector('.qty');
    const price = parseFloat(priceText?.replace(/[^0-9.-]/g, '')) || 0;
    const currentQty = parseFloat(qtyInput?.value) || 0;
    const newQty = (currentQty - 1) == 0  ? 1 : currentQty - 1;
    if (qtyInput) {
        qtyInput.value = newQty;
    }
    let newAmount = price * newQty  
    amountElements.forEach(element => {
        element.textContent = `${formatAccounting(newAmount)} LE` ;
    });
    updateLine(itemID, newQty, price, newAmount, lineId)
});
$(document).on("click", ".s-item-row .img-holder .fa.fa-trash", (e) => {
    const itemRow = e.target.closest('.s-item-row');
    const lineId = itemRow.querySelector('.inv-line-id')?.textContent;
    const itemID = itemRow.querySelector('.item-id')?.textContent;
    for (let i = invoiceLinesItems.length - 1; i >= 0; i--) {
        if (invoiceLinesItems[i] == itemID) {
            invoiceLinesItems.splice(i, 1);
        }
    }
    if (!lineId) return;
    apex.message.confirm("Delete this line?", function (ok) {
        if (!ok) return;
        deleteLine(lineId) 
        itemRow.remove()
    });
});
/*------------- Open Customers Page  */
$(document).on("click", ".inv-header-wrap .invoice-customer", ()=> {
    openCustomersPage()
})
$(document).on("click", ".inputGroup .fa.fa-plus-circle-o", ()=> {
    createCustomer()
})
/*------------- Open Customers Page  */
$(document).on("click", "#invTaxRatesCash .ul-dropdown-inner li", (e)=> {
    let overlay = document.querySelector('#overlay-content')
    console.log(e.currentTarget)
    let li = e.currentTarget.closest('li');
    let taxRate = li.getAttribute('value')
    let invTotal = overlay.querySelector('#totalInvValueDiv').value
    let invSubTotal = overlay.querySelector('#invSubTotal').value
        invSubTotal = parseFloat(invSubTotal.replace(/,/g, ''))
console.log(taxRate, invTotal, invSubTotal)
    let invDiscount = overlay.querySelector('#invDiscount').value
        invDiscount = parseFloat(invDiscount.replace(/,/g, ''))    

    let taxAmount = taxRate == 0 ? 0 : ((taxRate/100) * invSubTotal)
    invTotal = taxRate == 0 ? (invSubTotal - invDiscount) : ((invSubTotal - invDiscount) + ((taxRate/100) * (invSubTotal - invDiscount)))
    console.log(`taxAmount: ${taxAmount}, invTotal: ${invTotal}`)
    overlay.querySelector('#taxValueDiv').value = formatAccounting(taxAmount)
    overlay.querySelector('#totalInvValueDiv').value = formatAccounting(invTotal)
})
/*================================================================ */
//------------------------- Callback Functions
/*================================================================*/
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
    div.classList.add('pos-overlay','d-flex','cntnt-c','algn-i-c')
    div.id ='pos-overlay'
    div.innerHTML =` <div class="overlay-content" id="overlay-content"></div>`
    document.body.appendChild(div)
}
function removerOverlay(){
    let posOverlay = document.getElementById('pos-overlay')
    posOverlay.remove()
}
function removeElementWithID(eleID){
    let eleToRemove = document.getElementById(eleID)
    eleToRemove.remove()
}
//------------------------- Error Message
function errMessage(msg){  
    apex.message.showPageSuccess(msg); 
    $('#t_Alert_Success').attr('style','background-color: #ffe5ad;');
    $('.t-Alert-title').attr('style','color: black;font-weight: bold;');
    $('#t_Alert_Success div div.t-Alert-icon span').removeClass('t-Icon').addClass('fa fa-warning');
    setTimeout(function() {
        apex.message.hidePageSuccess();
    }, 3000);
}
function successMessage(msg){  
    apex.message.showPageSuccess(msg); 
    setTimeout(function() {
        apex.message.hidePageSuccess();
    }, 3000);
}
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