package com.digitalcafe.config.filter;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

class RateLimitFilterTest {

    @Test
    void shouldReturn429WhenRateLimitExceeded() throws Exception {
        RateLimitFilter filter = new RateLimitFilter();
        ReflectionTestUtils.setField(filter, "enabled", true);
        ReflectionTestUtils.setField(filter, "capacity", 1);
        ReflectionTestUtils.setField(filter, "refillPerMinute", 1);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/customer/orders");
        request.addHeader("X-Forwarded-For", "10.0.0.1");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);
        verify(chain).doFilter(request, response);

        MockHttpServletResponse secondResponse = new MockHttpServletResponse();
        filter.doFilter(request, secondResponse, chain);

        assertThat(secondResponse.getStatus()).isEqualTo(429);
        verify(chain, never()).doFilter(request, secondResponse);
    }

    @Test
    void shouldSkipWhitelistedPaths() throws Exception {
        RateLimitFilter filter = new RateLimitFilter();
        ReflectionTestUtils.setField(filter, "enabled", true);
        ReflectionTestUtils.setField(filter, "capacity", 1);
        ReflectionTestUtils.setField(filter, "refillPerMinute", 1);

        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/payments/webhook/razorpay");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
    }
}
