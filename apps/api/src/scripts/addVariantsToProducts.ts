import { prisma } from '@nishabdha/database';

async function addVariantsToProducts() {
  console.log('🔍 Finding products without variants...');

  const productsWithoutVariants = await prisma.product.findMany({
    where: {
      variants: {
        none: {}
      }
    },
    include: {
      variants: true
    }
  });

  console.log(`Found ${productsWithoutVariants.length} products without variants`);

  for (const product of productsWithoutVariants) {
    console.log(`\n📦 Adding variants to: ${product.name}`);

    if (product.type === 'ARTWORK') {
      // Artwork products - add size-based variants
      const artworkVariants = [
        {
          name: 'Small (12x18)',
          sku: `${product.slug}-sm-unfr`.toUpperCase(),
          price: product.basePrice,
          stockQuantity: 10,
          size: '12x18',
          material: 'Wood Wool Board',
          frame: 'Unframed',
          isActive: true
        },
        {
          name: 'Medium (18x24)',
          sku: `${product.slug}-md-unfr`.toUpperCase(),
          price: (parseFloat(product.basePrice) * 1.5).toFixed(0),
          stockQuantity: 8,
          size: '18x24',
          material: 'Wood Wool Board',
          frame: 'Unframed',
          isActive: true
        },
        {
          name: 'Large (24x36)',
          sku: `${product.slug}-lg-fr`.toUpperCase(),
          price: (parseFloat(product.basePrice) * 2).toFixed(0),
          stockQuantity: 5,
          size: '24x36',
          material: 'PET Board',
          frame: 'Framed',
          isActive: true
        }
      ];

      for (const variant of artworkVariants) {
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            ...variant
          }
        });
        console.log(`  ✅ Added variant: ${variant.name}`);
      }
    } else if (product.type === 'MERCHANDISE') {
      // Merchandise products - add size-based variants for clothing
      const merchVariants = [
        {
          name: 'S',
          sku: `${product.slug}-s`.toUpperCase(),
          price: product.basePrice,
          stockQuantity: 15,
          size: 'S',
          isActive: true
        },
        {
          name: 'M',
          sku: `${product.slug}-m`.toUpperCase(),
          price: product.basePrice,
          stockQuantity: 20,
          size: 'M',
          isActive: true
        },
        {
          name: 'L',
          sku: `${product.slug}-l`.toUpperCase(),
          price: product.basePrice,
          stockQuantity: 20,
          size: 'L',
          isActive: true
        },
        {
          name: 'XL',
          sku: `${product.slug}-xl`.toUpperCase(),
          price: product.basePrice,
          stockQuantity: 15,
          size: 'XL',
          isActive: true
        },
        {
          name: 'XXL',
          sku: `${product.slug}-xxl`.toUpperCase(),
          price: product.basePrice,
          stockQuantity: 10,
          size: 'XXL',
          isActive: true
        }
      ];

      for (const variant of merchVariants) {
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            ...variant
          }
        });
        console.log(`  ✅ Added variant: ${variant.name}`);
      }
    }
  }

  console.log('\n✅ Done! All products now have variants.');

  // Show summary
  const totalProducts = await prisma.product.count();
  const productsWithVariants = await prisma.product.count({
    where: {
      variants: {
        some: {}
      }
    }
  });

  console.log(`\n📊 Summary:`);
  console.log(`   Total products: ${totalProducts}`);
  console.log(`   Products with variants: ${productsWithVariants}`);
  console.log(`   Products without variants: ${totalProducts - productsWithVariants}`);
}

addVariantsToProducts()
  .then(() => {
    console.log('\n🎉 Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
