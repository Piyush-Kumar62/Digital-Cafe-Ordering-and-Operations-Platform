import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Cart, CartItem } from '@shared/models/cart.model';
import { MenuItem } from '@shared/models/menu.model';
import { ApiService } from '@core/services/api.service';
import { Order, OrderRequest } from '@shared/models/order.model';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private static readonly STORAGE_PREFIX = 'digital_cafe_cart_v1';
  private activeStorageKey = '';
  private cartSubject = new BehaviorSubject<Cart>({ items: [], totalItems: 0, totalPrice: 0 });
  cart$: Observable<Cart> = this.cartSubject.asObservable();

  constructor(private apiService: ApiService) {
    this.ensureCartForCurrentUser(true);
  }

  addItem(item: MenuItem): void {
    this.ensureCartForCurrentUser();
    this.ensureSingleCafeCart(item.cafeId);
    const currentCart = this.cartSubject.getValue();
    const existingItem = currentCart.items.find(i => i.item.id === item.id);

    let newItems: CartItem[];

    if (existingItem) {
      newItems = currentCart.items.map(i =>
        i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
      );
    } else {
      newItems = [...currentCart.items, { item: item, quantity: 1 }];
    }

    this.updateCart(newItems);
  }

  removeItem(itemId: number): void {
    this.ensureCartForCurrentUser();
    const currentCart = this.cartSubject.getValue();
    const newItems = currentCart.items.map(i => {
      if (i.item.id === itemId) {
        return { ...i, quantity: i.quantity - 1 };
      }
      return i;
    }).filter(i => i.quantity > 0);

    this.updateCart(newItems);
  }

  updateQuantity(itemId: number, quantity: number): void {
    this.ensureCartForCurrentUser();
    const safeQuantity = Math.max(0, Math.floor(quantity));
    const currentCart = this.cartSubject.getValue();
    const newItems = currentCart.items
      .map((i) => {
        if (i.item.id !== itemId) {
          return i;
        }
        return { ...i, quantity: safeQuantity };
      })
      .filter((i) => i.quantity > 0);
    this.updateCart(newItems);
  }

  getTotal(): number {
    this.ensureCartForCurrentUser();
    return this.cartSubject.getValue().totalPrice;
  }

  clearCart(): void {
    this.ensureCartForCurrentUser();
    this.updateCart([]);
  }

  placeOrder(orderRequest: Omit<OrderRequest, 'items'>): Observable<Order> {
    this.ensureCartForCurrentUser();
    const currentCart = this.cartSubject.getValue();
    if (currentCart.items.length === 0) {
      throw new Error('Cart is empty');
    }

    const fullOrderRequest: OrderRequest = {
      ...orderRequest,
      items: currentCart.items.map(cartItem => ({
        menuItemId: cartItem.item.id,
        quantity: cartItem.quantity,
        specialInstructions: ''
      }))
    };

    return this.apiService.createOrder(fullOrderRequest);
  }

  private updateCart(items: CartItem[]): void {
    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
    const totalPrice = items.reduce((sum, i) => sum + (i.item.price * i.quantity), 0);
    const nextCart = { items, totalItems, totalPrice };
    this.cartSubject.next(nextCart);
    this.persistCart(nextCart);
  }

  /**
   * Ensures current cart belongs to one cafe.
   * If user switches cafe, stale items from previous cafe are cleared.
   */
  ensureCafeScope(cafeId: number): void {
    this.ensureCartForCurrentUser();
    this.ensureSingleCafeCart(cafeId);
  }

  private ensureCartForCurrentUser(force: boolean = false): void {
    const key = this.getStorageKey();
    if (!force && key === this.activeStorageKey) {
      return;
    }
    this.activeStorageKey = key;
    this.restoreCartFromStorage(key);
  }

  private getStorageKey(): string {
    const userDataRaw = localStorage.getItem(environment.userKey || 'cafe_user_data');
    let userId = 'guest';

    if (userDataRaw) {
      try {
        const parsed = JSON.parse(userDataRaw);
        if (parsed?.id !== undefined && parsed?.id !== null) {
          userId = String(parsed.id);
        }
      } catch {
        userId = 'guest';
      }
    }

    return `${CartService.STORAGE_PREFIX}_${userId}`;
  }

  private restoreCartFromStorage(storageKey: string): void {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      this.cartSubject.next({ items: [], totalItems: 0, totalPrice: 0 });
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Cart | null;
      const items = (parsed?.items || [])
        .filter((entry: any) => entry?.item && Number(entry?.quantity) > 0)
        .map((entry: any) => ({
          item: entry.item as MenuItem,
          quantity: Math.max(1, Math.floor(Number(entry.quantity) || 1)),
        }));
      const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
      const totalPrice = items.reduce((sum, i) => sum + (i.item.price * i.quantity), 0);
      this.cartSubject.next({ items, totalItems, totalPrice });
    } catch {
      this.cartSubject.next({ items: [], totalItems: 0, totalPrice: 0 });
      localStorage.removeItem(storageKey);
    }
  }

  private persistCart(cart: Cart): void {
    if (!this.activeStorageKey) {
      return;
    }
    localStorage.setItem(this.activeStorageKey, JSON.stringify(cart));
  }

  private ensureSingleCafeCart(cafeId?: number): void {
    if (!cafeId) {
      return;
    }
    const current = this.cartSubject.getValue();
    const firstCafeId = current.items[0]?.item?.cafeId;
    if (firstCafeId && firstCafeId !== cafeId) {
      this.updateCart([]);
    }
  }
}
