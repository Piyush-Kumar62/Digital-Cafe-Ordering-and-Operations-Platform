package com.digitalcafe.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtUtilTest {

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", "0123456789abcdef0123456789abcdef");
        ReflectionTestUtils.setField(jwtUtil, "expiration", 3_600_000L);
        ReflectionTestUtils.setField(jwtUtil, "refreshExpiration", 86_400_000L);
        ReflectionTestUtils.invokeMethod(jwtUtil, "validateSecret");
    }

    @Test
    void shouldGenerateAndValidateAccessToken() {
        User principal = new User(
                "customer@test.com",
                "pwd",
                List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER"))
        );
        var auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());

        String token = jwtUtil.generateToken(auth);

        assertThat(token).isNotBlank();
        assertThat(jwtUtil.extractUsername(token)).isEqualTo("customer@test.com");
        assertThat(jwtUtil.validateToken(token, principal)).isTrue();
    }

    @Test
    void shouldRejectShortSecretDuringValidation() {
        JwtUtil invalidUtil = new JwtUtil();
        ReflectionTestUtils.setField(invalidUtil, "secret", "short-secret");

        assertThatThrownBy(() -> ReflectionTestUtils.invokeMethod(invalidUtil, "validateSecret"))
                .hasMessageContaining("jwt.secret must be at least 32 bytes");
    }
}
