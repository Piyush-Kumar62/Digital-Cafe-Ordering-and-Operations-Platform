package com.digitalcafe.repository;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers(disabledWithoutDocker = true)
@SpringBootTest
@ActiveProfiles("test")
class MySqlSchemaContainerTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16")
            .withDatabaseName("digital_cafe_schema_test")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create");
        registry.add("spring.jpa.database-platform", () -> "org.hibernate.dialect.PostgreSQLDialect");
    }

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void shouldCreateExpectedPaymentIndexes() {
        List<String> indexes = jdbcTemplate.queryForList(
                """
                SELECT DISTINCT indexname
                FROM pg_indexes
                WHERE schemaname = 'public'
                  AND tablename = 'payments'
                """,
                String.class
        );

        assertThat(indexes)
                .contains("idx_payment_status", "idx_order_payment", "idx_transaction_id");
    }

    @Test
    void shouldCreateForeignKeyFromPaymentsToOrders() {
        Long fkCount = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM information_schema.key_column_usage
                WHERE table_schema = 'public'
                  AND table_name = 'payments'
                  AND column_name = 'order_id'
                  AND referenced_table_name = 'orders'
                """,
                Long.class
        );

        assertThat(fkCount).isNotNull();
        assertThat(fkCount).isGreaterThan(0L);
    }
}
