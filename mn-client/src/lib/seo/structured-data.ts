export const SITE_URL = "https://malappuramnikah.com";
export const BRAND_NAME = "Malappuram Nikah";
export const BRAND_LOGO = `${SITE_URL}/Mlogo-01.png`;

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
    ],
  };
}
