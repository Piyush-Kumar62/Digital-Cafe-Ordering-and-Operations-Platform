package com.digitalcafe.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Entity representing user roles in the system.
 * Supports ADMIN, CAFE_OWNER, CHEF, WAITER, and CUSTOMER roles.
 */
@Entity
@Table(name = "roles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "name", nullable = false, unique = true, length = 20)
    private RoleName name;

    @Column(name = "description")
    private String description;

    public enum RoleName {
        ADMIN,
        CAFE_OWNER,
        CHEF,
        WAITER,
        CUSTOMER
    }
}
