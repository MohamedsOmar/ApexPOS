


console.log("POS loaded");
// /*================================================================ */
// //------------------- Document Elements Events
// /*================================================================*/
/* ----- Get Invoice Details on selected invoice change */
$(document).on("click", "#invoices-ids li", ()=> {
    triggerChangedInvoice();
});

/* ----- Save Invoice Header on Header Data Values Changes*/
$(document).on("click", "div.dropdown-menu-inner.customer-ids", ()=> {
    saveInvoiceHeader(0);
});
$(document).on("click", "div.dropdown-menu-inner.inv-vat", ()=> {
    saveInvoiceHeader(0);
});
$(document).on("click", "div.dropdown-menu-inner.inv-pay-method", ()=> {
    saveInvoiceHeader(0);
});

$(document).on("click", ".inputGroup .fa.fa-plus-circle-o", ()=> {
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
                            <input required="" autocomplete="off" type="text" id="new-customer-name">
                            <label for="cashamount">Customer Name</label>
                        </div>
                    </div>
                    <div class="content-row">
                        <div class="inputGroup">
                            <input required="" autocomplete="off" type="text" id="new-customer-phone">
                            <label for="cashamount">Address</label>
                        </div>
                    </div>
                    <div class="content-row">
                        <div class="inputGroup">
                            <input required="" autocomplete="off" type="text" id="new-customer-adreess">
                            <label for="cashamount">Phone Number</label>
                        </div>
                    </div>
                    <div class="btns-wrap">
                        <button type="button" class="inv-btns" id="createNewCustomer">Create</button>
                        <button type="button" class="inv-btns" onclick="removeElementWithID('content-body-02')">Cancel</button>
                    </div>
                </div>
            </div>`
    overlayConetent.appendChild(div)
    overlayConetent.querySelector('#createNewCustomer').addEventListener('click', ()=>{
        let customerName = overlayConetent.querySelector('#new-customer-name')
        let customerAddress = overlayConetent.querySelector('#new-customer-adreess')?.value
        let customerPhone = overlayConetent.querySelector('#new-customer-phone')?.value

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
        createCustomer(customerName.value,customerAddress,customerPhone)
    });

})

function createCustomer(customerName,customerAddress,customerPhone){
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
    }
  );
}
// /*================================================================ */
// //------------------- Functions Runs on Page Load
// /*================================================================*/
function getOpenShift(){
    apex.server.process(
        'GET_OPEN_SHIFT',
        {},
        {
            dataType: 'json',
            success: function (data) {
                console.log(data)
                if (data.found == 'Y') {
                    let open_shift = data.open_shift
                    document.querySelector(".open_shift_id").textContent = open_shift;
                    fetchCategories(open_shift)
                    fetchOpenInvoices(open_shift)
                    fetchCustomers()
                    fetchTaxRates()
                    fetchPaymentMethods()
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
                    let posCategoriesContainer = document.getElementById("pos-categories");
                    posCategoriesContainer.innerHTML=''
                    let jsonData = data.items
                    const categoriesContainer = document.createElement("div");
                    categoriesContainer.className='categories-container'
                    jsonData.forEach((item)=>{
                    const div = document.createElement("div");
                    div.className = 'category-row'
                    div.innerHTML = `
                        <div class="cat-id">${item.cat_id}</div>
                        <div>${item.cat_name}</div>`
                        // <div class="img-holder">
                        //     <img src="${item.cat_img_src}" />
                        // </div>`;
                        categoriesContainer.appendChild(div)
                        posCategoriesContainer.appendChild(categoriesContainer)
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
    apex.server.process(
        'GET_TAX_RATES',
        {},
        {
            dataType: 'json',
            success: function (data) {
                if (data.found === 'Y') {
                    let jsonData = data.items
                    const parentElement = document.querySelector("#inv-vat");
                    const selectList = parentElement.querySelector(".ul-dropdown-inner");
                    jsonData.forEach((item) => {
                        const option = document.createElement('li');
                            option.value = item.taxID;
                            option.dataset.value = item.taxRate;
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
function fetchPaymentMethods() {
    apex.server.process(
        'GET_PAYMENT_METHODS',
        {},
        {
            dataType: 'json',
            success: function (data) {
                if (data.found === 'Y') {
                    let jsonData = data.items
                    const parentElement = document.querySelector("#inv-pay-method");
                    const selectList = parentElement.querySelector(".ul-dropdown-inner");
                    jsonData.forEach((item) => {
                        const option = document.createElement('li');
                            option.dataset.value = item.methodID;
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
function fetchOpenInvoices(open_shift) {
    apex.server.process(
        'GET_OPEN_INVS',
        {},
        {
            dataType: 'json',
            success: function (data) {
                const parentElement = document.querySelector("#invoices-ids");
                const selectList = parentElement.querySelector(".ul-dropdown-inner");
                selectList.innerHTML = '';
                if (data.found === 'Y' && Array.isArray(data.items)) {
                    data.items.forEach(item => {
                        const option = document.createElement('li');
                        option.dataset.value = item.inv_id;
                        // option.dataset.shiftId = open_shift;
                        option.textContent = item.inv_no;
                        selectList.appendChild(option);
                    });
                } 
                setupCustomDropdown(parentElement)
                triggerChangedInvoice()
            },
            error: function (err) {
                console.error(err);
                apex.message.alert('Server error while fetching item');
            }
        }
    );
}

function fetchCustomers(){
    apex.server.process(
        'GET_CUSTOMERS',
        {},
        {
            dataType: 'json',
            success: function (data) {
                if (data.found === 'Y') {
                    let jsonData = data.items
                    const parentElement = document.querySelector("#customer-ids");
                    const selectList = parentElement.querySelector(".ul-dropdown-inner");
                    jsonData.forEach((item) => {
                        const option = document.createElement('li');
                            option.dataset.value = item.customer_id;
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

// /*================================================================ */
// //------------------- Create and Save Invoice
// /*================================================================*/
function createNewInvoice(){
    let shiftID = document.querySelector('.open_shift_id').textContent;
  apex.message.confirm('Create New Invoice?', function(ok){
    if(!ok) return;
    $('#pos-table-body').empty();
    apex.server.process(
      'CREATE_NEW_INVOICE',
      { x01: shiftID},
      {
        dataType: 'json',
        success: function(data){
          if(data.status !== 'SUCCESS'){
            apex.message.alert('Error: ' + data.message || 'Error creating invoice');
            return;
          }
          let invNo = data.inv_no;
          const selectList = document.getElementById("invoices-ids")
          selectList.innerHTML=''
          fetchOpenInvoices(shiftID)
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
    let invoiceID, invoiceNo
    let selectedInvoice = document.getElementById("invoices-ids");
    let selectElementLen = selectedInvoice.length;
    if(selectElementLen==0){
        invoiceID = false
    }else{
        invoiceID = selectedInvoice.options[selectedInvoice.selectedIndex].value;
        invoiceNo = selectedInvoice.options[selectedInvoice.selectedIndex].text; 
    }
    if(!invoiceID){
        errMessage('No Invoice Selected')
        return
    }
    createOverlay()
    let posOverlay = document.getElementById('pos-overlay');
    posOverlay.style.backgroundColor = '#00000040'
    let overlayConetent = document.getElementById('overlay-content')
    let invContent = document.querySelector('.inv-header-wrap .totals')
    let empBranch = invContent.querySelector(".emp_branch").textContent;
    let customers = invContent.querySelector("#customer-ids");
        let customerName = customers.options[customers.selectedIndex].text; 
    let invoiceType = invContent.querySelector(".inv_type").textContent;
    let invDateValue = invContent.querySelector(".inv-date").getAttribute("date-value");
    let invSubTotal = invContent.querySelector(".inv-sub-total").textContent;
    let invTaxAmt = invContent.querySelector(".inv-tax-amt").textContent;
    let invTotalAmt = invContent.querySelector(".inv-total").textContent;

    let taxes= invContent.querySelector(".inv-vat");
    let taxName = taxes.options[taxes.selectedIndex].text; 

    let payMethods= invContent.querySelector(".inv-pay-method");
    let ppayMethodID = payMethods.options[payMethods.selectedIndex].value;
    let payMethodsName = payMethods.options[payMethods.selectedIndex].text; 


    let div = document.createElement('div')
    div.className = 'content-body'
    div.innerHTML=`
            <div class="form-wrap wrap data-form">
                <div class="h1">${invoiceType}# ${invoiceNo}</div>
                <div class="inputs">
                    <div class="content-wrapper">
                        <div class="content-row">
                            <div class="inputGroup">
                                <input type="text" required="" autocomplete="off" value=${invDateValue}>
                                <label for="cashamount">Invoice Date</label>
                                <div class="block-entry"></div>
                            </div>
                            <div class="inputGroup">
                                <input type="text" required="" autocomplete="off" value=${empBranch}>
                                <label for="cashamount">Branch</label>
                                <div class="block-entry"></div>
                            </div>
                        </div>
                        <div class="content-row">
                            <div class="inputGroup">
                                <input type="text" required="" autocomplete="off" value=${payMethodsName}>
                                <label for="cashamount">Payment Method</label>
                            </div>
                            <div class="inputGroup">
                                <input style="position: relative;" type="text" required="" autocomplete="off" value=${customerName}>
                                <span style="position: absolute;" class="fa fa-plus-circle-o"></span>
                                <label for="cashamount">Customer</label>
                            </div>
                        </div>
                        <div class="content-row">
                            <div class="inputGroup">
                                <input type="text" required="" autocomplete="off" value=0>
                                <label for="cashamount">Discount</label>
                                <div class="block-entry"></div>
                            </div>
                        </div>
                        <div class="content-row">
                            <div class="inputGroup">
                                <input type="text" required="" autocomplete="off" value=${invSubTotal}>
                                <label for="cashamount">Sub-Total</label>
                                <div class="block-entry"></div>
                            </div>
                        </div>
                        <div class="content-row">
                            <div class="inputGroup">
                                <input type="text" required="" autocomplete="off" value=${taxName} ${invTaxAmt}>
                                <label for="cashamount">Vat</label>
                                <div class="block-entry"></div>
                            </div>
                            <div class="inputGroup">
                                <input type="text" required="" autocomplete="off" value=${invTotalAmt}>
                                <label for="cashamount">Total</label>
                                <div class="block-entry"></div>
                            </div>
                        </div>
                        <div class="content-row">
                            <div class="inputGroup">
                                <input id="paid-amt" type="text" required="" autocomplete="off" value=${invTotalAmt}>
                                <label for="cashamount">Cash Amount</label>
                            </div>
                        </div>
                        <div class="content-row">
                            <div class="inputGroup">
                                <input id="inv-remaning-amt" type="text" required="" autocomplete="off" value=0>
                                <label for="cashamount">Remaning</label>
                                <div class="block-entry"></div>
                            </div>
                        </div>
                    </div>
                    <div class="btns-wrap">
                        <button type="button" class="btn" id="btn-cash-Invoice">Cash Out</button>
                        <button type="button" class="btn" onclick="removerOverlay()" >Cancel</button>
                    </div>
                </div>
            </div>`
    overlayConetent.appendChild(div)
    overlayConetent.querySelector('#btn-cash-Invoice').addEventListener('click', ()=> {
        saveInvoiceHeader(1);
    });
    overlayConetent.querySelector('#paid-amt').addEventListener('keyup', calcRemaining);
    function calcRemaining() {
        let remaningInput = document.querySelector("#inv-remaning-amt");
        let paidInput = document.querySelector("#paid-amt");
        let paidAmount = parseFloat(paidInput.value) || 0;
        let totalAmount = parseFloat(invTotalAmt.replace(/,/g, '')) || 0;
        let remainingAmount = paidAmount - totalAmount;
        remaningInput.value = formatAccounting(remainingAmount);
    }
}
function saveInvoiceHeader(invClosed){
    let invoiceID, invoiceNo
    let selectedInvoice = document.getElementById("invoices-ids");
    let selectElementLen = selectedInvoice.length;
    if(selectElementLen==0){
        invoiceID = false
    }else{
        invoiceID = selectedInvoice.options[selectedInvoice.selectedIndex].value;
        invoiceNo = selectedInvoice.options[selectedInvoice.selectedIndex].text; 
    }
    if(!invoiceID){
        errMessage('No Invoice Selected')
        return
    }
    let shiftID = document.querySelector('.open_shift_id').textContent
    let selectedCustomer = document.getElementById("customer-ids");
    let customerID = selectedCustomer.options[selectedCustomer.selectedIndex].value;

    let selectedPayMethod = document.getElementById("inv-pay-method");
    let payMethodName = selectedPayMethod.options[selectedPayMethod.selectedIndex].value;

    let invDate = document.querySelector(".inv-date").getAttribute('date-value');
    let empBranch = document.querySelector(".emp_branch").textContent;
    let invType = document.querySelector(".inv_type").textContent;
    let invVat = document.getElementById("inv-vat").value;

    let invPayment = document.querySelector("input.inv-payment").value;
    let invDiscount = document.querySelector("input.inv-discount").value ;

    if(!invoiceID || !customerID || !payMethodName || !invDate || !invVat){
        errMessage('Invoice Header Must be Completed for Saving')
        return;
    }

  apex.server.process(
    "SAVE_INV_HEADER_DATA",
    {
      x01: invoiceID,
      x02: customerID,
      x03: payMethodName,
      x04: invDate,
      x05: empBranch,
      x06: invType,
      x07: invVat, 
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
            removerOverlay()
            fetchOpenInvoices(shiftID)
            triggerChangedInvoice()
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
    let invoiceID, invoiceNo
    let selectedInvoice = document.getElementById("invoices-ids");
    let selectElementLen = selectedInvoice.length;
    if(selectElementLen==0){
        invoiceID = false
    }else{
        invoiceID = selectedInvoice.options[selectedInvoice.selectedIndex].value;
        invoiceNo = selectedInvoice.options[selectedInvoice.selectedIndex].text; 
    }
    if(invoiceID){
        errMessage('Close Open Invoices')
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
                        <input required="" autocomplete="off" type="number">
                        <label for="cashamount">Cashier Amount</label>
                    </div>

                    <div class="btns-wrap">
                        <button type="button" class="inv-btns" id="btn-close-shift">Close Shift</button>
                        <button type="button" class="inv-btns" onclick="removerOverlay()" >Cancel</button>
                    </div>
                </div>
            </div>`
    overlayConetent.appendChild(div)

    overlayConetent.querySelector('#btn-close-shift').addEventListener('click', closeShift);
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
        let shiftID = document.querySelector('.open_shift_id').textContent;
        shiftAmount = String(shiftAmount).replace(/,/g, '')

        apex.server.process(
            "CLOSE_OPEN_SHIFT",
            {
                x01: shiftID,
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
    let invoiceID, invoiceNo
    let selectedInvoice = document.getElementById("invoices-ids");
    let selectElementLen = selectedInvoice.length;
    if(selectElementLen==0){
        invoiceID = false
    }else{
        invoiceID = selectedInvoice.options[selectedInvoice.selectedIndex].value;
        invoiceNo = selectedInvoice.options[selectedInvoice.selectedIndex].text; 
    }
    if(invoiceID){
        errMessage('Close Open Invoices')
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
                    <input placeholder="Cashier Amount"    type="number">
                    <div class="btns-wrap">
                        <button type="button" class="btn" id="btn-open-shift">Open Shift</button>
                    </div>
                </div>
            </div>`
    overlayConetent.appendChild(div)

    overlayConetent.querySelector('#btn-open-shift').addEventListener('click', openShift);
    function openShift(){
        let shiftAmount = overlayConetent.querySelector('input[type="number"]').value;
        if(!shiftAmount){return};
        let shiftID = document.querySelector('.open_shift_id').textContent;
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

/* ------------------------ Get Items related to cateogry on click ------------------------ */
$(document).on("click", ".category-row", function () {
    var row = $(this).closest("div");
    var catID = row.find(".cat-id").text();
    if (!catID) return;
    apex.server.process(
      "GET_ITEMS_FOR_CATEGORY",
      { x01: catID },
      {
        dataType: "json",
        success: function (data) {
                if (data.found === 'Y') {
                    const container = document.querySelector(".items-conatiner");
                    $(".category-row").removeClass("is-cat-active");
                    row.addClass("is-cat-active");
                    container.innerHTML = "";
                    let jsonData = data.items
                    jsonData.forEach((item)=>{
                        const div = document.createElement("div");
                        div.className = 'item-row'
                        div.innerHTML = `
                            <div class="item_id"   >${item.item_id}</div>
                            <div class="item_name" style="display:none">${item.item_name}</div>
                            <div class="item_price"style="display:none">${formatAccounting(item.item_price)}</div>
                            <div class="item_uom"  style="display:none">${item.item_uom}</div>
                            <div class="item_description" title=${item.item_name}>
                                ${item.item_uom} ${item.item_name} - (${formatAccounting(item.item_price)} ج)
                            </div>
                            <div class="img-holder"><img src="${item.item_img}" /></div>`;
                        document.querySelector(".items-conatiner").appendChild(div);
                    });
                }
        },
        error: function (err) {
            console.error(err);
            apex.message.alert('Server error while fetching item');
        }
      }
    );
});

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
    }
});
async function handleItemClick() {
    let invID;
    const selectElement = document.getElementById("invoices-ids");
    let selectElementLen = selectElement.length;
    /*Validate that there is invoice selected first */
    if (selectElementLen == 0) {
        invID = false;
    } else {
        const selectedOption = selectElement.options[selectElement.selectedIndex];
        invID = selectedOption.value;
    }
    if (!invID) {
        errMessage('No Invoice Selected');
        return;
    }
    
    var row = $(this).closest("div");
    var itemID = row.find(".item_id").text().trim();
    var itemName = row.find(".item_name").text();
    var itemPrice = parseFloat(Number(row.find(".item_price").text().replace(/,/g, '')));
    var itemUOM = row.find(".item_uom").text();
    if (!itemID) return;

    let itemFound = false;
    $('#pos-table-body tr').each(function() {
        const $tr = $(this); 
        let rowItemID = $tr.find(".item-id").text().trim();
        if (itemID == rowItemID) {
            itemFound = true;
            let $qtyInput = $tr.find("input.qty");
            let currentQty = parseInt($qtyInput.val()) + 1;
            $qtyInput.val(currentQty);
            let row = $tr.prop('outerHTML')
            posTableLines(row, currentQty)
            // $qtyInput.trigger(
            //     jQuery.Event("keydown", {
            //         key: "Enter",
            //         keyCode: 13,
            //         which: 13
            //     })
            // );
            addedItemsCache.add(itemID);
            return false;
        }
    });
    if (itemFound) return;
    // Item doesn't exist
    let itemsRow = $("#pos-Table tr").length;
    var newRow = `
        <tr data-item-id="${itemID}">
            <td class="inv-line-id" style="display: none;"></td>
            <td class="inv-id" style="display: none;">${invID}</td>
            <td class="item-id" style="display: none;">${itemID}</td>
            <td style="position:relative;">${itemsRow} <span style="position:absolute;" aria-hidden="true" class="fa fa-trash"></span></td>
            <td class="item-name" title="${itemName}">${itemName}</td>
            <td class="uom">${itemUOM}</td>
            <td class="price">${formatAccounting(itemPrice)}</td>
            <td><input type="number" class="qty" value=1 disabled=true></td>
            <td class="amount"></td>
        </tr>`;
    // Add to cache BEFORE appending to DOM
    addedItemsCache.add(itemID);
    $('#pos-table-body').append(newRow);
    posTableLines(newRow)
}


/* ------------------------ Get Selected Invoice Details ------------------------ */
function triggerChangedInvoice(){
    const selectElement = document.querySelector("#invoices-ids .li-selected");
    let invID = selectElement?.getAttribute('data-value');
    if(!invID){
        invID = 0
    }
    getInvoicedataDetails(invID)
    renderInvoiceRows(invID);
}
/* ------------------------ Get Selected Invoice Header Details ------------------------ */
function getInvoicedataDetails(invID){
  apex.server.process(
    'GET_INVOICE_HEADER_DATA',
    { x01: invID },
    {
      dataType: 'json',
      success: function (data) {
        let selectElement
        if(data.found=='N'){

            // document.querySelector(".inv-date")?.value = null;
            document.querySelector(".inv-date").setAttribute('date-value',"");
            document.querySelector(".emp_branch").textContent = null; 
            document.querySelector(".inv_type").textContent =null;
            document.querySelector("input.inv-payment").value = null;
            document.querySelector("input.inv-discount").value =null;
            document.querySelector(".inv-total").textContent = null;
            document.querySelector(".inv-sub-total").textContent =null;
            document.querySelector(".inv-tax-amt").textContent = null;
            document.querySelector(".remaning-amt").textContent = null;

            document.querySelector("#customer-ids .li-selected").setAttribute('data-value', '');
            document.querySelector("#inv-vat .li-selected").setAttribute('data-value', '');
            document.querySelector("#inv-pay-method .li-selected").setAttribute('data-value', '');

            document.querySelector("#customer-ids .li-selected").textContent ='';
            document.querySelector("#inv-vat .li-selected").textContent ='';
            document.querySelector("#inv-pay-method .li-selected").textContent ='';

        }else{
            let header = data.header
            const options = {year: 'numeric',month: 'long', day: '2-digit', weekday: 'long'};
            let invHeaderDate = new Date(header.inv_date)
            document.querySelector(".inv-date").value = new Intl.DateTimeFormat('en-US', options).format(invHeaderDate);
            document.querySelector(".inv-date").setAttribute('date-value', header.inv_date);
            document.querySelector(".emp_branch").textContent = header.inv_branch; 
            document.querySelector(".inv_type").textContent = header.inv_type;
            document.querySelector("input.inv-payment").value = formatAccounting(header.inv_payments);
            document.querySelector("input.inv-discount").value = formatAccounting(header.discount);
            document.querySelector(".inv-total").textContent = formatAccounting(header.inv_final_total);
            document.querySelector(".inv-sub-total").textContent = formatAccounting(header.inv_sub_total);
            document.querySelector(".inv-tax-amt").textContent = formatAccounting(header.inv_tax_amt);
            document.querySelector(".remaning-amt").textContent = formatAccounting(header.remaning);

            document.querySelector("#customer-ids .li-selected").setAttribute('data-value',  header.customer_id);
            document.querySelector("#inv-vat .li-selected").setAttribute('data-value', header.inv_vat);
            document.querySelector("#inv-pay-method .li-selected").setAttribute('data-value', header.pay_method);

            let uls = document.querySelectorAll('.ul-dropdown-inner');
            if(uls.length != 0){
                uls.forEach((ele)=>{
                    let ulWraaper = ele.closest('.ul-select-wrapper')
                    let selectedEle = ulWraaper.querySelector('.li-selected')
                    let selectedValue = selectedEle.getAttribute('data-value');
                    let ul = ulWraaper.querySelectorAll('.ul-dropdown-inner li')
                    ul.forEach(li=>{
                        li.classList.remove("li-is-select")
                        let dataValue = li.getAttribute('data-value')
                        if(selectedValue ==dataValue){
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
function renderInvoiceRows(invID) {
  $('#pos-table-body').empty();
  let itemsRow = 0
  if (!invID) {
        return;
  }
  apex.server.process(
    'GET_INV_LINES',
    { x01: invID },
    {
      dataType: 'json',
      success: function (data) {
        if (data.found !== 'Y') {
          return;
        }
        data.items.forEach((item, index) => {
                itemsRow = index + 1
            var newRow = `
                <tr>
                    <td class="inv-line-id" style="display: none;">${item.invLineID}</td>
                    <td class="inv-id" style="display: none;">${item.invID}</td>
                    <td class="item-id" style="display: none;">${item.itemID}</td>
                    <td style="position:relative;">${itemsRow} <span style="position:absolute;" aria-hidden="true" class="fa fa-trash"></span></td>
                    <td class="item-name" title="${item.item_name}">${item.item_name}</td>
                    <td class="uom">${item.uom}</td>
                    <td class="price">${formatAccounting(item.price)}</td>
                    <td><input type="number" class="qty" value=${item.qty} disabled=true></td>
                    <td class="amount">${formatAccounting(item.total_before_tax)}</td>
                </tr>`;
            $('#pos-table-body').append(newRow);
        });
         $("#pos-table-body tr:last .qty").focus()
      },
      error: function (err) {
        console.error(err);
        apex.message.alert('renderInvoiceRows() Server error while fetching items');
      }
    }
  );
}

/* ------------------------ Append Item to DB on entering Qty  ------------------------ */
function posTableLines(trSelected, currentQty) {
    const $row = trSelected.jquery ? trSelected : $(trSelected);
    const selectElement = document.getElementById("invoices-ids");
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    let invoiceID = selectedOption.value;
    let invLineID = $row.find(".inv-line-id").text().trim();
    let priceText = $row.find(".price").text().replace(/[^0-9.-]+/g, "");
    let qty = Number(currentQty);
    let price = Number(priceText) || 0;
    let amount = qty * price;
    $row.find(".amount").text(formatAccounting(amount.toFixed(2)));
    if (invLineID) {
        updateLine($row, qty, price, amount, invLineID);
    } else {
        saveLine($row, 1, price, price, invoiceID);
    }
}

/* ------------------------ Save Line to DB ------------------------ */
function saveLine(row, qty, price, amount, invoiceID) {
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
        triggerChangedInvoice()
      },
      error: function (err) {
        console.error(err);
        apex.message.alert("Server error while saving line");
      },
    }
  );
}
/* ------------------------ Update DB Line ------------------------- */
function updateLine(row, qty, price, amount, invLineID) {
  var itemID = row.find(".item-id").text();
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
        triggerChangedInvoice()
      },
      error: function (err) {
        console.error(err);
        apex.message.alert("Server error while saving line");
      },
    }
  );
}

/* ------------------------ Delete Line ------------------------ */
$(document).on("click", ".fa.fa-trash", function () {
  var row = $(this).closest("tr");
  var lineId = row.find(".inv-line-id").text();
  if (!lineId) return;
  apex.message.confirm("Delete this line?", function (ok) {
    if (!ok) return;
    apex.server.process(
      "DELETE_INV_LINE",
      { x01: lineId },
      {
        dataType: "json",
        success: function () {
          row.remove();
          triggerChangedInvoice()
        },
      }
    );
  });
});

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
