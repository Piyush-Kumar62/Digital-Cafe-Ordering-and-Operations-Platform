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
