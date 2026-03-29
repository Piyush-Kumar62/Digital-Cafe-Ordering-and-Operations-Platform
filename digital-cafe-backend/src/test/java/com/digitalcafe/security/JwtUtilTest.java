package com.digitalcafe.security;

import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;

import static org.assertj.core.api.Assertions.assertThat;

class JwtUtilTest {

    @Test
    void shouldValidateGeneratedToken() {
        JwtUtil jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", "0123456789abcdef0123456789abcdef");
        ReflectionTestUtils.setField(jwtUtil, "expiration", 60000L);
        ReflectionTestUtils.setField(jwtUtil, "refreshExpiration", 120000L);

        UserDetails userDetails = new User("customer@test.com", "pass", Collections.emptyList());
        Authentication authentication = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

        String token = jwtUtil.generateToken(authentication);

        assertThat(jwtUtil.validateToken(token)).isTrue();
        assertThat(jwtUtil.validateToken(token, userDetails)).isTrue();
        assertThat(jwtUtil.extractUsername(token)).isEqualTo("customer@test.com");
    }

    @Test
    void shouldRejectExpiredToken() {
        JwtUtil jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", "0123456789abcdef0123456789abcdef");
        ReflectionTestUtils.setField(jwtUtil, "expiration", -1000L);
        ReflectionTestUtils.setField(jwtUtil, "refreshExpiration", -1000L);

        UserDetails userDetails = new User("customer@test.com", "pass", Collections.emptyList());
        Authentication authentication = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

        String token = jwtUtil.generateToken(authentication);

        assertThat(jwtUtil.validateToken(token)).isFalse();
        assertThat(jwtUtil.validateToken(token, userDetails)).isFalse();
    }
}
