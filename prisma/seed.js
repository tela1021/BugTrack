const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // 1. Create default users
    const usersData = [
        { email: 'admin@bugzero.io', name: 'Admin Developer', role: 'ADMIN' },
        { email: 'sarah@bugzero.io', name: 'Sarah Engineer', role: 'MEMBER' },
        { email: 'mike@bugzero.io', name: 'Mike Designer', role: 'MEMBER' },
        { email: 'alex@bugzero.io', name: 'Alex Manager', role: 'ADMIN' },
    ];

    const users = [];
    for (const u of usersData) {
        const user = await prisma.user.upsert({
            where: { email: u.email },
            update: {},
            create: {
                email: u.email,
                name: u.name,
            }
        });
        users.push(user);
    }

    const user = users[0]; // Admin for reporter

    // 2. Create a default team
    const team = await prisma.team.upsert({
        where: { key: 'BUG' },
        update: {},
        create: {
            key: 'BUG',
            name: 'Core Engineering',
            description: 'The main team working on BugZero',
        }
    });

    // 3. Create workflow statuses
    const statusTypes = [
        { name: 'Backlog', type: 'BACKLOG', position: 0 },
        { name: 'Todo', type: 'TODO', position: 1 },
        { name: 'In Progress', type: 'IN_PROGRESS', position: 2 },
        { name: 'Review', type: 'IN_PROGRESS', position: 3 },
        { name: 'Done', type: 'DONE', position: 4 },
    ];

    for (const s of statusTypes) {
        await prisma.workflowStatus.create({
            data: {
                name: s.name,
                type: s.type,
                position: s.position,
                teamId: team.id,
            }
        });
    }

    const statuses = await prisma.workflowStatus.findMany({ where: { teamId: team.id } });

    // 4. Create some issues
    const issues = [
        { title: 'Implement file upload', status: 'In Progress', priority: 'HIGH' },
        { title: 'Add search to Command Palette', status: 'Todo', priority: 'URGENT' },
        { title: 'Fix CSS layout', status: 'Backlog', priority: 'MEDIUM' },
    ];

    for (let i = 0; i < issues.length; i++) {
        const s = statuses.find(st => st.name === issues[i].status);
        const readableId = `BUG-${i + 1}`;
        await prisma.issue.upsert({
            where: { readableId },
            update: {},
            create: {
                title: issues[i].title,
                readableId,
                statusId: s.id,
                teamId: team.id,
                reporterId: user.id,
                priority: issues[i].priority,
            }
        });
    }

    console.log('Seed finished successfully!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
