import { PrismaClient } from '@/generated/prisma';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});

// Gracefully handle connection errors
prisma.$connect().catch((err) => {
    console.error('Failed to connect to database:', err);
});

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
