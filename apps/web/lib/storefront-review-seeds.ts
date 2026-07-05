export interface StorefrontReview {
  id: string;
  name: string;
  location: string;
  rating: number;
  text: string;
  product: string;
  helpful: number;
}

export const STOREFRONT_REVIEW_SEEDS: StorefrontReview[] = [
  {
    id: "r1",
    name: "Maria C.",
    location: "Quezon City",
    rating: 5,
    text: "Super bilis ng delivery! Packaging was neat and the quality exceeded my expectations.",
    product: "Best seller",
    helpful: 24,
  },
  {
    id: "r2",
    name: "Jake R.",
    location: "Makati",
    rating: 5,
    text: "Legit seller — responsive sa messages and exactly as described. Will order again!",
    product: "Featured item",
    helpful: 18,
  },
  {
    id: "r3",
    name: "Aira L.",
    location: "Cebu City",
    rating: 4,
    text: "Great value for money. Sana may more payment options pero overall solid experience.",
    product: "Bundle deal",
    helpful: 11,
  },
  {
    id: "r4",
    name: "Dennis P.",
    location: "Davao",
    rating: 5,
    text: "First time ordering from this shop — impressed! Smooth checkout and fast shipping.",
    product: "New arrival",
    helpful: 9,
  },
];
