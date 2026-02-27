package com.digitalcafe.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_preferences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "theme", nullable = false, length = 20)
    @Builder.Default
    private Theme theme = Theme.LIGHT;

    @Column(name = "auto_refresh_seconds", nullable = false)
    @Builder.Default
    private Integer autoRefreshSeconds = 15;

    @Column(name = "admin_notifications_enabled", nullable = false)
    @Builder.Default
    private Boolean adminNotificationsEnabled = true;

    public enum Theme {
        LIGHT,
        DARK
    }
}
