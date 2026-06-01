import prisma from "./infrastructure/prisma/prisamClient";

async function main() {
  console.log("Checking DB entries...");
  const usersCount = await prisma.user.count();
  const interestsCount = await prisma.interest.count();
  console.log(`Total Users in DB: ${usersCount}`);
  console.log(`Total Interests in DB: ${interestsCount}`);

  const allInterests = await prisma.interest.findMany({
    include: {
      sender: { select: { id: true, first_name: true, last_name: true } },
      receiver: { select: { id: true, first_name: true, last_name: true } }
    }
  });

  console.log("Interests recorded in DB:");
  console.log(JSON.stringify(allInterests, null, 2));

  const allUsers = await prisma.user.findMany({
    select: { id: true, first_name: true, last_name: true, mobile_number: true }
  });
  console.log("Users recorded in DB:");
  console.log(JSON.stringify(allUsers, null, 2));
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
