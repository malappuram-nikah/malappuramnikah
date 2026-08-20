
"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Scale } from "lucide-react";

export default function TermsandConditionsPage() {
  return (
    <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <div className="bg-white rounded-2xl p-8 border border-gray-150 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <Scale className="w-8 h-8 text-brand-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-playfair">Terms and Conditions</h1>
            <p className="text-xs text-gray-500">Malappuram Nikah Matrimony</p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-gray-700 leading-relaxed">
          <p>By accessing, registering with, creating a profile on, or using the Platform, you (“User”, “you” or “your”) acknowledge that you have read, understood and agreed to be bound by these Terms, the Privacy Policy, Refund and Cancellation Policy and any other policies or guidelines published on the Platform from time to time.</p>
          <p>If you do not agree to these Terms, you must not access or use the Platform.</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">1. ABOUT MALAPPURAM NIKAH</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">1.1. Malappuram Nikah is an online matrimonial platform intended to facilitate interaction and communication between individuals seeking matrimonial relationships.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">1.2. The Platform may provide free and paid services, including profile creation, profile search, matchmaking, communication facilities, premium membership, profile visibility and other related services.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">1.3. Malappuram Nikah is a technology-enabled matrimonial platform and does not itself act as a matrimonial party, intermediary to a marriage, guarantor, agent, broker or representative of any User.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">1.4. Malappuram Nikah merely facilitates communication and interaction between Users and does not determine, control or guarantee the outcome of any interaction between Users.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">2. ELIGIBILITY</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">2.1. You must be legally competent to enter into a binding agreement under applicable Indian law to register and use the Platform.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">2.2. The Platform is intended for persons who are seeking a lawful matrimonial relationship.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">2.3. A person registering on behalf of another individual must have the authority and consent of that individual to create and operate the profile.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">2.4. Users shall not create profiles for persons who are minors.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">2.5. By registering, you represent and warrant that all information provided by you is true, accurate, current and complete to the best of your knowledge.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">2.6. Malappuram Nikah reserves the right to request appropriate information or documentation for verifying age, identity or other profile information where reasonably necessary.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">3. REGISTRATION AND ACCOUNT</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">3.1. Certain features of the Platform may require registration.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">3.2. The User shall provide accurate information during registration and shall promptly update information that becomes inaccurate, incomplete or outdated.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">3.3. Each User shall ordinarily maintain only one active profile unless otherwise expressly permitted by Malappuram Nikah.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">3.4. The User shall be responsible for maintaining the confidentiality of login credentials, passwords, OTPs and other authentication information.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">3.5. The User shall immediately notify Malappuram Nikah if they become aware of any unauthorised access to their account.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">3.6. The User shall be responsible for all activities carried out through their account, except where such responsibility arises from circumstances beyond the User&apos;s reasonable control and applicable law provides otherwise.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">4. AUTHENTICITY OF PROFILE INFORMATION</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">4.1. Users are solely responsible for the information, photographs, descriptions, educational details, professional information, family details, preferences and other content uploaded or submitted by them.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">4.2. Users shall not:</h2>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>impersonate another person;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>provide a false name or identity;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>misrepresent marital status;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>provide false educational, professional, financial or family information;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>upload photographs belonging to another person without appropriate authority;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>conceal material information that is intentionally represented as part of the matrimonial profile; or</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>create a profile for fraudulent or deceptive purposes.</span></p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">4.3. Malappuram Nikah may undertake verification of certain information where it considers appropriate. However, verification by Malappuram Nikah shall not be construed as a guarantee that all information provided by a User is complete, accurate or truthful.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">4.4. Users are responsible for independently verifying the identity, background, marital status, employment, education, financial position, family circumstances and other relevant information of any person with whom they interact.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">5. NATURE OF MATRIMONIAL SERVICES</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">5.1. Malappuram Nikah provides a platform for Users to discover and communicate with potential matrimonial partners.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">5.2. Malappuram Nikah does not guarantee:</h2>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>marriage or engagement;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>compatibility between Users;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>acceptance of a proposal;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>a particular number of matches;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>a particular number of proposals or responses;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>communication from another User;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>meetings between Users;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>successful negotiations between families;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>the identity or background of another User;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>the accuracy or completeness of information provided by another User; or</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>any particular matrimonial outcome.</span></p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">5.3. A User&apos;s decision to communicate, meet, marry or otherwise establish a relationship with another User is made entirely at the User&apos;s own discretion and risk.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">6. USER INTERACTIONS</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">6.1. Users acknowledge that Malappuram Nikah is not a party to communications, negotiations, meetings, engagements, marriages or other arrangements entered into between Users.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">6.2. Users shall exercise appropriate caution when communicating with other Users.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">6.3. Users should independently verify the identity and information of another User before sharing sensitive information, making financial commitments or arranging personal meetings.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">6.4. Users should avoid sending money, banking credentials, OTPs, passwords, payment card information or other sensitive financial information to another User.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">6.5. Malappuram Nikah shall not be responsible for financial loss, fraud, deception, misrepresentation or other harm arising from transactions or arrangements entered into directly between Users, except to the extent liability cannot lawfully be excluded.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">7. SAFETY AND REPORTING</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">7.1. Users are encouraged to report suspicious, fraudulent, abusive, threatening or inappropriate profiles or conduct through the reporting mechanism provided by the Platform.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">7.2. Upon receiving a complaint, Malappuram Nikah may, at its discretion and subject to applicable law, investigate the complaint and take appropriate action.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">7.3. Such action may include:</h2>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>requesting additional information;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>issuing warnings;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>restricting access;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>suspending a profile;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>removing content;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>disabling communication features;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>terminating an account; or</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>reporting the matter to an appropriate authority where required or considered necessary.</span></p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">7.4. Malappuram Nikah does not guarantee that every reported User will be identified, removed or prevented from accessing the Platform.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">8. PROHIBITED ACTIVITIES</h2>
          <p>Users shall not use the Platform for any unlawful, fraudulent, abusive or unauthorised purpose.</p>
          <p>The following activities are prohibited:</p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>impersonation or identity fraud;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>creating fake, misleading or fraudulent profiles;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>providing knowingly false information;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>harassment, stalking, intimidation, threats or abuse;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>sending obscene, sexually explicit, defamatory, threatening or otherwise unlawful content;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>promoting prostitution, trafficking or any unlawful activity;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>soliciting money or financial assistance from other Users through deceptive means;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>conducting scams, phishing or fraudulent schemes;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>using the Platform for commercial solicitation without prior written permission;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>advertising products, services or businesses without authorisation;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>collecting personal information of other Users for unauthorised purposes;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>scraping, crawling, copying or systematically extracting Platform data without permission;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>attempting to obtain unauthorised access to the Platform or its systems;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>introducing viruses, malware or other harmful code;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>interfering with the operation or security of the Platform;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>using another User&apos;s account;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>creating multiple accounts for fraudulent or abusive purposes;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>using automated systems, bots or scripts to access or interact with the Platform without permission; or</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>using the Platform in violation of applicable Indian law.</span></p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">9. USER CONTENT</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">9.1. “User Content” means photographs, text, descriptions, profile information, messages and other material submitted or uploaded by a User.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">9.2. The User retains ownership of their User Content, subject to the rights granted to Malappuram Nikah under these Terms.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">9.3. By submitting User Content to the Platform, the User grants Malappuram Nikah a non-exclusive, royalty-free, worldwide licence to host, store, reproduce, display, format, transmit and technically process such content to the extent reasonably necessary for operating, maintaining and providing the Platform and its services.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">9.4. The User represents that they have the necessary rights and permissions to upload the User Content.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">9.5. Users shall not upload content that infringes the copyright, trademark, privacy, publicity or other rights of another person.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">9.6. Malappuram Nikah reserves the right to remove, restrict or disable access to User Content that violates these Terms or applicable law.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">10. PHOTOGRAPHS AND PERSONAL INFORMATION</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">10.1. Users should upload only photographs and information that they are authorised to use and disclose.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">10.2. Users should exercise caution before publishing sensitive personal information on their profile.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">10.3. Malappuram Nikah may provide privacy settings and other controls where available, but Users acknowledge that no online system can guarantee absolute security or confidentiality.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">10.4. Users shall not copy, download, distribute, publish or commercially exploit another User&apos;s photographs or personal information without appropriate authority.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">11. INTELLECTUAL PROPERTY</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">11.1. All rights, title and interest in the Website, Platform, software, design, logos, trademarks, graphics, text, layout, features and other proprietary materials, excluding User Content, belong to Malappuram Nikah or its licensors, unless otherwise stated.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">11.2. Nothing in these Terms grants the User any ownership interest in the intellectual property of Malappuram Nikah.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">11.3. Users shall not reproduce, modify, distribute, sell, license, reverse engineer or commercially exploit any part of the Platform without prior written permission.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">12. THIRD-PARTY SERVICES</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">12.1. The Platform may use third-party services, including payment gateways, hosting providers, analytics providers, communication services and other technology providers.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">12.2. Such third-party services may be subject to separate terms and privacy policies.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">12.3. Malappuram Nikah shall not be responsible for failures attributable solely to third-party services, subject to applicable law.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">13. PAID SERVICES AND SUBSCRIPTIONS</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">13.1. Certain features may require payment.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">13.2. Fees, subscription duration and features shall be displayed before purchase.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">13.3. Payment does not guarantee any particular matrimonial result.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">13.4. Refunds and cancellations shall be governed by the Refund and Cancellation Policy published on the Platform.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">13.5. Users shall not initiate fraudulent chargebacks or payment disputes in respect of legitimate transactions.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">14. ACCOUNT SUSPENSION AND TERMINATION</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">14.1. Malappuram Nikah may suspend, restrict or terminate an account where it reasonably believes that the User:</h2>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>has violated these Terms;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>has provided false or misleading information;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>has engaged in fraudulent activity;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>has misused the Platform;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>has harassed or harmed another User;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>has violated applicable law;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>has compromised Platform security; or</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>has engaged in conduct detrimental to the Platform or its Users.</span></p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">14.2. Malappuram Nikah may also suspend or terminate an account where required by law or pursuant to a lawful direction from a competent authority.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">14.3. Where reasonably practicable, Malappuram Nikah may provide notice regarding suspension or termination, except where immediate action is necessary for security, prevention of fraud, protection of Users, compliance with law or other legitimate reasons.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">14.4. Termination of an account shall not affect rights or obligations accrued before termination.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">15. USER REQUEST FOR ACCOUNT DELETION</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">15.1. A User may request deletion or deactivation of their account in accordance with the facilities provided by the Platform.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">15.2. Certain information may be retained after deletion where necessary for legal compliance, fraud prevention, dispute resolution, enforcement of agreements, security or other legitimate purposes permitted by applicable law.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">15.3. Account deletion does not automatically result in a refund of subscription fees. Refund eligibility shall be governed by the Refund and Cancellation Policy and applicable law.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">16. PRIVACY AND PERSONAL DATA</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">16.1. The collection, use, storage and processing of personal data shall be governed by the Privacy Policy of Malappuram Nikah.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">16.2. By using the Platform, Users acknowledge that their personal information may be processed for purposes disclosed in the Privacy Policy and as otherwise permitted by applicable law.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">16.3. Users shall provide accurate information and shall not knowingly provide personal information belonging to another person without lawful authority or consent.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">16.4. Malappuram Nikah shall take reasonable measures appropriate to the nature of the Platform and applicable legal requirements to protect personal information.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">17. COMMUNICATIONS</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">17.1. By registering on the Platform, Users may receive service-related communications, including account notifications, security alerts, subscription information and other communications necessary for operation of the Platform.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">17.2. Promotional communications, where applicable, shall be subject to applicable law and available user preferences.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">17.3. Users may opt out of promotional communications through the mechanisms provided by the Platform, subject to the continued delivery of essential service communications.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">18. DISCLAIMERS</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">18.1. The Platform is provided on an “as available” basis, subject to applicable law.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">18.2. Malappuram Nikah does not represent or warrant that:</h2>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>the Platform will always be uninterrupted;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>all profiles will be authentic;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>all information supplied by Users will be accurate;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>the Platform will be free from technical errors;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>a particular User will find a matrimonial partner; or</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>the use of the Platform will result in marriage or any particular outcome.</span></p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">18.3. Malappuram Nikah does not conduct comprehensive background verification of every User unless expressly stated otherwise for a particular service.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">18.4. Users are solely responsible for exercising due diligence before entering into any personal, financial, matrimonial or other relationship with another User.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">19. LIMITATION OF LIABILITY</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">19.1. To the maximum extent permitted by applicable law, Malappuram Nikah shall not be liable for indirect, incidental, consequential, special or punitive losses arising from interactions between Users or from the use of information provided by other Users.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">19.2. Malappuram Nikah shall not be responsible for losses arising from:</h2>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>inaccurate information supplied by Users;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>fraudulent or deceptive conduct by another User;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>unauthorised communications between Users;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>decisions taken by a User based on information available on the Platform;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>personal meetings or relationships between Users;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>third-party websites or services; or</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>events beyond the reasonable control of Malappuram Nikah.</span></p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">19.3. Nothing in these Terms shall exclude or limit liability that cannot lawfully be excluded or limited under applicable law.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">20. INDEMNIFICATION</h2>
          <p>To the extent permitted by applicable law, a User agrees to indemnify and hold harmless Malappuram Nikah, its owners, directors, officers, employees, agents and service providers from claims, losses, liabilities, damages, costs and expenses arising out of:</p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>the User&apos;s violation of these Terms;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>unlawful or fraudulent conduct by the User;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>infringement of third-party intellectual property or other rights;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>User Content submitted by the User; or</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>misuse of the Platform by the User.</span></p>
          <p>This clause shall not apply to the extent that the relevant loss is caused by the wilful misconduct or negligence of Malappuram Nikah or where such indemnification is prohibited by applicable law.</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">21. GRIEVANCE REDRESSAL</h2>
          <p>Malappuram Nikah shall maintain a grievance mechanism in accordance with applicable law.</p>
          <p>Users may submit complaints relating to:</p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>fake or fraudulent profiles;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>inappropriate content;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>harassment or abuse;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>privacy concerns;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>payment issues;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>account-related issues;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>infringement complaints; or</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>other Platform-related grievances.</span></p>
          <p>Grievance Officer / Customer Support</p>
          <p>Name: [●] Designation: [●] Email: [●] Phone: [●] Address: [●]</p>
          <p>Complaints shall be reviewed and handled in accordance with applicable law and the internal grievance procedure of Malappuram Nikah.</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">22. COPYRIGHT AND INTELLECTUAL PROPERTY COMPLAINTS</h2>
          <p>If any person believes that material available on the Platform infringes their copyright or other intellectual property rights, they may submit a written complaint containing sufficient details to identify:</p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>the work or right allegedly infringed;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>the allegedly infringing material;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>the complainant&apos;s contact details;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>evidence of ownership or authority; and</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>any other information reasonably necessary for investigation.</span></p>
          <p>Malappuram Nikah may take appropriate action in accordance with applicable law.</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">23. LINKS TO OTHER WEBSITES</h2>
          <p>The Platform may contain links to third-party websites or services.</p>
          <p>Such links are provided for convenience and do not constitute an endorsement or guarantee by Malappuram Nikah.</p>
          <p>Users access third-party websites at their own risk and should review the applicable terms and privacy policies of such websites.</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">24. FORCE MAJEURE</h2>
          <p>Malappuram Nikah shall not be liable for failure or delay in performing its obligations to the extent caused by circumstances beyond its reasonable control, including natural disasters, war, riots, governmental actions, internet or telecommunications failures, cyber incidents, strikes, technical infrastructure failures or other events of force majeure.</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">25. CHANGES TO THE PLATFORM</h2>
          <p>Malappuram Nikah may modify, suspend, discontinue or introduce features, services or functionalities from time to time.</p>
          <p>Where material changes are made, appropriate notice may be provided where required by applicable law.</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">26. MODIFICATION OF THESE TERMS</h2>
          <p>Malappuram Nikah may amend these Terms from time to time to reflect changes in its services, business practices, technology or applicable law.</p>
          <p>The updated Terms shall be published on the Website with the revised “Last Updated” date.</p>
          <p>Continued use of the Platform after the updated Terms become effective shall constitute acceptance of the revised Terms, to the extent permitted by applicable law.</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">27. SEVERABILITY</h2>
          <p>If any provision of these Terms is held to be invalid, unlawful or unenforceable by a competent authority, such provision shall be modified or severed to the minimum extent necessary, and the remaining provisions shall continue in full force and effect.</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">28. WAIVER</h2>
          <p>Failure by Malappuram Nikah to enforce any provision of these Terms shall not constitute a waiver of its right to enforce that provision subsequently.</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">29. ENTIRE AGREEMENT</h2>
          <p>These Terms, together with the Privacy Policy, Refund and Cancellation Policy and any other policies expressly incorporated into these Terms, constitute the agreement between the User and Malappuram Nikah concerning use of the Platform, subject to applicable law.</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">30. GOVERNING LAW AND JURISDICTION</h2>
          <p>These Terms shall be governed by and interpreted in accordance with the laws of India.</p>
          <p>Subject to the jurisdiction of competent consumer fora and other statutory authorities, courts having appropriate jurisdiction in Kerala shall have jurisdiction over disputes arising from or relating to the use of the Platform.</p>
          <p>Nothing in these Terms shall restrict a consumer from exercising any statutory right or remedy available under applicable consumer protection law.</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">31. CONTACT INFORMATION</h2>
          <p>For questions, complaints or other communications concerning these Terms, please contact:</p>
          <p>Malappuram Nikah.com</p>
          <p>Website: www.Malappuram Nikah.com Email: …………….. Phone: …………….. Registered Office/Business Address: ……………………..</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">USER ACKNOWLEDGEMENT</h2>
          <p>By clicking “Register”, “Create Account”, “I Agree”, “Subscribe”, “Pay Now” or any equivalent button, or by otherwise accessing or using the Platform, the User confirms that:</p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>the User has read and understood these Terms and Conditions;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>the information provided by the User is true and accurate to the best of the User&apos;s knowledge;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>the User is legally eligible to use the Platform;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>the User understands that Malappuram Nikah does not guarantee marriage or any particular matrimonial outcome;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>the User understands that interactions with other Users are undertaken at the User&apos;s own discretion and risk; and</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>the User agrees to comply with these Terms, the Privacy Policy and the Refund and Cancellation Policy.</span></p>

        </div>
      </div>
    </div>
  );
}
