import Link from "next/link";
import Image from "next/image";
import { MessageCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-brand-900 text-white pt-20 pb-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
          
          <div className="lg:pr-8">
            <Link href="/" className="flex items-center mb-6 outline-none">
              <Image
                src="/logoMain-01.svg"
                alt="Malappuram Nikah Logo"
                width={140}
                height={70}
                className="h-14 w-auto object-contain brightness-200"
              />
            </Link>
            <p className="text-brand-300/80 text-sm leading-relaxed mb-6">
              Your trusted partner in finding the perfect life companion. We bring together tradition and modern technology to create meaningful connections.
            </p>
            <div className="flex items-center gap-3">
              {/* Instagram */}
              <a
                href="https://www.instagram.com/mnnikah"
                target="_blank"
                rel="noopener noreferrer"
                title="Instagram"
                className="w-10 h-10 rounded-full bg-brand-700 border border-brand-600 flex items-center justify-center hover:bg-brand-500 hover:border-brand-500 transition-all text-brand-300 hover:text-white"
              >
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                </svg>
              </a>

              {/* LinkedIn */}
              <a
                href="https://www.linkedin.com/company/malappuramnikah/"
                target="_blank"
                rel="noopener noreferrer"
                title="LinkedIn"
                className="w-10 h-10 rounded-full bg-brand-700 border border-brand-600 flex items-center justify-center hover:bg-brand-500 hover:border-brand-500 transition-all text-brand-300 hover:text-white"
              >
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.72a1.63 1.63 0 1 0 0 3.26 1.63 1.63 0 0 0 0-3.26z"/>
                </svg>
              </a>

              {/* WhatsApp */}
              <a
                href="https://wa.me/919946341443"
                target="_blank"
                rel="noopener noreferrer"
                title="WhatsApp"
                className="w-10 h-10 rounded-full bg-brand-700 border border-brand-600 flex items-center justify-center hover:bg-brand-500 hover:border-brand-500 transition-all text-brand-300 hover:text-white"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-base font-semibold text-white mb-6">Quick Links</h4>
            <ul className="space-y-4 text-sm text-brand-300/80">
              <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Premium Plans</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-base font-semibold text-white mb-6">Legal</h4>
            <ul className="space-y-4 text-sm text-brand-300/80">
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/refund" className="hover:text-white transition-colors">Refund Policy</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-base font-semibold text-white mb-6">Contact Us</h4>
            <ul className="space-y-4 text-sm text-brand-300/80">
              <li className="flex items-start">
                <span className="block mt-0.5 mr-3 w-1.5 h-1.5 rounded-full bg-brand-300 shrink-0" />
                Malappuram, Kerala, India
              </li>
              <li className="flex items-start">
                <span className="block mt-0.5 mr-3 w-1.5 h-1.5 rounded-full bg-brand-300 shrink-0" />
                support@malappuramnikah.com
              </li>
              <li className="flex items-start">
                <span className="block mt-0.5 mr-3 w-1.5 h-1.5 rounded-full bg-brand-300 shrink-0" />
                <span>Call: <a href="tel:+919447868443" className="hover:text-white transition-colors">+91 94478 68443</a></span>
              </li>
              <li className="flex items-start">
                <span className="block mt-0.5 mr-3 w-1.5 h-1.5 rounded-full bg-brand-300 shrink-0" />
                <span>WhatsApp: <a href="https://wa.me/919946341443" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">+91 99463 41443</a></span>
              </li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-brand-700 text-sm text-brand-300/60 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>&copy; {new Date().getFullYear()} Malappuram Nikah. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <span className="text-brand-300 mx-1">♥</span> in Kerala
          </p>
        </div>
      </div>
    </footer>
  );
}
