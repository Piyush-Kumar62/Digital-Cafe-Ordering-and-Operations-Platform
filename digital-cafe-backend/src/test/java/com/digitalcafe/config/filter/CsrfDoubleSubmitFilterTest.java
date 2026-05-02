package com.digitalcafe.config.filter;

import com.digitalcafe.security.CookieUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class CsrfDoubleSubmitFilterTest {

    @Test
    void shouldAllowUnsafeRequestWhenCsrfMatches() throws Exception {
        CsrfDoubleSubmitFilter filter = new CsrfDoubleSubmitFilter();
        ReflectionTestUtils.setField(filter, "csrfEnabled", true);
        ReflectionTestUtils.setField(filter, "csrfHeaderName", "X-XSRF-TOKEN");

        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/customer/orders");
        request.setCookies(new Cookie(CookieUtil.CSRF_TOKEN_COOKIE, "abc-123"));
        request.addHeader("X-XSRF-TOKEN", "abc-123");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
    }

    @Test
    void shouldRejectUnsafeRequestWhenCsrfMissing() throws Exception {
        CsrfDoubleSubmitFilter filter = new CsrfDoubleSubmitFilter();
        ReflectionTestUtils.setField(filter, "csrfEnabled", true);
        ReflectionTestUtils.setField(filter, "csrfHeaderName", "X-XSRF-TOKEN");

        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/customer/orders");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(403);
    }
}

