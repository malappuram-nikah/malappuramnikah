import prisma from "../infrastructure/prisma/prisamClient";

async function main() {
  console.log("Starting DB migration: Activating all inactive registered user accounts...");

  // Count current user statuses
  const counts = await prisma.user.groupBy({
    by: ["status"],
    _count: { id: true },
  });

  console.log("Current user status distribution:", counts);

  // Update all accounts with status "in_active" to "active"
  const result = await prisma.user.updateMany({
    where: {
      status: "in_active",
    },
    data: {
      status: "active",
    },
  });

  console.log(`Successfully activated ${result.count} accounts from 'in_active' to 'active'!`);

  // Print updated status distribution
  const updatedCounts = await prisma.user.groupBy({
    by: ["status"],
    _count: { id: true },
  });
  console.log("Updated user status distribution:", updatedCounts);
}

main()
  .catch((e) => {
    console.error("Migration error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
