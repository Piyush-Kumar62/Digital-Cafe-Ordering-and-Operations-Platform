import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Cart, CartItem } from '@shared/models/cart.model';
import { MenuItem } from '@shared/models/menu.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { Order, OrderRequest } from '@shared/models/order.model';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartSubject = new BehaviorSubject<Cart>({ items: [], totalItems: 0, totalPrice: 0 });
  cart$: Observable<Cart> = this.cartSubject.asObservable();

  private apiUrl = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) { }

  addItem(item: MenuItem): void {
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
    return this.cartSubject.getValue().totalPrice;
  }

  clearCart(): void {
    this.updateCart([]);
  }

  placeOrder(orderRequest: Omit<OrderRequest, 'items'>): Observable<Order> {
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

    return this.http
      .post<{ data?: Order }>(this.apiUrl, fullOrderRequest)
      .pipe(map((res) => res?.data as Order));
  }

  private updateCart(items: CartItem[]): void {
    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
    const totalPrice = items.reduce((sum, i) => sum + (i.item.price * i.quantity), 0);
    this.cartSubject.next({ items, totalItems, totalPrice });
  }
}
