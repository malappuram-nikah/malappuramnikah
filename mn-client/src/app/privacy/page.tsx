
"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <div className="bg-white rounded-2xl p-8 border border-gray-150 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <ShieldCheck className="w-8 h-8 text-brand-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-playfair">Privacy Policy</h1>
            <p className="text-xs text-gray-500">Malappuram Nikah Matrimony</p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-gray-700 leading-relaxed">
          <h2 className="text-sm font-bold text-gray-900 mt-6">1. Introduction</h2>
          <p>Welcome to Malappuram Nikah (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website www.malappuramnikah.com and use our services.</p>
          <p>By accessing or using our website, you agree to the terms of this Privacy Policy. If you do not agree with the terms herein, please discontinue use of our website.</p>
          <p>This policy is governed by the provisions of the Information Technology Act, 2000, the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011, and the Digital Personal Data Protection Act, 2023, along with the rules, regulations, and amendments issued thereunder from time to time, as applicable in India.</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">2. Information We Collect</h2>
          <p>We collect the following categories of personal information from users of our website:</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">2.1 Personal Identification Information</h2>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>Full Name</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>Email Address</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>Phone Number</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>Mailing Address</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>Billing Address</span></p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">2.2 Payment Information</h2>
          <p>When you make a purchase on our website (one-time or recurring), we collect payment details necessary to process your transaction. Payment information is processed through secure, encrypted payment gateways and is not stored directly on our servers.</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">2.3 Device &amp; Usage Information</h2>
          <p>We automatically collect certain information when you visit our website, including IP address, browser type, operating system, referring URLs, pages viewed, and time spent on pages. This information is collected through cookies, web beacons, and session technologies.</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">2.4 Camera &amp; Photo Gallery Access</h2>
          <p>Certain features of our website or application may request access to your device camera and photo gallery. This access is used solely to enable specific features you choose to use (e.g., uploading profile pictures or product-related images). We do not access or store media without your explicit permission.</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">2.5 Contact Form Data</h2>
          <p>When you reach out to us via contact forms, we collect the information you voluntarily submit, such as your name, email, phone number, and message.</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">3. How We Use Your Information</h2>
          <p>We use the information we collect for the following purposes:</p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>To create and manage your account</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>To process and fulfil your orders, including one-time and recurring payments</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>To send transactional emails, order confirmations, and important service notifications</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>To send promotional emails and newsletters (you may opt out at any time)</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>To respond to your enquiries and provide customer support</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>To personalise your experience on our website</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>To improve our website, products, and services</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>To analyse website traffic and user behaviour using analytics tools</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>To conduct targeted retargeting advertising campaigns</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>To comply with legal obligations and enforce our terms</span></p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">4. Cookies and Tracking Technologies</h2>
          <p>Our website uses the following tracking technologies:</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">4.1 Cookies</h2>
          <p>Cookies are small text files stored on your device. We use session cookies (which expire when you close your browser) and persistent cookies (which remain until deleted) to enhance your browsing experience, remember your preferences, and analyse site usage.</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">4.2 Web Beacons</h2>
          <p>We use web beacons (also known as pixel tags or clear GIFs) in our emails and web pages to track whether our emails have been opened and to analyse website interaction.</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">4.3 Session Tracking</h2>
          <p>We track user sessions to understand how visitors navigate our website and improve functionality and user experience.</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">4.4 Facebook Pixel</h2>
          <p>We have installed the Facebook Pixel on our website. This tool helps us measure the effectiveness of our advertising by tracking the actions users take on our website, and enables us to run targeted retargeting campaigns on Facebook and Instagram.</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">4.5 Managing Cookies</h2>
          <p>You may choose to disable cookies through your browser settings. Please note that disabling cookies may affect the functionality of certain parts of our website.</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">5. Analytics and Third-Party Tracking</h2>
          <p>We use third-party analytics and tracking solutions to monitor website traffic and user behaviour. These may include services provided by:</p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>Google Analytics — for website traffic analysis and performance monitoring</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>Facebook — for pixel-based conversion tracking and ad performance</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>Instagram — for social media campaign tracking</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>X (formerly Twitter) — for engagement tracking</span></p>
          <p>These third parties may collect data as described in their own privacy policies. We encourage you to review the privacy policies of these providers.</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">6. Retargeting and Advertising</h2>
          <p>We use retargeting technologies to advertise our products and services to users who have previously visited our website. This means that after visiting www.malappuramnikah.com, you may see our advertisements on other websites or social media platforms such as Google, Facebook, and Instagram.</p>
          <p>We do not display third-party advertisements on our own website. Our retargeting efforts are solely for promoting Malappuram nikah services and products.</p>
          <p>If you wish to opt out of retargeting ads, you may do so via your social media platform settings or by visiting the Digital Advertising Alliance opt-out page.</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">7. Social Media Integrations</h2>
          <p>Our website integrates with the following social media platforms: Google, Facebook, Instagram, and X (formerly Twitter). These integrations may allow us to share content, track interactions, and provide a seamless experience across platforms.</p>
          <p>When you interact with social media features on our website, those social media companies may collect information in accordance with their own privacy policies. We recommend reviewing their policies to understand how your data is handled.</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">8. Children&apos;s Privacy</h2>
          <p>Our website and services are accessible to users of all ages. We recognize that special attention is required to protect the privacy of children. In compliance with the Digital Personal Data Protection Act, 2023 (and rules thereunder), where a &quot;Child&quot; is defined as any individual below the age of eighteen (18) years, we adhere to the following principles:</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">8.1 Verifiable Parental Consent</h2>
          <p>We do not process the personal data of a Child unless we have obtained verifiable consent from the parent or lawful guardian of such Child. To obtain this consent, we have implemented the following verification mechanisms: (Example-Parent Mobile number verification)</p>
          <p>By providing a Child’s information or allowing a Child to use our services, the parent or guardian confirms that they are the lawful guardian and authorize the collection, use, and disclosure of the Child&apos;s personal data as described in this Privacy Policy.</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">8.2 Restrictions on Processing</h2>
          <p>Where we process the personal data of a Child with verifiable parental consent, we strictly adhere to the following limitations:</p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>No Tracking or Behavioural Monitoring: We do not track the Child’s online activity or monitor their behaviour.</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>No Targeted Advertising: We do not use the Child’s personal data to show targeted or retargeted advertisements.</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>Purpose Limitation: We only process the data to the extent necessary for the specific service the Child is using (e.g., account creation, order fulfilment) and for no other purpose.</span></p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">8.3 Parental Rights and Responsibilities</h2>
          <p>Parents or guardians have the right to:</p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>Review the personal data provided by or about their Child.</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>Request correction or deletion of their Child’s personal data.</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>Withdraw their consent at any time. Withdrawal of consent may result in the termination of the Child’s account or access to services, as we may not be able to operate the account without using the Child’s data.</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>To exercise these rights, parents must contact us at …………………………. with the subject line &quot;Parental Request for Child Data,&quot; and provide sufficient proof of their identity and relationship to the Child.</span></p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">8.4 Data Deletion</h2>
          <p>If we become aware that we have inadvertently collected personal data from a Child without the requisite verifiable parental consent, we will take immediate steps to delete that information from our records. If a parent or guardian believes their Child has provided us with information without their consent, they should contact us immediately at …………………………..</p>
          <p>We encourage parents and guardians to actively supervise their children&apos;s online activities.</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">9. Email Communications and Newsletters</h2>
          <p>With your consent, we may send you marketing emails, newsletters, and promotional materials. Every marketing email we send includes an option to unsubscribe. You may also opt out at any time by:</p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>Clicking the &apos;Unsubscribe&apos; link in any of our marketing emails</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>Contacting us directly at ………………………….</span></p>
          <p>Please note that even after opting out of marketing communications, you may still receive transactional and service-related emails necessary to your account or orders.</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">10. Online Payments</h2>
          <p>We accept both one-time and recurring payments on our website. Payment transactions are processed through secure, third-party payment gateways that comply with PCI-DSS (Payment Card Industry Data Security Standard) requirements.</p>
          <p>We do not store your full payment card details on our servers. Any payment information is handled exclusively by our trusted payment processors. Please refer to the respective payment gateway&apos;s privacy policy for more details on how they handle your financial information.</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">11. Data Sharing and Disclosure</h2>
          <p>We do not sell, rent, or trade your personal information to third parties. We may share your information in the following limited circumstances:</p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>Service Providers: With trusted third-party vendors who assist in operating our website and services (e.g., payment processors, email service providers, analytics providers), subject to confidentiality obligations.</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>Legal Requirements: When required by law, court order, or governmental authority in India or elsewhere.</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>Business Transfers: In connection with a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>Protection of Rights: When necessary to protect the rights, safety, and security of Malappura Nikah, our users, or the public.</span></p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">12. Data Security</h2>
          <p>We implement industry-standard security measures to protect your personal data against unauthorised access, alteration, disclosure, or destruction. These include encrypted connections (SSL/TLS), secure servers, and access controls.</p>
          <p>However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your personal information, we cannot guarantee absolute security. In the event of a data breach that affects your rights and freedoms, we will notify you as required by applicable law.</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">13. Data Retention</h2>
          <p>We retain your personal information only for as long as necessary to fulfil the purposes outlined in this Privacy Policy, or as required by law. When your data is no longer needed, we will securely delete or anonymise it.</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">14. Your Rights</h2>
          <p>As a user, you have the following rights regarding your personal information:</p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>Access: Request a copy of the personal data we hold about you.</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>Correction: Request correction of inaccurate or incomplete data.</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>Deletion: Request deletion of your personal data, subject to legal obligations.</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>Opt-out: opt out of marketing communications at any time.</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>Withdraw Consent: Withdraw consent for data processing where consent was the legal basis.</span></p>
          <p>To exercise any of these rights, please contact us using the details provided in Section 16.</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">15. Third-Party Links</h2>
          <p>Our website may contain links to third-party websites. We are not responsible for the privacy practices of those websites and encourage you to review their privacy policies before providing any personal information.</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">16. Contact Us</h2>
          <p>If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:</p>
          <p>……………………….</p>
          <p>Email: …………………</p>
          <p>Phone: ……………………</p>
          <p>Website: …………………….</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">17. Changes to This Privacy Policy</h2>
          <p>We reserve the right to update or modify this Privacy Policy at any time. Any changes will be posted on this page with a revised Effective Date. We encourage you to review this Policy periodically. Continued use of our website after any changes constitutes your acceptance of the updated policy.</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">18. Jurisdiction</h2>
          <p>Any disputes arising out of or in connection with this Privacy Policy shall be subject to the exclusive jurisdiction of the courts in Malappuram, Keralam, India.</p>

        </div>
      </div>
    </div>
  );
}
