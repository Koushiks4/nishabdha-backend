
export const artworkProducts = [
  { 
    id: 1, 
    name: "Ethereal Silence", 
    price: "₹2,999", 
    category: "Minimal", 
    images: [
      "https://picsum.photos/seed/minimal1/800/1000",
      "https://picsum.photos/seed/minimal1-alt/800/1000?grayscale",
      "https://picsum.photos/seed/minimal1-room/800/1000?blur=5"
    ], 
    orientation: "portrait",
    type: "artwork"
  },
  { 
    id: 2, 
    name: "Monolith I", 
    price: "₹3,499", 
    category: "Minimal", 
    images: [
      "https://picsum.photos/seed/minimal2/1200/800",
      "https://picsum.photos/seed/minimal2-alt/1200/800?grayscale",
      "https://picsum.photos/seed/minimal2-wall/1200/800?sepia"
    ], 
    orientation: "landscape",
    type: "artwork"
  },
  { 
    id: 3, 
    name: "Void Study", 
    price: "₹2,999", 
    category: "Abstract", 
    images: [
      "https://picsum.photos/seed/minimal3/800/1000",
      "https://picsum.photos/seed/minimal3-side/800/1000?grayscale"
    ], 
    orientation: "portrait",
    type: "artwork"
  },
  { 
    id: 4, 
    name: "Shadow Lines", 
    price: "₹3,299", 
    category: "Abstract", 
    images: ["https://picsum.photos/seed/minimal4/800/1000"],
    orientation: "portrait",
    type: "artwork"
  },
  { id: 5, name: "Zenith", price: "₹2,999", category: "Minimal", images: ["https://picsum.photos/seed/minimal5/800/1000"], orientation: "portrait", type: "artwork" },
  { 
    id: 6, 
    name: "Abstract Flow", 
    price: "₹2,999", 
    category: "Abstract", 
    images: [
      "https://picsum.photos/seed/minimal6/1200/800",
      "https://picsum.photos/seed/minimal6-alt/1200/800?grayscale"
    ], 
    orientation: "landscape",
    type: "artwork"
  },
  { id: 7, name: "Urban Calm", price: "From ₹2,999", images: ["https://picsum.photos/seed/trending3/600/800"], orientation: "portrait", category: "Minimal", type: "artwork" },
  { id: 8, name: "The Quiet", price: "From ₹2,999", images: ["https://picsum.photos/seed/trending4/600/800"], orientation: "portrait", category: "Abstract", type: "artwork" },
  { id: 9, name: "Velocity", price: "From ₹2,999", images: ["https://picsum.photos/seed/new1/600/800"], orientation: "portrait", category: "Sports", type: "artwork" },
  { id: 10, name: "Apex", price: "From ₹2,999", images: ["https://picsum.photos/seed/new2/600/800"], orientation: "portrait", category: "Abstract", type: "artwork" },
  { id: 11, name: "Inner Peace", price: "From ₹2,999", images: ["https://picsum.photos/seed/new3/1000/700"], orientation: "landscape", category: "Minimal", type: "artwork" },
  { id: 12, name: "Chaos Theory", price: "From ₹2,999", images: ["https://picsum.photos/seed/new4/600/800"], orientation: "portrait", category: "Sports", type: "artwork" },
  { id: 13, name: "Horizon", price: "From ₹2,999", images: ["https://picsum.photos/seed/h1/1200/800"], orientation: "landscape", category: "Abstract", type: "artwork" },
  { id: 14, name: "Solitude", price: "From ₹2,999", images: ["https://picsum.photos/seed/h2/600/800"], orientation: "portrait", category: "Minimal", type: "artwork" },
  { id: 15, name: "Ethereal Flow", price: "From ₹2,999", images: ["https://picsum.photos/seed/h3/1200/800"], category: "Minimal", orientation: "landscape", type: "artwork" },
  { id: 16, name: "Static Void", price: "From ₹2,999", images: ["https://picsum.photos/seed/h4/1200/800"], category: "Abstract", orientation: "landscape", type: "artwork" },
];

export const merchProducts = [
  { 
    id: "m1", 
    slug: "silence-tee",
    name: "Silence Tee", 
    price: "₹1,499", 
    category: "Minimal", 
    description: "Crafted from heavy-gauge organic cotton, the Silence Tee features a subtle screen-printed 'N' on the chest and a hidden artistic quote inside the neckline. Minimalist, breathable, and designed for clarity.",
    images: [
      "https://picsum.photos/seed/merch1/800/800?grayscale",
      "https://picsum.photos/seed/merch1-back/800/800?grayscale",
      "https://picsum.photos/seed/merch1-detail/800/800?grayscale",
      "https://picsum.photos/seed/merch1-fabric/800/800?grayscale"
    ],
    type: "merchandise"
  },
  { 
    id: "m2", 
    slug: "void-oversized",
    name: "Void Oversized", 
    price: "₹1,999", 
    category: "Oversized", 
    description: "The Void Oversized tee is defined by its architectural silhouette. A dropped shoulder and wide-cut body create a structured drape. The pitch-black fabric is deep enough to lose yourself in.",
    images: [
      "https://picsum.photos/seed/merch2/800/800?grayscale",
      "https://picsum.photos/seed/merch2-back/800/800?grayscale",
      "https://picsum.photos/seed/merch2-detail/800/800?grayscale",
      "https://picsum.photos/seed/merch2-fabric/800/800?grayscale"
    ],
    type: "merchandise"
  },
  { 
    id: "m3", 
    slug: "geometric-pulse",
    name: "Geometric Pulse", 
    price: "₹1,799", 
    category: "Graphic", 
    description: "Featuring an abstract geometric representation of sound waves, this graphic tee explores the visual relationship between frequency and silence. Printed using eco-friendly, high-density water-based inks.",
    images: [
      "https://picsum.photos/seed/merch3/800/800?grayscale",
      "https://picsum.photos/seed/merch3-back/800/800?grayscale",
      "https://picsum.photos/seed/merch3-detail/800/800?grayscale"
    ],
    type: "merchandise"
  },
  { 
    id: "m4", 
    slug: "ethereal-signature",
    name: "Ethereal Signature", 
    price: "₹1,499", 
    category: "Minimal", 
    description: "A clean, white-on-white (or black-on-black) signature piece. The Ethereal Signature uses high-density texturing to create a tactile brand mark that appears and disappears with the light.",
    images: [
      "https://picsum.photos/seed/merch4/800/800?grayscale",
      "https://picsum.photos/seed/merch4-back/800/800?grayscale",
      "https://picsum.photos/seed/merch4-detail/800/800?grayscale"
    ],
    type: "merchandise"
  },
  { 
    id: "m5", 
    slug: "abstract-monolith",
    name: "Abstract Monolith", 
    price: "₹2,199", 
    category: "Oversized", 
    description: "Inspired by the 'Monolith' art series, this oversized piece features a large-scale abstract print on the back. A wearable canvas for those who appreciate scale and shadow.",
    images: [
      "https://picsum.photos/seed/merch5/800/800?grayscale",
      "https://picsum.photos/seed/merch5-back/800/800?grayscale",
      "https://picsum.photos/seed/merch5-detail/800/800?grayscale"
    ],
    type: "merchandise"
  },
  { 
    id: "m6", 
    slug: "zenith-graphic",
    name: "Zenith Graphic", 
    price: "₹1,799", 
    category: "Graphic", 
    description: "The Zenith Graphic tee captures the point of peak creative clarity. Fine-line detailing and intricate dot-work create a visual depth usually reserved for gallery paper.",
    images: [
      "https://picsum.photos/seed/merch6/800/800?grayscale",
      "https://picsum.photos/seed/merch6-back/800/800?grayscale",
      "https://picsum.photos/seed/merch6-detail/800/800?grayscale"
    ],
    type: "merchandise"
  },
  {
    id: "ck1",
    slug: "creator-kit",
    name: "Creator Kit",
    price: "₹35,000",
    category: "Professional",
    description: "A curated acoustic setup designed for creators who value both sound and aesthetics. Built using premium sound-absorbing materials, this kit enhances clarity while maintaining Nishabdha’s minimal visual language.",
    images: [
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=2070&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1525362081669-2b476bb628c3?q=80&w=1974&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1589903308914-2310512f5394?q=80&w=2070&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1473315910421-507d99629a8a?q=80&w=2144&auto=format&fit=crop"
    ],
    type: "creator_kit",
    variants: [
      {
        name: "Wood Wool Board",
        material: "Wood Wool Board",
        price: "₹35,000",
        sku: "CK-WWB-001",
        stockQuantity: 10
      },
      {
        name: "PET Board",
        material: "PET Board",
        price: "₹38,000",
        sku: "CK-PET-001",
        stockQuantity: 8
      }
    ]
  },
];

export const allProducts = [...artworkProducts, ...merchProducts.map(p => ({ ...p, images: p.images, orientation: "portrait" as const }))];
