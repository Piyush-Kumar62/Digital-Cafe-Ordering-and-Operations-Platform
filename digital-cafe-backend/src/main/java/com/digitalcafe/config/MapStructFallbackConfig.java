package com.digitalcafe.config;

import com.digitalcafe.dto.request.BookingRequest;
import com.digitalcafe.dto.response.BookingResponse;
import com.digitalcafe.entity.Booking;
import com.digitalcafe.mapper.BookingMapper;
import com.digitalcafe.mapper.CafeMapper;
import com.digitalcafe.mapper.MenuItemMapper;
import com.digitalcafe.mapper.OrderMapper;
import com.digitalcafe.mapper.PaymentMapper;
import com.digitalcafe.mapper.ProfileMapper;
import com.digitalcafe.mapper.TableMapper;
import com.digitalcafe.mapper.UserMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.mapstruct.factory.Mappers;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.List;

/**
 * Fallback MapStruct beans for environments where annotation processing
 * or component scanning doesn't register mapper implementations.
 */
@Configuration
public class MapStructFallbackConfig {

    private static final Logger log = LoggerFactory.getLogger(MapStructFallbackConfig.class);

    @Bean
    @ConditionalOnMissingBean(BookingMapper.class)
    public BookingMapper bookingMapper() {
        try {
            return Mappers.getMapper(BookingMapper.class);
        } catch (RuntimeException ex) {
            log.warn("MapStruct BookingMapper instantiation failed; using safe manual fallback mapper", ex);
            return new BookingMapper() {
                @Override
                public BookingResponse toResponse(Booking booking) {
                    if (booking == null) {
                        return null;
                    }

                    return BookingResponse.builder()
                            .id(booking.getId())
                            .bookingNumber(booking.getBookingNumber())
                            .customerId(booking.getCustomer() != null ? booking.getCustomer().getId() : null)
                            .customerName(getCustomerName(booking))
                            .customerEmail(booking.getCustomer() != null ? booking.getCustomer().getEmail() : null)
                            .cafeId(booking.getCafe() != null ? booking.getCafe().getId() : null)
                            .cafeName(booking.getCafe() != null ? booking.getCafe().getName() : null)
                            .tableId(booking.getTable() != null ? booking.getTable().getId() : null)
                            .tableNumber(booking.getTable() != null ? booking.getTable().getTableNumber() : null)
                            .bookingDate(booking.getBookingDate())
                            .bookingTime(booking.getBookingTime())
                            .startTime(booking.getStartTimeOrFallback())
                            .endTime(booking.getEndTimeOrFallback())
                            .numberOfGuests(booking.getNumberOfGuests())
                            .status(booking.getStatus() != null ? booking.getStatus().name() : null)
                            .specialRequests(booking.getSpecialRequests())
                            .createdAt(booking.getCreatedAt())
                            .canOrder(booking.isActive())
                            .hasOrder(booking.getOrder() != null)
                            .build();
                }

                @Override
                public List<BookingResponse> toResponseList(List<Booking> bookings) {
                    if (bookings == null) {
                        return null;
                    }
                    List<BookingResponse> mapped = new ArrayList<>(bookings.size());
                    for (Booking booking : bookings) {
                        mapped.add(toResponse(booking));
                    }
                    return mapped;
                }

                @Override
                public Booking toEntity(BookingRequest request) {
                    if (request == null) {
                        return null;
                    }
                    return Booking.builder()
                            .bookingDate(request.getBookingDate())
                            .bookingTime(request.getBookingTime())
                            .numberOfGuests(request.getNumberOfGuests())
                            .specialRequests(request.getSpecialRequests())
                            .build();
                }
            };
        }
    }

    @Bean
    @ConditionalOnMissingBean(CafeMapper.class)
    public CafeMapper cafeMapper() {
        return Mappers.getMapper(CafeMapper.class);
    }

    @Bean
    @ConditionalOnMissingBean(MenuItemMapper.class)
    public MenuItemMapper menuItemMapper() {
        return Mappers.getMapper(MenuItemMapper.class);
    }

    @Bean
    @ConditionalOnMissingBean(OrderMapper.class)
    public OrderMapper orderMapper() {
        return Mappers.getMapper(OrderMapper.class);
    }

    @Bean
    @ConditionalOnMissingBean(PaymentMapper.class)
    public PaymentMapper paymentMapper() {
        return Mappers.getMapper(PaymentMapper.class);
    }

    @Bean
    @ConditionalOnMissingBean(ProfileMapper.class)
    public ProfileMapper profileMapper() {
        return Mappers.getMapper(ProfileMapper.class);
    }

    @Bean
    @ConditionalOnMissingBean(TableMapper.class)
    public TableMapper tableMapper() {
        return Mappers.getMapper(TableMapper.class);
    }

    @Bean
    @ConditionalOnMissingBean(UserMapper.class)
    public UserMapper userMapper() {
        return Mappers.getMapper(UserMapper.class);
    }
}
