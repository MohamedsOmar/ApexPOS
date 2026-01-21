function generateInvoicePDF() {
    var invNo = $v("P3_INV_NO");
    if (!invNo) {
        apex.message.alert("Invoice ID is missing!");
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