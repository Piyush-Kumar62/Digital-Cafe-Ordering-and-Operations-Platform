package com.digitalcafe.util;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.text.NumberFormat;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class PaymentReceiptPdfGenerator {

    private PaymentReceiptPdfGenerator() {}

    private static final int LEFT = 34;
    private static final int RIGHT = 561;
    private static final int PAGE_BORDER_INSET = 6;
    private static final float COFFEE_R = 0.36f;
    private static final float COFFEE_G = 0.23f;
    private static final float COFFEE_B = 0.14f;
    private static final Pattern ITEM_QTY_PATTERN = Pattern.compile("^(.*)\\sx(\\d+)\\b.*$", Pattern.CASE_INSENSITIVE);
    private static final Pattern MONEY_PATTERN = Pattern.compile("([0-9]+(?:\\.[0-9]{1,2})?)");

    public static byte[] generate(String receiptId, String customer, String details) {

        Map<String, String> f = new LinkedHashMap<>();
        List<String> items = new ArrayList<>();

        if (details != null) {
            // Parse simple key:value lines and the semicolon-separated item list.
            for (String line : details.split("\\R")) {
                if (line.startsWith("Items:")) {
                    for (String i : line.substring(6).split(";")) {
                        if (!i.isBlank()) items.add(i.trim());
                    }
                } else if (line.contains(":")) {
                    String[] p = line.split(":", 2);
                    f.put(p[0].trim(), p[1].trim());
                }
            }
        }

        return buildPdf(buildContent(receiptId, customer, f, items));
    }

    private static String buildContent(String receiptId, String customer,
                                       Map<String, String> f, List<String> items) {

        StringBuilder s = new StringBuilder();

        // Paint a coffee frame and keep a white inner canvas for readability.
        s.append(COFFEE_R).append(" ").append(COFFEE_G).append(" ").append(COFFEE_B).append(" rg 0 0 595 842 re f\n");
        int innerWidth = 595 - (PAGE_BORDER_INSET * 2);
        int innerHeight = 842 - (PAGE_BORDER_INSET * 2);
        s.append("1 1 1 rg ").append(PAGE_BORDER_INSET).append(" ").append(PAGE_BORDER_INSET)
         .append(" ").append(innerWidth).append(" ").append(innerHeight).append(" re f\n");

        drawHeader(s, receiptId, f);
        drawCustomer(s, customer, f);
        drawGrid(s, f);
        int afterItemsY = drawItemsTable(s, items);
        drawPricing(s, f, afterItemsY);
        drawFooter(s, receiptId, customer, f, items);

        return s.toString();
    }

    private static void drawHeader(StringBuilder s, String receiptId, Map<String, String> f) {

        s.append("0.33 0.22 0.14 rg 34 740 527 72 re f\n");

        int brandY = 779;

        s.append("1 1 1 RG 1.2 w 40 782 13 8 re S\n");
        s.append("1 1 1 RG 1 w 53 784 3 4 re S\n");
        s.append("1 1 1 RG 1.2 w 39 780 m 55 780 l S\n");

        s.append("BT /F2 20 Tf 1 1 1 rg 1 0 0 1 64 ").append(brandY)
         .append(" Tm (DIGITAL CAFE) Tj ET\n");

        String subtitle = getFirst(f, "Invoice Type", "Receipt Type");
        if (subtitle == null || subtitle.isBlank() || "-".equals(subtitle.trim())) {
            subtitle = "Payment Receipt";
        }
        s.append("BT /F1 9 Tf 0.8 0.85 0.95 rg 1 0 0 1 64 ")
         .append(brandY - 20).append(" Tm (").append(clean(truncate(subtitle, 22))).append(") Tj ET\n");

        s.append("0.44 0.30 0.20 rg 382 761 150 24 re f\n");
        s.append("BT /F2 10 Tf 1 1 1 rg 1 0 0 1 392 770 Tm (")
         .append(clean(truncate(receiptId, 20))).append(") Tj ET\n");
    }

    private static void drawCustomer(StringBuilder s, String name, Map<String, String> f) {

        s.append("BT /F1 9 Tf 0.35 0.45 0.60 rg 1 0 0 1 34 718 Tm (Customer Info) Tj ET\n");
        s.append("BT /F2 14 Tf 0.1 0.2 0.3 rg 1 0 0 1 34 701 Tm (")
         .append(clean(name)).append(") Tj ET\n");
        String issue = safeVal(getFirst(f, "Issue Time", "Payment Time"));
        String tz = safeVal(getFirst(f, "Timezone"));
        s.append("BT /F1 8 Tf 0.35 0.45 0.60 rg 1 0 0 1 360 714 Tm (Issued: ")
         .append(clean(truncate(issue, 22))).append(") Tj ET\n");
        s.append("BT /F1 8 Tf 0.35 0.45 0.60 rg 1 0 0 1 360 702 Tm (TZ: ")
         .append(clean(truncate(tz, 20))).append(") Tj ET\n");

        s.append("0.8 0.85 0.95 RG 34 692 m 561 692 l S\n");
    }

    private static void drawGrid(StringBuilder s, Map<String, String> f) {

        s.append("0.96 0.97 0.99 rg 34 530 527 158 re f\n");
        s.append("0.84 0.89 0.96 RG 0.7 w 34 530 527 158 re S\n");
        s.append("0.87 0.91 0.97 RG 0.5 w 296 536 m 296 680 l S\n");

        int y = 656;

        String[][] keys = {
                {"Order", "Booking"},
                {"Cafe", "Amount Paid"},
                {"Method", "Payment Time"},
                {"Gateway", "Gateway Payment ID"},
                {"Gateway Order ID", "Status"}
        };

        for (String[] row : keys) {

            s.append(label(50, y, row[0]));
            s.append(value(170, y, truncate(f.get(row[0]), "Gateway Order ID".equals(row[0]) ? 14 : 20)));

            s.append(label(310, y, row[1]));

            if ("Status".equals(row[1])) {
                // Keep status color obvious for quick scanning.
                float r = 0.95f, g = 0.79f, b = 0.28f;
                String status = clean(f.get(row[1])).toUpperCase();
                if (status.contains("CAPTURED") || status.contains("SUCCESS")) {
                    r = 0.18f; g = 0.72f; b = 0.38f;
                } else if (status.contains("FAIL")) {
                    r = 0.89f; g = 0.23f; b = 0.24f;
                }
                s.append(r).append(" ").append(g).append(" ").append(b).append(" rg 440 ")
                 .append(y - 5).append(" 86 15 re f\n");
                s.append("BT /F2 8 Tf 1 1 1 rg 1 0 0 1 457 ").append(y + 2)
                 .append(" Tm (").append(clean(truncate(status, 10))).append(") Tj ET\n");
            } else {
                s.append(value(440, y, truncate(f.get(row[1]), "Payment Time".equals(row[1]) ? 18 : 16)));
            }

            y -= 24;
        }

        String legal = safeVal(getFirst(f, "Cafe Legal Name", "Cafe"));
        String gstin = safeVal(getFirst(f, "Cafe GSTIN", "GSTIN"));
        String channel = safeVal(getFirst(f, "Order Channel"));
        s.append("0.88 0.91 0.96 RG 0.4 w 46 554 m 549 554 l S\n");
        s.append("BT /F1 8 Tf 0.36 0.46 0.60 rg 1 0 0 1 50 544 Tm (Legal: ")
         .append(clean(truncate(legal, 26))).append(") Tj ET\n");
        s.append("BT /F1 8 Tf 0.36 0.46 0.60 rg 1 0 0 1 310 544 Tm (GSTIN: ")
         .append(clean(truncate(gstin, 20))).append(") Tj ET\n");
        s.append("BT /F1 8 Tf 0.36 0.46 0.60 rg 1 0 0 1 50 536 Tm (Channel: ")
         .append(clean(truncate(channel, 20))).append(") Tj ET\n");
    }

    private static int drawItemsTable(StringBuilder s, List<String> items) {

        int maxRows = 6;
        int rowsToRender = Math.max(1, Math.min(maxRows, items == null ? 0 : items.size()));
        int top = 524;
        int height = 76 + (rowsToRender * 18);
        int bottom = top - height;
        if (bottom < 332) bottom = 332;

        s.append("0.97 0.98 1 rg 34 ").append(bottom).append(" 527 ").append(top - bottom).append(" re f\n");
        s.append("0.85 0.90 0.98 RG 0.7 w 34 ").append(bottom).append(" 527 ").append(top - bottom).append(" re S\n");
        s.append("BT /F2 11 Tf 0.10 0.22 0.50 rg 1 0 0 1 46 ").append(top - 20).append(" Tm (Items Ordered) Tj ET\n");

        int headerY = top - 44;
        s.append("0.93 0.95 0.98 rg 46 ").append(headerY).append(" 503 22 re f\n");
        s.append(label(56, headerY + 8, "Item"));
        s.append(label(405, headerY + 8, "Qty"));
        s.append(label(475, headerY + 8, "Price"));
        s.append("0.84 0.88 0.95 RG 0.5 w 46 ").append(headerY).append(" m 549 ").append(headerY).append(" l S\n");

        int y = headerY - 18;
        int rowCount = 0;

        for (String item : items) {
            // Cap rows so the table never overlaps the pricing section.
            if (rowCount >= maxRows || y < bottom + 12) break;

            ParsedItem parsed = parseItem(item);
            String name = parsed.name;
            String qty = parsed.qty;
            String price = parsed.lineTotal;

            s.append(value(56, y, truncate(name, 36)));
            s.append(value(410, y, qty));
            s.append(value(470, y, truncate(price, 12)));
            s.append("0.90 0.93 0.98 RG 0.4 w 46 ").append(y - 8).append(" m 549 ").append(y - 8).append(" l S\n");

            y -= 18;
            rowCount++;
        }

        if (rowCount == 0) {
            s.append("BT /F1 10 Tf 0.40 0.48 0.60 rg 1 0 0 1 56 ").append(headerY - 28).append(" Tm (No line items available.) Tj ET\n");
        }

        return bottom;
    }

    private static void drawPricing(StringBuilder s, Map<String, String> f, int startY) {
        BigDecimal amountPaid = parse(f.get("Amount Paid"));
        BigDecimal subtotal = parseOr(f.get("Subtotal"), amountPaid);
        BigDecimal discount = parseOr(f.get("Discount"), BigDecimal.ZERO);
        BigDecimal tax = parseOr(f.get("Tax"), BigDecimal.ZERO);
        if (tax.compareTo(BigDecimal.ZERO) == 0) {
            tax = parseOr(f.get("GST"), BigDecimal.ZERO);
        }
        if (tax.compareTo(BigDecimal.ZERO) == 0) {
            tax = subtotal.multiply(new BigDecimal("0.10")).setScale(2, RoundingMode.HALF_UP);
        }
        BigDecimal cgst = parseOr(f.get("CGST"), tax.divide(new BigDecimal("2"), 2, RoundingMode.HALF_UP));
        BigDecimal sgst = parseOr(f.get("SGST"), tax.divide(new BigDecimal("2"), 2, RoundingMode.HALF_UP));
        BigDecimal igst = parseOr(f.get("IGST"), BigDecimal.ZERO);
        BigDecimal fee = parseOr(getFirst(f, "Platform Fee", "Service Fee", "Platform / Service Fee"), BigDecimal.ZERO);
        BigDecimal rounding = parseOr(f.get("Rounding"), BigDecimal.ZERO);
        BigDecimal netPayable = parseOr(f.get("Net Payable"), subtotal.subtract(discount).add(tax).add(fee).add(rounding));
        BigDecimal total = amountPaid.compareTo(BigDecimal.ZERO) > 0 ? amountPaid : netPayable;

        int titleY = startY - 24;
        if (titleY < 250) titleY = 250;

        int cardTop = titleY + 14;
        int cardBottom = titleY - 154;
        s.append("0.97 0.98 1 rg 34 ").append(cardBottom).append(" 527 ")
         .append(cardTop - cardBottom).append(" re f\n");
        s.append("0.85 0.90 0.98 RG 0.7 w 34 ").append(cardBottom).append(" 527 ")
         .append(cardTop - cardBottom).append(" re S\n");

        s.append("BT /F2 12 Tf 0.10 0.22 0.50 rg 1 0 0 1 46 ").append(titleY)
         .append(" Tm (Pricing Breakdown) Tj ET\n");
        s.append("0.83 0.88 0.95 RG 0.8 w 46 ").append(titleY - 6).append(" m 549 ")
         .append(titleY - 6).append(" l S\n");

        int y = titleY - 28;
        s.append(price("Subtotal", subtotal, y));
        y -= 18;
        if (discount.compareTo(BigDecimal.ZERO) > 0) {
            s.append(price("Discount", discount.negate(), y));
            y -= 18;
        }
        s.append(price("CGST", cgst, y));
        y -= 18;
        s.append(price("SGST", sgst, y));
        y -= 18;
        if (igst.compareTo(BigDecimal.ZERO) > 0) {
            s.append(price("IGST", igst, y));
            y -= 18;
        }
        s.append(price("Platform / Service Fee", fee, y));
        y -= 18;
        if (rounding.compareTo(BigDecimal.ZERO) != 0) {
            s.append(price("Rounding", rounding, y));
            y -= 18;
        }
        s.append(price("Net Payable", netPayable, y));
        y -= 18;
        s.append("0.60 0.67 0.82 RG 0.6 w 338 ").append(y + 16).append(" m 520 ").append(y + 16).append(" l S\n");
        s.append("BT /F2 12 Tf 0.05 0.10 0.22 rg 1 0 0 1 338 ").append(y)
         .append(" Tm (TOTAL AMOUNT) Tj ET\n");
        s.append("BT /F2 12 Tf 0.05 0.10 0.22 rg 1 0 0 1 452 ").append(y)
         .append(" Tm (").append(format(total)).append(") Tj ET\n");
    }

    private static void drawFooter(StringBuilder s, String receiptId, String customer, Map<String, String> f, List<String> items) {

        s.append("0.8 0.85 0.95 RG 46 100 m 549 100 l S\n");

        s.append("BT /F2 11 Tf 0.1 0.2 0.3 rg 1 0 0 1 46 80 Tm ")
         .append("(Thank you for visiting Digital Cafe!) Tj ET\n");
        s.append("BT /F1 8 Tf 0.36 0.45 0.58 rg 1 0 0 1 46 64 Tm ")
         .append("(Support: help@digitalcafe.in | +91-98765-43210) Tj ET\n");
        s.append("BT /F1 7 Tf 0.45 0.53 0.64 rg 1 0 0 1 46 52 Tm ")
         .append("(Computer generated receipt. Refunds are subject to cafe and gateway policy.) Tj ET\n");
        s.append("BT /F1 7 Tf 0.45 0.53 0.64 rg 1 0 0 1 46 40 Tm (Integrity: ")
         .append(clean(shortHash(receiptId + "|" + customer + "|" + f.toString() + "|" + items.toString())))
         .append(") Tj ET\n");
    }

    private static String label(int x, int y, String t) {
        return "BT /F1 9 Tf 0.4 0.5 0.6 rg 1 0 0 1 " + x + " " + y +
                " Tm (" + clean(t) + ") Tj ET\n";
    }

    private static String value(int x, int y, String t) {
        return "BT /F2 10 Tf 0.1 0.2 0.3 rg 1 0 0 1 " + x + " " + y +
                " Tm (" + clean(t) + ") Tj ET\n";
    }

    private static String price(String label, BigDecimal v, int y) {
        return label(338, y, label) + value(452, y, format(v));
    }

    private static String clean(String s) {
        if (s == null || s.isBlank()) return "-";
        String raw = s.replace("₹", "INR ");
        return raw.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)");
    }

    private static BigDecimal parse(String s) {
        if (s == null) return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        Matcher matcher = MONEY_PATTERN.matcher(s);
        if (!matcher.find()) return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        String numeric = matcher.group(1);
        if (numeric.isBlank()) return BigDecimal.ZERO;
        return new BigDecimal(numeric).setScale(2, RoundingMode.HALF_UP);
    }

    private static String format(BigDecimal v) {
        BigDecimal normalized = v == null
                ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP)
                : v.setScale(2, RoundingMode.HALF_UP);
        NumberFormat formatter = NumberFormat.getNumberInstance(new Locale("en", "IN"));
        formatter.setMinimumFractionDigits(2);
        formatter.setMaximumFractionDigits(2);
        formatter.setGroupingUsed(true);
        return "INR " + formatter.format(normalized);
    }

    private static String truncate(String value, int max) {
        if (value == null || value.isBlank()) return "-";
        String trimmed = value.trim();
        return trimmed.length() <= max ? trimmed : trimmed.substring(0, max - 1) + "~";
    }

    private static String safeVal(String v) {
        return v == null || v.isBlank() ? "-" : v.trim();
    }

    private static String getFirst(Map<String, String> f, String... keys) {
        for (String key : keys) {
            String value = f.get(key);
            if (value != null && !value.isBlank()) return value;
        }
        return null;
    }

    private static BigDecimal parseOr(String value, BigDecimal fallback) {
        BigDecimal parsed = parse(value);
        if (parsed.compareTo(BigDecimal.ZERO) == 0 && (value == null || value.isBlank())) {
            return fallback.setScale(2, RoundingMode.HALF_UP);
        }
        return parsed;
    }

    private static ParsedItem parseItem(String item) {
        String cleanItem = item == null ? "" : item.trim();
        if (cleanItem.contains("||")) {
            String[] parts = cleanItem.split("\\|\\|");
            String name = parts.length > 0 ? parts[0].trim() : "-";
            String qty = parts.length > 1 ? parts[1].trim() : "1";
            String unit = parts.length > 2 ? parts[2].trim() : "-";
            String line = parts.length > 3 ? parts[3].trim() : unit;
            return new ParsedItem(safeVal(name), sanitizeQty(qty), safeVal(unit), safeVal(line));
        }

        String name = cleanItem;
        String qty = "1";
        String price = "-";

        int inrIndex = cleanItem.toUpperCase().indexOf("INR");
        if (inrIndex >= 0) {
            price = clean(cleanItem.substring(inrIndex).replace("(", "").replace(")", "").trim());
            name = cleanItem.substring(0, inrIndex).trim();
        }

        Matcher qtyMatcher = ITEM_QTY_PATTERN.matcher(name);
        if (qtyMatcher.matches()) {
            name = qtyMatcher.group(1).trim();
            qty = qtyMatcher.group(2).trim();
        }

        return new ParsedItem(safeVal(name), sanitizeQty(qty), "-", safeVal(price));
    }

    private static String sanitizeQty(String qty) {
        if (qty == null || qty.isBlank()) return "1";
        String trimmed = qty.trim().replaceAll("[^0-9]", "");
        if (trimmed.isBlank() || trimmed.length() > 3) return "1";
        return trimmed;
    }

    private static String shortHash(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) sb.append(String.format("%02x", b));
            return sb.substring(0, 16).toUpperCase();
        } catch (Exception ex) {
            return "NA";
        }
    }

    private record ParsedItem(String name, String qty, String unitPrice, String lineTotal) {}

    private static byte[] buildPdf(String content) {

        try {
            byte[] stream = content.getBytes(StandardCharsets.US_ASCII);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            List<Integer> offsets = new ArrayList<>();
            offsets.add(0);

            write(out, "%PDF-1.4\n");

            offsets.add(out.size());
            write(out, "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

            offsets.add(out.size());
            write(out, "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");

            offsets.add(out.size());
            write(out, "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] " +
                    "/Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n");

            offsets.add(out.size());
            write(out, "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n");

            offsets.add(out.size());
            write(out, "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n");

            offsets.add(out.size());
            write(out, "6 0 obj\n<< /Length " + stream.length + " >>\nstream\n");
            out.write(stream);
            write(out, "\nendstream\nendobj\n");

            int xref = out.size();
            write(out, "xref\n0 7\n0000000000 65535 f \n");

            for (int i = 1; i <= 6; i++) {
                write(out, String.format("%010d 00000 n \n", offsets.get(i)));
            }

            write(out, "trailer\n<< /Size 7 /Root 1 0 R >>\n");
            write(out, "startxref\n" + xref + "\n%%EOF");

            return out.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private static void write(ByteArrayOutputStream out, String s) {
        out.writeBytes(s.getBytes(StandardCharsets.US_ASCII));
    }
}
