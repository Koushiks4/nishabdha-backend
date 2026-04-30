import { prisma } from './client';

async function main() {
  console.log('🌱 Starting database seed...');

  // Create collections
  const minimalCollection = await prisma.collection.upsert({
    where: { slug: 'minimal' },
    update: {},
    create: {
      name: 'Minimal',
      slug: 'minimal',
      description: 'Clean and minimalistic acoustic art',
      isActive: true,
      sortOrder: 1,
    },
  });

  const abstractCollection = await prisma.collection.upsert({
    where: { slug: 'abstract' },
    update: {},
    create: {
      name: 'Abstract',
      slug: 'abstract',
      description: 'Modern abstract acoustic designs',
      isActive: true,
      sortOrder: 2,
    },
  });

  console.log('✅ Created collections:', { minimalCollection, abstractCollection });

  // Create sample product
  const sampleProduct = await prisma.product.upsert({
    where: { slug: 'minimalist-waves' },
    update: {},
    create: {
      name: 'Minimalist Waves',
      slug: 'minimalist-waves',
      description: 'A beautiful minimalist acoustic panel with wave patterns',
      type: 'ARTWORK',
      status: 'ACTIVE',
      basePrice: 2999,
      collectionId: minimalCollection.id,
      category: 'Wall Art',
      tags: ['acoustic', 'minimal', 'waves'],
      orientation: 'landscape',
      trackInventory: true,
      metaTitle: 'Minimalist Waves Acoustic Panel',
      metaDescription: 'Premium acoustic panel with minimalist wave design',
      metaKeywords: ['acoustic panel', 'wall art', 'minimal'],
    },
  });

  console.log('✅ Created sample product:', sampleProduct);

  // Create product variants
  const smallVariant = await prisma.productVariant.upsert({
    where: { sku: 'MIN-WAVES-SM-UNFR' },
    update: {},
    create: {
      productId: sampleProduct.id,
      name: 'Small (Unframed)',
      sku: 'MIN-WAVES-SM-UNFR',
      price: 2999,
      stockQuantity: 10,
      lowStockThreshold: 3,
      size: '18x24',
      material: 'Wood Wool Board',
      frame: 'Unframed',
      isActive: true,
    },
  });

  const mediumVariant = await prisma.productVariant.upsert({
    where: { sku: 'MIN-WAVES-MD-FR' },
    update: {},
    create: {
      productId: sampleProduct.id,
      name: 'Medium (Framed)',
      sku: 'MIN-WAVES-MD-FR',
      price: 4999,
      stockQuantity: 5,
      lowStockThreshold: 2,
      size: '24x36',
      material: 'PET Board',
      frame: 'Framed',
      isActive: true,
    },
  });

  console.log('✅ Created product variants:', { smallVariant, mediumVariant });

  // Create studio spaces
  const podcastStudio = await prisma.studioSpace.upsert({
    where: { slug: 'podcast-studio' },
    update: {},
    create: {
      name: 'Podcast Studio',
      slug: 'podcast-studio',
      description: 'Professional podcast recording studio with acoustic treatment',
      features: ['Professional Microphones', 'Multi-camera Setup', 'Acoustic Panels', 'Green Screen Option'],
      isActive: true,
    },
  });

  console.log('✅ Created studio space:', podcastStudio);

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
