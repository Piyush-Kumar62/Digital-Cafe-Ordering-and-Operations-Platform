package com.digitalcafe.websocket;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RealtimeNotification {
    private String type;
    private String title;
    private String message;
    private String severity;
    private String entityType;
    private Long entityId;
    private LocalDateTime timestamp;
}
