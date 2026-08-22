export const SITE_URL = "https://www.malappuramnikah.com";
export const BRAND_NAME = "Malappuram Nikah";
export const BRAND_LOGO = `${SITE_URL}/Mlogo-01.png`;

export const HOMEPAGE_FAQS = [
  {
    question: "How does Malappuram Nikah work?",
    answer:
      "Malappuram Nikah provides a dedicated matrimonial platform for Muslim brides and grooms. After registering your profile, you can explore compatible matches, filter by education, profession, and location, express mutual interest, and connect securely with families.",
  },
  {
    question: "Who can register on Malappuram Nikah?",
    answer:
      "Any Muslim individual seeking marriage—or parents, guardians, and siblings registering on behalf of a prospective bride or groom—can create a profile on Malappuram Nikah.",
  },
  {
    question: "How do I create a matrimonial profile?",
    answer:
      "Click 'Join Now' or 'Create Account', enter your mobile number, verify via OTP, and complete your basic details, religious preferences, education, occupation, and family background through our guided profile builder.",
  },
  {
    question: "How can I search and filter suitable matches?",
    answer:
      "You can browse prospective matches on the Matches page and filter profiles by age, marital status, caste preference, educational qualification, profession, and district within Kerala and beyond.",
  },
  {
    question: "How do I express interest in a potential match?",
    answer:
      "When you find a compatible profile, click 'Send Interest'. The member receives a notification and can accept your request to initiate mutual matrimonial communication.",
  },
  {
    question: "How is my personal information and photo handled?",
    answer:
      "We prioritize user privacy and dignity. Your contact numbers and private documents are protected. You control your profile visibility, and contact details are shared only upon mutual interest or active plan access.",
  },
  {
    question: "Can I update my profile details after registration?",
    answer:
      "Yes. You can edit your bio, family details, partner preferences, education, photos, and contact settings at any time from your member dashboard under 'My Profile'.",
  },
  {
    question: "How can I contact customer support if I need assistance?",
    answer:
      "You can call our dedicated support team directly at +91 94478 68443, chat with us on WhatsApp, or email us at support@malappuramnikah.com for registration and matchmaking guidance.",
  },
];

export const ORGANIZATION_SCHEMA = {
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: BRAND_NAME,
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    "@id": `${SITE_URL}/#logo`,
    url: BRAND_LOGO,
    contentUrl: BRAND_LOGO,
    caption: BRAND_NAME,
  },
  image: BRAND_LOGO,
  description:
    "Welcome to Malappuram Nikah, the leading Kerala Muslim matrimonial service. Experience trusted Muslim matchmaking and secure Muslim matrimony today.",
  sameAs: [
    "https://www.instagram.com/mnnikah",
    "https://www.linkedin.com/company/malappuramnikah/",
  ],
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: "+91 94478 68443",
      contactType: "customer support",
      email: "support@malappuramnikah.com",
      areaServed: "IN",
      availableLanguage: ["en", "ml"],
    },
  ],
  address: {
    "@type": "PostalAddress",
    addressLocality: "Malappuram",
    addressRegion: "Kerala",
    addressCountry: "IN",
  },
};

export const WEBSITE_SCHEMA = {
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: BRAND_NAME,
  description:
    "Welcome to Malappuram Nikah, the leading Kerala Muslim matrimonial service. Experience trusted Muslim matchmaking and secure Muslim matrimony today.",
  publisher: {
    "@id": `${SITE_URL}/#organization`,
  },
  inLanguage: "en-IN",
};

export const FAQ_SCHEMA = {
  "@type": "FAQPage",
  "@id": `${SITE_URL}/#faq`,
  mainEntity: HOMEPAGE_FAQS.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export function getHomepageStructuredData() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      ORGANIZATION_SCHEMA,
      WEBSITE_SCHEMA,
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/#webpage`,
        url: SITE_URL,
        name: "Malappuram Nikah | Trusted Malappuram Muslim Matrimony",
        description:
          "Welcome to Malappuram Nikah, the leading Kerala Muslim matrimonial service. Experience trusted Muslim matchmaking and secure Muslim matrimony today.",
        isPartOf: {
          "@id": `${SITE_URL}/#website`,
        },
        about: {
          "@id": `${SITE_URL}/#organization`,
        },
        inLanguage: "en-IN",
      },
      FAQ_SCHEMA,
    ],
  };
}
