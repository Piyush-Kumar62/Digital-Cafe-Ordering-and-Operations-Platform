package com.digitalcafe.integration;

import com.digitalcafe.dto.request.BookingRequest;
import com.digitalcafe.dto.response.BookingResponse;
import com.digitalcafe.dto.response.OrderResponse;
import com.digitalcafe.dto.response.PageResponse;
import com.digitalcafe.entity.Booking;
import com.digitalcafe.entity.User;
import com.digitalcafe.exception.BookingConflictException;
import com.digitalcafe.repository.UserRepository;
import com.digitalcafe.service.BookingService;
import com.digitalcafe.service.OrderService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PlatformIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private BookingService bookingService;

    @MockBean
    private OrderService orderService;

    @MockBean
    private UserRepository userRepository;

    @Test
    @WithMockUser(username = "customer@test.com", roles = "CUSTOMER")
    void bookingOverlapShouldReturnConflict() throws Exception {
        User customer = User.builder().id(10L).email("customer@test.com").build();
        when(userRepository.findByEmail("customer@test.com")).thenReturn(Optional.of(customer));
        when(bookingService.createBooking(anyLong(), any(BookingRequest.class)))
                .thenThrow(new BookingConflictException("Table is already booked for this time slot"));

        BookingRequest request = BookingRequest.builder()
                .cafeId(1L)
                .tableId(2L)
                .bookingDate(LocalDate.now().plusDays(1))
                .bookingTime(LocalTime.of(12, 0))
                .numberOfGuests(2)
                .build();

        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    @WithMockUser(username = "customer@test.com", roles = "CUSTOMER")
    void customerCannotAccessOtherCustomerOrders() throws Exception {
        User customer = User.builder().id(10L).email("customer@test.com").build();
        when(userRepository.findByEmail("customer@test.com")).thenReturn(Optional.of(customer));

        mockMvc.perform(get("/api/orders/customer/99"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "owner@test.com", roles = "CAFE_OWNER")
    void cafeOwnerCannotAccessOtherCafeData() throws Exception {
        when(orderService.getOrdersByCafeId(anyLong(), any()))
                .thenThrow(new com.digitalcafe.exception.AccessDeniedException("You are not allowed to access another cafe's order data"));

        mockMvc.perform(get("/api/orders/cafe/999"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "chef@test.com", roles = "CHEF")
    void chefCannotMarkReadyWithoutPreparing() throws Exception {
        when(orderService.updateOrderStatus(anyLong(), any()))
                .thenThrow(new com.digitalcafe.exception.AccessDeniedException("Chef can only move PREPARING orders to READY"));

        mockMvc.perform(put("/api/chef/order/1/ready"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "waiter@test.com", roles = "WAITER")
    void waiterCannotMarkServedWithoutReady() throws Exception {
        when(orderService.updateOrderStatus(anyLong(), any()))
                .thenThrow(new com.digitalcafe.exception.AccessDeniedException("Waiter can only move READY orders to SERVED"));

        mockMvc.perform(put("/api/waiter/order/1/served"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "chef@test.com", roles = "CHEF")
    void unpaidOrderShouldNotBeVisibleToChefQueue() throws Exception {
        User chef = User.builder()
                .id(22L)
                .email("chef@test.com")
                .cafe(com.digitalcafe.entity.Cafe.builder().id(5L).build())
                .build();
        when(userRepository.findByEmail("chef@test.com")).thenReturn(Optional.of(chef));
        when(orderService.getOrdersByStatus(5L, com.digitalcafe.entity.Order.OrderStatus.PREPARING)).thenReturn(List.of());

        mockMvc.perform(get("/api/chef/orders"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(0));

        verify(orderService).getOrdersByStatus(5L, com.digitalcafe.entity.Order.OrderStatus.PREPARING);
        verifyNoMoreInteractions(orderService);
    }
}
