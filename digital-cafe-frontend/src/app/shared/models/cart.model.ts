import { MenuItem } from "./menu.model";

export interface CartItem {
  item: MenuItem;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}
