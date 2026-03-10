package com.digitalcafe.util;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Lightweight PDF generator for payment receipts without third-party PDF dependencies.
 * Generates a single-page PDF with text content in Helvetica.
 */
public final class PaymentReceiptPdfGenerator {

    private PaymentReceiptPdfGenerator() {
    }

    public static byte[] generate(String receiptNumber, String customerName, String details) {
        List<String> lines = new ArrayList<>();
        lines.add("Digital Cafe - Payment Receipt");
        lines.add("Receipt No: " + safe(receiptNumber));
        lines.add("Customer: " + safe(customerName));
        lines.add("");
        if (details != null && !details.isBlank()) {
            for (String line : details.split("\\R")) {
                lines.add(line);
            }
        }
        lines.add("");
        lines.add("This is a computer-generated receipt.");
        return buildPdf(lines);
    }

    private static byte[] buildPdf(List<String> lines) {
        try {
            String content = buildContentStream(lines);
            byte[] contentBytes = content.getBytes(StandardCharsets.US_ASCII);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            List<Integer> offsets = new ArrayList<>();
            offsets.add(0); // xref object 0

            write(out, "%PDF-1.4\n");

            offsets.add(out.size());
            write(out, "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

            offsets.add(out.size());
            write(out, "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");

            offsets.add(out.size());
            write(out, "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] ");
            write(out, "/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n");

            offsets.add(out.size());
            write(out, "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n");

            offsets.add(out.size());
            write(out, "5 0 obj\n<< /Length " + contentBytes.length + " >>\nstream\n");
            out.write(contentBytes);
            write(out, "\nendstream\nendobj\n");

            int xrefOffset = out.size();
            write(out, "xref\n0 6\n");
            write(out, String.format("%010d %05d f %n", 0, 65535));
            for (int i = 1; i <= 5; i++) {
                write(out, String.format("%010d %05d n %n", offsets.get(i), 0));
            }

            write(out, "trailer\n<< /Size 6 /Root 1 0 R >>\n");
            write(out, "startxref\n" + xrefOffset + "\n%%EOF");

            return out.toByteArray();
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to generate payment receipt PDF", ex);
        }
    }

    private static String buildContentStream(List<String> lines) {
        StringBuilder sb = new StringBuilder();
        sb.append("BT\n");
        sb.append("/F1 12 Tf\n");
        sb.append("40 800 Td\n");

        int maxLines = 45;
        int rendered = 0;
        for (String line : lines) {
            if (rendered >= maxLines) {
                break;
            }
            String sanitized = sanitize(line);
            if (rendered == 0) {
                sb.append("(").append(sanitized).append(") Tj\n");
            } else {
                sb.append("0 -16 Td\n");
                sb.append("(").append(sanitized).append(") Tj\n");
            }
            rendered++;
        }

        sb.append("ET");
        return sb.toString();
    }

    private static String sanitize(String line) {
        if (line == null) {
            return "";
        }
        String ascii = line.replace("₹", "INR ");
        StringBuilder out = new StringBuilder(ascii.length());
        for (char c : ascii.toCharArray()) {
            if (c == '\\' || c == '(' || c == ')') {
                out.append('\\');
            }
            out.append(c <= 126 ? c : '?');
        }
        return out.toString();
    }

    private static String safe(String value) {
        return (value == null || value.isBlank()) ? "-" : value;
    }

    private static void write(ByteArrayOutputStream out, String value) {
        out.writeBytes(value.getBytes(StandardCharsets.US_ASCII));
    }
}
