/*file to import =>
    #WORKSPACE_FILES#salesInvoiceItems#MIN#.js
    https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js
    https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js
    #WORKSPACE_FILES#Amiri-Regular-normal.js
*/

function generateInvoicePDFTherminalPrint() {
    var invNo = $v("P3_INV_NO");
    console.log('inv ID: '+ invNo)
    if (!invNo) {
        apex.message.alert("You Must Select Invoice!");
        return;
    }

    apex.server.process("GET_INVOICE_DATA", {
        pageItems: "#P3_INV_NO"
    }, {
        success: function(pData) {

            if (!pData || !pData.lines || pData.lines.length === 0) {
                apex.message.alert("No data found for this invoice.");
                return;
            }

            const { jsPDF } = window.jspdf;

            // === THERMAL RECEIPT SIZE: 80mm width ===
            const receiptWidth = 90;  // Change to 58 if your printer uses 58mm paper
            const doc = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: [receiptWidth, 900]  // Tall enough for long receipts
            });

            // === Fix Arabic Font – Manual Load (your file likely uses 'window.font') ===
            const arabicFontBase64 = window.font || window.Amiri || window.AmiriRegular || window.customFont;
            
            if (!arabicFontBase64) {
                apex.message.alert("Arabic font not loaded! Check your Amiri-Regular-normal.js file.");
                console.error("Font base64 variable not found!");
                return;
            }

            // Add the font properly
            doc.addFileToVFS("Amiri-Regular.ttf", arabicFontBase64);
            doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
            doc.setFont("Amiri");  // This is now guaranteed to work
            doc.setFontSize(10);

            // Helper to center text on narrow receipt
            function centerText(text, y) {
                const pageWidth = doc.internal.pageSize.getWidth();
                doc.text(text, pageWidth / 2, y, { align: "center" });
            }
            function leftText(text, y) {
                const leftMargin = 4;
                doc.text(text, leftMargin, y);  // Starts near left edge
            }

            function rightText(text, y) {
                const rightMargin = 4;
                doc.text(text, pageWidth - rightMargin, y, { align: "right" });
            }
            let y = 5;

            // === Logo (small and centered) ===
            const logoUrl = "#APP_FILES#icons/app-icon-144-rounded.png";
            doc.addImage(logoUrl, "PNG", (receiptWidth - 28) / 2, y, 28, 28);
            y += 35;

            // === Company Info ===
            doc.setFontSize(13);
            centerText("Carved",y);
            y += 8;
            
            doc.setFontSize(10);
            centerText("Phone: 0123456789", y);
            y += 7;
            // === Invoice Details ===
            centerText("Inv# " + pData.header.INV_NO, y);
            y += 7;
            centerText("Date: " + pData.header.INV_DATE, y);
            y += 7;

            // === Separator ===
            centerText("--------------------------------", y);
            y += 3;

            // === Items Table (clean, centered) ===
            // const body = pData.lines.map(line => [
            //     line.ITEM_NAME.length > 20 ? line.ITEM_NAME.substring(0, 20) + ".." : line.ITEM_NAME,
            //     line.QTY,
            //     line.PRICE,
            //     line.LINE_TOTAL
            // ]);

            // doc.autoTable({
            //     head: [["الصنف", "الكمية", "السعر", "الإجمالي"]],
            //     body: body,
            //     startY: y,
            //     theme: "plain",
            //     styles: {
            //         font: "Amiri",
            //         fontSize: 9,
            //         halign: "center",
            //         cellPadding: 3,
            //         overflow: "linebreak"
            //     },
            //     headStyles: {
            //         font: "Amiri",
            //         fontSize: 10,
            //         halign: "center",
            //         fillColor: [255, 255, 255],
            //         textColor: [0, 0, 0],
            //         overflow: "linebreak"
            //     },
            //     margin: { left: 4, right: 4 }
            // });
            doc.autoTable({
                head: [["Item", "Qty", "Price", "Total"]],
                body: pData.lines.map(line => [
                    line.ITEM_NAME,  // Full name – will wrap if too long
                    line.QTY,
                    line.PRICE,
                    line.LINE_TOTAL
                ]),
                startY: y,
                theme: "plain",
                styles: {
                    font: "Amiri",
                    fontSize: 9,
                    halign: "center",
                    cellPadding: 1,
                    overflow: "linebreak",     // Allows body text (item names) to wrap into multiple lines
                    valign: "middle"
                },
                headStyles: {
                    font: "Amiri",
                    fontSize: 9,
                    halign: "center",
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    overflow: "ellipsize",     // ← Critical: Headers stay on ONE line (adds "..." if too long)
                    minCellHeight: 10
                },
                columnStyles: {
                    0: { cellWidth: 36, halign: "left" },   // Item name: wider, right-aligned (better for Arabic)
                    1: { cellWidth: 12, halign: "left" },  // Qty
                    2: { cellWidth: 15, halign: "left" },  // Price
                    3: { cellWidth: 15, halign: "left" }   // Total
                },
                margin: { left: 4, right: 4 },
                // Optional: prevent page break inside table rows
                pageBreak: "avoid"
            });
            y = doc.lastAutoTable.finalY + 10;

            // === Totals Separator ===
            centerText("--------------------------------", y);
            y += 10;

            // === Final Totals ===
            doc.setFontSize(11);
            if (pData.header.INV_VAT > 0) {
                leftText("Sub-Total " + pData.header.TOTAL_BEFORE_TAX, y);
                y += 5;
                leftText("Tax: " + pData.header.INV_VAT + "%", y);
                y += 5;
            }
            leftText("Total " + pData.header.TOTAL_AFTER_TAX, y);
            y += 5;
            doc.setFontSize(7);
            leftText("Cashier: " + pData.header.PRINTED_BY, y);
            y += 8;

            // === Thank You ===
            centerText("--------------------------------", y);
            y += 10;
            doc.setFontSize(8);
            centerText("Let Us See You Again ❤️", y);
            y += 8;

            // === Auto Print ===
            const pdfBlob = doc.output("blob");
            const pdfUrl = URL.createObjectURL(pdfBlob);
            const printWin = window.open(pdfUrl, "_blank");

            if (printWin) {
                printWin.onload = function() {
                    setTimeout(function() {
                        printWin.print();
                    }, 800);
                };
                printWin.onafterprint = function() {
                    printWin.close();
                };
            } else {
                apex.message.alert("Allow Pop-Ups for Printing");
            }
        },
        error: function() {
            apex.util.removeSpinner();
            apex.message.alert("Error fetching invoice data.");
        }
    });
}

function generateInvoicePDF() {
    var invNo = $v("P3_INV_NO");
    if (!invNo) {
        apex.message.alert("You Must Select Invoice!");
        return;
    }
    apex.server.process("GET_INVOICE_DATA", {
        pageItems: "#P3_INV_NO"
    }, {
        success: function(pData) {
            if (!pData || !pData.lines || pData.lines.length === 0) {
                apex.message.alert("No data found for this invoice.");
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4"
            });

            // === Load Custom Arabic Font ===
            const arabicFontBase64 = window.font || window.Amiri || window.AmiriRegular;  
            if (!arabicFontBase64) {
                apex.message.alert("Font base64 not found! Check variable name in Amiri-Regular-normal.js");
                console.error("Font base64 variable not found on window");
                return;
            }

            doc.addFileToVFS("Amiri-Regular.ttf", arabicFontBase64);
            doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");  // "Amiri" is the font family name
            doc.setFont("Amiri");  // Use the family name here

            // Debug: Check if font is registered
            console.log("Available fonts:", doc.getFontList());

            // Company Logo
            const logoUrl = "#APP_FILES#icons/app-icon-144-rounded.png";
            doc.addImage(logoUrl, "PNG", 15, 10, 30, 30);

            // Title
            doc.setFontSize(20);
            doc.text("فاتورة", 105, 20, { align: "center" });

            // Header details (RTL – right-aligned)
            doc.setFontSize(12);
            let yPos = 50;
            doc.text("رقم الفاتورة: " + pData.header.INV_NO, 195, yPos, { align: "right" });
            doc.text("تاريخ الفاتورة: " + pData.header.INV_DATE, 195, yPos + 10, { align: "right" });
            doc.text("الضريبة: " + (pData.header.INV_VAT || "0") + "%", 195, yPos + 20, { align: "right" });
            doc.text("مطبوع بواسطة: " + pData.header.PRINTED_BY, 195, yPos + 40, { align: "right" });

            // Totals
            doc.text("الإجمالي قبل الضريبة: " + pData.header.TOTAL_BEFORE_TAX, 195, yPos + 60, { align: "right" });
            doc.text("الإجمالي بعد الضريبة: " + pData.header.TOTAL_AFTER_TAX, 195, yPos + 70, { align: "right" });

            // Lines Table
            const headers = [["الصنف", "الكمية", "السعر", "إجمالي السطر"]];
            const body = pData.lines.map(line => [
                line.ITEM_NAME,
                line.QTY,
                line.PRICE,
                line.LINE_TOTAL
            ]);

            doc.autoTable({
                head: headers,
                body: body,
                startY: yPos + 90,
                theme: "grid",
                styles: { 
                    font: "Amiri",          // Must match the family name from addFont
                    fontSize: 10,
                    halign: "right",
                    valign: "middle"
                },
                headStyles: { 
                    fillColor: [41, 128, 185],
                    textColor: [255, 255, 255],
                    font: "Amiri",
                    halign: "center"
                },
                margin: { left: 15, right: 15 }
            });

            // Open PDF with auto-print
            const pdfBlob = doc.output("blob");
            const pdfUrl = URL.createObjectURL(pdfBlob);
            const newTab = window.open(pdfUrl, "_blank");

            if (newTab) {
                newTab.onload = function() {
                    setTimeout(function() { newTab.print(); }, 1000);
                };
                newTab.onafterprint = function() { newTab.close(); };
            } else {
                apex.message.alert("Please allow pop-ups for this site.");
            }
        },
        error: function() {
            apex.message.alert("Error fetching invoice data.");
        }
    });
}