export type Product = {
  id: string
  name: string
  price: number
  originalPrice?: number
  image: string
  category: string
  rating: number
  reviews: number
  sold: number
  badge?: string
}

export const categories = [
  { id: "all", label: "All", emoji: "✨" },
  { id: "fashion", label: "Fashion" },
  { id: "beauty", label: "Beauty" },
  { id: "tech", label: "Tech" },
  { id: "home", label: "Home" },
  { id: "fitness", label: "Fitness" },
  { id: "accessories", label: "Accessories" },
] as const

export const products: Product[] = [
  {
    id: "sneakers",
    name: "Coral Runner Sneakers",
    price: 3599,
    originalPrice: 5499,
    image: "/products/sneakers.png",
    category: "fashion",
    rating: 4.9,
    reviews: 1284,
    sold: 5200,
    badge: "Deal",
  },
  {
    id: "headphones",
    name: "Cloud Wireless Headphones",
    price: 4499,
    originalPrice: 7299,
    image: "/products/headphones.png",
    category: "tech",
    rating: 4.8,
    reviews: 942,
    sold: 3100,
    badge: "Deal",
  },
  {
    id: "skincare",
    name: "Glow Ritual Skincare Set",
    price: 2399,
    originalPrice: 3399,
    image: "/products/skincare.png",
    category: "beauty",
    rating: 4.9,
    reviews: 2033,
    sold: 8700,
    badge: "Bestseller",
  },
  {
    id: "sunglasses",
    name: "Retro Tortoise Sunglasses",
    price: 1599,
    originalPrice: 2499,
    image: "/products/sunglasses.png",
    category: "accessories",
    rating: 4.7,
    reviews: 512,
    sold: 1900,
  },
  {
    id: "watch",
    name: "Minimal Leather Watch",
    price: 4999,
    image: "/products/watch.png",
    category: "accessories",
    rating: 4.8,
    reviews: 678,
    sold: 2400,
    badge: "New",
  },
  {
    id: "backpack",
    name: "Everyday Canvas Backpack",
    price: 2999,
    image: "/products/backpack.png",
    category: "fashion",
    rating: 4.6,
    reviews: 331,
    sold: 1200,
    badge: "New",
  },
  {
    id: "mug",
    name: "Terracotta Ceramic Mug",
    price: 999,
    image: "/products/mug.png",
    category: "home",
    rating: 4.9,
    reviews: 890,
    sold: 4100,
    badge: "New",
  },
  {
    id: "lamp",
    name: "Soft Glow Table Lamp",
    price: 2599,
    originalPrice: 3899,
    image: "/products/lamp.png",
    category: "home",
    rating: 4.7,
    reviews: 214,
    sold: 760,
    badge: "Deal",
  },
  {
    id: "serum",
    name: "Vitamin C Radiance Serum",
    price: 1399,
    originalPrice: 2199,
    image: "/products/serum.png",
    category: "beauty",
    rating: 4.9,
    reviews: 3120,
    sold: 12400,
    badge: "Bestseller",
  },
]

export const featured = products.filter((p) =>
  ["skincare", "headphones", "sneakers"].includes(p.id),
)
export const deals = products.filter((p) => p.badge === "Deal")
export const newArrivals = products.filter((p) => p.badge === "New")
export const popular = [...products].sort((a, b) => b.sold - a.sold).slice(0, 6)

export type Review = {
  id: string
  name: string
  handle: string
  platform: "Facebook" | "Instagram" | "TikTok"
  rating: number
  text: string
  product: string
}

export const reviews: Review[] = [
  {
    id: "r1",
    name: "Maya Torres",
    handle: "@mayalovesglow",
    platform: "Instagram",
    rating: 5,
    text: "Ordered the Glow set straight from their live stream and it arrived in 2 days. The one-tap checkout is unreal — no more DMs to place an order!",
    product: "Glow Ritual Skincare Set",
  },
  {
    id: "r2",
    name: "Jerome Aquino",
    handle: "@jeromebuys",
    platform: "Facebook",
    rating: 5,
    text: "Bought the sneakers during a flash deal. Paid with GCash, tracked everything in Messenger. Smoothest social buy I've done.",
    product: "Coral Runner Sneakers",
  },
  {
    id: "r3",
    name: "Kai Nakamura",
    handle: "@kaidaily",
    platform: "TikTok",
    rating: 5,
    text: "The live selling is addictive. Host answered my question in real time and I checked out without leaving the stream. 10/10.",
    product: "Cloud Wireless Headphones",
  },
  {
    id: "r4",
    name: "Bea Santos",
    handle: "@beafinds",
    platform: "Instagram",
    rating: 4,
    text: "Cutest little shop. The serum sold out fast but restock alerts hit my Messenger instantly. Customer service is so fast.",
    product: "Vitamin C Radiance Serum",
  },
]

export function formatPrice(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
  }).format(value)
}
