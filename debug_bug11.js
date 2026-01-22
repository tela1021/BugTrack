const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const issue = await prisma.issue.findUnique({
        where: { readableId: 'BUG-11' },
        include: { status: true, team: true }
    });

    console.log('--- Issue BUG-11 ---');
    console.log(JSON.stringify(issue, null, 2));

    if (issue) {
        const teamStatuses = await prisma.workflowStatus.findMany({
            where: { teamId: issue.teamId }
        });
        console.log(`\n--- All Statuses for Team ${issue.team.name} (${issue.teamId}) ---`);
        console.log(JSON.stringify(teamStatuses, null, 2));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
