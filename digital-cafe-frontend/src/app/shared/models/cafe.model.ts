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

export interface PublicCafeCard {
  id: number;
  name: string;
  location: string;
  description: string;
  openTime: string;
  closeTime: string;
  rating: number;
  imageUrl?: string;
}

export interface PublicCafeMenuItem {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  imageUrl?: string;
  available: boolean;
}

export interface PublicCafeDetail {
  cafeDetails: PublicCafeCard;
  menuItems: PublicCafeMenuItem[];
}
