export interface Cafe {
  id: number;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  email: string;
  imageUrl?: string;
  rating: number;
  openingTime: string;
  closingTime: string;
  isActive: boolean;
  ownerId: number;
  ownerName?: string;
  createdAt: string;
}

export interface CreateCafeRequest {
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  email: string;
  openingTime: string;
  closingTime: string;
}

export interface Table {
  id: number;
  tableNumber: string;
  capacity: number;
  isAvailable: boolean;
  cafeId: number;
  cafeName?: string;
}

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
  preparationTime: number;
  cafeId: number;
  cafeName?: string;
  createdAt: string;
}

export interface MenuItemRequest {
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
  preparationTime: number;
}

export enum MenuCategory {
  APPETIZER = 'APPETIZER',
  MAIN_COURSE = 'MAIN_COURSE',
  DESSERT = 'DESSERT',
  BEVERAGE = 'BEVERAGE',
  SNACK = 'SNACK',
}
