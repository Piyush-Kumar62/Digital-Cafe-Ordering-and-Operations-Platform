import { Injectable } from "@angular/core";
import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { BehaviorSubject, filter, Observable } from "rxjs";
import { environment } from "@environments/environment";
import { AuthService } from "@core/auth/auth.service";
import { Order } from "@shared/models/order.model";

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: string;
}

@Injectable({
  providedIn: "root",
})
export class WebSocketService {
  private client: Client | null = null;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private destinationCallbacks: Map<string, Array<(payload: any) => void>> =
    new Map();
  private destinationStreams: Map<string, BehaviorSubject<any | null>> =
    new Map();
  private defaultSubscriptionsInitialized = false;
  private connectionStatus = new BehaviorSubject<boolean>(false);
  public connectionStatus$ = this.connectionStatus.asObservable();

  private orderNotifications = new BehaviorSubject<Order | null>(null);
  public orderNotifications$ = this.orderNotifications.asObservable();

  private orderStatusUpdates = new BehaviorSubject<any>(null);
  public orderStatusUpdates$ = this.orderStatusUpdates.asObservable();

  private tableAvailabilityUpdates = new BehaviorSubject<any>(null);
  public tableAvailabilityUpdates$ =
    this.tableAvailabilityUpdates.asObservable();
  private tableAvailabilityDestination: string | null = null;
  private notificationsStore = new BehaviorSubject<WebSocketMessage[]>([]);
  public notifications$ = this.notificationsStore.asObservable();

  constructor(private authService: AuthService) {}

  connect(): void {
    if (this.client?.connected) {
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
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
      onConnect: () => {
        this.connectionStatus.next(true);
        this.setupDefaultSubscriptions();
        this.resubscribeDynamicDestinations();
      },
      onDisconnect: () => {
        this.connectionStatus.next(false);
      },
      onStompError: (frame) => {
        this.connectionStatus.next(false);
      },
    });

    this.client.activate();
  }

  disconnect(): void {
    if (this.client) {
      this.subscriptions.forEach((sub) => sub.unsubscribe());
      this.subscriptions.clear();
      this.destinationCallbacks.clear();
      this.destinationStreams.forEach((stream) => stream.complete());
      this.destinationStreams.clear();
      this.defaultSubscriptionsInitialized = false;
      this.client.deactivate();
      this.client = null;
      this.connectionStatus.next(false);
    }
  }

  isConnected(): boolean {
    return this.client?.connected || false;
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
    if (
      this.tableAvailabilityDestination &&
      this.tableAvailabilityDestination !== destination
    ) {
      this.unsubscribe(this.tableAvailabilityDestination);
    }
    this.tableAvailabilityDestination = destination;
    this.subscribe(destination, (message) => {
      this.tableAvailabilityUpdates.next(message);
    });
  }

  watchDestination<T>(destination: string): Observable<T> {
    let stream = this.destinationStreams.get(destination);
    if (!stream) {
      stream = new BehaviorSubject<T | null>(null);
      this.destinationStreams.set(destination, stream);
      this.subscribe(destination, (payload: T) => stream?.next(payload));
    }

    if (!this.isConnected()) {
      this.connect();
    }

    return stream
      .asObservable()
      .pipe(filter((value): value is T => value !== null));
  }

  unsubscribe(destination: string): void {
    const subscription = this.subscriptions.get(destination);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(destination);
    }
    this.destinationCallbacks.delete(destination);

    const stream = this.destinationStreams.get(destination);
    if (stream) {
      stream.complete();
      this.destinationStreams.delete(destination);
    }
  }

  sendMessage(destination: string, body: any): void {
    if (!this.client?.connected) {
      return;
    }

    this.client.publish({
      destination,
      body: JSON.stringify(body),
    });
  }

  private setupDefaultSubscriptions(): void {
    if (this.defaultSubscriptionsInitialized) {
      return;
    }

    const user = this.authService.currentUserValue;
    if (!user) return;

    this.subscribe("/user/queue/notifications", (message) =>
      this.handleNotification(message),
    );
    this.subscribe(`/user/${user.id}/queue/notifications`, (message) =>
      this.handleNotification(message),
    );

    if (user.roles.includes("ROLE_CHEF") && user.cafeId) {
      this.subscribeToChefOrders(user.cafeId);
    }

    if (user.roles.includes("ROLE_WAITER") && user.cafeId) {
      this.subscribeToWaiterOrders(user.cafeId);
    }

    if (user.roles.includes("ROLE_CAFE_OWNER") && user.cafeId) {
      this.subscribeToCafeOrders(user.cafeId);
    }

    if (user.roles.includes("ROLE_CUSTOMER")) {
      this.subscribeToCustomerOrders(user.id);
    }

    if (user.roles.includes("ROLE_ADMIN")) {
      this.subscribe("/topic/admin/orders", (message) =>
        this.handleNotification(message),
      );
    }

    this.defaultSubscriptionsInitialized = true;
  }

  private subscribe(
    destination: string,
    callback: (payload: any) => void,
  ): void {
    const callbacks = this.destinationCallbacks.get(destination) || [];
    this.destinationCallbacks.set(destination, [...callbacks, callback]);

    if (!this.client?.connected || this.subscriptions.has(destination)) {
      return;
    }

    const subscription = this.client.subscribe(
      destination,
      (message: IMessage) => {
        try {
          const payload = JSON.parse(message.body);
          const destinationCallbacks =
            this.destinationCallbacks.get(destination) || [];
          destinationCallbacks.forEach((cb) => cb(payload));
        } catch {
          // Silently discard malformed WebSocket messages
        }
      },
    );

    this.subscriptions.set(destination, subscription);
  }

  private handleNotification(message: any): void {
    const payload = message?.payload ?? message;
    const type = message?.type ?? payload?.type ?? "NOTIFICATION";
    const timestamp =
      message?.timestamp ?? payload?.timestamp ?? new Date().toISOString();

    const current = this.notificationsStore.getValue();
    // Cap in-memory notifications at 50 to avoid unbounded memory growth
    this.notificationsStore.next(
      [
        {
          type,
          payload,
          timestamp,
        },
        ...current,
      ].slice(0, 50),
    );

    const orderTypes = new Set([
      "NEW_ORDER",
      "PREPARING",
      "READY",
      "SERVED",
      "CANCELLED",
      "ORDER_PLACED",
      "ORDER_PREPARING",
      "ORDER_READY",
      "ORDER_SERVED",
      "ORDER_CANCELLED",
      "ORDER_CONFIRMED",
      "PAYMENT_CAPTURED",
      "ORDER_STATUS_UPDATE",
    ]);

    if (orderTypes.has(type) || !!payload?.status || !!payload?.orderId) {
      this.orderNotifications.next(payload);
      this.orderStatusUpdates.next(payload);
    }
  }

  private resubscribeDynamicDestinations(): void {
    Array.from(this.destinationCallbacks.keys()).forEach((destination) => {
      if (this.subscriptions.has(destination) || !this.client?.connected) {
        return;
      }

      const subscription = this.client.subscribe(
        destination,
        (message: IMessage) => {
          try {
            const payload = JSON.parse(message.body);
            const callbacks = this.destinationCallbacks.get(destination) || [];
            callbacks.forEach((cb) => cb(payload));
          } catch {
            // Silently discard malformed WebSocket messages
          }
        },
      );

      this.subscriptions.set(destination, subscription);
    });
  }
}
