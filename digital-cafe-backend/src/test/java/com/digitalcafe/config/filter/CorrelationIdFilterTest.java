package com.digitalcafe.config.filter;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class CorrelationIdFilterTest {

    private final CorrelationIdFilter filter = new CorrelationIdFilter();

    @AfterEach
    void clearMdc() {
        MDC.clear();
    }

    @Test
    void shouldUseProvidedCorrelationIdHeader() throws Exception {
        String id = UUID.randomUUID().toString();
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/public/health");
        request.addHeader(CorrelationIdFilter.CORRELATION_ID_HEADER, id);
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        assertThat(response.getHeader(CorrelationIdFilter.CORRELATION_ID_HEADER)).isEqualTo(id);
        verify(chain).doFilter(request, response);
    }

    @Test
    void shouldGenerateCorrelationIdWhenMissing() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/public/health");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        String correlationHeader = response.getHeader(CorrelationIdFilter.CORRELATION_ID_HEADER);
        String requestHeader = response.getHeader(CorrelationIdFilter.REQUEST_ID_HEADER);
        assertThat(correlationHeader).isNull();
        assertThat(requestHeader).isNotBlank();
        verify(chain).doFilter(request, response);
    }
}
