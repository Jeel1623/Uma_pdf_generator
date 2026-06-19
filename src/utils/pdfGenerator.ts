import { jsPDF } from "jspdf";
import { HeaderData, RowData } from "../types";

// Helper to convert mm to points (jsPDF text sizing uses points)
const mmToPt = (mm: number) => mm * 72 / 25.4;

// Helper to wrap long strings based on font size and character limit
const getWrappedLines = (text: string, fontSize: number): string[] => {
  // Max characters that can fit on one line of 45mm width at this font size
  // Char width in mm for Helvetica bold is approx 0.16 * fontSize.
  // Capacity = 45 / (0.16 * fontSize) = 280 / fontSize.
  const maxChars = Math.max(6, Math.floor(280 / fontSize));
  
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  words.forEach((word) => {
    if (word.length > maxChars) {
      // If there is already something in currentLine, push it first
      if (currentLine) {
        lines.push(currentLine);
        currentLine = "";
      }
      // Split word into chunks of maxChars
      let remaining = word;
      while (remaining.length > maxChars) {
        lines.push(remaining.substring(0, maxChars));
        remaining = remaining.substring(maxChars);
      }
      currentLine = remaining;
    } else {
      if (currentLine) {
        if (currentLine.length + 1 + word.length <= maxChars) {
          currentLine += " " + word;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      } else {
        currentLine = word;
      }
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
};

export const generatePDF = async (
  header: HeaderData,
  rows: RowData[],
  action: "download" | "print" | "view"
): Promise<string | null> => {
  // A4 dimensions: 210mm x 297mm
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const totalRows = rows.length;
  const isDuplicateLayout = totalRows <= 5;

  // Grid coordinates
  const leftMargin = 6;
  const rightMargin = 6;
  const pageWidth = 210;
  const printableWidth = pageWidth - leftMargin - rightMargin; // 198mm

  // Column widths: SR: 5%, SAREE: 7%, F1-F3: 12%, F4-F7: 13% of 198mm printable width
  const colWidths = [9.9, 13.86, 23.76, 23.76, 23.76, 25.74, 25.74, 25.74, 25.74];
  
  // Pre-calculate column starting X positions
  const colX: number[] = [leftMargin];
  for (let i = 0; i < colWidths.length; i++) {
    colX.push(colX[i] + colWidths[i]);
  }

  // Draw a single copy of the sheet
  const drawSheet = (offsetY: number, rowSubset: RowData[], isDuplicate: boolean) => {
    // 1. Draw Company Name (Top Center)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14); // 14pt (18px) Company Name
    doc.setTextColor(0, 0, 0);
    doc.text(header.companyName || "UMA CREATION / UMA FAB", pageWidth / 2, 11 + offsetY, { align: "center" });

    // 2. Draw Design Name (Centered & Auto-Wrapped to avoid overlap)
    doc.setFont("helvetica", "bold");
    const designText = header.designName || "110 LICHI";
    
    let designFontSize = 38;
    let designLines: string[] = [];

    // Loop to reduce font size if it takes more than 3 lines
    while (designFontSize >= 18) {
      designLines = getWrappedLines(designText, designFontSize);
      if (designLines.length <= 3) {
        break;
      }
      designFontSize -= 2;
    }

    doc.setFontSize(designFontSize);
    const designLineHeight = designFontSize * 0.38; // approx line height in mm
    const designTotalHeight = (designLines.length - 1) * designLineHeight;
    // Center vertically around Y = 28
    const designStartY = 28 + offsetY - designTotalHeight / 2 + (designFontSize * 0.12);

    designLines.forEach((lineText, lineIdx) => {
      doc.text(lineText, pageWidth / 2, designStartY + lineIdx * designLineHeight, { align: "center" });
    });

    // 3. Draw Header Fields (Left & Right Column)
    doc.setFontSize(15); // 15pt (20px) Header Labels and Values

    // Left Column Fields: DATE, M NO., DESIGN
    const leftFields = [
      { label: "DATE", value: header.date },
      { label: "M NO.", value: header.mNo },
      { label: "DESIG", value: header.design },
    ];

    const leftYStarts = [20, 29, 38];
    const leftColMaxX = 75; // line ends here

    leftFields.forEach((field, idx) => {
      const y = leftYStarts[idx] + offsetY;
      doc.setFont("helvetica", "bold");
      doc.text(field.label, leftMargin, y);
      
      const labelWidth = doc.getTextWidth(field.label);
      const valueStartX = leftMargin + labelWidth + 3;

      // Draw value in medium/normal weight
      doc.setFont("helvetica", "normal");
      doc.text(field.value || "", valueStartX, y);

      // Draw underline
      doc.setLineWidth(0.3);
      doc.setDrawColor(0, 0, 0);
      doc.line(valueStartX, y + 1.5, leftColMaxX, y + 1.5);
    });

    // Right Column Fields: PICK, PARTY, ORDER NO.
    const rightFields = [
      { label: "PICK", value: header.pick },
      { label: "PARTY", value: header.party },
      { label: "ORDER NO.", value: header.orderNo },
    ];

    const rightYStarts = [20, 29, 38];
    const rightColStartX = 135; // Shift right to avoid overlap with Design Name
    const rightColMaxX = pageWidth - rightMargin; // 204mm

    rightFields.forEach((field, idx) => {
      const y = rightYStarts[idx] + offsetY;
      doc.setFont("helvetica", "bold");
      doc.text(field.label, rightColStartX, y);

      const labelWidth = doc.getTextWidth(field.label);
      const valueStartX = rightColStartX + labelWidth + 3;

      // Draw value in medium/normal weight
      doc.setFont("helvetica", "normal");
      doc.text(field.value || "", valueStartX, y);

      // Draw underline
      doc.setLineWidth(0.3);
      doc.setDrawColor(0, 0, 0);
      doc.line(valueStartX, y + 1.5, rightColMaxX, y + 1.5);
    });

    // 4. Draw Table
    const tableStartY = 46 + offsetY;
    const headerHeight = 16; // Taller header to fit wrapped text
    const minRowHeight = isDuplicate ? 14 : 16; // Slightly shorter rows for duplicate copies to fit A4
    const lineSpacingMm = 5.2; // 15pt font line spacing

    // Draw Table Header
    doc.setLineWidth(0.8); // Thick borders for table outline
    doc.setDrawColor(0, 0, 0);
    
    // Header cells bounding box
    doc.rect(leftMargin, tableStartY, printableWidth, headerHeight);
    
    // Draw Header vertical separators
    for (let i = 1; i < colX.length - 1; i++) {
      doc.line(colX[i], tableStartY, colX[i], tableStartY + headerHeight);
    }

    // Header values: SR, SAREE, F1...F7
    const headers = [
      "N\nSR",
      "SA\nRE\nE",
      "F1",
      "F2",
      "F3",
      "F4",
      "F5",
      "F6",
      "F7",
    ];

    headers.forEach((hText, colIdx) => {
      let fSize = 16; // default for F1-F7 (approx 21px)
      let hLineHeight = 5.2;
      let baselineOffset = 1.8;

      if (colIdx === 0) {
        // SR: 14px-16px Bold -> 12pt (16px)
        fSize = 12;
        hLineHeight = 4.2;
        baselineOffset = 1.4;
      } else if (colIdx === 1) {
        // SAREE: 12px-14px Bold -> 10pt (13px)
        fSize = 10;
        hLineHeight = 3.6;
        baselineOffset = 1.2;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(fSize);

      const cellW = colWidths[colIdx];
      const midX = colX[colIdx] + cellW / 2;
      const lines = hText.split("\n");
      // Center the lines vertically in the header cell
      const startY = tableStartY + headerHeight / 2 - ((lines.length - 1) * hLineHeight) / 2 + baselineOffset;

      lines.forEach((lineText, lineIdx) => {
        doc.text(lineText, midX, startY + lineIdx * hLineHeight, { align: "center" });
      });
    });

    // Draw Table Body Rows
    let currentY = tableStartY + headerHeight;

    rowSubset.forEach((row, rowIdx) => {
      // Resolve content for each cell
      const cellTexts = [
        (rowIdx + 1).toString(),
        row.saree,
        row.f1,
        row.f2,
        row.f3,
        row.f4,
        row.f5,
        row.f6,
        row.f7,
      ];

      // Format & wrap text in each cell
      const cellLines = cellTexts.map((text, colIdx) => {
        const cellW = colWidths[colIdx];
        const padding = 1.5; // 1.5mm padding
        const maxWPoints = mmToPt(cellW - padding);
        
        let fSize = 14.5;
        let fontStyle = "normal";
        if (colIdx === 0) {
          fSize = 12;
        } else if (colIdx === 1) {
          fSize = 11;
        } else {
          fontStyle = "bold";
        }
        
        doc.setFont("helvetica", fontStyle);
        doc.setFontSize(fSize);
        return doc.splitTextToSize(text || "", maxWPoints);
      });

      // Calculate row height
      const maxLines = Math.max(...cellLines.map((lines) => lines.length), 1);
      const rowHeight = Math.max(minRowHeight, (maxLines - 1) * 5.0 + 9);

      // Draw cell boxes
      doc.setLineWidth(0.5); // Standard thick inner lines
      doc.rect(leftMargin, currentY, printableWidth, rowHeight);
      for (let i = 1; i < colX.length - 1; i++) {
        doc.line(colX[i], currentY, colX[i], currentY + rowHeight);
      }

      // Draw cell text
      cellLines.forEach((lines, colIdx) => {
        let fSize = 14.5;
        let lineSpacing = 5.0;
        let baselineOffset = 1.8;
        let fontStyle = "normal";

        if (colIdx === 0) {
          fSize = 12;
          lineSpacing = 4.2;
          baselineOffset = 1.5;
        } else if (colIdx === 1) {
          fSize = 11; // SAREE values: 11pt
          lineSpacing = 3.8;
          baselineOffset = 1.3;
        } else {
          fontStyle = "bold";
        }

        doc.setFont("helvetica", fontStyle);
        doc.setFontSize(fSize);

        const cellW = colWidths[colIdx];
        const midX = colX[colIdx] + cellW / 2;
        // Vertically center text in cell
        const textBlockHeight = (lines.length - 1) * lineSpacing;
        const startY = currentY + rowHeight / 2 - textBlockHeight / 2 + baselineOffset;

        lines.forEach((lineText: string, lineIdx: number) => {
          doc.text(lineText, midX, startY + lineIdx * lineSpacing, { align: "center" });
        });
      });

      currentY += rowHeight;
    });

    // Outer table border thick line to clean up corners
    doc.setLineWidth(0.8);
    doc.rect(leftMargin, tableStartY, printableWidth, currentY - tableStartY);
  };

  // LAYOUT BUILDING DECISION
  if (isDuplicateLayout) {
    // ----------------------------------------------------
    // RULE 1: Total Rows <= 5 -> Draw 2 identical copies
    // ----------------------------------------------------
    
    // Top copy
    drawSheet(0, rows, true);

    // Dashed divider line in the middle of page (A4 height is 297mm, middle is 148.5mm)
    doc.setLineWidth(0.5);
    doc.setLineDashPattern([3, 3], 0);
    doc.line(leftMargin, 148.5, pageWidth - rightMargin, 148.5);
    doc.setLineDashPattern([], 0); // reset to solid

    // Bottom copy
    drawSheet(148.5, rows, true);

  } else {
    // ----------------------------------------------------
    // RULE 2 & 3: Total Rows > 5 -> Full page layout & continuation
    // ----------------------------------------------------
    let currentPageRows: RowData[] = [];
    let currentY = 46 + 16; // Start after header + table header
    const pageLimitY = 275; // leave bottom margin
    const minRowHeight = 16;
    const lineSpacingMm = 5.0; // F1-F7 line spacing

    let isFirstPage = true;

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      const cellTexts = [
        (rowIndex + 1).toString(),
        row.saree,
        row.f1,
        row.f2,
        row.f3,
        row.f4,
        row.f5,
        row.f6,
        row.f7,
      ];

      // Calculate how high this row will be
      const cellLines = cellTexts.map((text, colIdx) => {
        const cellW = colWidths[colIdx];
        const padding = 1.5;
        const maxWPoints = mmToPt(cellW - padding);
        
        let fSize = 14.5;
        let fontStyle = "normal";
        if (colIdx === 0) {
          fSize = 12;
        } else if (colIdx === 1) {
          fSize = 11;
        } else {
          fontStyle = "bold";
        }
        
        doc.setFont("helvetica", fontStyle);
        doc.setFontSize(fSize);
        return doc.splitTextToSize(text || "", maxWPoints);
      });
      const maxLines = Math.max(...cellLines.map((lines) => lines.length), 1);
      const rowHeight = Math.max(minRowHeight, (maxLines - 1) * 5.0 + 9);

      // Check if this row overflows the current page
      if (currentY + rowHeight > pageLimitY) {
        // Draw the current page sheet
        if (isFirstPage) {
          drawSheet(0, currentPageRows, false);
          isFirstPage = false;
        } else {
          // Draw continuation page content
          drawContinuationSheet(doc, currentPageRows, colWidths, colX, leftMargin, rightMargin, pageWidth, header.designName, rowIndex - currentPageRows.length);
        }

        // Move to new page
        doc.addPage();
        currentPageRows = [row];
        currentY = 30 + 16 + rowHeight; // new page start Y is table header start (30) + table header height (16) + row height
      } else {
        currentPageRows.push(row);
        currentY += rowHeight;
      }
    }

    // Draw final page
    if (currentPageRows.length > 0) {
      if (isFirstPage) {
        drawSheet(0, currentPageRows, false);
      } else {
        drawContinuationSheet(doc, currentPageRows, colWidths, colX, leftMargin, rightMargin, pageWidth, header.designName, rows.length - currentPageRows.length);
      }
    }
  }

  // Handle PDF Action output
  if (action === "download") {
    const filename = `${header.designName || "Production"}_Sheet_${header.date || ""}.pdf`.replace(/[\s/\\?%*:|"<>]/g, "_");
    doc.save(filename);
    return null;
  } else if (action === "print") {
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    
    // Create iframe for background silent printing
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    iframe.src = url;
    document.body.appendChild(iframe);

    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(url);
      }, 1000);
    };
    return url;
  } else {
    // view (return raw URL string)
    const blob = doc.output("blob");
    return URL.createObjectURL(blob);
  }
};

// Helper for pages 2+ continuation sheet drawing
const drawContinuationSheet = (
  doc: jsPDF,
  rows: RowData[],
  colWidths: number[],
  colX: number[],
  leftMargin: number,
  rightMargin: number,
  pageWidth: number,
  designName: string,
  startIndex: number
) => {
  const offsetY = 10;
  const tableStartY = 30;
  const headerHeight = 16; // Taller header to fit wrapped text
  const minRowHeight = 16;
  const lineSpacingMm = 5.0; // F1-F7 line spacing
  const printableWidth = pageWidth - leftMargin - rightMargin;

  // Title on continuation page
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(`${designName || "PRODUCTION SHEET"} - CONTINUED`, pageWidth / 2, offsetY + 8, { align: "center" });

  // Draw Table Header
  doc.setLineWidth(0.8);
  doc.rect(leftMargin, tableStartY, printableWidth, headerHeight);
  
  for (let i = 1; i < colX.length - 1; i++) {
    doc.line(colX[i], tableStartY, colX[i], tableStartY + headerHeight);
  }

  const headers = ["N\nSR", "SA\nRE\nE", "F1", "F2", "F3", "F4", "F5", "F6", "F7"];
  headers.forEach((hText, colIdx) => {
    let fSize = 16; // F1-F7
    let hLineHeight = 5.2;
    let baselineOffset = 1.8;

    if (colIdx === 0) {
      fSize = 12;
      hLineHeight = 4.2;
      baselineOffset = 1.4;
    } else if (colIdx === 1) {
      fSize = 10;
      hLineHeight = 3.6;
      baselineOffset = 1.2;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(fSize);

    const cellW = colWidths[colIdx];
    const midX = colX[colIdx] + cellW / 2;
    const lines = hText.split("\n");
    const startY = tableStartY + headerHeight / 2 - ((lines.length - 1) * hLineHeight) / 2 + baselineOffset;

    lines.forEach((lineText, lineIdx) => {
      doc.text(lineText, midX, startY + lineIdx * hLineHeight, { align: "center" });
    });
  });

  // Rows
  let currentY = tableStartY + headerHeight;

  rows.forEach((row, idx) => {
    // Resolve row number from custom ID or state index (it displays the absolute serial number)
    const cellTexts = [
      (startIndex + idx + 1).toString(), // we store the row's absolute index or number in the id for rendering
      row.saree,
      row.f1,
      row.f2,
      row.f3,
      row.f4,
      row.f5,
      row.f6,
      row.f7,
    ];

    // Format & wrap text in each cell
    const cellLines = cellTexts.map((text, colIdx) => {
      const cellW = colWidths[colIdx];
      const padding = 1.5;
      const maxWPoints = mmToPt(cellW - padding);
      
      let fSize = 14.5;
      let fontStyle = "normal";
      if (colIdx === 0) {
        fSize = 12;
      } else if (colIdx === 1) {
        fSize = 11;
      } else {
        fontStyle = "bold";
      }
      
      doc.setFont("helvetica", fontStyle);
      doc.setFontSize(fSize);
      return doc.splitTextToSize(text || "", maxWPoints);
    });

    const maxLines = Math.max(...cellLines.map((lines) => lines.length), 1);
    const rowHeight = Math.max(minRowHeight, (maxLines - 1) * 5.0 + 9);

    doc.setLineWidth(0.5);
    doc.rect(leftMargin, currentY, printableWidth, rowHeight);
    for (let i = 1; i < colX.length - 1; i++) {
      doc.line(colX[i], currentY, colX[i], currentY + rowHeight);
    }

    cellLines.forEach((lines, colIdx) => {
      let fSize = 14.5;
      let lineSpacing = 5.0;
      let baselineOffset = 1.8;
      let fontStyle = "normal";

      if (colIdx === 0) {
        fSize = 12;
        lineSpacing = 4.2;
        baselineOffset = 1.5;
      } else if (colIdx === 1) {
        fSize = 11;
        lineSpacing = 3.8;
        baselineOffset = 1.3;
      } else {
        fontStyle = "bold";
      }

      doc.setFont("helvetica", fontStyle);
      doc.setFontSize(fSize);

      const cellW = colWidths[colIdx];
      const midX = colX[colIdx] + cellW / 2;
      const textBlockHeight = (lines.length - 1) * lineSpacing;
      const startY = currentY + rowHeight / 2 - textBlockHeight / 2 + baselineOffset;

      lines.forEach((lineText: string, lineIdx: number) => {
        doc.text(lineText, midX, startY + lineIdx * lineSpacing, { align: "center" });
      });
    });

    currentY += rowHeight;
  });

  // Thick outline
  doc.setLineWidth(0.8);
  doc.rect(leftMargin, tableStartY, printableWidth, currentY - tableStartY);
};
