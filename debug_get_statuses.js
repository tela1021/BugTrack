const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Fetching all statuses...');
    const statuses = await prisma.workflowStatus.findMany({
        orderBy: { position: 'asc' }
    });

    console.log(`Raw statuses count: ${statuses.length}`);

    // Simulate deduplication
    const uniqueMap = new Map();
    const uniqueStatuses = [];

    for (const status of statuses) {
        if (!uniqueMap.has(status.name)) {
            uniqueMap.set(status.name, true);
            uniqueStatuses.push(status);
            console.log(`Keeping: ${status.name} (pos: ${status.position}, team: ${status.teamId})`);
        } else {
            // console.log(`Duplicate skipped: ${status.name}`);
        }
    }

    console.log('\nFinal Unique Statuses List:');
    uniqueStatuses.forEach(s => console.log(`- ${s.name} (id: ${s.id})`));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
