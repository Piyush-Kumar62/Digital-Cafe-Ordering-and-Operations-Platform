package com.digitalcafe.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class CookieUtil {

    public static final String REFRESH_TOKEN_COOKIE = "refreshToken";
    public static final String ACCESS_TOKEN_COOKIE = "accessToken";
    public static final String CSRF_TOKEN_COOKIE = "XSRF-TOKEN";

    @Value("${jwt.expiration:86400000}")
    private Long accessExpiration;

    @Value("${jwt.refresh-expiration:604800000}")
    private Long refreshExpiration;

    @Value("${app.cookie.secure:false}")
    private boolean secureCookie;

    @Value("${app.cookie.same-site:Lax}")
    private String sameSite;

    public HttpHeaders createRefreshTokenCookie(String refreshToken) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_TOKEN_COOKIE, refreshToken)
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite(sameSite)
                .path("/")
                .maxAge(refreshExpiration / 1000)
                .build();

        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.SET_COOKIE, cookie.toString());
        return headers;
    }

    public HttpHeaders clearRefreshTokenCookie() {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_TOKEN_COOKIE, "")
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite(sameSite)
                .path("/")
                .maxAge(0) // Expire immediately
                .build();

        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.SET_COOKIE, cookie.toString());
        return headers;
    }

    public HttpHeaders createAccessTokenCookie(String accessToken) {
        ResponseCookie cookie = ResponseCookie.from(ACCESS_TOKEN_COOKIE, accessToken)
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite(sameSite)
                .path("/")
                .maxAge(accessExpiration / 1000)
                .build();

        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.SET_COOKIE, cookie.toString());
        return headers;
    }

    public HttpHeaders clearAccessTokenCookie() {
        ResponseCookie cookie = ResponseCookie.from(ACCESS_TOKEN_COOKIE, "")
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite(sameSite)
                .path("/")
                .maxAge(0)
                .build();

        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.SET_COOKIE, cookie.toString());
        return headers;
    }

    public HttpHeaders createCsrfCookie() {
        ResponseCookie cookie = ResponseCookie.from(CSRF_TOKEN_COOKIE, UUID.randomUUID().toString())
                .httpOnly(false)
                .secure(secureCookie)
                .sameSite(sameSite)
                .path("/")
                .maxAge(refreshExpiration / 1000)
                .build();

        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.SET_COOKIE, cookie.toString());
        return headers;
    }

    public HttpHeaders clearCsrfCookie() {
        ResponseCookie cookie = ResponseCookie.from(CSRF_TOKEN_COOKIE, "")
                .httpOnly(false)
                .secure(secureCookie)
                .sameSite(sameSite)
                .path("/")
                .maxAge(0)
                .build();

        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.SET_COOKIE, cookie.toString());
        return headers;
    }
}
