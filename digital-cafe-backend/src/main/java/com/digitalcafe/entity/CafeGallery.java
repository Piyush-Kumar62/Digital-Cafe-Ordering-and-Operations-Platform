package com.digitalcafe.entity;

import com.digitalcafe.entity.Cafe;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "cafe_gallery")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CafeGallery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String imageUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cafe_id")
    private Cafe cafe;
}