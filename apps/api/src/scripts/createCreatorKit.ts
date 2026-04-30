import { prisma } from '@nishabdha/database';
import { logger } from '../utils/logger';

async function main() {
  logger.info('Creating Creator Kit product with variants...');

  // Check if it already exists
  const existing = await prisma.product.findUnique({
    where: { slug: 'creator-kit' },
  });

  if (existing) {
    logger.info('Creator Kit already exists, deleting it first...');
    await prisma.product.delete({ where: { id: existing.id } });
  }

  // Create the Creator Kit product
  const creatorKit = await prisma.product.create({
    data: {
      name: 'Creator Kit',
      slug: 'creator-kit',
      description: 'A curated acoustic setup designed for creators who value both sound and aesthetics. Built using premium sound-absorbing materials, this kit enhances clarity while maintaining Nishabdha\'s minimal visual language.',
      type: 'CREATOR_KIT',
      status: 'ACTIVE',
      basePrice: 35000,
      compareAtPrice: null,
      category: 'Professional',
      tags: ['Professional', 'Acoustic', 'Creator'],
      orientation: null,
      trackInventory: true,
      metaTitle: 'Creator Kit - Professional Acoustic Setup',
      metaDescription: 'A curated acoustic setup designed for creators who value both sound and aesthetics.',
      metaKeywords: ['creator kit', 'acoustic panels', 'sound absorption', 'studio setup'],
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=2070&auto=format&fit=crop',
            altText: 'Creator Kit - Acoustic Panels Setup',
            sortOrder: 0,
          },
          {
            url: 'https://images.unsplash.com/photo-1525362081669-2b476bb628c3?q=80&w=1974&auto=format&fit=crop',
            altText: 'Creator Kit - Studio Environment',
            sortOrder: 1,
          },
          {
            url: 'https://images.unsplash.com/photo-1589903308914-2310512f5394?q=80&w=2070&auto=format&fit=crop',
            altText: 'Creator Kit - Detail View',
            sortOrder: 2,
          },
          {
            url: 'https://images.unsplash.com/photo-1473315910421-507d99629a8a?q=80&w=2144&auto=format&fit=crop',
            altText: 'Creator Kit - Installation',
            sortOrder: 3,
          },
        ],
      },
      variants: {
        create: [
          {
            name: 'Wood Wool Board',
            sku: 'CK-WWB-001',
            price: 35000,
            stockQuantity: 10,
            material: 'Wood Wool Board',
            isActive: true,
          },
          {
            name: 'PET Board',
            sku: 'CK-PET-001',
            price: 38000,
            stockQuantity: 8,
            material: 'PET Board',
            isActive: true,
          },
        ],
      },
    },
    include: {
      images: true,
      variants: true,
    },
  });

  logger.info(`✓ Created Creator Kit product: ${creatorKit.id}`);
  logger.info(`✓ Images: ${creatorKit.images.length}`);
  logger.info(`✓ Variants:`);
  creatorKit.variants.forEach((v) => {
    logger.info(`  - ${v.name} (${v.material}): ₹${v.price} - Stock: ${v.stockQuantity}`);
  });

  logger.info('\n✅ Creator Kit created successfully!');

  await prisma.$disconnect();
}

main().catch((error) => {
  logger.error('Script failed:', error);
  process.exit(1);
});
