const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Starting cleanup...');

    // Get all statuses
    const statuses = await prisma.workflowStatus.findMany();

    // Group by TeamID + Name
    const groups = {};
    statuses.forEach(s => {
        const key = `${s.teamId}-${s.name}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(s);
    });

    let deletedCount = 0;

    for (const key of Object.keys(groups)) {
        const group = groups[key];
        // Sort by ID to ensure deterministic behavior since createdAt is missing
        group.sort((a, b) => a.id.localeCompare(b.id));

        if (group.length > 1) {
            console.log(`Found duplicates for ${key}: ${group.length} items`);

            // Keep the first one (oldest) or the one with most relations? 
            // Let's keep the first one created (index 0 since we ordered by createdAt asc)
            const keeper = group[0];
            const duplicates = group.slice(1);

            for (const dup of duplicates) {
                // Migrate issues
                const issues = await prisma.issue.updateMany({
                    where: { statusId: dup.id },
                    data: { statusId: keeper.id }
                });
                if (issues.count > 0) {
                    console.log(`  Migrated ${issues.count} issues from ${dup.id} to ${keeper.id}`);
                }

                // Delete duplicate
                await prisma.workflowStatus.delete({
                    where: { id: dup.id }
                });
                console.log(`  Deleted duplicate status ${dup.id}`);
                deletedCount++;
            }
        }
    }

    console.log(`Cleanup complete. Deleted ${deletedCount} duplicate statuses.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
