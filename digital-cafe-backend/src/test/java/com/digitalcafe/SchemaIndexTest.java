package com.digitalcafe;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.EnabledIfDockerAvailable;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
@EnabledIfDockerAvailable
@SpringBootTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class SchemaIndexTest {

    @Container
    private static final PostgreSQLContainer<?> POSTGRES =
            new PostgreSQLContainer<>("postgres:16")
                    .withDatabaseName("digital_cafe_db")
                    .withUsername("test")
                    .withPassword("test");

    @DynamicPropertySource
    static void overrideProps(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "update");
        registry.add("app.data.init.enabled", () -> "false");
    }

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void requiredIndexesExist() {
        // user_id indexes
        assertThat(indexExists("profiles", "user_id")).isTrue();
        assertThat(indexExists("notifications", "user_id")).isTrue();

        // cafe_id indexes
        assertThat(indexExists("bookings", "cafe_id")).isTrue();
        assertThat(indexExists("orders", "cafe_id")).isTrue();

        // booking_id indexes
        assertThat(indexExists("orders", "booking_id")).isTrue();
        assertThat(indexExists("notifications", "booking_id")).isTrue();

        // order_id indexes
        assertThat(indexExists("order_items", "order_id")).isTrue();
        assertThat(indexExists("payments", "order_id")).isTrue();
        assertThat(indexExists("order_status_history", "order_id")).isTrue();
        assertThat(indexExists("notifications", "order_id")).isTrue();
    }

    private boolean indexExists(String table, String column) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM pg_indexes
                WHERE schemaname = 'public'
                  AND tablename = ?
                  AND indexdef ILIKE '%' || ? || '%'
                """,
                Integer.class,
                table,
                column
        );
        return count != null && count > 0;
    }
}
