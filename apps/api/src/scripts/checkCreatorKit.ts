import { prisma } from '@nishabdha/database';

async function main() {
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { slug: { contains: 'creator' } },
        { name: { contains: 'Creator' } },
      ],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
    },
  });

  console.log('Products matching "creator":', JSON.stringify(products, null, 2));

  await prisma.$disconnect();
}

main();
