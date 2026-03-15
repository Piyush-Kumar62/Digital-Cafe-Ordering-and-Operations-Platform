package com.digitalcafe.config;

import com.digitalcafe.mapper.BookingMapper;
import com.digitalcafe.mapper.CafeMapper;
import com.digitalcafe.mapper.MenuItemMapper;
import com.digitalcafe.mapper.OrderMapper;
import com.digitalcafe.mapper.PaymentMapper;
import com.digitalcafe.mapper.ProfileMapper;
import com.digitalcafe.mapper.TableMapper;
import com.digitalcafe.mapper.UserMapper;
import org.mapstruct.factory.Mappers;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Fallback MapStruct beans for environments where annotation processing
 * or component scanning doesn't register mapper implementations.
 */
@Configuration
public class MapStructFallbackConfig {

    @Bean
    @ConditionalOnMissingBean(BookingMapper.class)
    public BookingMapper bookingMapper() {
        return Mappers.getMapper(BookingMapper.class);
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
