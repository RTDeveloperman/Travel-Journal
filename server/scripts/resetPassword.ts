import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const username = 'user1';
    try {
        const user = await prisma.user.findUnique({
            where: { username },
        });

        if (!user) {
            console.log(`User '${username}' not found.`);
            return;
        }

        await prisma.user.update({
            where: { username },
            data: { password: '' },
        });

        console.log(`Password for user '${username}' has been deleted (set to empty string).`);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
