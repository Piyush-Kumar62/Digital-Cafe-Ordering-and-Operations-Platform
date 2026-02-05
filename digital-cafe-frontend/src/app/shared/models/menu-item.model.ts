export interface MenuItem {
  id?: number;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  available: boolean;
  cafeId: number;
  categoryId: number;
  category?: Category;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id?: number;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}
