console.log("POS loaded");
let invoiceID, openShiftID, headerSrcDataContainer, srcValuesHolder, selectedValues
let posCategoriesContainer = document.getElementById("pos-categories");

let discountAccess = false, createCashAccess = false, createCustomerAccess = false, posCashierOnlyAccess = false
// /*================================================================ */
// //------------------- Get User Access
// /*================================================================*/
let userPermissions
async function fetchUserAccess() {
    return new Promise((resolve, reject) => {
        apex.server.process(
            'GET_USER_ACCESS',
            {},
            {
                dataType: 'json',
                success: function (data) {
                    if (data.found === 'Y') {
                        resolve(data.items);
                        userPermissions = data.items
                        userPermissions.forEach((access)=>{
                            let role = access.roleID
                            if(role=="95959979848418912790978149798646558686"){
                                createCustomerAccess = true
                            }
                            if(role=="95950591706144986175657814674178211076"){
                                posCashierOnlyAccess = true
                            }
                            if(role=="95960885256253348064994365834003120777"){
                                createCashAccess = true
                            }
                            if(role=="95945194037845973039104600264428639250"){
                                discountAccess = true
                            }
                        })
                        if(!createCashAccess){
                            document.querySelector('#createCashEntryBtn').remove()
                        }
                    } else {
                        resolve(null);
                    }
                },
                error: function (err) {
                    console.error(err);
                    apex.message.alert('Server error while fetching item');
                    reject(err);
                }
            }
        );
    });
}
// /*================================================================ */
// //------------------- Document Elements Events
// /*================================================================*/
// Qty Increase and Decrease - Delete Line 
$(document).on("click", ".s-item-row .qty-row .qty-plus", (e) => {
    const itemRow = e.target.closest('.s-item-row');
    const lineId = itemRow.querySelector('.inv-line-id')?.textContent;
    const priceText = itemRow.querySelector('.price')?.textContent;
    const itemID = itemRow.querySelector(".item-id").textContent;

    const amountElements = itemRow.querySelectorAll('.amount'); // NodeList, not textContent
    const qtyInput = itemRow.querySelector('.qty');
    const price = parseFloat(priceText?.replace(/[^0-9.-]/g, '')) || 0;
    const currentQty = parseFloat(qtyInput?.value) || 0;
    const newQty = currentQty + 1;
    if (qtyInput) {
        qtyInput.value = newQty;
    }
    const newAmount = price * newQty;
    amountElements.forEach(element => {
        element.textContent = formatAccounting ? formatAccounting(newAmount) : newAmount.toFixed(2);
    });
    updateLine(itemID, newQty, price, newAmount, lineId)
});
$(document).on("click", ".s-item-row .qty-row .qty-less", (e) => {
    const itemRow = e.target.closest('.s-item-row');
    const lineId = itemRow.querySelector('.inv-line-id')?.textContent;
    const priceText = itemRow.querySelector('.price')?.textContent;
    const itemID = itemRow.querySelector(".item-id").textContent;
    const amountElements = itemRow.querySelectorAll('.amount'); // NodeList, not textContent
    const qtyInput = itemRow.querySelector('.qty');
    const price = parseFloat(priceText?.replace(/[^0-9.-]/g, '')) || 0;
    const currentQty = parseFloat(qtyInput?.value) || 0;
    const newQty = (currentQty - 1) == 0  ? 1 : currentQty - 1;
    if (qtyInput) {
        qtyInput.value = newQty;
    }
    const newAmount = price * newQty;
    amountElements.forEach(element => {
        element.textContent = formatAccounting ? formatAccounting(newAmount) : newAmount.toFixed(2);
    });
    updateLine(itemID, newQty, price, newAmount, lineId)
});
$(document).on("click", ".s-item-row .img-holder .fa.fa-trash", (e) => {
    const itemRow = e.target.closest('.s-item-row');
    const lineId = itemRow.querySelector('.inv-line-id')?.textContent;
    if (!lineId) return;
    apex.message.confirm("Delete this line?", function (ok) {
        if (!ok) return;
        deleteLine(lineId) 
        itemRow.remove()
    });
});
/*------------- Open Customers Page  */
$(document).on("click", ".inv-header-wrap .invoice-customer", ()=> {
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
                    <div class="btns-wrap" style="margin-top:10px">
                        ${!createCustomerAccess ? '' : `<button type="button" class="inv-btns overlay-btn" id="OpenCreateNewCustomer">Create New</button>`}
                        <button type="button" class="inv-btns overlay-btn" onclick="removerOverlay()">Cancel</button>
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

})
$(document).on("click", ".inputGroup .fa.fa-plus-circle-o", ()=> {
    createCustomer()
})
function createCustomer(){
    let customerName, customerAddress, customerPhone;
    let overlayConetent = document.getElementById('overlay-content')
    if(!overlayConetent){return}
    let div = document.createElement('div')
    div.className = 'content-body-02'
    div.id = 'content-body-02'
    div.innerHTML=`
        <div class="form-wrap wrap" style="width:40vw">
            <div class="h1">Create Customer</div>
            <div class="inputs">
                <div class="content-row">
                    <div class="inputGroup">
                        <input class="input" required="" autocomplete="off" type="text" id="new-customer-name">
                        <label for="cashamount">Customer Name</label>
                    </div>
                </div>
                <div class="content-row">
                    <div class="inputGroup">
                        <input class="input" required="" autocomplete="off" type="text" id="new-customer-phone">
                        <label for="cashamount">Address</label>
                    </div>
                </div>
                <div class="content-row">
                    <div class="inputGroup">
                        <input class="input" required="" autocomplete="off" type="text" id="new-customer-adreess">
                        <label for="cashamount">Phone Number</label>
                    </div>
                </div>
                <div class="btns-wrap">
                    <button type="button" class="inv-btns overlay-btn" id="createNewCustomer">Create</button>
                    <button type="button" class="inv-btns overlay-btn" onclick="removeElementWithID('content-body-02')">Cancel</button>
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
// /*================================================================ */
// //------------------- Functions Runs on Page Load
// /*================================================================*/
async function getOpenShift(){
    userPermissions = await fetchUserAccess();
    console.log(userPermissions)
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
                    categoriesContainer.className='categories-container'
                    const div = document.createElement("div");
                    div.classList.add('category-row', 'is-cat-active')
                    div.innerHTML = `
                        <div class="cat-id">0</div>
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
                        jsonData.forEach((item)=>{
                            const div = document.createElement("div");
                            div.className = 'category-row'
                            div.innerHTML = `
                            <div class="cat-id">${item.cat_id}</div>
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
                    
                }
            },
            error: function (err) {
                console.error(err);
                apex.message.alert('Server error while fetching item');
            }
        }
    );
}
/* ------------------------ Get Items related to cateogry on click ------------------------ */
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
                    let searchDiv = document.createElement('div')
                        searchDiv.classList.add('search-cat')
                    searchDiv.innerHTML=`
                        <div class="input-group">
                            <input type="text" placeholder="Search..." class="item-search-input">
                            <span class="fa fa-search" aria-hidden="true"></span>
                        </div>`                                            
                    posItemsContainer.prepend(searchDiv);
                    searchDiv.addEventListener('keyup', (e)=>{
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
                    jsonData.forEach((item)=>{
                        let itemTag = item.item_balance > item.item_stockCheck ? 'Available' : 
                                    item.item_balance < item.item_stockCheck && item.item_balance > 0  ? 'Low Stock' : 'Not Available';  
                        const div = document.createElement("div");
                        div.className = 'item-row'
                        div.innerHTML = `
                            <div class="item_id"   >${item.item_id}</div>
                            <div class="item_uom"  style="display:none">${item.item_uom}</div>
                            <div class="item_catID"  style="display:none">${item.item_CAT_ID}</div>
                            <div class="item_balance"  style="display:none">${item.item_balance}</div>
                            <div class="item-wrapper">
                                <div class="img-holder">
                                        <img src="${item.item_img}" />
                                </div>
                                <div class="item_description">
                                    <div class="item_name">${item.item_name}</div>
                                    <div class="item_price">${formatAccounting(item.item_price)}</div>
                                </div>
                                <div class="item-tag ${itemTag.replace(' ','-')}">${itemTag}</div>
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
function fetchOpenInvoices() {
    apex.server.process(
        'GET_OPEN_INVS',
        {},
        {
            dataType: 'json',
            success: function (data) {
                let posInoivces = document.querySelector('#pos-open-invoices');
                $('#pos-open-invoices').empty()
                let newInvoice = document.createElement('div')
                    newInvoice.classList.add('create-new-invoice');
                    newInvoice.id= 'createNewInvoice';
                    newInvoice.textContent= '  +  ';
                    newInvoice.title= 'Create New Invoice';
                posInoivces.appendChild(newInvoice)
                newInvoice.addEventListener('click',()=>{
                    createNewInvoice()
                })
                let invoiceContianer = document.createElement('div')
                    invoiceContianer.classList.add('invoices-contianer');
                posInoivces.appendChild(invoiceContianer)

                let prevInvoices = document.createElement('div')
                    prevInvoices.classList.add('prev-invoice');
                    prevInvoices.innerHTML=`<span class="fa fa-chevron-circle-left"></span>`;
                    invoiceContianer.appendChild(prevInvoices)

                let invoiceWrapper = document.createElement('div')
                    invoiceWrapper.classList.add('invoices-wrapper');
                invoiceContianer.appendChild(invoiceWrapper)

                let nextInvoices = document.createElement('div')
                    nextInvoices.classList.add('next-invoice');
                    nextInvoices.innerHTML=`<span class="fa fa-chevron-circle-right"></span>`;
                invoiceContianer.appendChild(nextInvoices)
                    
                let invoicsContent = document.createElement('div')
                    invoicsContent.classList.add('invoices-content');
                invoiceWrapper.appendChild(invoicsContent)

                let currentIndex = 0;
                nextInvoices.addEventListener('click', () => {
                    let items = document.querySelectorAll('.invoices-content .invoice-row')
                    if(currentIndex + 1 == items.length){return}
                    if (currentIndex < items.length ) {
                        currentIndex++;
                        items[currentIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                });
                prevInvoices.addEventListener('click', () => {
                    let items = document.querySelectorAll('.invoices-content .invoice-row')
                    if(currentIndex == 0){return}
                    if (currentIndex > 0) {
                        currentIndex--;
                        items[currentIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                });

                if (data.found === 'Y' && Array.isArray(data.items)) {
                    data.items.forEach(item => {
                    let option = document.createElement('div');
                        option.classList.add('invoice-row');
                        option.dataset.value = item.invID;
                        option.dataset.invTotal = item.invTotal;
                        option.dataset.customer = item.cutomerName;
                        option.innerHTML=`
                                <div style="display: flex;align-items: center;width: 100%;justify-content: space-between;padding-top: 5px;">
                                    <div class="customer" style="overflow:hidden;font-weight: bold;">${item.cutomerName}</div>
                                    <div class="invoice" >#${item.invNo}</div>
                                </div>
                                <div class="inv-summary" style=";position: absolute;left: 0;margin: 10px;bottom: 0;width: fit-content;">
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
                    <div class="li-selected" data-value="" ></div>
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
                    setupCustomDropdown(parentElement)
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
                    <div class="li-selected" data-value=""></div>
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
                    setupCustomDropdown(parentElement)
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
                    setupCustomDropdown(parentElement)
                }
            },
            error: function (err) {
                console.error(err);
                apex.message.alert('Server error while fetching item');
            }
        }
    );
}
/* ------------------------ Get Selected Invoice Header Details ------------------------ */
/* ------------------------ Get Selected Invoice Details ------------------------ */
function triggerChangedInvoice(){
    if(!invoiceID){
        invoiceID = 0
        return
    }
    getInvoicedataDetails(invoiceID)
    renderInvoiceRows(invoiceID);
}
function getInvoicedataDetails(){
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
                numbers[0].querySelector('span:nth-child(2)').textContent = '00.00';
                numbers[1].querySelector('span:nth-child(1)').textContent = `Tax`;
                numbers[1].querySelector('span:nth-child(2)').textContent = '00.00';
                numbers[2].querySelector('span:nth-child(2)').textContent = '00.00';

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
                numbers[0].querySelector('span:nth-child(2)').textContent = formatAccounting(header.invTotal);
                numbers[1].querySelector('span:nth-child(1)').textContent = `Tax (${header.invTaxRateValue}%)`;
                numbers[1].querySelector('span:nth-child(2)').textContent = formatAccounting(header.invTaxAmt);
                numbers[2].querySelector('span:nth-child(2)').textContent = formatAccounting(header.invFinalTotal);

            let uls = headerSrcDataContainer.querySelectorAll('.ul-dropdown-inner');
            if(uls.length != 0){
                uls.forEach((ele)=>{
                    let ulWraaper = ele.closest('.ul-select-wrapper')
                    let selectedEle = ulWraaper.querySelector('.li-selected')
                    let selectedValue = selectedEle.getAttribute('data-value');
                    let ul = ulWraaper.querySelectorAll('.ul-dropdown-inner li')
                    ul.forEach(li=>{
                        li.classList.remove("li-is-select")
                        let dataValue = li.getAttribute('data-value')
                        if(selectedValue == dataValue){
                            selectedEle.textContent = li.textContent
                            li.classList.add("li-is-select")
                        }
                    })
                })
            }
        }
      },
      error: function (err) {
        console.error(err);
      }
    }
  );
}
/* ------------------------ Render invoice rows related to selected invoice items to sales table ------------------------ */
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
        data.items.forEach((item, index) => {
                itemsRow = index + 1
            var newRow = `
                <div class="s-item-row">
                    <div class="inv-line-id" style="display: none;">${item.invLineID}</div>
                    <div class="inv-id" style="display: none;">${item.invID}</div>
                    <div class="item-id" style="display: none;">${item.itemID}</div>
                    <div style="display: none;">${itemsRow}</div>
                    <div style="display: none;" class="item-name" title="${item.item_name}">${item.item_name}</div>
                    <div style="display: none;" class="price">${formatAccounting(item.price)}</div>
                    <div style="display: none;" class="uom">${item.uom}</div>
                    <div style="display: none;" class="amount">${formatAccounting(item.total_before_tax)}</div>
                    
                    <div class="item-img">
                        <div class="img-holder">
                            <span style="position:absolute;" aria-hidden="true" class="fa fa-trash"></span>
                            <img src=${item.item_img}>
                        </div>
                    </div>
                    <div style="flex:1;display:flex;justify-content: space-between;">
                        <div class="item-disc"><div>${item.item_name}</div> <div>${item.uom}</div></div>
                        <div class="qty-col">
                            <div class="qty-row">
                                <div class="qty-less"><span aria-hidden="true" class="fa fa-minus-circle-o"></span></div>
                                    <input type="number" class="qty" value=${item.qty} disabled=true>
                                <div class="qty-plus"><span class="fa fa-plus-circle-o" aria-hidden="true"></span></div>
                            </div>
                            <div class="amount">${formatAccounting(item.total_before_tax)}</div>
                        </div>
                    </div>
                </div>`;
            $('#pos-table-body').append(newRow);
        });
        removeLaoder(posItemsContainer)
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
                        <div class="content-row">
                            <div class="inputGroup">
                                    <!--<div class="inv-head-row">
                                        <span>Invoice Date</span>
                                        <div>
                                            <div class="date-picker-wrapper" style="position: relative;">
                                                <input type="text" id="dateInput" placeholder="Select a date" class="inv-date" date-value="">
                                                <div class="calendar" id="calendar">
                                                    <div class="header">
                                                        <button id="prevBtn" type="button">&lt;</button>
                                                        <h2 id="monthYear">Month Year</h2>
                                                        <button id="nextBtn" type="button">&gt;</button>
                                                    </div>
                                                    <div class="days" id="daysContainer"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div> 
                                </div> -->
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
                        <div class="content-row">
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
                        <div class="content-row">
                            <div class="inputGroup">
                                <input class="input" type="text" required="" autocomplete="off" value=${invTotal}>
                                <label for="cashamount">Sub-Total</label>
                                <div class="block-entry"></div>
                            </div>
                            <div class="inputGroup">
                                <input class="input" id="invDiscount" type="text" required="" autocomplete="off" value=0>
                                <label for="cashamount">Discount</label>
                                ${!discountAccess ? `<div class="block-entry"></div>` : ''}
                            </div>
                        </div>
                        <div class="content-row">
                            <div class="inputGroup">
                                <label for="cashamount">Tax Rate</label>
                                ${taxesDiv.outerHTML}
                            </div>
                            <div class="inputGroup">
                                <input class="input" type="text" required="" autocomplete="off" value=${invTaxAmt}>
                                <label for="cashamount">Tax Amount</label>
                                <div class="block-entry"></div>
                            </div>
                        </div>
                        <div class="content-row">
                            <div class="inputGroup">
                                <input class="input" type="text" required="" autocomplete="off" value=${invFinalTotal}>
                                <label for="cashamount">Total</label>
                                <div class="block-entry"></div>
                            </div>
                        </div>
                        <div class="content-row">
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
                    <div class="btns-wrap">
                        <button type="button" class="overlay-btn" id="btn-cash-Invoice">Cash Out</button>
                        <button type="button" class="overlay-btn" onclick="removerOverlay()" >Cancel</button>
                    </div>
                </div>
            </div>`
    overlayConetent.appendChild(div)

    setupCustomDropdown(overlayConetent.querySelector("#invTaxRatesCash"))
    setupCustomDropdown(overlayConetent.querySelector("#invPayMethodsCash"))
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
// /*================================================================ */
// //------------------- Open and Close Shifts
// /*================================================================*/
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
                    <div class="btns-wrap">
                        <button type="button" class="inv-btns overlay-btn" id="btn-close-shift">Close Shift</button>
                        <button type="button" class="inv-btns overlay-btn" onclick="removerOverlay()" >Cancel</button>
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
                    <div class="btns-wrap">
                        <button type="button" class="btn overlay-btn" id="btn-open-shift">Open Shift</button>
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
                <div class="content-row">
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
                <div class="content-row">
                    <div class="inputGroup">
                        <input class="input" required="" autocomplete="off" type="text" id="entryDescription">
                        <label for="cashamount">Description</label>
                    </div>
                </div>
            </div>
            <div class="btns-wrap">
                <button type="button" class="inv-btns overlay-btn" id="createCashEntry">Create</button>
                <button type="button" class="inv-btns overlay-btn" onclick="removerOverlay()">Cancel</button>
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
let isProcessingItem = false;
const addedItemsCache = new Set();
$(document).on("click", ".item-row", async function () {
    if (isProcessingItem) {
        console.log('Still processing previous item...');
        return;
    }
    isProcessingItem = true;
    try {
        await handleItemClick.call(this);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        setTimeout(() => {
            isProcessingItem = false;
        }, 500);
        getInvoicedataDetails()
        fetchOpenInvoices()
    }
});
async function handleItemClick() {
    if (!invoiceID) {
        errMessage('No Invoice Selected');
        return;
    }
    var row = $(this).closest("div");
    var itemID = row.find(".item_id").text().trim();
    var itemName = row.find(".item_name").text();
    var itemPrice = parseFloat(Number(row.find(".item_price").text().replace(/,/g, '')));
    var itemUOM = row.find(".item_uom").text();
    // var itemImg = row.find("img").attr('src');
    var itemImg = row.find("img").attr('src').replace(/\n/g, '').trim();
    if (!itemID) return;
    let itemFound = false;
    $('#pos-table-body div').each(function() {
        const $tr = $(this); 
        let rowItemID = $tr.find(".item-id").text().trim();
        if (itemID == rowItemID) {
            itemFound = true;
            let $qtyInput = $tr.find("input.qty");
            let currentQty = parseInt($qtyInput.val()) + 1;
            $qtyInput.val(currentQty);
            let row = $tr.prop('outerHTML')
            posTableLines(row, currentQty)
            addedItemsCache.add(itemID);
            return false;
        }
    });
    if (itemFound) return;
    // Item doesn't exist
    let itemsRow = $("#pos-Table tr").length;
    var newRow =`
        <div class="s-item-row" data-item-id="${itemID}">
            <div class="inv-line-id" style="display: none;"></div>
            <div class="inv-id" style="display: none;">${invoiceID}</div>
            <div class="item-id" style="display: none;">${itemID}</div>
            <div style="display: none;">${itemsRow}</div>
            <div style="display: none;" class="item-name" title="${itemName}">${itemName}</div>
            <div style="display: none;" class="price">${formatAccounting(itemPrice)}</div>
            <div style="display: none;" class="uom">${itemUOM}</div>
            <div style="display: none;" class="amount">${formatAccounting(itemPrice)}</div>
            <div class="item-img">
                <div class="img-holder">
                    <span style="position:absolute;" aria-hidden="true" class="fa fa-trash"></span>
                    <img src=${itemImg}}>
                </div>
            </div>
            <div style="flex:1;display:flex;justify-content: space-between;">
                <div class="item-disc"><div>${itemName}</div> <div>${itemUOM}</div></div>
                <div class="qty-col">
                    <div class="qty-row">
                        <div class="qty-less"><span aria-hidden="true" class="fa fa-minus-circle-o"></span></div>
                            <input type="number" class="qty" value=1 disabled=true>
                        <div class="qty-plus"><span class="fa fa-plus-circle-o" aria-hidden="true"></span></div>
                    </div>
                    <div class="amount">${formatAccounting(itemPrice)}</div>
                </div>
            </div>
        </div>`;
    // Add to cache BEFORE appending to DOM
    addedItemsCache.add(itemID);
    $('#pos-table-body').append(newRow);
    posTableLines(newRow)
}

/* ------------------------ Append Item to DB  ------------------------ */
function posTableLines(trSelected, currentQty) {
    const $row = trSelected.jquery ? trSelected : $(trSelected);
    var itemID = $row.find(".item_id").text().trim();
    let invLineID = $row.find(".inv-line-id").text().trim();
    let priceText = $row.find(".price").text().replace(/[^0-9.-]+/g, "");
    let qty = Number(currentQty);
    let price = Number(priceText) || 0;
    let amount = qty * price;
    $row.find(".amount").text(formatAccounting(amount.toFixed(2)));
    $row.find(".amount").each(function() {
        console.log("Found amount element:", this);
        $(this).text(formatAccounting(amount.toFixed(2)));
    });
    if (invLineID) {
        updateLine(itemID, qty, price, amount, invLineID);
    } else {
        saveLine($row, 1, price, price);
    }
}

/* ------------------------ Save Line to DB ------------------------ */
function saveLine(row, qty, price, amount) {
  var itemID = row.find(".item-id").text();
  let invType = ''
  let lineType = ''
  if(invType == 'Return Invoice'){
    lineType = 'RI'
  }else{
    lineType = 'SI'
  }
  apex.server.process(
    "ADD_INV_LINE_TO_DB",
    {
      x01: itemID,
      x02: qty,
      x03: price,
      x04: amount,
      x05: invoiceID,
      x06: lineType,
    },
    {
      dataType: "json",
      success: function (data) {
        if (data.status !== "SUCCESS") {
          apex.message.alert(data.message || "Error saving line");
          return;
        }
        let invLineID = data.l_inv_line_id;
        row.find(".inv-line-id").text(invLineID);
        // triggerChangedInvoice()
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
    {
      x01: itemID,
      x02: qty,
      x03: price,
      x04: amount,
      x05: invLineID,
    },
    {
      dataType: "json",
      success: function (data) {
        if (data.status !== "SUCCESS") {
          apex.message.alert(data.message || "Error saving line");
          return;
        }
        // triggerChangedInvoice()
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
                triggerChangedInvoice()
            },
        }
    );
};

// /*================================================================ */
// //------------------------- Callback Functions
// /*================================================================*/
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
    div.className = 'pos-overlay'
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