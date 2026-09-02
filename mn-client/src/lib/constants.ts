export const SUPPORT_CALL_NUMBER = "+91 99613 41443";
export const SUPPORT_CALL_TEL = "+919961341443";
export const SUPPORT_WHATSAPP_NUMBER = "+91 99613 41443";
export const SUPPORT_WHATSAPP_RAW = "919961341443";

export const LOCATIONS = [
  "Angadipuram",
  "Edappal",
  "Kadalundi",
  "Kondotty",
  "Kottakkal",
  "Kottakunnu",
  "Kuttippuram",
  "Malappuram",
  "Manjeri",
  "Nilambur",
  "Parappanangadi",
  "Perinthalmanna",
  "Ponnani",
  "Puthanathani",
  "Tanur",
  "Thirunavaya",
  "Tirur",
  "Tirurangadi",
  "Valanchery",
  "Vengara",
  "Venniyur",
  "Wandoor",
];

export interface CountryCodeOption {
  code: string;
  label: string;
  country: string;
  digits: number;
  placeholder: string;
}

export const COUNTRY_CODES: CountryCodeOption[] = [
  { code: "+91", label: "+91 (IN)", country: "India", digits: 10, placeholder: "10 digit mobile number" },
  { code: "+971", label: "+971 (UAE)", country: "United Arab Emirates", digits: 9, placeholder: "9 digit mobile number" },
  { code: "+966", label: "+966 (KSA)", country: "Saudi Arabia", digits: 9, placeholder: "9 digit mobile number" },
  { code: "+974", label: "+974 (QA)", country: "Qatar", digits: 8, placeholder: "8 digit mobile number" },
  { code: "+968", label: "+968 (OM)", country: "Oman", digits: 8, placeholder: "8 digit mobile number" },
  { code: "+965", label: "+965 (KW)", country: "Kuwait", digits: 8, placeholder: "8 digit mobile number" },
  { code: "+973", label: "+973 (BH)", country: "Bahrain", digits: 8, placeholder: "8 digit mobile number" },
  { code: "+44", label: "+44 (UK)", country: "United Kingdom", digits: 10, placeholder: "10 digit mobile number" },
  { code: "+1", label: "+1 (US/CA)", country: "USA / Canada", digits: 10, placeholder: "10 digit mobile number" },
];

