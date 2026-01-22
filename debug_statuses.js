const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const statuses = await prisma.workflowStatus.findMany({
        include: { team: true }
    });

    console.log('Total Statuses:', statuses.length);

    const map = {};
    statuses.forEach(s => {
        const key = `${s.teamId}-${s.name}`;
        if (!map[key]) map[key] = 0;
        map[key]++;
    });

    console.log('\n--- Duplicate Check (TeamId-StatusName) ---');
    Object.keys(map).forEach(key => {
        if (map[key] > 1) {
            console.log(`${key}: ${map[key]} occurrences`);
        }
    });

    console.log('\n--- Statuses per Team ---');
    const teamCounts = {};
    statuses.forEach(s => {
        const tName = s.team?.name || 'Unknown';
        if (!teamCounts[tName]) teamCounts[tName] = 0;
        teamCounts[tName]++;
    });
    console.log(teamCounts);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
