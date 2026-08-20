const fs = require('fs');
const path = require('path');

const clientAppDir = '/Users/jinsiyajasmin/Documents/malappuramnikah/mn-client/src/app';
const docsDir = '/Users/jinsiyajasmin/Documents/malappuramnikah/mn-api/docs';

const docs = [
  {
    file: 'MN_Privacy_Policy.txt',
    dest: path.join(clientAppDir, 'privacy', 'page.tsx'),
    title: 'Privacy Policy',
    icon: 'ShieldCheck'
  },
  {
    file: 'MN_general terms and conditions.txt',
    dest: path.join(clientAppDir, 'terms', 'page.tsx'),
    title: 'Terms and Conditions',
    icon: 'Scale'
  },
  {
    file: 'MN_Refund_and cancellation_Policy.txt',
    dest: path.join(clientAppDir, 'refund', 'page.tsx'),
    title: 'Refund and Cancellation Policy',
    icon: 'ReceiptRefund'
  }
];

docs.forEach(doc => {
  const content = fs.readFileSync(path.join(docsDir, doc.file), 'utf-8');
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  let jsxContent = `
"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ${doc.icon} } from "lucide-react";

export default function ${doc.title.replace(/\s+/g, '')}Page() {
  return (
    <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <div className="bg-white rounded-2xl p-8 border border-gray-150 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <${doc.icon} className="w-8 h-8 text-brand-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-playfair">${doc.title}</h1>
            <p className="text-xs text-gray-500">Malappuram Nikah Matrimony</p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-gray-700 leading-relaxed">
`;

  // Process the content
  lines.forEach((line, index) => {
    // Skip titles that match the page title (usually first few lines)
    if (index < 5 && line.toUpperCase().includes(doc.title.toUpperCase())) return;
    if (index < 5 && line.toUpperCase().includes('MALAPPURAM NIKAH')) return;
    if (index < 5 && line.toUpperCase().includes('EFFECTIVE DATE:')) return;
    if (index < 5 && line.toUpperCase().includes('WEBSITE:')) return;

    // Check if line is a heading (starts with digit. or is all caps)
    const isHeading = /^(\d+\.)/.test(line) || (/^[A-Z0-9\s\.\,\(\)\-]+$/.test(line) && line.length < 100 && !line.includes('www.') && !line.includes('Email:'));
    
    // Check if it's a list item
    const isListItem = /^[•\-\*a-z]\.\s/.test(line) || /^•/.test(line);

    // Escape React reserved chars in JSX
    const safeLine = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

    if (isHeading) {
      jsxContent += `          <h2 className="text-sm font-bold text-gray-900 mt-6">${safeLine}</h2>\n`;
    } else if (isListItem) {
      const bulletContent = safeLine.replace(/^[•\-\*a-z]\.\s/, '').replace(/^•\s*/, '');
      jsxContent += `          <p className="ml-4 flex gap-2"><span className="text-brand-600">•</span> <span>${bulletContent}</span></p>\n`;
    } else {
      jsxContent += `          <p>${safeLine}</p>\n`;
    }
  });

  jsxContent += `
        </div>
      </div>
    </div>
  );
}
`;

  if (!fs.existsSync(path.dirname(doc.dest))) {
    fs.mkdirSync(path.dirname(doc.dest), { recursive: true });
  }
  fs.writeFileSync(doc.dest, jsxContent);
});

console.log('Pages generated successfully!');
