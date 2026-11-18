export type MarketplaceItem = { id: string; title: string; price: number; location: string; category: string; condition: string; image: string; description: string; seller: string; posted: string };

export const categories = [
  { slug: "vehicles", label: "Vehicles" }, { slug: "property-rentals", label: "Property rentals" },
  { slug: "apparel", label: "Apparel" }, { slug: "electronics", label: "Electronics" },
  { slug: "home-garden", label: "Home & garden" }, { slug: "hobbies", label: "Hobbies" },
  { slug: "classifieds", label: "Classifieds" },
];

export const marketplaceItems: MarketplaceItem[] = [
  { id: "iphone-15-pro", title: "iPhone 15 Pro 256GB", price: 48500, location: "Makati City", category: "electronics", condition: "Like new", image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1000&q=85", description: "Natural titanium iPhone 15 Pro in excellent condition. Complete with box, cable, and a clear case. Battery health is 96%.", seller: "Alex M.", posted: "Listed 2 hours ago" },
  { id: "vintage-chair", title: "Mid-century lounge chair", price: 6800, location: "Quezon City", category: "home-garden", condition: "Good", image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1000&q=85", description: "Comfortable walnut lounge chair with newly cleaned upholstery. A few small marks consistent with age.", seller: "Mia R.", posted: "Listed yesterday" },
  { id: "road-bike", title: "Lightweight road bike", price: 22000, location: "Pasig City", category: "hobbies", condition: "Good", image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1000&q=85", description: "Well-maintained aluminum road bike, size medium. Recently tuned and ready to ride.", seller: "Paolo D.", posted: "Listed 3 days ago" },
  { id: "camera", title: "Mirrorless camera kit", price: 34500, location: "Taguig City", category: "electronics", condition: "Like new", image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=85", description: "Compact mirrorless camera with kit lens, two batteries, charger, and padded camera bag.", seller: "Sam C.", posted: "Listed 5 hours ago" },
  { id: "sneakers", title: "Classic white sneakers", price: 2400, location: "Mandaluyong", category: "apparel", condition: "New", image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1000&q=85", description: "Brand-new leather sneakers, size 9. Never worn outside and includes the original box.", seller: "Jamie L.", posted: "Listed today" },
  { id: "coffee-table", title: "Solid oak coffee table", price: 5200, location: "San Juan City", category: "home-garden", condition: "Good", image: "https://images.unsplash.com/photo-1532372320572-cda25653a694?auto=format&fit=crop&w=1000&q=85", description: "Solid oak coffee table with a warm natural finish. Sturdy, clean, and fits compact living rooms.", seller: "Bea T.", posted: "Listed yesterday" },
  { id: "headphones", title: "Noise-cancelling headphones", price: 9500, location: "Manila", category: "electronics", condition: "Like new", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=85", description: "Wireless over-ear headphones with excellent battery life. Includes hard case and charging cable.", seller: "Chris V.", posted: "Listed 4 hours ago" },
  { id: "apartment", title: "Sunny studio apartment", price: 18000, location: "BGC, Taguig", category: "property-rentals", condition: "For rent", image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=85", description: "Furnished studio with natural light, building amenities, and easy access to shops and offices.", seller: "North Properties", posted: "Listed today" },
  { id: "scooter", title: "City commuter scooter", price: 42500, location: "Marikina City", category: "vehicles", condition: "Used", image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1000&q=85", description: "Reliable commuter scooter with updated registration and recent oil change. Available for viewing.", seller: "Ron B.", posted: "Listed 2 days ago" },
  { id: "guitar", title: "Acoustic guitar with case", price: 7500, location: "Parañaque City", category: "hobbies", condition: "Good", image: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=1000&q=85", description: "Warm-sounding acoustic guitar, ideal for beginners and casual players. Soft case included.", seller: "Nico G.", posted: "Listed 6 hours ago" },
];

export const formatPrice = (price: number) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(price);
export const getItem = (id: string) => marketplaceItems.find((item) => item.id === id);
export const getCategory = (slug: string) => categories.find((category) => category.slug === slug);
