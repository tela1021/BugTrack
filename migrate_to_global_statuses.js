const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Starting Status Unification ---');

    // 1. Get all unique status names currently in the system
    const allStatuses = await prisma.workflowStatus.findMany();
    const uniqueNames = [...new Set(allStatuses.map(s => s.name))];

    console.log(`Found ${allStatuses.length} total status records.`);
    console.log(`Found ${uniqueNames.length} unique status names: ${uniqueNames.join(', ')}`);

    // 2. Map existing types/positions to names (taking the most common or first)
    const statusMap = {};
    for (const name of uniqueNames) {
        const sample = allStatuses.find(s => s.name === name);
        statusMap[name] = {
            type: sample.type,
            position: sample.position,
            color: sample.color // If it exists
        };
    }

    // 3. Create global statuses
    console.log('Creating global statuses...');
    const globalStatusRecords = [];
    for (const name of uniqueNames) {
        const existingGlobal = await prisma.workflowStatus.findFirst({
            where: { name, teamId: null }
        });

        if (!existingGlobal) {
            const created = await prisma.workflowStatus.create({
                data: {
                    name,
                    type: statusMap[name].type,
                    position: statusMap[name].position,
                    teamId: null
                }
            });
            globalStatusRecords.push(created);
            console.log(`Created global status: ${name}`);
        } else {
            globalStatusRecords.push(existingGlobal);
            console.log(`Global status already exists: ${name}`);
        }
    }

    // 4. Update all issues to point to global statuses
    console.log('Updating issues to reference global statuses...');
    const issues = await prisma.issue.findMany({ include: { status: true } });
    let updatedCount = 0;

    for (const issue of issues) {
        const globalStatus = globalStatusRecords.find(gs => gs.name === issue.status.name);
        if (globalStatus && issue.statusId !== globalStatus.id) {
            await prisma.issue.update({
                where: { id: issue.id },
                data: { statusId: globalStatus.id }
            });
            updatedCount++;
        }
    }
    console.log(`Updated ${updatedCount} issues.`);

    // 5. Delete old team-specific statuses
    console.log('Cleaning up old team-specific statuses...');
    const deleted = await prisma.workflowStatus.deleteMany({
        where: { teamId: { not: null } }
    });
    console.log(`Deleted ${deleted.count} legacy status records.`);

    console.log('--- Status Unification Complete ---');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
