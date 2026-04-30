import { prisma } from '@nishabdha/database';
import { SupabaseStorageService } from '../services/supabase-storage';
import { artworkProducts, merchProducts } from './productData';
import { logger } from '../utils/logger';

interface SeedVariant {
  name: string;
  material?: string;
  size?: string;
  price: string;
  sku: string;
  stockQuantity?: number;
}

interface SeedProduct {
  id: number | string;
  name: string;
  price: string;
  category?: string;
  description?: string;
  images: string[];
  orientation?: string;
  type: string;
  slug?: string;
  variants?: SeedVariant[];
}

interface SeedResult {
  success: number;
  skipped: number;
  failed: number;
  errors: Array<{ product: string; error: string }>;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function parsePrice(priceString: string): number {
  const cleaned = priceString.replace(/₹|,|From\s*/g, '').trim();
  const parsed = parseFloat(cleaned);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid price format: "${priceString}"`);
  }
  return parsed;
}

async function seedProduct(
  product: SeedProduct,
  storageService: SupabaseStorageService
): Promise<'created' | 'skipped'> {
  const slug = product.slug || generateSlug(product.name);

  // Check if product already exists
  const existing = await prisma.product.findUnique({ where: { slug } });
  if (existing) {
    logger.info(`Skipping existing product: ${product.name}`);
    return 'skipped';
  }

  // Parse price
  const basePrice = parsePrice(product.price);

  // Download and upload images
  const imageUrls: Array<{ url: string; sortOrder: number }> = [];
  for (let i = 0; i < product.images.length; i++) {
    const sourceUrl = product.images[i];
    const filename = `image-${i}.jpg`;
    const destinationPath = `${slug}/${filename}`;

    logger.info(`Downloading image ${i + 1}/${product.images.length} for ${product.name}`);
    const publicUrl = await storageService.downloadAndUploadImage(sourceUrl, destinationPath);

    imageUrls.push({ url: publicUrl, sortOrder: i });
  }

  // Determine product type
  let productType: 'ARTWORK' | 'MERCHANDISE' | 'CREATOR_KIT' = 'ARTWORK';
  if (product.type === 'merchandise') {
    productType = 'MERCHANDISE';
  } else if (product.type === 'artwork') {
    productType = 'ARTWORK';
  } else if (product.type === 'creator_kit') {
    productType = 'CREATOR_KIT';
  }

  // Create product with images and variants
  await prisma.product.create({
    data: {
      name: product.name,
      slug,
      description: product.description || product.name,
      type: productType,
      status: 'ACTIVE',
      basePrice,
      compareAtPrice: null,
      category: product.category || null,
      tags: product.category ? [product.category] : [],
      orientation: product.orientation || null,
      trackInventory: true,
      metaTitle: product.name,
      metaDescription: product.description || product.name,
      metaKeywords: product.category ? [product.category] : [],
      images: {
        create: imageUrls.map((img) => ({
          url: img.url,
          altText: product.name,
          sortOrder: img.sortOrder,
        })),
      },
      variants: product.variants ? {
        create: product.variants.map((variant) => ({
          name: variant.name,
          sku: variant.sku,
          price: parsePrice(variant.price),
          stockQuantity: variant.stockQuantity || 0,
          material: variant.material || null,
          size: variant.size || null,
          isActive: true,
        })),
      } : undefined,
    },
  });

  logger.info(`✓ Created product: ${product.name}`);
  return 'created';
}

async function main() {
  logger.info('Starting product seed...');

  const storageService = new SupabaseStorageService();
  await storageService.ensureBucketExists();

  const allProducts: SeedProduct[] = [
    ...artworkProducts,
    ...merchProducts,
  ];

  const result: SeedResult = {
    success: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  for (const product of allProducts) {
    try {
      const status = await seedProduct(product, storageService);
      if (status === 'created') {
        result.success++;
      } else {
        result.skipped++;
      }
    } catch (error) {
      result.failed++;
      result.errors.push({
        product: product.name,
        error: error instanceof Error ? error.message : String(error),
      });
      logger.error(`Failed to seed ${product.name}:`, error);
    }
  }

  // Summary
  logger.info('\n===== Seed Summary =====');
  logger.info(`Total products processed: ${allProducts.length}`);
  logger.info(`Successfully created: ${result.success}`);
  logger.info(`Skipped (duplicates): ${result.skipped}`);
  logger.info(`Failed: ${result.failed}`);

  if (result.errors.length > 0) {
    logger.error('\nErrors:');
    result.errors.forEach((err) => {
      logger.error(`  - ${err.product}: ${err.error}`);
    });
  }

  await prisma.$disconnect();

  process.exit(result.failed > 0 && result.success === 0 ? 1 : 0);
}

main().catch((error) => {
  logger.error('Seed script failed:', error);
  process.exit(1);
});
