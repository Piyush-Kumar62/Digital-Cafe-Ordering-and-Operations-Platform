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

  constructor(private authService: AuthService) {}

  connect(): void {
    if (this.client?.connected) {
      console.log('WebSocket already connected');
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
      debug: (str) => {
        console.log('STOMP Debug:', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: (_frame) => {
        console.log('WebSocket connected');
        this.connectionStatus.next(true);
        this.setupDefaultSubscriptions();
      },
      onDisconnect: () => {
        console.log('WebSocket disconnected');
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
      console.log('WebSocket disconnected');
    }
  }

  isConnected(): boolean {
    return this.client?.connected || false;
  }

  private setupDefaultSubscriptions(): void {
    const user = this.authService.currentUserValue;
    if (!user) return;

    // Subscribe to user-specific notifications
    this.subscribe(`/user/${user.id}/queue/notifications`, (message) => {
      console.log('User notification:', message);
      this.handleNotification(message);
    });

    // Subscribe to role-based channels
    if (user.roles.includes('ROLE_CHEF')) {
      this.subscribeToChefOrders(user.cafeId!);
    }

    if (user.roles.includes('ROLE_WAITER')) {
      this.subscribeToWaiterOrders(user.cafeId!);
    }

    if (user.roles.includes('ROLE_CAFE_OWNER')) {
      this.subscribeToCafeOrders(user.cafeId!);
    }
  }

  subscribeToChefOrders(cafeId: number): void {
    const destination = `/topic/orders/cafe/${cafeId}/chef`;
    this.subscribe(destination, (message) => {
      console.log('Chef order update:', message);
      this.orderNotifications.next(message);
    });
  }

  subscribeToWaiterOrders(cafeId: number): void {
    const destination = `/topic/orders/cafe/${cafeId}/waiter`;
    this.subscribe(destination, (message) => {
      console.log('Waiter order update:', message);
      this.orderNotifications.next(message);
    });
  }

  subscribeToCafeOrders(cafeId: number): void {
    const destination = `/topic/orders/cafe/${cafeId}`;
    this.subscribe(destination, (message) => {
      console.log('Cafe order update:', message);
      this.orderNotifications.next(message);
    });
  }

  subscribeToOrderStatus(orderId: number): void {
    const destination = `/topic/orders/${orderId}/status`;
    this.subscribe(destination, (message) => {
      console.log('Order status update:', message);
      this.orderStatusUpdates.next(message);
    });
  }

  private subscribe(destination: string, callback: (payload: any) => void): void {
    if (!this.client?.connected) {
      console.error('Cannot subscribe: WebSocket not connected');
      return;
    }

    // Avoid duplicate subscriptions
    if (this.subscriptions.has(destination)) {
      console.log('Already subscribed to:', destination);
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
    console.log('Subscribed to:', destination);
  }

  unsubscribe(destination: string): void {
    const subscription = this.subscriptions.get(destination);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(destination);
      console.log('Unsubscribed from:', destination);
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
        console.log('Unknown notification type:', message.type);
    }
  }
}
