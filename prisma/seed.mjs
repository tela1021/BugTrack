import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const password = process.env.SEED_ADMIN_PASSWORD;

if (!password || password.length < 12) {
    throw new Error('SEED_ADMIN_PASSWORD must be set and be at least 12 characters long.');
}

const statuses = [
    { name: 'Backlog', type: 'BACKLOG', position: 0 },
    { name: 'Todo', type: 'TODO', position: 1 },
    { name: 'In Progress', type: 'IN_PROGRESS', position: 2 },
    { name: 'In Review', type: 'IN_PROGRESS', position: 3 },
    { name: 'Done', type: 'DONE', position: 4 },
    { name: 'Canceled', type: 'CANCELED', position: 5 },
];

async function main() {
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@bugzero.local' },
        update: { name: 'Local Administrator', role: 'ADMIN', hashedPassword },
        create: { email: 'admin@bugzero.local', name: 'Local Administrator', role: 'ADMIN', hashedPassword },
    });
    const member = await prisma.user.upsert({
        where: { email: 'member@bugzero.local' },
        update: { name: 'Local Member', role: 'MEMBER', hashedPassword },
        create: { email: 'member@bugzero.local', name: 'Local Member', role: 'MEMBER', hashedPassword },
    });
    const team = await prisma.team.upsert({
        where: { key: 'BUG' },
        update: { name: 'Core Engineering', description: 'Local development team' },
        create: { key: 'BUG', name: 'Core Engineering', description: 'Local development team' },
    });

    await Promise.all([
        prisma.teamMember.upsert({
            where: { userId_teamId: { userId: admin.id, teamId: team.id } },
            update: { role: 'OWNER' },
            create: { userId: admin.id, teamId: team.id, role: 'OWNER' },
        }),
        prisma.teamMember.upsert({
            where: { userId_teamId: { userId: member.id, teamId: team.id } },
            update: { role: 'MEMBER' },
            create: { userId: member.id, teamId: team.id, role: 'MEMBER' },
        }),
        ...statuses.map((status) => prisma.workflowStatus.upsert({
            where: { teamId_name: { teamId: team.id, name: status.name } },
            update: { type: status.type, position: status.position },
            create: { ...status, teamId: team.id },
        })),
    ]);
}

main()
    .finally(async () => prisma.$disconnect());
