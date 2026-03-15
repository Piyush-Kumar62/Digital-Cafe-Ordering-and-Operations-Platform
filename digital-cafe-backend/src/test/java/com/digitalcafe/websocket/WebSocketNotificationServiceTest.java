package com.digitalcafe.websocket;

import com.digitalcafe.entity.Role;
import com.digitalcafe.entity.User;
import com.digitalcafe.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.List;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WebSocketNotificationServiceTest {

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private WebSocketNotificationService webSocketNotificationService;

    @Test
    void shouldPublishOrderNotificationToCafeTopic() {
        OrderNotification notification = new OrderNotification();
        notification.setType(OrderNotification.NotificationType.READY);

        webSocketNotificationService.sendOrderNotification(5L, notification);

        verify(messagingTemplate).convertAndSend("/topic/cafe/5/orders", notification);
    }

    @Test
    void shouldFanoutAdminRealtimeNotifications() {
        User admin1 = User.builder().id(1L).build();
        User admin2 = User.builder().id(2L).build();
        when(userRepository.findByRoleName(Role.RoleName.ADMIN)).thenReturn(List.of(admin1, admin2));

        RealtimeNotification payload = RealtimeNotification.builder()
                .type("PLATFORM_ALERT")
                .title("Test")
                .message("Admin message")
                .build();

        webSocketNotificationService.notifyAdmins(payload);

        verify(messagingTemplate).convertAndSend("/user/1/queue/notifications", payload);
        verify(messagingTemplate).convertAndSend("/user/2/queue/notifications", payload);
    }
}
