export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
  preparationTime?: number;
  preparationTimeMinutes?: number;
  cafeId: number;
  cafeName?: string;
  createdAt?: string;
}

export interface MenuItemRequest {
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
  preparationTime?: number;
  preparationTimeMinutes?: number;
}

export enum MenuCategory {
  APPETIZER = 'APPETIZER',
  MAIN_COURSE = 'MAIN_COURSE',
  DESSERT = 'DESSERT',
  BEVERAGE = 'BEVERAGE',
  COFFEE = 'COFFEE',
  TEA = 'TEA',
  JUICE = 'JUICE',
  SMOOTHIE = 'SMOOTHIE',
  SANDWICH = 'SANDWICH',
  BURGER = 'BURGER',
  PIZZA = 'PIZZA',
  PASTA = 'PASTA',
  SALAD = 'SALAD',
  SOUP = 'SOUP',
  BREAKFAST = 'BREAKFAST',
  SNACKS = 'SNACKS',
  OTHER = 'OTHER',
}
