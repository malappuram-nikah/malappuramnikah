import prisma from "../infrastructure/prisma/prisamClient";
import { deleteKycFile } from "../infrastructure/helpers/admin.helpers";

async function purgeLegacyVerifiedKyc() {
  console.log("=================================================");
  console.log(" Starting DPDP Act KYC Document Cleanup Routine");
  console.log("=================================================\n");

  const verifiedUsersWithDocs = await prisma.user.findMany({
    where: {
      kyc_status: "VERIFIED",
      OR: [
        { kyc_front_url: { not: null } },
        { kyc_back_url: { not: null } }
      ]
    },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      kyc_front_url: true,
      kyc_back_url: true,
      kyc_status: true,
      kyc_verified_at: true,
    }
  });

  console.log(`Found ${verifiedUsersWithDocs.length} verified profile(s) with stored ID documents.\n`);

  let purgedCount = 0;

  for (const user of verifiedUsersWithDocs) {
    console.log(`[Processing User ID: ${user.id}] ${user.first_name} ${user.last_name}`);

    // 1. Purge Cloudinary & Local Storage Files
    if (user.kyc_front_url) {
      await deleteKycFile(user.kyc_front_url);
    }
    if (user.kyc_back_url) {
      await deleteKycFile(user.kyc_back_url);
    }

    // 2. Clear Database document URLs while preserving VERIFIED status & timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: {
        kyc_front_url: null,
        kyc_back_url: null,
      }
    });

    purgedCount++;
    console.log(`✓ Purged ID documents for User ID: ${user.id}\n`);
  }

  console.log("=================================================");
  console.log(` Completed! Successfully purged ${purgedCount} ID document record(s).`);
  console.log(" All verified accounts remain VERIFIED.");
  console.log("=================================================");
}

purgeLegacyVerifiedKyc()
  .catch((err) => {
    console.error("Error during KYC purge:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
