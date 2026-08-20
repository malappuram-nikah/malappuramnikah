import prisma from "../src/infrastructure/database/prisma.service";
import path from "path";
import fs from "fs";

const STORE_PATH = path.join(process.cwd(), "src", "infrastructure", "data", "adminStore.json");

async function runBackfill() {
  console.log("Starting idempotent database backfill script...");

  const db = prisma as any;

  const users = await db.user.findMany();
  console.log(`Found ${users.length} user records to process.`);

  let memberProfileCount = 0;
  let memberPreferenceCount = 0;
  let memberLocationCount = 0;
  let memberFamilyCount = 0;
  let memberPrivacyCount = 0;
  let kycApplicationCount = 0;

  for (const user of users) {
    const details = (user.profile_details as any) || {};
    const prefs = (user.search_preferences as any) || {};
    const basicDraft = details.mn_basic_details_draft || {};
    const familyDraft = details.mn_family_details_draft || {};
    const locDraft = details.mn_location_details_draft || {};

    // 1. Backfill MemberProfile
    const maritalStatus = details.maritalStatus || basicDraft.marital_status || null;
    const heightCm = details.height ? parseInt(details.height, 10) : basicDraft.height ? parseInt(basicDraft.height, 10) : null;
    const weightKg = details.weight ? parseInt(details.weight, 10) : basicDraft.weight ? parseInt(basicDraft.weight, 10) : null;
    const motherTongue = details.motherTongue || basicDraft.mother_tongue || "Malayalam";
    const aboutMe = details.about_me || details.aboutMe || null;

    await db.memberProfile.upsert({
      where: { user_id: user.id },
      update: {
        profile_for: user.profile_for,
        gender: user.gender,
        first_name: user.first_name,
        last_name: user.last_name,
        dob: user.dob,
        marital_status: maritalStatus,
        height_cm: isNaN(heightCm!) ? null : heightCm,
        weight_kg: isNaN(weightKg!) ? null : weightKg,
        mother_tongue: motherTongue,
        about_me: aboutMe,
      },
      create: {
        user_id: user.id,
        profile_for: user.profile_for,
        gender: user.gender,
        first_name: user.first_name,
        last_name: user.last_name,
        dob: user.dob,
        marital_status: maritalStatus,
        height_cm: isNaN(heightCm!) ? null : heightCm,
        weight_kg: isNaN(weightKg!) ? null : weightKg,
        mother_tongue: motherTongue,
        about_me: aboutMe,
      },
    });
    memberProfileCount++;

    // 2. Backfill MemberPreference
    await db.memberPreference.upsert({
      where: { user_id: user.id },
      update: {
        age_min: prefs.ageMin ? parseInt(prefs.ageMin, 10) : 18,
        age_max: prefs.ageMax ? parseInt(prefs.ageMax, 10) : 60,
        height_min: prefs.heightMin ? parseInt(prefs.heightMin, 10) : null,
        height_max: prefs.heightMax ? parseInt(prefs.heightMax, 10) : null,
        marital_status_list: prefs.maritalStatus || null,
        district_list: prefs.district || null,
        education_list: prefs.education || null,
        profession_list: prefs.profession || null,
        community_list: prefs.community || null,
      },
      create: {
        user_id: user.id,
        age_min: prefs.ageMin ? parseInt(prefs.ageMin, 10) : 18,
        age_max: prefs.ageMax ? parseInt(prefs.ageMax, 10) : 60,
        height_min: prefs.heightMin ? parseInt(prefs.heightMin, 10) : null,
        height_max: prefs.heightMax ? parseInt(prefs.heightMax, 10) : null,
        marital_status_list: prefs.maritalStatus || null,
        district_list: prefs.district || null,
        education_list: prefs.education || null,
        profession_list: prefs.profession || null,
        community_list: prefs.community || null,
      },
    });
    memberPreferenceCount++;

    // 3. Backfill MemberLocation
    const country = locDraft.country || details.country || "India";
    const state = locDraft.state || details.state || "Kerala";
    const district = locDraft.district || user.location || details.district || null;
    const city = locDraft.city || details.city || null;
    const pincode = locDraft.pincode || details.pincode || null;
    const nativePlace = locDraft.native_place || details.native_place || null;

    await db.memberLocation.upsert({
      where: { user_id: user.id },
      update: {
        country,
        state,
        district,
        city,
        pincode,
        native_place: nativePlace,
      },
      create: {
        user_id: user.id,
        country,
        state,
        district,
        city,
        pincode,
        native_place: nativePlace,
      },
    });
    memberLocationCount++;

    // 4. Backfill MemberFamily
    const familyStatus = familyDraft.family_status || details.familyStatus || null;
    const financialStatus = familyDraft.financial_status || details.financialStatus || null;
    const familyType = familyDraft.family_type || details.familyType || null;
    const fatherName = familyDraft.father_name || details.fatherName || null;
    const fatherOcc = familyDraft.father_occupation || details.fatherOccupation || null;
    const motherName = familyDraft.mother_name || details.motherName || null;
    const motherOcc = familyDraft.mother_occupation || details.motherOccupation || null;
    const siblings = familyDraft.siblings_count ? parseInt(familyDraft.siblings_count, 10) : null;

    await db.memberFamily.upsert({
      where: { user_id: user.id },
      update: {
        family_status: familyStatus,
        financial_status: financialStatus,
        family_type: familyType,
        father_name: fatherName,
        father_occupation: fatherOcc,
        mother_name: motherName,
        mother_occupation: motherOcc,
        siblings_count: isNaN(siblings!) ? 0 : siblings,
      },
      create: {
        user_id: user.id,
        family_status: familyStatus,
        financial_status: financialStatus,
        family_type: familyType,
        father_name: fatherName,
        father_occupation: fatherOcc,
        mother_name: motherName,
        mother_occupation: motherOcc,
        siblings_count: isNaN(siblings!) ? 0 : siblings,
      },
    });
    memberFamilyCount++;

    // 5. Backfill MemberPrivacy
    await db.memberPrivacy.upsert({
      where: { user_id: user.id },
      update: {
        phone_privacy: "MATCHES_ONLY",
        photo_privacy: "PUBLIC",
        biodata_download_allowed: true,
      },
      create: {
        user_id: user.id,
        phone_privacy: "MATCHES_ONLY",
        photo_privacy: "PUBLIC",
        biodata_download_allowed: true,
      },
    });
    memberPrivacyCount++;

    // 6. Backfill KycApplication & KycDocument
    let mappedKycStatus = "NOT_SUBMITTED";
    if (user.kyc_status === "PENDING") mappedKycStatus = "PENDING";
    else if (user.kyc_status === "UNDER_REVIEW") mappedKycStatus = "UNDER_REVIEW";
    else if (user.kyc_status === "VERIFIED") mappedKycStatus = "VERIFIED";
    else if (user.kyc_status === "REJECTED") mappedKycStatus = "REJECTED";

    const kycApp = await db.kycApplication.upsert({
      where: { user_id: user.id },
      update: {
        status: mappedKycStatus,
        submitted_at: user.kyc_submitted_at || null,
        verified_at: user.kyc_verified_at || null,
        rejected_reason: user.kyc_rejected_reason || null,
      },
      create: {
        user_id: user.id,
        status: mappedKycStatus,
        submitted_at: user.kyc_submitted_at || null,
        verified_at: user.kyc_verified_at || null,
        rejected_reason: user.kyc_rejected_reason || null,
      },
    });
    kycApplicationCount++;

    if (user.kyc_document_type || user.kyc_front_url || user.kyc_back_url) {
      await db.kycDocument.create({
        data: {
          kyc_application_id: kycApp.id,
          document_type: user.kyc_document_type || "Aadhaar Card",
          front_url: user.kyc_front_url,
          back_url: user.kyc_back_url,
          is_verified: mappedKycStatus === "VERIFIED",
        },
      });
    }
  }

  // 7. Backfill Businesses from adminStore.json if present
  let businessCount = 0;
  if (fs.existsSync(STORE_PATH)) {
    try {
      const store = JSON.parse(fs.readFileSync(STORE_PATH, "utf-8"));
      if (Array.isArray(store.vendors)) {
        for (const v of store.vendors) {
          let mappedStatus = "APPROVED";
          if (v.status === "PENDING") mappedStatus = "PENDING";
          else if (v.status === "REJECTED") mappedStatus = "REJECTED";

          const createdBiz = await db.business.create({
            data: {
              name: v.name || "Vendor",
              category: v.category || "Catering",
              location: v.location || "Malappuram",
              contact_phone: v.contact || "+919876543210",
              status: mappedStatus,
              commission_rate: v.commission_rate || 10.0,
              rating: v.rating || 5.0,
              revenue: v.revenue || 0.0,
            },
          });
          businessCount++;

          if (Array.isArray(store.bookings)) {
            for (const b of store.bookings.filter((bk: any) => bk.vendor_id === v.id || bk.vendor_name === v.name)) {
              let mappedBkStatus = "PENDING";
              if (b.status === "CONFIRMED") mappedBkStatus = "CONFIRMED";
              else if (b.status === "COMPLETED") mappedBkStatus = "COMPLETED";

              await db.businessBooking.create({
                data: {
                  business_id: createdBiz.id,
                  customer_id: users[0]?.id || 1,
                  booking_date: new Date(),
                  status: mappedBkStatus,
                  total_amount: b.amount || 5000,
                },
              });
            }
          }
        }
      }
    } catch (err) {
      console.warn("Could not backfill adminStore vendors:", err);
    }
  }

  console.log("Backfill operation completed successfully!");
  console.log(`- MemberProfiles created/updated: ${memberProfileCount}`);
  console.log(`- MemberPreferences created/updated: ${memberPreferenceCount}`);
  console.log(`- MemberLocations created/updated: ${memberLocationCount}`);
  console.log(`- MemberFamilies created/updated: ${memberFamilyCount}`);
  console.log(`- MemberPrivacies created/updated: ${memberPrivacyCount}`);
  console.log(`- KycApplications created/updated: ${kycApplicationCount}`);
  console.log(`- Businesses created: ${businessCount}`);

  await prisma.$disconnect();
}

runBackfill().catch((err) => {
  console.error("Backfill failed:", err);
  prisma.$disconnect();
  process.exit(1);
});
