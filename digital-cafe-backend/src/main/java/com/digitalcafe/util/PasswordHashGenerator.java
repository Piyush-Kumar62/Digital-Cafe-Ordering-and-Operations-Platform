package com.digitalcafe.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Utility to generate BCrypt password hash
 * Run this to get the hash, then use it in SQL
 */
public class PasswordHashGenerator {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String rawPassword = "admin123";
        String hashedPassword = encoder.encode(rawPassword);
        System.out.println("Raw Password: " + rawPassword);
        System.out.println("BCrypt Hash: " + hashedPassword);
        
        // Verify the hash works
        boolean matches = encoder.matches(rawPassword, hashedPassword);
        System.out.println("Verification: " + (matches ? "SUCCESS" : "FAILED"));
    }
}
