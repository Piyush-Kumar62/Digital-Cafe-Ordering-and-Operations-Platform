import { Injectable } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { AuthService } from '@core/auth/auth.service';
import { Order } from '@shared/models/order.model';

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private client: Client | null = null;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private connectionStatus = new BehaviorSubject<boolean>(false);
  public connectionStatus$ = this.connectionStatus.asObservable();

  // Order notification subjects
  private orderNotifications = new BehaviorSubject<Order | null>(null);
  public orderNotifications$ = this.orderNotifications.asObservable();

  private orderStatusUpdates = new BehaviorSubject<any>(null);
  public orderStatusUpdates$ = this.orderStatusUpdates.asObservable();

  private tableAvailabilityUpdates = new BehaviorSubject<any>(null);
  public tableAvailabilityUpdates$ = this.tableAvailabilityUpdates.asObservable();
  private tableAvailabilityDestination: string | null = null;

  constructor(private authService: AuthService) {}

  connect(): void {
    if (this.client?.connected) {
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      console.error('Cannot connect to WebSocket: No authentication token');
      return;
    }

    this.client = new Client({
      webSocketFactory: () => new SockJS(environment.wsUrl),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: () => {},
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: (_frame) => {
        this.connectionStatus.next(true);
        this.setupDefaultSubscriptions();
      },
      onDisconnect: () => {
        this.connectionStatus.next(false);
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
        this.connectionStatus.next(false);
      },
    });

    this.client.activate();
  }

  disconnect(): void {
    if (this.client) {
      this.subscriptions.forEach((sub) => sub.unsubscribe());
      this.subscriptions.clear();
      this.client.deactivate();
      this.client = null;
      this.connectionStatus.next(false);
    }
  }

  isConnected(): boolean {
    return this.client?.connected || false;
  }

  private setupDefaultSubscriptions(): void {
    const user = this.authService.currentUserValue;
    if (!user) return;

    // Subscribe to user-specific notifications
    this.subscribe(`/user/queue/notifications`, (message) => {
      this.handleNotification(message);
    });
    // Backward-compatible path in case server uses explicit user-id queue naming
    this.subscribe(`/user/${user.id}/queue/notifications`, (message) => {
      this.handleNotification(message);
    });

    // Subscribe to role-based channels
    if (user.roles.includes('ROLE_CHEF') && user.cafeId) {
      this.subscribeToChefOrders(user.cafeId);
    }

    if (user.roles.includes('ROLE_WAITER') && user.cafeId) {
      this.subscribeToWaiterOrders(user.cafeId);
    }

    if (user.roles.includes('ROLE_CAFE_OWNER') && user.cafeId) {
      this.subscribeToCafeOrders(user.cafeId);
    }

    if (user.roles.includes('ROLE_CUSTOMER')) {
      this.subscribeToCustomerOrders(user.id);
    }
  }

  subscribeToChefOrders(cafeId: number): void {
    const destination = `/topic/chef/${cafeId}`;
    this.subscribe(destination, (message) => {
      this.orderNotifications.next(message);
    });
  }

  subscribeToWaiterOrders(cafeId: number): void {
    const destination = `/topic/waiter/${cafeId}`;
    this.subscribe(destination, (message) => {
      this.orderNotifications.next(message);
    });
  }

  subscribeToCafeOrders(cafeId: number): void {
    const destination = `/topic/cafe/${cafeId}`;
    this.subscribe(destination, (message) => {
      this.orderNotifications.next(message);
    });
  }

  subscribeToCustomerOrders(customerId: number): void {
    const destination = `/topic/customer/${customerId}`;
    this.subscribe(destination, (message) => {
      this.orderStatusUpdates.next(message);
      this.orderNotifications.next(message);
    });
  }

  subscribeToOrderStatus(orderId: number): void {
    const destination = `/topic/orders/${orderId}/status`;
    this.subscribe(destination, (message) => {
      this.orderStatusUpdates.next(message);
    });
  }

  subscribeToTableAvailability(cafeId: number): void {
    const destination = `/topic/cafe/${cafeId}/tables`;
    if (this.tableAvailabilityDestination && this.tableAvailabilityDestination !== destination) {
      this.unsubscribe(this.tableAvailabilityDestination);
    }
    this.tableAvailabilityDestination = destination;
    this.subscribe(destination, (message) => {
      this.tableAvailabilityUpdates.next(message);
    });
  }

  private subscribe(destination: string, callback: (payload: any) => void): void {
    if (!this.client?.connected) {
      console.error('Cannot subscribe: WebSocket not connected');
      return;
    }

    // Avoid duplicate subscriptions
    if (this.subscriptions.has(destination)) {
      return;
    }

    const subscription = this.client.subscribe(destination, (message: IMessage) => {
      try {
        const payload = JSON.parse(message.body);
        callback(payload);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    this.subscriptions.set(destination, subscription);
  }

  unsubscribe(destination: string): void {
    const subscription = this.subscriptions.get(destination);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(destination);
    }
  }

  sendMessage(destination: string, body: any): void {
    if (!this.client?.connected) {
      console.error('Cannot send message: WebSocket not connected');
      return;
    }

    this.client.publish({
      destination,
      body: JSON.stringify(body),
    });
  }

  private handleNotification(message: any): void {
    // Handle different notification types
    switch (message.type) {
      case 'NEW_ORDER':
        this.orderNotifications.next(message.payload);
        break;
      case 'ORDER_STATUS_UPDATE':
        this.orderStatusUpdates.next(message.payload);
        break;
      default:
        break;
    }
  }
}
