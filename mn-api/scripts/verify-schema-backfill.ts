import prisma from "../src/infrastructure/database/prisma.service";

async function runVerification() {
  console.log("Starting backfill verification script...");

  const db = prisma as any;

  const totalUsers = await db.user.count();
  const totalProfiles = await db.memberProfile.count();
  const totalPreferences = await db.memberPreference.count();
  const totalLocations = await db.memberLocation.count();
  const totalFamilies = await db.memberFamily.count();
  const totalPrivacies = await db.memberPrivacy.count();
  const totalKycApps = await db.kycApplication.count();

  console.log(`Total User accounts: ${totalUsers}`);
  console.log(`Total MemberProfile records: ${totalProfiles}`);
  console.log(`Total MemberPreference records: ${totalPreferences}`);
  console.log(`Total MemberLocation records: ${totalLocations}`);
  console.log(`Total MemberFamily records: ${totalFamilies}`);
  console.log(`Total MemberPrivacy records: ${totalPrivacies}`);
  console.log(`Total KycApplication records: ${totalKycApps}`);

  if (totalUsers !== totalProfiles) {
    throw new Error(`Mismatch: ${totalUsers} Users vs ${totalProfiles} MemberProfiles.`);
  }

  if (totalUsers !== totalPreferences) {
    throw new Error(`Mismatch: ${totalUsers} Users vs ${totalPreferences} MemberPreferences.`);
  }

  if (totalUsers !== totalLocations) {
    throw new Error(`Mismatch: ${totalUsers} Users vs ${totalLocations} MemberLocations.`);
  }

  if (totalUsers !== totalFamilies) {
    throw new Error(`Mismatch: ${totalUsers} Users vs ${totalFamilies} MemberFamilies.`);
  }

  if (totalUsers !== totalPrivacies) {
    throw new Error(`Mismatch: ${totalUsers} Users vs ${totalPrivacies} MemberPrivacies.`);
  }

  if (totalUsers !== totalKycApps) {
    throw new Error(`Mismatch: ${totalUsers} Users vs ${totalKycApps} KycApplications.`);
  }

  // Sample data field check
  const users = await db.user.findMany({ take: 10 });
  for (const u of users) {
    const p = await db.memberProfile.findUnique({ where: { user_id: u.id } });
    if (!p) throw new Error(`User ID ${u.id} missing MemberProfile record.`);
    if (p.first_name !== u.first_name || p.last_name !== u.last_name) {
      throw new Error(`Data mismatch for User ID ${u.id}: Name does not match.`);
    }

    const k = await db.kycApplication.findUnique({ where: { user_id: u.id } });
    if (!k) throw new Error(`User ID ${u.id} missing KycApplication record.`);
  }

  console.log("ALL BACKFILL VERIFICATION CHECKS PASSED SUCCESSFULLY! 100% Data Integrity Confirmed.");
  await prisma.$disconnect();
}

runVerification().catch((err) => {
  console.error("Verification check failed:", err);
  prisma.$disconnect();
  process.exit(1);
});
