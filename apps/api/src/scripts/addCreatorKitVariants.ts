import { prisma } from '@nishabdha/database';
import { logger } from '../utils/logger';

async function main() {
  logger.info('Adding variants to Creator Kit...');

  // Find the Creator Kit product
  const creatorKit = await prisma.product.findUnique({
    where: { slug: 'creator-kit' },
    include: { variants: true },
  });

  if (!creatorKit) {
    logger.error('Creator Kit product not found!');
    process.exit(1);
  }

  logger.info(`Found Creator Kit: ${creatorKit.name}`);
  logger.info(`Existing variants: ${creatorKit.variants.length}`);

  // Delete existing variants if any
  if (creatorKit.variants.length > 0) {
    logger.info('Deleting existing variants...');
    await prisma.productVariant.deleteMany({
      where: { productId: creatorKit.id },
    });
  }

  // Create the two variants
  const variants = [
    {
      productId: creatorKit.id,
      name: 'Wood Wool Board',
      sku: 'CK-WWB-001',
      price: 35000,
      stockQuantity: 10,
      material: 'Wood Wool Board',
      isActive: true,
    },
    {
      productId: creatorKit.id,
      name: 'PET Board',
      sku: 'CK-PET-001',
      price: 38000,
      stockQuantity: 8,
      material: 'PET Board',
      isActive: true,
    },
  ];

  logger.info('Creating variants...');
  for (const variant of variants) {
    await prisma.productVariant.create({
      data: variant,
    });
    logger.info(`✓ Created variant: ${variant.name} - ₹${variant.price}`);
  }

  // Update product type to CREATOR_KIT
  await prisma.product.update({
    where: { id: creatorKit.id },
    data: { type: 'CREATOR_KIT' },
  });

  logger.info('✓ Updated product type to CREATOR_KIT');
  logger.info('\n✅ Creator Kit variants added successfully!');

  await prisma.$disconnect();
}

main().catch((error) => {
  logger.error('Script failed:', error);
  process.exit(1);
});
