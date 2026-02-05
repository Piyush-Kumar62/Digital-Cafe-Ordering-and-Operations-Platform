export interface Cafe {
  id?: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  description?: string;
  openingTime: string;
  closingTime: string;
  rating?: number;
  ownerId: number;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CafeTable {
  id?: number;
  cafeId: number;
  tableNumber: number;
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
  location?: string;
}
