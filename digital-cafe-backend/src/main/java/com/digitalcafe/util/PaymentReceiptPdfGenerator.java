package com.digitalcafe.util;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Lightweight styled PDF generator for payment receipts – no third-party library.
 * Produces a professional single-page A4 PDF with:
 *   • Dark-indigo branded header
 *   • Two-column order-detail fields
 *   • Itemised order list
 *   • Total amount row
 *   • Auto-generated disclaimer footer
 */
public final class PaymentReceiptPdfGenerator {

    private PaymentReceiptPdfGenerator() {}

    // ── Public API (signature unchanged for backward compatibility) ───────────

    public static byte[] generate(String receiptNumber, String customerName, String details) {
        Map<String, String> fields = new LinkedHashMap<>();
        List<String>        items  = new ArrayList<>();

        if (details != null && !details.isBlank()) {
            for (String rawLine : details.split("\\R")) {
                String line = rawLine.trim();
                if (line.startsWith("Items:")) {
                    for (String part : line.substring(6).split(";")) {
                        String s = part.trim();
                        if (!s.isEmpty()) items.add(s);
                    }
                } else if (line.contains(":")) {
                    int colon = line.indexOf(':');
                    String key = line.substring(0, colon).trim();
                    String val = line.substring(colon + 1).trim();
                    if (!key.isEmpty()) fields.put(key, val);
                }
            }
        }
        return buildPdf(safe(receiptNumber), safe(customerName), fields, items);
    }

    // ── PDF binary assembly ───────────────────────────────────────────────────

    private static byte[] buildPdf(String receiptNumber, String customerName,
                                    Map<String, String> fields, List<String> items) {
        try {
            String content = buildContentStream(receiptNumber, customerName, fields, items);
            byte[] cs = content.getBytes(StandardCharsets.US_ASCII);

            ByteArrayOutputStream out = new ByteArrayOutputStream(4096);
            List<Integer> off = new ArrayList<>();
            off.add(0); // placeholder – xref entry 0 is always free

            write(out, "%PDF-1.4\n");

            // obj 1 – Catalog
            off.add(out.size());
            write(out, "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

            // obj 2 – Pages
            off.add(out.size());
            write(out, "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");

            // obj 3 – Page  (two fonts: F1 = Helvetica, F2 = Helvetica-Bold)
            off.add(out.size());
            write(out, "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] "
                    + "/Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n");

            // obj 4 – Helvetica regular
            off.add(out.size());
            write(out, "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n");

            // obj 5 – Helvetica Bold
            off.add(out.size());
            write(out, "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n");

            // obj 6 – Content stream
            off.add(out.size());
            write(out, "6 0 obj\n<< /Length " + cs.length + " >>\nstream\n");
            out.write(cs);
            write(out, "\nendstream\nendobj\n");

            // Cross-reference table
            int xrefOffset = out.size();
            write(out, "xref\n0 7\n");
            write(out, String.format("%010d %05d f %n", 0, 65535));
            for (int i = 1; i <= 6; i++) {
                write(out, String.format("%010d %05d n %n", off.get(i), 0));
            }
            write(out, "trailer\n<< /Size 7 /Root 1 0 R >>\n");
            write(out, "startxref\n" + xrefOffset + "\n%%EOF");

            return out.toByteArray();
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to generate payment receipt PDF", ex);
        }
    }

    // ── PDF content stream ────────────────────────────────────────────────────

    private static String buildContentStream(String receiptNumber, String customerName,
                                              Map<String, String> fields, List<String> items) {
        StringBuilder s = new StringBuilder(2048);

        // ── Header band (dark indigo, y 770–842) ──────────────────────────────
        s.append("0.09 0.14 0.38 rg\n");
        s.append("0 770 595 72 re f\n");

        // Accent strip at very top
        s.append("0.38 0.51 0.93 rg\n");
        s.append("0 838 595 4 re f\n");

        // Left accent border (full page height)
        s.append("0.38 0.51 0.93 rg\n");
        s.append("0 0 4 842 re f\n");

        // "DIGITAL CAFE" – large white bold
        s.append("BT /F2 21 Tf 1 1 1 rg 1 0 0 1 42 801 Tm (DIGITAL CAFE) Tj ET\n");
        // "Payment Receipt" – light-blue subtitle
        s.append("BT /F1 11 Tf 0.75 0.83 0.97 rg 1 0 0 1 42 781 Tm (Payment Receipt) Tj ET\n");

        // Receipt no. (right side of header)
        s.append("BT /F1 8 Tf 0.65 0.73 0.93 rg 1 0 0 1 400 801 Tm (RECEIPT NO.) Tj ET\n");
        s.append("BT /F2 9 Tf 0.93 0.94 0.98 rg 1 0 0 1 400 787 Tm ("
                + sanitize(receiptNumber) + ") Tj ET\n");

        // ── Bill-to block ─────────────────────────────────────────────────────
        s.append("BT /F1 8 Tf 0.50 0.50 0.56 rg 1 0 0 1 22 745 Tm (BILLED TO) Tj ET\n");
        s.append("BT /F2 13 Tf 0.09 0.14 0.38 rg 1 0 0 1 22 728 Tm ("
                + sanitize(customerName) + ") Tj ET\n");

        // Divider below customer name
        s.append("0.82 0.82 0.87 RG 0.5 w 22 718 m 573 718 l S\n");

        // ── Two-column detail fields ──────────────────────────────────────────
        //  Layout: KEY_L=22  VAL_L=140   KEY_R=305  VAL_R=430
        final int KL = 22, VL = 140, KR = 305, VR = 430;
        String[][] rows = {
            {"Order",            "Booking"},
            {"Cafe",             "Amount Paid"},
            {"Method",           "Status"},
            {"Gateway",          "Payment Time"},
            {"Gateway Order ID", "Gateway Payment ID"}
        };

        int fy = 700;
        for (String[] row : rows) {
            // Left key + value
            s.append("BT /F1 8 Tf 0.50 0.50 0.56 rg 1 0 0 1 " + KL + " " + fy
                    + " Tm (" + sanitize(row[0]) + ") Tj ET\n");
            String lv = fields.getOrDefault(row[0], "-");
            s.append("BT /F2 9 Tf 0.10 0.12 0.20 rg 1 0 0 1 " + VL + " " + fy
                    + " Tm (" + sanitize(truncate(lv, 22)) + ") Tj ET\n");

            // Right key + value (if present)
            if (row.length > 1 && !row[1].isEmpty()) {
                s.append("BT /F1 8 Tf 0.50 0.50 0.56 rg 1 0 0 1 " + KR + " " + fy
                        + " Tm (" + sanitize(row[1]) + ") Tj ET\n");
                String rv = fields.getOrDefault(row[1], "-");
                s.append("BT /F2 9 Tf 0.10 0.12 0.20 rg 1 0 0 1 " + VR + " " + fy
                        + " Tm (" + sanitize(truncate(rv, 22)) + ") Tj ET\n");
            }
            fy -= 22;
        }

        // ── Items section ─────────────────────────────────────────────────────
        fy -= 6;
        s.append("0.82 0.82 0.87 RG 0.5 w 22 " + fy + " m 573 " + fy + " l S\n");
        fy -= 16;

        // Section heading
        s.append("BT /F2 10 Tf 0.09 0.14 0.38 rg 1 0 0 1 22 " + fy + " Tm (ITEMS ORDERED) Tj ET\n");
        fy -= 6;
        s.append("0.82 0.82 0.87 RG 0.5 w 22 " + fy + " m 573 " + fy + " l S\n");
        fy -= 14;

        // Column headers
        s.append("BT /F1 8 Tf 0.50 0.50 0.56 rg 1 0 0 1 22 " + fy + " Tm (Description) Tj ET\n");
        s.append("BT /F1 8 Tf 0.50 0.50 0.56 rg 1 0 0 1 490 " + fy + " Tm (Amount) Tj ET\n");
        fy -= 5;
        s.append("0.82 0.82 0.87 RG 0.5 w 22 " + fy + " m 573 " + fy + " l S\n");
        fy -= 16;

        // Item rows (format: "Name x1 (INR 99.00)")
        for (String itemLine : items) {
            String desc  = itemLine;
            String price = "";
            int parenOpen = itemLine.lastIndexOf('(');
            if (parenOpen > 0 && itemLine.endsWith(")")) {
                price = itemLine.substring(parenOpen + 1, itemLine.length() - 1);
                desc  = itemLine.substring(0, parenOpen).trim();
            }
            s.append("BT /F1 9 Tf 0.10 0.12 0.20 rg 1 0 0 1 22 " + fy
                    + " Tm (" + sanitize(truncate(desc, 55)) + ") Tj ET\n");
            if (!price.isEmpty()) {
                s.append("BT /F1 9 Tf 0.10 0.12 0.20 rg 1 0 0 1 468 " + fy
                        + " Tm (" + sanitize(price) + ") Tj ET\n");
            }
            fy -= 16;
            if (fy < 130) break; // guard against page overflow
        }

        // ── Total row ─────────────────────────────────────────────────────────
        fy -= 4;
        s.append("0.52 0.52 0.60 RG 1 w 22 " + fy + " m 573 " + fy + " l S\n");
        fy -= 16;

        String totalAmt = fields.getOrDefault("Amount Paid", "-");
        s.append("BT /F2 10 Tf 0.09 0.14 0.38 rg 1 0 0 1 370 " + fy
                + " Tm (TOTAL AMOUNT PAID) Tj ET\n");
        s.append("BT /F2 11 Tf 0.09 0.14 0.38 rg 1 0 0 1 490 " + fy
                + " Tm (" + sanitize(totalAmt) + ") Tj ET\n");

        // ── Footer band ───────────────────────────────────────────────────────
        s.append("0.94 0.94 0.96 rg 0 0 595 50 re f\n");
        s.append("0.82 0.82 0.87 RG 0.5 w 0 50 m 595 50 l S\n");

        s.append("BT /F1 8 Tf 0.50 0.50 0.56 rg 1 0 0 1 22 30 Tm "
                + "(This is an auto-generated receipt. "
                + "Digital Cafe is not responsible for discrepancies post payment confirmation.) Tj ET\n");
        s.append("BT /F1 7 Tf 0.60 0.60 0.66 rg 1 0 0 1 22 17 Tm "
                + "(For support, contact your cafe or reach Digital Cafe Help at help@digitalcafe.in) Tj ET\n");

        return s.toString();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** Escape a string for use as a PDF literal string (inside parentheses). */
    private static String sanitize(String text) {
        if (text == null) return "";
        String ascii = text.replace("\u20B9", "INR ").replace("₹", "INR ");
        StringBuilder out = new StringBuilder(ascii.length() + 8);
        for (char c : ascii.toCharArray()) {
            if (c == '\\' || c == '(' || c == ')') out.append('\\');
            out.append(c < 32 || c > 126 ? '?' : c);
        }
        return out.toString();
    }

    private static String truncate(String value, int max) {
        return (value != null && value.length() > max) ? value.substring(0, max - 1) + "~" : value;
    }

    private static String safe(String v) {
        return (v == null || v.isBlank()) ? "-" : v.trim();
    }

    private static void write(ByteArrayOutputStream out, String value) {
        out.writeBytes(value.getBytes(StandardCharsets.US_ASCII));
    }
}

