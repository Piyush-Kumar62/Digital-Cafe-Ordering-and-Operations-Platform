import { Cafe, PublicCafeCard } from "@shared/models/cafe.model";

interface FeaturedCafeSeed {
  id: number;
  name: string;
  description: string;
  city: string;
  state: string;
  rating: number;
  openingTime: string;
  closingTime: string;
  imageUrl: string;
  address: string;
  phoneNumber: string;
  pincode: string;
  landmark: string;
  fssaiNumber: string;
}

// 6 Indian flagship cafes — same data used on landing page, owner dashboard & customer browse
export const FEATURED_CAFE_SEED: FeaturedCafeSeed[] = [
  {
    id: 1,
    name: "Brew & Bloom",
    description:
      "Artisan single-origin coffee, fresh croissants, and a lush garden seating area.",
    city: "Mumbai",
    state: "Maharashtra",
    rating: 4.8,
    openingTime: "07:00 AM",
    closingTime: "10:00 PM",
    imageUrl:
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=500&fit=crop&auto=format",
    address: "14, Bandra West, Linking Road",
    phoneNumber: "9876543210",
    pincode: "400050",
    landmark: "Near Taj Lands End",
    fssaiNumber: "10018011002253",
  },
  {
    id: 2,
    name: "The Chai Chronicles",
    description:
      "A love letter to Indian spiced teas, filter coffee, and regional breakfast plates.",
    city: "Bengaluru",
    state: "Karnataka",
    rating: 4.7,
    openingTime: "06:30 AM",
    closingTime: "09:30 PM",
    imageUrl:
      "https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=800&h=500&fit=crop&auto=format",
    address: "23, Indiranagar 100 Feet Road",
    phoneNumber: "9812345678",
    pincode: "560038",
    landmark: "Near Metro Station",
    fssaiNumber: "10018011002254",
  },
  {
    id: 3,
    name: "Roast & Relish",
    description:
      "Specialty dark roasts, avocado toasts, and minimalist industrial interiors.",
    city: "Delhi",
    state: "Delhi",
    rating: 4.9,
    openingTime: "07:30 AM",
    closingTime: "11:00 PM",
    imageUrl:
      "https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=500&fit=crop&auto=format",
    address: "45, Khan Market",
    phoneNumber: "9701234567",
    pincode: "110003",
    landmark: "Near Khan Market Metro",
    fssaiNumber: "10018011002255",
  },
  {
    id: 4,
    name: "Saffron Sip",
    description:
      "Traditional chai blends, kesar milk, and fusion desserts with heritage décor.",
    city: "Jaipur",
    state: "Rajasthan",
    rating: 4.6,
    openingTime: "08:00 AM",
    closingTime: "09:00 PM",
    imageUrl:
      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=500&fit=crop&auto=format",
    address: "7, MI Road, Statue Circle",
    phoneNumber: "9654321098",
    pincode: "302001",
    landmark: "Near Albert Hall",
    fssaiNumber: "10018011002256",
  },
  {
    id: 5,
    name: "The Monsoon Mug",
    description:
      "Rain-inspired interiors, coastal snacks, and fresh cold-pressed juices all day.",
    city: "Pune",
    state: "Maharashtra",
    rating: 4.5,
    openingTime: "07:00 AM",
    closingTime: "10:00 PM",
    imageUrl:
      "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800&h=500&fit=crop&auto=format",
    address: "12, Koregaon Park Lane 5",
    phoneNumber: "9543210987",
    pincode: "411001",
    landmark: "Near Osho Ashram",
    fssaiNumber: "10018011002257",
  },
  {
    id: 6,
    name: "Nilgiri Nest",
    description:
      "Blue Mountain espresso, homemade banana bread, and panoramic terrace dining.",
    city: "Chennai",
    state: "Tamil Nadu",
    rating: 4.8,
    openingTime: "06:00 AM",
    closingTime: "09:00 PM",
    imageUrl:
      "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&h=500&fit=crop&auto=format",
    address: "88, Anna Salai, Nungambakkam",
    phoneNumber: "9432109876",
    pincode: "600006",
    landmark: "Near Spencer Plaza",
    fssaiNumber: "10018011002258",
  },
];

export function buildLandingFallbackCafes(): Cafe[] {
  return FEATURED_CAFE_SEED.map((cafe) => ({
    id: cafe.id,
    name: cafe.name,
    description: cafe.description,
    city: cafe.city,
    state: cafe.state,
    rating: cafe.rating,
    openingTime: cafe.openingTime,
    closingTime: cafe.closingTime,
    imageUrl: cafe.imageUrl,
    address: cafe.address,
    zipCode: cafe.pincode,
    phoneNumber: cafe.phoneNumber,
    email: "",
    isActive: true,
    ownerId: 0,
    createdAt: "",
  }));
}

export function buildPublicFallbackCafes(): PublicCafeCard[] {
  return FEATURED_CAFE_SEED.map((cafe) => ({
    id: cafe.id,
    name: cafe.name,
    description: cafe.description,
    location: `${cafe.city}, ${cafe.state}`,
    openTime: cafe.openingTime,
    closeTime: cafe.closingTime,
    rating: cafe.rating,
    imageUrl: cafe.imageUrl,
  }));
}

/** Seed data as CreateCafeRequest payloads — used by owner to pre-fill forms */
export function getFeaturedCafeSeedData() {
  return FEATURED_CAFE_SEED;
}
