import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Clean existing data
  await prisma.post.deleteMany()
  await prisma.account.deleteMany()
  await prisma.session.deleteMany()
  await prisma.user.deleteMany()

  // Create demo users
  const alice = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      name: 'Alice Johnson',
      emailVerified: new Date(),
      posts: {
        create: [
          {
            title: 'Getting Started with Next.js 15',
            content: 'Next.js 15 brings exciting new features including...',
            published: true,
          },
          {
            title: 'React Server Components Deep Dive',
            content: 'Server Components are a game changer for React applications...',
            published: true,
          },
          {
            title: 'Draft: Optimizing Database Queries',
            content: 'This is a work in progress...',
            published: false,
          },
        ],
      },
    },
  })

  const bob = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      name: 'Bob Smith',
      emailVerified: new Date(),
      posts: {
        create: [
          {
            title: 'Understanding Server Actions',
            content: 'Server Actions in Next.js allow you to...',
            published: true,
          },
        ],
      },
    },
  })

  console.log('Database seeded successfully!')
  console.log({ alice, bob })
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })