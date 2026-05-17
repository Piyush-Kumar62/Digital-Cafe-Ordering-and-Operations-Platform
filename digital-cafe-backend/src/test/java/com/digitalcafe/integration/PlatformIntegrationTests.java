package com.digitalcafe.integration;

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

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.digitalcafe.dto.request.BookingRequest;
import com.digitalcafe.entity.Booking;
import com.digitalcafe.entity.Cafe;
import com.digitalcafe.entity.CafeTable;
import com.digitalcafe.entity.Order;
import com.digitalcafe.entity.User;
import com.digitalcafe.exception.BookingConflictException;
import com.digitalcafe.repository.UserRepository;
import com.digitalcafe.service.BookingService;
import com.digitalcafe.service.OrderService;
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PlatformIntegrationTests {
    private static final String TEST_CSRF_TOKEN = "test-csrf-token";


    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private BookingService bookingService;

    @MockitoBean
    private OrderService orderService;

    @MockitoBean
    private UserRepository userRepository;

    @Test
    @WithMockUser(username = "customer@test.com", roles = "CUSTOMER")
    void bookingOverlapShouldReturnConflict() throws Exception {
        User customer = User.builder().id(10L).email("customer@test.com").isEmailVerified(true).isProfileComplete(true).build();
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
                        .cookie(new Cookie("XSRF-TOKEN", TEST_CSRF_TOKEN))
                        .header("X-XSRF-TOKEN", TEST_CSRF_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    @WithMockUser(username = "customer@test.com", roles = "CUSTOMER")
    void customerCannotAccessOtherCustomerOrders() throws Exception {
        User customer = User.builder().id(10L).email("customer@test.com").isEmailVerified(true).isProfileComplete(true).build();
        when(userRepository.findByEmail("customer@test.com")).thenReturn(Optional.of(customer));
        when(orderService.getOrderById(99L))
                .thenThrow(new com.digitalcafe.exception.AccessDeniedException("You are not allowed to view this order"));

        mockMvc.perform(get("/api/orders/99"))
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

        mockMvc.perform(put("/api/chef/order/1/ready")
                        .cookie(new Cookie("XSRF-TOKEN", TEST_CSRF_TOKEN))
                        .header("X-XSRF-TOKEN", TEST_CSRF_TOKEN))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "waiter@test.com", roles = "WAITER")
    void waiterCannotMarkServedWithoutReady() throws Exception {
        User waiter = User.builder()
                .id(30L)
                .email("waiter@test.com")
                .isEmailVerified(true)
                .isProfileComplete(true)
                .cafe(Cafe.builder().id(5L).build())
                .build();

        Order order = Order.builder()
                .id(1L)
                .cafe(Cafe.builder().id(5L).build())
                .booking(Booking.builder().table(CafeTable.builder().id(1L).build()).build())
                .build();

        when(userRepository.findByEmail("waiter@test.com")).thenReturn(Optional.of(waiter));
        when(orderService.getOrderEntity(1L)).thenReturn(order);
        when(orderService.updateOrderStatus(anyLong(), any()))
                .thenThrow(new com.digitalcafe.exception.AccessDeniedException("Waiter can only move READY orders to SERVED"));

        mockMvc.perform(put("/api/waiter/order/1/served")
                        .cookie(new Cookie("XSRF-TOKEN", TEST_CSRF_TOKEN))
                        .header("X-XSRF-TOKEN", TEST_CSRF_TOKEN))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "chef@test.com", roles = "CHEF")
    void unpaidOrderShouldNotBeVisibleToChefQueue() throws Exception {
        User chef = User.builder()
                .id(22L)
                .email("chef@test.com")
                .isEmailVerified(true)
                .isProfileComplete(true)
                .cafe(com.digitalcafe.entity.Cafe.builder().id(5L).build())
                .build();
        when(userRepository.findByEmail("chef@test.com")).thenReturn(Optional.of(chef));
        // Controller fetches both PLACED (new) and PREPARING (in-progress) orders
        when(orderService.getOrdersByStatus(5L, com.digitalcafe.entity.Order.OrderStatus.PLACED)).thenReturn(List.of());
        when(orderService.getOrdersByStatus(5L, com.digitalcafe.entity.Order.OrderStatus.PREPARING)).thenReturn(List.of());

        mockMvc.perform(get("/api/chef/orders"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(0));

        verify(orderService).getOrdersByStatus(5L, com.digitalcafe.entity.Order.OrderStatus.PLACED);
        verify(orderService).getOrdersByStatus(5L, com.digitalcafe.entity.Order.OrderStatus.PREPARING);
        verifyNoMoreInteractions(orderService);
    }
}

