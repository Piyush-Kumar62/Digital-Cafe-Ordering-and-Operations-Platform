package com.digitalcafe.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Represents an image in a cafe's photo gallery.
 */
@Entity
@Table(name = "cafe_gallery", indexes = {
        @Index(name = "idx_cg_cafe_id", columnList = "cafe_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CafeGallery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cafe_id", nullable = false)
    private Cafe cafe;

    @Column(name = "image_url", nullable = false, length = 255)
    private String imageUrl;

    @Column(name = "caption", length = 200)
    private String caption;

    @Column(name = "display_order")
    @Builder.Default
    private int displayOrder = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
