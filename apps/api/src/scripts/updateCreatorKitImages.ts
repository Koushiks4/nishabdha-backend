import { prisma } from '@nishabdha/database';
import { logger } from '../utils/logger';

async function main() {
  logger.info('Updating Creator Kit images...');

  const creatorKit = await prisma.product.findUnique({
    where: { slug: 'creator-kit' },
    include: { images: true },
  });

  if (!creatorKit) {
    logger.error('Creator Kit not found!');
    process.exit(1);
  }

  logger.info(`Found Creator Kit with ${creatorKit.images.length} images`);

  // Delete all existing images
  await prisma.productImage.deleteMany({
    where: { productId: creatorKit.id },
  });

  // Create new working images
  const newImages = [
    {
      url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&auto=format&fit=crop',
      altText: 'Creator Kit - Acoustic Panels Setup',
      sortOrder: 0,
    },
    {
      url: 'https://images.unsplash.com/photo-1525362081669-2b476bb628c3?w=800&auto=format&fit=crop',
      altText: 'Creator Kit - Studio Environment',
      sortOrder: 1,
    },
  ];

  for (const img of newImages) {
    await prisma.productImage.create({
      data: {
        productId: creatorKit.id,
        ...img,
      },
    });
    logger.info(`✓ Created image: ${img.altText}`);
  }

  logger.info(`\n✅ Updated Creator Kit with ${newImages.length} working images`);

  await prisma.$disconnect();
}

main().catch((error) => {
  logger.error('Script failed:', error);
  process.exit(1);
});
