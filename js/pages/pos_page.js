var actionConfirmed = false
var logFor='JavaScript', pageID = 9, logFile ='pos_page.js', logShift, logUser = activeUser

let invoiceLinesItems = []
let invoiceID, openShiftID, headerSrcDataContainer, srcValuesHolder, selectedValues, posCategoriesContainer
/*================================================================ */
//------------------- Get User Access
/*================================================================*/
document.addEventListener("DOMContentLoaded", initPOS);
async function initPOS() {
    try {
        buildApp()
        await fetchUserAccess();
        await createNavBar(true, true)
        await createPageStructure()
    } catch (err) {
        console.error("POS init failed:", err);
        errLog(logFor,'initPOS()',pageID, logFile,err,logShift,logUser)
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
                    <h4 class="invoice-h t-bold margn-0">Select Invoice</h4>
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
            <button class="btn-style-brdr flex-1 t-size-m" type="button" onclick="createNewInvoice()" style="padding: 17px;transform: translateY(-18px);">Save</button>
        </div>
    </div>
    `;
    pos.appendChild(divposWrapper)
    app.appendChild(pos)
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
}catch(err){
    console.log('Err', err)
    errLog(logFor,'createPageStructure()',pageID, logFile,err,logShift,logUser)
}
}
async function getOpenShift(){
try{
    if(!userPermissions){return}
    let data = await apex.server.process('GET_OPEN_SHIFT',{},{dataType: 'json'})
    if (data.found == 'Y') {
        openShiftID = data.open_shift
        logShift = openShiftID
        fetchSrcData()
        fetchCategories()
        fetchItems()
    }
    else{
        openNewShift();
    }
}catch(err) {
    console.error(err);
    apex.message.alert('Server error while fetching item');
    errLog(logFor,'getOpenShift()',pageID, logFile,err,logShift,logUser)
}
}
/*================================================================ */
//------------------- Functions Runs on Page Load
/*================================================================*/
/* ------------------------ Get Items ------------------------ */
function fetchSrcData(){
try{
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
}catch(err){
    console.log('Err', err)
    errLog(logFor,'fetchSrcData()',pageID, logFile,err,logShift,logUser)
}
}
async function fetchCategories() {
try{
    let data = await apex.server.process('GET_ITEMS_CATEGORIES',{},{dataType: 'json'});
    if (data.found !== 'Y') {return};
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
    
}catch(err){
    console.log(err)
    errLog(logFor,'fetchCategories()',pageID, logFile,err,logShift,logUser)
}
}
async function fetchItems() {
try{
    let posItemsContainer = document.querySelector("#pos-items")
    showLoader(posItemsContainer)
    let data = await apex.server.process("GET_ITEMS",{},{dataType: 'json'});
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
}catch(err){
    removeLaoder(posItemsContainer)
    console.error(err);
    apex.message.alert('Server error while fetching item');
    errLog(logFor,'fetchItems()',pageID, logFile,err,logShift,logUser)
}
};
/* ------------------------ Fetch Data On Page Load and Save It In Hidden Div ------------------------ */
async function fetchOpenInvoices() {
try{
    let data = await apex.server.process('GET_OPEN_INVS',{},{dataType: 'json'})
    // if(data.found !=='Y'){return}
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
                document.querySelector('.inv-header .inv-header-wrap .invoice-h').textContent = `Invoice #${invNum.replace('#','')}`
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
                document.querySelector('.inv-header .inv-header-wrap .invoice-h').textContent = `Invoice #${ele.querySelector('.invoice').textContent.replace('#','').trim()}`
                document.querySelector('.inv-header .inv-header-wrap .invoice-customer').textContent = `${ele.getAttribute('data-customer').trim()}`
            }
        })
    }
}catch(err){
    console.error(err);
    apex.message.alert('Server error while fetching item');
    errLog(logFor,'fetchOpenInvoices()',pageID, logFile,err,logShift,logUser)
}
}
async function fetchPaymentMethods() {
    let div = document.createElement('div')
    div.classList.add('inv-head-row')
    div.innerHTML=`<div id="invPayMethods">
                        <ul class="ul-dropdown-inner"></ul>
                    </div>`
    srcValuesHolder.appendChild(div)
    try{
        let data = await apex.server.process('GET_PAYMENT_METHODS',{},{dataType: 'json'})
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
    }catch(err){
        console.error(err);
        apex.message.alert('Server error while fetching item');
        errLog(logFor,'fetchPaymentMethods()',pageID, logFile,err,logShift,logUser)
    }
}
function fetchTaxRates() {
    let div = document.createElement('div')
    div.classList.add('inv-head-row')
    div.innerHTML=`<div id="invTaxRates">
                        <ul class="ul-dropdown-inner"></ul>
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
// function fetchCustomers(){
//     let div = document.createElement('div')
//     div.classList.add('inv-head-row')
//     div.innerHTML=`<div id="customerIds" class="ul-select-wrapper input" style="position: relative;">
//                     <div class="li-selected" data-value=""></div>
//                     <div class="dropdown-list"  style="position: absolute;">
//                         <input placeholder="Search..." type="text" class="dropdown-menu-search">
//                         <ul class="ul-dropdown-inner"></ul>
//                     </div>
//                 </div>`
//     srcValuesHolder.appendChild(div)
//     apex.server.process(
//         'GET_CUSTOMERS',
//         {},
//         {
//             dataType: 'json',
//             success: function (data) {
//                 if (data.found === 'Y') {
//                     let jsonData = data.items
//                     const parentElement = document.querySelector("#customerIds");
//                     const selectList = parentElement.querySelector(".ul-dropdown-inner");
//                     jsonData.forEach((item) => {
//                         const option = document.createElement('li');
//                             option.dataset.value = item.customer_id;
//                             option.value = item.customer_name 
//                             option.textContent = item.customer_name;
//                         selectList.appendChild(option);
//                     });
//                 }
//             },
//             error: function (err) {
//                 console.error(err);
//                 apex.message.alert('Server error while fetching item');
//             }
//         }
//     );
// }
/*-------------- Open Customers Page and Create New Customer ------------------*/
async function openCustomersPage(){
try{
    if(!openShiftID){openNewShift(); return}
    if(!invoiceID){
        errMessage('Selecte Invoice First')
        return
    }
    let overlayExist = false;
    let overlayConetent = document.querySelector('#overlay-content')
    if(overlayConetent){
        overlayExist = true
    }else{
        createOverlay();
        overlayConetent = document.querySelector('#overlay-content')
    }
    let div = document.createElement('div')
    div.id = 'contentWrap01'
    div.className = 'content-body-wrap'
    div.style.cssText='z-index: 1;'
    div.innerHTML=`
            <div class="content-body" style="min-width: 60%;z-index: 1;">
            <div class="form-wrap p-10">
                <div class="form-title">Customers</div>
                <div onclick=" ${overlayExist ? "removeElementWithID('contentWrap01')" : "removerOverlay()"}" 
                    class="postion-a click-btn d-flex algn-i-c cntnt-c cursor-p t-clr-5" style="right: 10px;top: 7px;">
                    <span class="fa fa-times-circle t-size-5 t-clr-9" aria-hidden="true"></span>
                </div>
                <div class="form-data" style="gap: 0;">
                    <div class="input-group input-field w-100" style="margin: 0;" >
                        <input type="text" placeholder="Search..." class="item-search-input" id="searchCustomer">
                        <span class="fa fa-search t-clr-5" aria-hidden="true"></span>
                    </div>
                    <div class="content-wrapper scroll-y scrol-bar-w-0">
                        <div class="w-100 d-flex-r p-10" style="position: sticky;top: 0;text-wrap: nowrap;background: var(--bg-clr-1);padding: 10px 0;">
                            <div class="flex-1">Customer Name</div>
                            <div class="flex-1">Phone Number</div>
                            <div class="flex-1">Address</div>
                        </div>
                    </div>
                    <div class="btns-wrap d-flex gap-10 w-100 cntnt-c p-20">
                        ${!createCustomerAccess ? '' : `<button type="button" class="btn-style"  id="OpenCreateNewCustomer">Create New</button>`}
                    </div>
                </div>
            </div></div>`
    overlayConetent.appendChild(div)
    try{
        let data = await apex.server.process('GET_CUSTOMERS',{},{dataType: 'json'});
        if (data.found === 'Y') {
            let jsonData = data.items
            const parentElement = document.querySelector("#contentWrap01 .form-data .content-wrapper");
            let classAdded = false
            jsonData.forEach((item) => {
                const option = document.createElement('div');
                option.classList.add('content-row','d-flex-r','hover-clr-1','cursor-p','p-10','brdr-r-m')
                if(!classAdded){
                    option.classList.add('bg-clr-1')
                    classAdded = true
                }else{classAdded = false}
                option.dataset.value = item.customer_id;
                option.innerHTML =`
                                <div  class="name flex-1"">${item.customer_name ? item.customer_name : ''}</div>
                                <div class="flex-1">${item.customerPhone ? item.customerPhone : ''}</div>
                                <div class="flex-1">${item.customerAddress? item.customerAddress : ''} </div>
                                `
                parentElement.appendChild(option);
                option.addEventListener('click',(e)=>{
                    let row = e.target.closest('.content-row')
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
                        if(overlayExist)overlayConetent.querySelector('.invCustomerName').textContent= customerName
                    })
                    if(overlayExist){removeElementWithID('contentWrap01')
                    }else{removerOverlay()}
                    saveInvoiceHeader(0)
                })
            });
        }
    overlayConetent.querySelector('#searchCustomer').addEventListener('keyup', (e) => {
        const txtVal = e.target.value.trim().toLowerCase();
        overlayConetent.querySelectorAll('.content-row').forEach(row => {
        const rowValue = row.textContent.toLowerCase();
        if (txtVal === '') {
            row.style.display = 'flex';
            return;
        }
        if (rowValue.includes(txtVal)) {
            row.style.display = 'flex';
        } else {
            row.style.display = 'none';
        }
        });
    });
    }catch(err){
        console.error(err);
        apex.message.alert('Server error while fetching item');
        errLog(logFor,'openCustomersPage()',pageID, logFile,err,logShift,logUser)
    }
    overlayConetent.querySelector('#OpenCreateNewCustomer')?.addEventListener('click', ()=> {
        createCustomer(overlayExist)
    })
}catch(err){
    console.log('Err', err)
    errLog(logFor,'openCustomersPage()',pageID, logFile,err,logShift,logUser)
}
}
function createCustomer(overlayExist){
try{
    let customerName, customerAddress, customerPhone;
    let overlayConetent = document.getElementById('overlay-content')
    if(!overlayConetent){return}
    let div = document.createElement('div')
    div.id = 'contentWrap02'
    div.className = 'content-body-wrap'
    div.style.cssText='z-index: 2;'
    div.innerHTML=`
        <div class="content-body" style="width: 40%;height: 50%;z-index: 2;">
        <div class="form-wrap wrap d-flex-c gap-10 cntnt-sb">
            <div class="form-title">Create Customer</div>
            <div class="form-data">
                <div class="content-wrapper d-flex-c gap-10 p-10 cntnt-c">
                    <div class="content-row d-flex-c gap-10 algn-i-c">
                        <div class="inputGroup">
                            <input class="input" required="" autocomplete="off" type="text" id="new-customer-name">
                            <label for="cashamount">Customer Name</label>
                        </div>
                    </div>
                    <div class="content-row d-flex-c gap-10 algn-i-c">
                        <div class="inputGroup">
                            <input class="input" required="" autocomplete="off" type="text" id="new-customer-phone">
                            <label for="cashamount" >Phone Number</label>
                        </div>
                    </div>
                    <div class="content-row d-flex-c gap-10 algn-i-c">
                        <div class="inputGroup">
                            <input class="input" required="" autocomplete="off" type="text" id="new-customer-adreess">
                            <label for="cashamount">Address</label>
                        </div>
                    </div>
                </div>
                <div class="btns-wrap d-flex gap-10 w-100 cntnt-c p-10">
                    <button type="button"class="btn-style" id="createNewCustomer">Create</button>
                    <button type="button"class="btn-style" onclick="removeElementWithID('contentWrap02')">Cancel</button>
                </div>
            </div>
        </div></div>`
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
        postCustomerData(overlayExist)
    });
    async function postCustomerData(overlayExist){
    try{
        console.log(customerName.value, customerPhone, customerAddress)
        let data = await apex.server.process("CREATE_NEW_CUSTOMER",{ x01: customerName.value, x02: customerPhone, x03: customerAddress},{dataType: "json"})
        if (data.status !== "SUCCESS") {
            apex.message.alert(data.message || "Error saving Customer");
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
            const parentElement = document.querySelector("#contentWrap01 .form-data .content-wrapper");
            const option = document.createElement('div');
            option.classList.add('content-row','d-flex-r','hover-clr-1','cursor-p','p-10','brdr-r-m')
            option.dataset.value = data.customerID; 
            option.innerHTML =`
                            <div class="name flex-1"">${customerName.value}</div>
                            <div class="flex-1">${customerPhone}</div>
                            <div class="flex-1">${customerAddress} </div>
                            `
            parentElement.appendChild(option);
            option.addEventListener('click',(e)=>{
                let row = e.target.closest('.content-row')
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
                        if(overlayExist)overlayConetent.querySelector('.invCustomerName').textContent= customerName
                    }
                })
                if(overlayExist){removeElementWithID('contentWrap01')
                }else{removerOverlay()}
                saveInvoiceHeader(0)
            })
            removeElementWithID('contentWrap02')
        }
    }catch(err) {
        console.error(err);
        apex.message.alert("Server error while saving line");
        errLog(logFor,'createCustomer() => postCustomerData()',pageID, logFile,err,logShift,logUser)
    } 
    }
}catch(err){
    console.log('Err', err)
    errLog(logFor,'createCustomer()[Overlay Form Creation]',pageID, logFile,err,logShift,logUser)
}
}
/* ------------------------ Get Selected Invoice Header Details ------------------------ */
/* ------------------------ Get Selected Invoice Details ------------------------ */
function triggerChangedInvoice(){
try{
    if(!invoiceID){
        invoiceID = 0
        // return
    }
    getInvoiceDataDetails()
    renderInvoiceRows();
}catch(err){
    console.log('Err', err)
    errLog(logFor,'triggerChangedInvoice()',pageID, logFile,err,logShift,logUser)
}
}
async function getInvoiceDataDetails(){
if(!openShiftID){openNewShift(); return}
try{
    let data = await apex.server.process('GET_INVOICE_HEADER_DATA',{ x01: invoiceID },{dataType: 'json'})
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
}catch(err){
    console.error(err);
    errLog(logFor,'getInvoiceDataDetails()',pageID, logFile,err,logShift,logUser)
}
}
/* ---- Render invoice rows related to selected invoice */
async function renderInvoiceRows() {
    if(!openShiftID){openNewShift(); return}
    let itemsRow = 0
    if (!invoiceID) {
        return;
    }
    let posItemsContainer = document.querySelector("#pos-container")
    showLoader(posItemsContainer)
try{
        let data = await apex.server.process('GET_INV_LINES',{ x01: invoiceID },{dataType: 'json'})
        if (data.found !== 'Y') {
            $('#pos-table-body').empty();
            let div = `<div style="text-align: center;">No Data Found</div>`
            $('#pos-table-body').append(div);
            removeLaoder(posItemsContainer)
            return;
        }
        $('#pos-table-body').empty()
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
    }
    catch(err) {
        console.error(err);
        removeLaoder(posItemsContainer)
        errLog(logFor,'renderInvoiceRows()',pageID, logFile,err,logShift,logUser)
    }

}
/*================================================================ */
//------------------- Create and Save Invoice
/*================================================================*/
async function createNewInvoice() {
try{
    if(!openShiftID){openNewShift(); return}
    if(invoiceID){
        invoiceLinesItems = []
        invoiceID =''
        $('#pos-table-body').empty()
        document.querySelector('.inv-header .inv-header-wrap .invoice-h').textContent = `Select Invoice`
        document.querySelector('.inv-header .inv-header-wrap .invoice-customer').textContent =''
        getInvoiceDataDetails()
        fetchOpenInvoices()
        return;
    }
    actionConfirmed = await confirmMsg('Create New Invoice?')
    if(!actionConfirmed)return;
    try {
        const headerResult = await apex.server.process("CREATE_NEW_INVOICE", {x01: openShiftID}, {dataType: "json"});
        if (headerResult.status !== "SUCCESS") {
            apex.message.alert("Error: " + (headerResult.message || "Failed to create invoice"));
            errLog(logFor,'createNewInvoice()',pageID, logFile,headerResult.message,logShift,logUser)
            return;
        }
        const invNo    = headerResult.inv_no;
        invoiceID      = headerResult.inv_id;  
        const soldItems = document.querySelectorAll('#pos-table-body .s-item-row.d-flex');
        soldItems.forEach(row => {
            const priceEl = row.querySelector(".price");
            const qtyInput = row.querySelector("input.qty");
            const price = parseFloat(priceEl?.textContent?.replace(/,/g, '')) || 0;
            const qty   = parseInt(qtyInput?.value || '0', 10) || 0;
            if (qty <= 0 || price <= 0) return; 
            const amount = qty * price;
            saveLine(row, qty, price, amount, true)
        });
        triggerChangedInvoice()
        fetchOpenInvoices();
        successMessage(`Invoice ${invNo} Created Successfully`);
    } catch (err) {
        errLog(logFor,'createNewInvoice()',pageID, logFile,err,logShift,logUser)
        console.error('Invoice creation failed:', err);
    }
}catch(err){
    console.log('Err', err)
    errLog(logFor,'createNewInvoice()',pageID, logFile,err,logShift,logUser)
}   
}
function cashOutInvoice(){
try{
    if(!openShiftID){openNewShift(); return}
    if(!invoiceID){
        errMessage('Select Invoice To Proceed')
        return
    }
    createOverlay()
    let invoiceNo =headerSrcDataContainer.querySelector("#sInvNo").getAttribute('data-value').trim();
    let overlayConetent = document.querySelector('#overlay-content')
    let invDateValue = selectedValues.querySelector("#sInvDate").getAttribute("data-value");
    let invTotal =  selectedValues.querySelector("#sInvTotal").getAttribute("data-value");
    let invTaxAmt =    selectedValues.querySelector("#sInvTaxAmt").getAttribute("data-value").trim();
    let invFinalTotal =  selectedValues.querySelector("#sInvFinalTotal").getAttribute("data-value").trim();
    let customerName =  document.querySelector(".invoice-row.selected-invoice").getAttribute("data-customer");
    let sInvPayMethod =  document.querySelector("#sInvPayMethod").getAttribute("data-value");
    let invDiscount = selectedValues.querySelector("#sInvDiscount").getAttribute("data-value");

    let div = document.createElement('div')
    div.className = 'content-body-wrap'
    div.id = 'contentWrap'
    let soldDev = document.createElement('div')
    soldDev.classList.add('sold-items','w-100','sold-items','flow-h','d-flex-c','cntnt-fs','algn-i-c','p-10','gap-10','flex-1')
    let soldItems = document.querySelectorAll('#pos-table-body .s-item-row')
    soldItems.forEach(ele => {
        let item = document.createElement('div')
        item.classList.add('item','d-flex-r','gap-10','w-100','cntnt-fs','t-nwrap','algn-i-c')
        item.querySelector('.item-img span')?.remove()
        item.innerHTML=`
            ${ele.querySelector('.item-img').outerHTML}
            <div class="d-flex-c gap-5">
                <div class="t-bold">${ele.querySelector('.item-name')?.textContent}</div>
                <div>
                    ${ele.querySelector('.qty-col input.qty')?.value} x ${ele.querySelector('.price')?.textContent}
                </div>
            </div>
            <div class="flex-1 t-algn-r">
                ${ele.querySelector('.qty-col .amount')?.textContent}
            </div>
        `
        soldDev.appendChild(item)
        item.querySelector('.item-img span')?.remove()
    });
    let divPayMethods = document.createElement('div')
    divPayMethods.classList.add('payMethods','d-flex-r','gap-10','d-flx-wrap')
    divPayMethods.style.cssText = 'margin-top:30px'
    let invPayMethods = document.querySelectorAll('#invPayMethods ul li')
    invPayMethods.forEach(li=>{
        let methodDiv = document.createElement('div');
        methodDiv.dataset.value = li.getAttribute('data-value');
        methodDiv.textContent = li.textContent
        methodDiv.style.cssText = 'height: 80px;min-width: 100px;flex-grow: 1;'
        if(sInvPayMethod==li.getAttribute('data-value')){methodDiv.classList.add('selected-pay')}
        methodDiv.classList.add('hover-brdr-btn','bg-clr-3','click-btn','hover-btn','bx-shadow-s','cursor-p','brdr-r-m','t-bold','d-flex','algn-i-c','t-nwrap')
        methodDiv.style.cssText='padding: 30px 20px;'
        divPayMethods.appendChild(methodDiv)
    })
    div.innerHTML=`
            <div class="content-body">
            <div class="form-wrap">
                <div onclick="removerOverlay()" class="postion-a click-btn d-flex algn-i-c cntnt-c cursor-p t-clr-5" style="right: 10px;top: 7px;">
                    <span class="fa fa-times-circle t-size-5 t-clr-9" aria-hidden="true"></span>
                </div>
                <div class="form-title">Payment</div>
                <div class="form-data" style="margin:0">
                    <div class="content-wrapper d-flex-r cntnt-sb gap-20">
                        <div class="d-flex-c cntnt-c algn-i-c" style="margin: 50px 0 0;">
                            <div class="d-flex gap-10 w-100 cntnt-c algn-i-c p-10 brdr-r-m bx-shadow-s" style="width: 450px;">
                                <div class="p-10 h-100 brdr-r-m t-clr-3 bg-clr-5">CN</div>
                                <div class="cursor-p" onclick="openCustomersPage()">
                                    <div class="d-flex gap-10 t-size-m algn-i-c">
                                        <div class="t-bold invCustomerName">${customerName}</div>
                                        <!--<span class="fa fa-refresh" aria-hidden="true"></span>-->
                                    </div>
                                    <div>#${invoiceNo}</div>
                                </div>
                                <div class="flex-1 t-algn-r">${invDateValue}</div>
                            </div>
                            ${soldDev.outerHTML}
                        </div>
                        <div class="cash-inputs d-flex-c bg-clr-1 bx-shadow-s brdr-r-m p-10 cntnt-sa">
                            ${divPayMethods.outerHTML}
                            <div class="inputNumbers d-flex-c gap-10">
                                <div class="inputGroup brdr-r-m p-10 t-bold t-algn-c" >
                                    <label for="cashamount" class="t-clr-5">Discount</label>
                                    ${!discountAccess?  
                                        `<div class="input t-algn-c" id="invDiscount">${invDiscount}</div>`:
                                        `<div class="item-c backspaceBtn" style="right: 12px;"><span class="fa fa-box-arrow-in-west" aria-hidden="true"></span></div>
                                        <input class="input t-algn-c" id="invDiscount" required="" autocomplete="off" type="text" inputmode="decimal" pattern="[0-9]*\.?[0-9]*"
                                        value=${invDiscount}>`
                                    }
                                    
                                </div>
                                <div class="inputGroup brdr-r-m p-10 t-bold t-algn-c postion-r" >
                                    <div class="item-c backspaceBtn" style="right: 12px;"><span class="fa fa-box-arrow-in-west" aria-hidden="true"></span></div>
                                    <label for="cashamount" class="t-clr-5">Paid</label>
                                    <input class="input t-algn-c" id="enteredAmt" required="" pattern="[0-9]*\.?[0-9]*"
                                        autocomplete="off" type="text"  inputmode="decimal"
                                        value=0>
                                </div>     
                                <div class="d-grid cntnt-sa algn-i-c gap-10" style="grid-template-columns: repeat(3, 1fr);grid-template-rows: repeat(3, auto);gap: 10px;">
                                    <div class="numKey bg-clr-3 click-btn hover-btn d-flex algn-i-c cntnt-c" style="height:50px">1</div>
                                    <div class="numKey bg-clr-3 click-btn hover-btn d-flex algn-i-c cntnt-c" style="height:50px">2</div>
                                    <div class="numKey bg-clr-3 click-btn hover-btn d-flex algn-i-c cntnt-c" style="height:50px">3</div>
                                    <div class="numKey bg-clr-3 click-btn hover-btn d-flex algn-i-c cntnt-c" style="height:50px">4</div>
                                    <div class="numKey bg-clr-3 click-btn hover-btn d-flex algn-i-c cntnt-c" style="height:50px">5</div>
                                    <div class="numKey bg-clr-3 click-btn hover-btn d-flex algn-i-c cntnt-c" style="height:50px">6</div>
                                    <div class="numKey bg-clr-3 click-btn hover-btn d-flex algn-i-c cntnt-c" style="height:50px">7</div>
                                    <div class="numKey bg-clr-3 click-btn hover-btn d-flex algn-i-c cntnt-c" style="height:50px">8</div>
                                    <div class="numKey bg-clr-3 click-btn hover-btn d-flex algn-i-c cntnt-c" style="height:50px">9</div>
                                    <div class="numKey bg-clr-3 click-btn hover-btn d-flex algn-i-c cntnt-c" style="height:50px">.</div>
                                    <div class="numKey bg-clr-3 click-btn hover-btn d-flex algn-i-c cntnt-c" style="height:50px">0</div>
                                    <div class="deleteNumber bg-clr-3 click-btn hover-btn d-flex algn-i-c cntnt-c" style="height:50px">
                                        <span class="fa fa-remove" aria-hidden="true"></span>
                                    </div>
                                </div>
                                <div class="d-flex-c gap-5">
                                    <div class="invoice amounts">
                                        <div class="numbers d-flex-c gap-10 p-10 bg-clr-1 w-100 postion-r brdr-r-m flow-h" style="padding: 0 10px;">
                                            <div class="d-flex-c gap-10 t-size-m">
                                                <div class="amt d-flex cntnt-sb algn-i-c"><span>Sub-Total</span><span>${formatAccounting(invTotal)} LE</span></div>
                                                <div class="amt d-flex cntnt-sb algn-i-c"><span>Tax (14%)</span><span>${formatAccounting(invTaxAmt)} LE</span></div>
                                                <div class="amt d-flex cntnt-sb algn-i-c"><span>Discount</span><span class="discountAmt">00.00 LE</span></div>
                                                <div class="amt d-flex cntnt-sb algn-i-c"><span>Remaning</span><span class="remaning">00.00 LE</span></div>
                                            </div>
                                            <div class="postion-r">
                                                <div style="display: flex;align-items: center;justify-content: space-between;" class="numbers t-bold t-size-m d-flex cntnt-sb algn-i-c">
                                                    <span>Total</span><span>${formatAccounting(invFinalTotal)} LE</span>
                                                </div>
                                                <div style="position: absolute;width: 89%;height: 1px;border: 1px dashed #00000070;left: 25px;top: -4px;"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="btns-wrap d-flex gap-10 w-100 cntnt-c brdr-r-m">
                                <button type="button" class="btn-style w-100" id="btn-cash-Invoice">Cash Out</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div></div>`

    overlayConetent.appendChild(div)
    let methodsDiv = overlayConetent.querySelectorAll('.payMethods div')
        methodsDiv.forEach(ele=>{
            ele.addEventListener('click',()=>{
                let cutId = ele.getAttribute('data-value')
                document.querySelector("#sInvPayMethod").setAttribute("data-value", cutId);
                let payMethods = overlayConetent.querySelectorAll('.payMethods div')
                payMethods.forEach(ele=>{ele.classList.remove('selected-pay')})
                ele.classList.add('selected-pay')
            })    
        })

    let numberBtns = overlayConetent.querySelectorAll('.inputNumbers .numKey')
    let paidInput = overlayConetent.querySelector('#enteredAmt')
    let remaning = overlayConetent.querySelector('.remaning')
    let discountInput = overlayConetent.querySelector('#invDiscount')
    let deleteNumber = overlayConetent.querySelector('.deleteNumber')
    let backspaceBtn = overlayConetent.querySelectorAll('.backspaceBtn')
    let activeInput = null;
    overlayConetent.querySelectorAll('input').forEach(input => {
        input.addEventListener('focus', () => {
            activeInput = input;
        })
    });
    function calcRemaning(){
        let paidAmt = paidInput?.value.trim().replace(/,/g, '')  || 0
        let discountAmt = discountInput?.value.trim().replace(/,/g, '')  || 0
        let remaningAmt = paidAmt - (invFinalTotal -discountAmt)
            remaning.textContent = `${formatAccounting(remaningAmt)} LE`
        overlayConetent.querySelector('.discountAmt').textContent = `${formatAccounting(discountAmt)} LE`
    }
    backspaceBtn.forEach(field=>{
        field.addEventListener('click',(e)=>{
            let div = e.target.closest('.inputGroup')
            activeInput = div.querySelector('input') 
            activeInput.focus()
            if(activeInput.value=='' ){return}
            activeInput.value = activeInput.value.slice(0, -1)
            discountInput.dispatchEvent(new Event('keyup'));
            paidInput.dispatchEvent(new Event('keyup'));
        })
    })
    numberBtns.forEach((key)=>{
        key.addEventListener('click',()=>{
            if (!activeInput)return;
            let activeInputVal = activeInput?.value.trim().replace(/,/g, '')  
            let keyValue = key?.textContent.trim()
            if(keyValue =='.'){
                if(activeInputVal.includes('.')){return}
                activeInput.value += keyValue;
                return;
            }
            let amt = activeInputVal + keyValue;
            activeInputVal = amt.replace(/,/g, '')
            activeInput.value = parseFloat(activeInputVal)
            discountInput.dispatchEvent(new Event('keyup'));
            paidInput.dispatchEvent(new Event('keyup'));
            activeInput.focus()
        })
    })
    discountInput.addEventListener('keyup',()=>{calcRemaning()})
    paidInput.addEventListener('keyup',()=>{calcRemaning()})
    deleteNumber.addEventListener('click',()=>{
        if (!activeInput)return;
        activeInput.value=0
        calcRemaning()
    })
    overlayConetent.querySelector('#btn-cash-Invoice').addEventListener('click', ()=> {
        saveInvoiceHeader(1);
    });
}catch(err){
    console.log('Err', err)
    errLog(logFor,'cashOutInvoice()',pageID, logFile,err,logShift,logUser)
} 
}
async function saveInvoiceHeader(invClosed){
try{
    if(!openShiftID){openNewShift(); return}
    if(!invoiceID){
        errMessage('No Invoice Selected')
        return
    }
    let invDiscount, payMethodID
    let invoiceNo =headerSrcDataContainer.querySelector("#sInvNo").getAttribute('data-value');
    let overlayConetent = document.querySelector('#overlay-content')
    let empBranch = selectedValues.querySelector("#sEmpBranch").getAttribute("data-value");
    let invType = selectedValues.querySelector("#sInvType").getAttribute("data-value");
    let invDate = selectedValues.querySelector("#sInvDate").getAttribute("data-value");
    let invPayment = selectedValues.querySelector("#sInvFinalTotal").getAttribute("data-value");
    let customerID = selectedValues.querySelector("#sCustomerId").getAttribute("data-value");
    let invTaxID = selectedValues.querySelector("#sTaxRateID").getAttribute("data-value");

    if(overlayConetent){
        invDiscount = overlayConetent.querySelector("#invDiscount").value ;
        payMethodID = overlayConetent.querySelector(".payMethods .selected-pay").getAttribute("data-value");
    }else{
        invDiscount = selectedValues.querySelector("#sInvDiscount").getAttribute("data-value");
        payMethodID = selectedValues.querySelector("#sInvPayMethod").getAttribute("data-value");
    }

    if(!invoiceID || !customerID || !payMethodID || !invTaxID){
        errMessage('Invoice Header Must be Completed for Saving')
        return;
    }
    try{
        let res = await apex.server.process('SAVE_INV_HEADER_DATA',{
            x01: invoiceID, x02: customerID, x03: payMethodID, x04: invDate, 
            x05: empBranch, x06: invType, x07: invTaxID,  x08: invClosed, 
            x09: parseFloat(invDiscount.replace(/,/g, '')), x10: parseFloat(invPayment.replace(/,/g, ''))
        },{dataType:"json"})
        if (res.status !== "SUCCESS") {
            errLog(logFor,`saveInvoiceHeader(${invClosed})`,pageID, logFile,res.message,logShift,logUser)
            apex.message.alert(res.message || "Error saving invoice");
            return;
        }
        if(invClosed ==1){
            invoiceLinesItems = []
            invoiceID =''
            $('#pos-table-body').empty()
            document.querySelector('.inv-header .inv-header-wrap .invoice-h').textContent = `Select Invoice`
            document.querySelector('.inv-header .inv-header-wrap .invoice-customer').textContent =''
            removerOverlay()
            triggerChangedInvoice()
            fetchOpenInvoices()
            successMessage(`Invoice ${invoiceNo} Saved`)
        }
    }
    catch(err){
        console.error(err);
        apex.message.alert("Server error while saving line");
        errLog(logFor,`saveInvoiceHeader(${invClosed}) => PostData`,pageID, logFile,err,logShift,logUser)
    }
}catch(err){
    console.log('Err', err)
    errLog(logFor,'saveInvoiceHeader()=> Data Capture',pageID, logFile,err,logShift,logUser)
} 
}
/*================================================================ */
//------------------- Open and Close Shifts
/*================================================================*/
function closeOpenShift(){
try{
    if(!openShiftID){openNewShift(); return}
    let invoicesCount = document.querySelectorAll(".invoices-content .invoice-row").length
    console.log(`Open Invoices: ${invoicesCount}`)
    if(invoicesCount != 0 ){
        errMessage(`Close Open Invoices - ${invoicesCount} Invoice(s)`)
        return
    }
    createOverlay()
    let overlayConetent = document.getElementById('overlay-content')
    let div = document.createElement('div')
    div.id = 'contentWrap'
    div.className = 'content-body-wrap'
    div.innerHTML=`
            <div class="content-body" style="width: 400px;height: auto">
            <div class="form-wrap">
                <div class="form-title">Close Shift</div>
                <div class="form-data">
                    <div class="content-wrapper">
                        <div class="inputGroup">
                            <input class="input" required="" autocomplete="off" type="number">
                            <label for="cashamount">Cashier Amount</label>
                        </div>
                    </div>
                    <div class="btns-wrap d-flex gap-10 w-100 cntnt-c">
                        <button type="button" class="btn-style" id="btn-close-shift">Close Shift</button>
                        <button type="button" class="btn-style" onclick="removerOverlay()" >Cancel</button>
                    </div>
                </div>
            </div></div>`
    overlayConetent.appendChild(div)

    overlayConetent.querySelector('#btn-close-shift').addEventListener('click', ()=>{closeShift()});
    async function closeShift(){
        try{
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
            let data = await apex.server.process("CLOSE_OPEN_SHIFT",{x01: openShiftID,x02: shiftAmount,},{dataType: "json"})
            if (data.status !== "SUCCESS") {
                removerOverlay()
                apex.message.alert(data.message || "Error Closing Shift");
                return;
            }
            openShiftID=''
            removerOverlay()
            successMessage(`Shift Closed Successfully`)
            getOpenShift()
        }catch(err){
            console.error('Err', err)
            removerOverlay()
            errLog(logFor,'closeOpenShift() => closeShift()',pageID, logFile,err,logShift,logUser)
        }
    }
}catch(err){
    console.error('Err', err)
    errLog(logFor,'closeOpenShift()',pageID, logFile,err,logShift,logUser)
}
}
function openNewShift(){
try{
    if(openShiftID){
        errMessage(`Close Open Shift First`)
        return
    }
    createOverlay()
    let overlayConetent = document.getElementById('overlay-content')
    let div = document.createElement('div')
    div.id = 'contentWrap'
    div.className = 'content-body-wrap'
    div.innerHTML=`
            <div class="content-body" style="width: 400px;height: auto">
            <div class="form-wrap">
                <div class="form-title">Open Shift</div>
                <div class="form-data">
                    <div class="content-wrapper">
                        <div class="inputGroup">
                            <input class="input" required="" autocomplete="off" type="number">
                            <label for="cashamount">Cashier Amount</label>
                        </div>
                    </div>
                    <div class="btns-wrap d-flex gap-10 w-100 cntnt-c">
                        <button type="button" class="btn-style" id="btn-open-shift">Open Shift</button>
                    </div>
                </div>
            </div>
            </div>`
    overlayConetent.appendChild(div)
    overlayConetent.querySelector('#btn-open-shift').addEventListener('click', ()=>{openShift()});
    const openShift = async ()=>{
        let shiftAmount = overlayConetent.querySelector('input[type="number"]').value;
        if(!shiftAmount){return};
        shiftAmount = String(shiftAmount).replace(/,/g, '')
        try{
            let data = await apex.server.process("OPEN_NEW_SHIFT",{x01: shiftAmount,},{dataType: "json"})
            if (data.status !== "SUCCESS") {
                removerOverlay()
                apex.message.alert(data.message || "Error Opening Shift");
                return;
            }
            openShiftID=data.shiftID
            removerOverlay()
            triggerChangedInvoice()
            getOpenShift()
            successMessage(`Shift Opened Successfully`)
        }catch(err) {
            removerOverlay()
            console.error(err);
            errLog(logFor,'openNewShift() => openShift()',pageID, logFile,err,logShift,logUser)
        }
    }
}catch(err){
    console.error('Err', err)
    errLog(logFor,'openNewShift()',pageID, logFile,err,logShift,logUser)
}
}
/* ------------------------ Append Item to sales table ------------------------ */
let itemFound = false;
let existingRow = null;
let lastPromise = Promise.resolve();
$(document).on("click", ".item-row",function(event) {
    if(!openShiftID){openNewShift(); return}
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
        if(itemsRowCount==0){$('#pos-table-body').empty();}
        invoiceLinesItems.push(itemID)
        let newRowHtml = document.createElement('div')
        newRowHtml.classList.add('s-item-row','s-item-row','d-flex','gap-10','p-10','bg-clr-3')
        newRowHtml.innerHTML = `
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
                    </div>`;
        posTableLines(newRowHtml, 1);
        // getInvoiceDataDetails();
        // fetchOpenInvoices();
    } catch (err) {
        console.error("Error in handleItemClick:", err);
        errLog(logFor,'handleItemClick()',pageID, logFile,err,logShift,logUser)
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
                updateLine(itemID, qty, price, amount, invLineID);
            }else {
                saveLine(row, 1, price, price, false);
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
async function saveLine(row, qty, price, amount, newInv) {
try{
    if(!openShiftID){openNewShift(); return}
    var itemID = row.querySelector(".item-id").textContent;
    let invType = ''
    let lineType = invType =='Return Invoice' ? 'RI' :'SI'
    let data = await apex.server.process("ADD_INV_LINE_TO_DB",{x01: itemID,x02: qty,x03: price,x04: amount,x05: invoiceID,x06: lineType},{dataType: "json"})
    if (data.status !== "SUCCESS") {
        apex.message.alert(data.message || "Error saving line");
        errLog(logFor,'saveLine()',pageID, logFile,err,logShift,logUser)
        return;
    }
    let invLineID = data.l_inv_line_id;
    row.querySelector(".inv-line-id").textContent = invLineID
    if(!newInv){
        document.querySelector('#pos-table-body').appendChild(row);
        getInvoiceDataDetails()
    }
    if(newInv){
        row.querySelector(".inv-id").textContent = invoiceID
    }

}catch(err){
    console.error('Err', err)
    errLog(logFor,'saveLine()',pageID, logFile,err,logShift,logUser)
}
}
/* ------------------------ Update DB Line ------------------------- */
async function updateLine(itemID, qty, price, amount, invLineID) {
try{
    if(!openShiftID){openNewShift(); return}
    let data = await apex.server.process("UPDATE_INV_LINE",{x01: itemID,x02: qty,x03: price,x04: amount,x05: invLineID},{dataType: "json"})
    if (data.status !== "SUCCESS") {
        apex.message.alert(data.message || "Error saving line");
        errLog(logFor,'updateLine()',pageID, logFile,err,logShift,logUser)
        return;
    }
    getInvoiceDataDetails()
}catch(err){
    console.error('Err', err)
    errLog(logFor,'updateLine()',pageID, logFile,err,logShift,logUser)
}
}
/* ------------------------ Delete Line ------------------------ */
async function deleteLine(lineId) {
try{
    if(!openShiftID){openNewShift(); return}
    if (!lineId) return;
    await apex.server.process("DELETE_INV_LINE",{ x01: lineId },{dataType: "json"})
    getInvoiceDataDetails()
}catch(err){
    console.error('Err', err)
    errLog(logFor,'deleteLine()',pageID, logFile,err,logShift,logUser)
}
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
    if(!openShiftID){openNewShift(); return}
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
    if(!openShiftID){openNewShift(); return}
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
    if(!openShiftID){openNewShift(); return}
    const itemRow = e.target.closest('.s-item-row');
    const lineId = itemRow.querySelector('.inv-line-id')?.textContent;
    const itemID = itemRow.querySelector('.item-id')?.textContent;
    for (let i = invoiceLinesItems.length - 1; i >= 0; i--) {
        if (invoiceLinesItems[i] == itemID) {
            invoiceLinesItems.splice(i, 1);
        }
    }
    if (!lineId) {
        itemRow.remove()
        return
    };
    apex.message.confirm("Delete this line?", function (ok) {
        if (!ok) return;
        deleteLine(lineId) 
        itemRow.remove()
    });
});
/*------------- Open Customers Page  */
$(document).on("click", ".inv-header-wrap .invoice-customer", ()=> {
    if(!openShiftID){openNewShift(); return}
    openCustomersPage()
})