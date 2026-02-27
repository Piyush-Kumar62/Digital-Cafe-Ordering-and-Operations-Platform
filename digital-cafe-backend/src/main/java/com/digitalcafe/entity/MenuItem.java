package com.digitalcafe.entity;

import jakarta.persistence.*;
import lombok.experimental.SuperBuilder;
import lombok.*;

import java.math.BigDecimal;

/**
 * Menu item entity representing food/beverage offerings in a cafe.
 * Includes pricing, availability, and categorization.
 */
@Entity
@Table(name = "menu_items", indexes = {
        @Index(name = "idx_cafe_menu", columnList = "cafe_id"),
        @Index(name = "idx_category", columnList = "category")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class MenuItem extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cafe_id", nullable = false)
    private Cafe cafe;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "price", nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 50)
    private Category category;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "is_available", nullable = false)
    @Builder.Default
    private Boolean isAvailable = true;

    @Column(name = "is_vegetarian", nullable = false)
    @Builder.Default
    private Boolean isVegetarian = false;

    @Column(name = "is_vegan", nullable = false)
    @Builder.Default
    private Boolean isVegan = false;

    @Column(name = "preparation_time_minutes")
    private Integer preparationTimeMinutes;

    @Column(name = "calories")
    private Integer calories;

    @Column(name = "allergen_info", length = 200)
    private String allergenInfo;

    public enum Category {
        APPETIZER,
        MAIN_COURSE,
        DESSERT,
        BEVERAGE,
        COFFEE,
        TEA,
        JUICE,
        SMOOTHIE,
        SANDWICH,
        BURGER,
        PIZZA,
        PASTA,
        SALAD,
        SOUP,
        BREAKFAST,
        SNACKS,
        OTHER
    }
}
