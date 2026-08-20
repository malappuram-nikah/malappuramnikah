
"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Receipt } from "lucide-react";

export default function RefundandCancellationPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <div className="bg-white rounded-2xl p-8 border border-gray-150 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <Receipt className="w-8 h-8 text-brand-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-playfair">Refund and Cancellation Policy</h1>
            <p className="text-xs text-gray-500">Malappuram Nikah Matrimony</p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-gray-700 leading-relaxed">
          <p>By registering on the Platform, purchasing any subscription or paid service, or otherwise making a payment to Malappuram Nikah, you acknowledge that you have read, understood and agreed to this Policy, along with the Terms and Conditions and Privacy Policy applicable to the Platform.</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">1. Nature of Services</h2>
          <p>Malappuram Nikah is an online matrimonial platform that facilitates interaction between individuals who are seeking matrimonial relationships.</p>
          <p>The Platform may provide free and paid services, including, as applicable:</p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>creation and maintenance of matrimonial profiles;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>access to search and matchmaking features;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>communication or contact facilities;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>access to premium profiles or premium features;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>subscription-based membership plans;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>profile visibility or promotional services; and</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>such other matrimonial or related digital services as may be introduced from time to time.</span></p>
          <p>MalappuramNikah provides a platform and matchmaking service only and does not guarantee that a User will receive a particular number of proposals, matches, responses, meetings, marriage proposals or marriage outcomes.</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">2. Subscription and Payment</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">2.1. Certain features of the Platform may be available only upon payment of the applicable subscription or service fee.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">2.2. The applicable fee, duration, features and other material terms of the selected subscription shall be displayed to the User before payment.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">2.3. The User shall be responsible for ensuring that the information entered during the payment process is accurate.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">2.4. Payments may be processed through third-party payment gateways or payment service providers. MalappuramNikah shall not be responsible for delays, failures or technical issues attributable solely to the payment gateway, banking institution or other third-party payment service provider.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">2.5. Taxes, if applicable, shall be charged in accordance with applicable law.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">3. Cancellation by the User</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">3.1. A User may request cancellation of a subscription by contacting MalappuramNikah through the customer support/contact details published on the Website.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">3.2. Cancellation of a subscription does not, by itself, create an automatic entitlement to a refund.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">3.3. Once a paid subscription or premium service has been activated and the User has obtained access to the corresponding digital features, the service shall ordinarily be treated as having commenced.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">3.4. The User is therefore advised to review the subscription details, duration, features and applicable charges carefully before making payment.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">4. Refund Eligibility</h2>
          <p>Subject to applicable law, a refund may be considered in the following circumstances:</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">4.1. Duplicate Payment</h2>
          <p>Where the same transaction has been successfully charged more than once due to a technical or payment-processing error, the excess amount shall be refunded after verification.</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">4.2. Payment Deducted but Subscription Not Activated</h2>
          <p>Where the User&apos;s account has been debited successfully but the corresponding subscription has not been activated due to a technical error attributable to MalappuramNikah, the Company may either:</p>
          <p>(a) activate the purchased service; or (b) refund the amount paid, where activation is not reasonably possible.</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">4.3. Technical Failure Attributable to MalappuramNikah</h2>
          <p>Where a paid service cannot be accessed due to a substantial technical failure attributable to MalappuramNikah and the issue cannot reasonably be rectified within a reasonable period, the Company may provide an appropriate refund or extension of the subscription, as determined having regard to the circumstances.</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">4.4. Service Not Provided as Advertised</h2>
          <p>Where it is established that a paid service materially differs from the service or features expressly represented to the User at the time of purchase, the User may request an appropriate remedy, including refund where warranted.</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">4.5. Unauthorised Transaction</h2>
          <p>Where a User claims that a payment was made without authorisation, MalappuramNikah may require reasonable information and supporting documents to verify the claim and shall process the matter in accordance with applicable law and the procedures of the relevant payment service provider.</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">5. No Refund in Certain Circumstances</h2>
          <p>Subject to the User&apos;s statutory rights under applicable law, refunds shall ordinarily not be available merely because:</p>
          <p>(a) the User did not find a suitable matrimonial match;</p>
          <p>(b) the User did not receive a proposal, response or communication from another User;</p>
          <p>(c) a particular User did not respond to a message or request;</p>
          <p>(d) the User did not like or approve the profiles displayed;</p>
          <p>(e) the User changed their mind after purchasing a subscription;</p>
          <p>(f) the User did not use the subscription or premium features after purchase;</p>
          <p>(g) the User&apos;s personal circumstances changed after purchasing the service;</p>
          <p>(h) the User entered incorrect or incomplete information while registering or making payment;</p>
          <p>(i) the User&apos;s account was suspended, restricted or terminated due to violation of the Terms and Conditions, fraudulent conduct, misuse of the Platform or submission of false information; or</p>
          <p>(j) the User expected a particular number of matches, proposals, contacts, responses, meetings or marriage outcomes which were not expressly guaranteed by MalappuramNikah.</p>
          <p>For avoidance of doubt, MalappuramNikah does not guarantee marriage, engagement, a particular number of matches, proposals, responses, successful communication or any particular matrimonial outcome.</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">6. Profile Deletion and Marriage</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">6.1. A User may delete or deactivate their matrimonial profile in accordance with the functionality provided on the Platform.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">6.2. Deletion, deactivation or suspension of a profile after commencement of a paid subscription shall not automatically entitle the User to a refund.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">6.3. Where a User gets married, becomes engaged or otherwise no longer requires the service during the subscription period, the User may request closure of the profile. Such closure shall not by itself create an entitlement to a refund.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">7. Refund Request Procedure</h2>
          <p>A refund request shall be submitted through the customer support/contact mechanism provided on the Website and should contain:</p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>registered name of the User;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>registered mobile number/email address;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>transaction/order/reference ID;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>date and amount of payment;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>subscription/service purchased;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>reason for requesting the refund; and</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>supporting documents, wherever reasonably required.</span></p>
          <p>MalappuramNikah may request additional information where necessary to verify the transaction and assess the refund request.</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">8. Processing of Refund Requests</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">8.1. Each refund request shall be reviewed on its individual facts and circumstances.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">8.2. Where a refund is approved, the refund shall ordinarily be processed to the original payment method used for the transaction, subject to the procedures and timelines of the relevant payment gateway, bank or financial institution.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">8.3. MalappuramNikah shall endeavour to process approved refunds within a reasonable period and in accordance with applicable law.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">8.4. The actual time taken for the amount to reflect in the User&apos;s account may depend upon the payment gateway, bank or card/payment service provider.</h2>
          <h2 className="text-sm font-bold text-gray-900 mt-6">9. Partial Refunds</h2>
          <p>Where a paid service has been partially utilised or partially delivered and a refund is legally or contractually warranted, MalappuramNikah may determine an appropriate proportionate refund having regard to:</p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>the period for which the service was available;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>the extent to which the service was used;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>the services already provided;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>the nature of the deficiency, if any; and</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>the applicable law.Nothing in this clause shall restrict any statutory right of the User.</span></p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">10. Cancellation or Termination by MalappuramNikah</h2>
          <p>Malappuram Nikah reserves the right to suspend, restrict or terminate a User&apos;s account or access to paid services where the User:</p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>provides false, misleading or fraudulent information;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>creates a fraudulent or impersonated profile;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>engages in harassment, abuse, threats or inappropriate conduct;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>misuses the Platform;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>attempts to circumvent Platform security;</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>violates the Terms and Conditions or applicable law; or</span></p>
          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>engages in any conduct that may adversely affect the safety, rights or interests of other Users or Malappuram Nikah.</span></p>
          <p>Where termination is caused by the User&apos;s violation of the Terms and Conditions or applicable law, the User shall not ordinarily be entitled to a refund, subject always to applicable law and the User&apos;s statutory rights.</p>
          <p>Where Malappuram Nikah terminates a paid service for reasons not attributable to the User and the service cannot reasonably be continued or substituted, an appropriate refund or other suitable remedy may be provided.</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">11. Promotional Offers and Discounts</h2>
          <p>Promotional subscriptions, discounted plans, coupons, introductory offers, complimentary services and special packages may be subject to separate terms.</p>
          <p>Unless expressly stated otherwise at the time of the offer, promotional benefits shall not be exchangeable for cash and shall not create an independent entitlement to a refund.</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">12. Payment Gateway Charges</h2>
          <p>Where a refund is required under applicable law or where Malappuram Nikah approves a refund, the refund shall be made in accordance with the applicable payment and banking mechanisms.</p>
          <p>No deduction shall be made from a refund where such deduction is prohibited by applicable law.</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">13. Consumer Rights</h2>
          <p>Nothing contained in this Policy shall be interpreted as excluding, restricting or waiving any right or remedy available to a consumer under the Consumer Protection Act, 2019, the Consumer Protection (E-Commerce) Rules, 2020, or any other applicable law.</p>
          <p>Where Malappuram Nikah is legally required to provide a refund, replacement, correction, compensation or other remedy, the same shall be provided in accordance with applicable law.</p>
          <p>The Consumer Protection (E-Commerce) Rules, 2020 require e-commerce entities to process accepted refunds within the applicable legal/payment framework and contain requirements concerning consumer cancellation and affirmative consent. (Consumer Affairs)</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">14. Personal and Payment Information</h2>
          <p>Any information submitted in connection with a refund request shall be handled in accordance with Malappuram Nikah&apos;s Privacy Policy and applicable data-protection laws.</p>
          <p>The Platform may process information necessary to verify transactions, prevent fraud, resolve disputes and process refunds. The Digital Personal Data Protection Act, 2023 requires processing of personal data to be undertaken for a lawful purpose and provides for notice concerning the data processed and its purpose. (India Code)</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">15. Fraudulent Refund Claims</h2>
          <p>Malappuram Nikah reserves the right to investigate refund claims that appear to be fraudulent, abusive, misleading or otherwise made in bad faith.</p>
          <p>Where a User knowingly submits false information or attempts to obtain an unauthorised refund, Malappuram Nikah may take appropriate action, including suspension or termination of the account and such other action as may be permitted by law.</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">16. Dispute Resolution and Grievance Redressal</h2>
          <p>If a User has any concern regarding a payment, cancellation or refund, the User should first contact Malappuram Nikah through the grievance/customer-support mechanism provided on the Website.</p>
          <p>Malappuram Nikah shall endeavour to resolve genuine complaints within a reasonable period in accordance with applicable law.</p>
          <p>Grievance Officer / Customer Support: Name: …………….. Email:…………. Phone: …………. Address: ………….</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">17. Amendments to this Policy</h2>
          <p>Malappuram Nikah may amend or update this Policy from time to time to reflect changes in its services, payment mechanisms or applicable laws.</p>
          <p>The revised Policy shall be published on the Website with the updated “Last Updated” date. The revised Policy shall apply prospectively to transactions made after its effective date, unless otherwise required by applicable law.</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">18. Governing Law</h2>
          <p>This Policy shall be governed by and construed in accordance with the laws of India.</p>
          <p>Subject to applicable consumer protection laws and the jurisdiction of competent consumer fora, courts having appropriate jurisdiction in Kerala shall have jurisdiction over disputes arising in connection with this Policy.</p>
          <h2 className="text-sm font-bold text-gray-900 mt-6">19. Contact Us</h2>
          <p>For cancellation, refund or payment-related queries, please contact:</p>
          <p>MalappuramNikah.com Email: ………….. Phone: …………… Website: www.malappuramnikah.com Address: …………….</p>
          <p>By making a payment on MalappuramNikah.com, the User acknowledges that they have read and understood this Refund and Cancellation Policy and the applicable Terms and Conditions.</p>

        </div>
      </div>
    </div>
  );
}
