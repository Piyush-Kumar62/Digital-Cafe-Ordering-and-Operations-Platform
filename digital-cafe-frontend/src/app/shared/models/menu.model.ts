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
  MOCKTAIL = 'MOCKTAIL',
  SHAKE = 'SHAKE',
  FRAPPE = 'FRAPPE',
  HOT_CHOCOLATE = 'HOT_CHOCOLATE',
  BAKERY = 'BAKERY',
  PASTRY = 'PASTRY',
  CAKE_SLICE = 'CAKE_SLICE',
  ICE_CREAM = 'ICE_CREAM',
  WAFFLE = 'WAFFLE',
  PANCAKE = 'PANCAKE',
  NOODLES = 'NOODLES',
  RICE_BOWL = 'RICE_BOWL',
  BIRYANI = 'BIRYANI',
  SEAFOOD = 'SEAFOOD',
  STEAK = 'STEAK',
  GRILL = 'GRILL',
  WRAP = 'WRAP',
  ROLLS = 'ROLLS',
  MEXICAN = 'MEXICAN',
  ITALIAN = 'ITALIAN',
  CHINESE = 'CHINESE',
  THAI = 'THAI',
  INDIAN = 'INDIAN',
  KOREAN = 'KOREAN',
  JAPANESE = 'JAPANESE',
  MEDITERRANEAN = 'MEDITERRANEAN',
  VEGAN = 'VEGAN',
  GLUTEN_FREE = 'GLUTEN_FREE',
  KETO = 'KETO',
  KIDS_MEAL = 'KIDS_MEAL',
  COMBO_MEAL = 'COMBO_MEAL',
  SEASONAL_SPECIAL = 'SEASONAL_SPECIAL',
  CHEF_SPECIAL = 'CHEF_SPECIAL',
  OTHER = 'OTHER',
}
