import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, CheckCircle2, Share2, Users, X } from "lucide-react";
import { API_URL } from "@/lib/config";

interface ReferralGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReferralGeneratorModal({ isOpen, onClose }: ReferralGeneratorModalProps) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !mobile || !password) {
      setError("Please enter your name, mobile number, and password.");
      return;
    }
    if (mobile.length < 8) {
      setError("Please enter a valid mobile number.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setCopied(false);

    try {
      const response = await fetch(`${API_URL}/user/generate-referral-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, mobile_number: `+91${mobile}`, password }) // default to +91
      });

      const data = await response.json();
      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to generate referral code");
      }

      setReferralCode(data.referralCode);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareText = `Join Malappuram Nikah using my referral code *${referralCode}* to get exclusive benefits!`;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Partner with Us</h2>
              <p className="text-xs font-medium text-brand-600">Generate your referral code</p>
            </div>
            <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 sm:p-8 text-center overflow-y-auto bg-brand-50/30">
            <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-600">
              <Users className="w-8 h-8" />
            </div>
            <p className="text-gray-600 mb-8 max-w-xl mx-auto text-sm">
              Enter your details below to get your unique referral code instantly!
            </p>

            {!referralCode ? (
              <form onSubmit={handleGenerate} className="space-y-4">
                {error && (
                  <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100">
                    {error}
                  </div>
                )}
                
                <div className="text-left">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all bg-white"
                    required
                  />
                </div>

                <div className="text-left">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile Number</label>
                  <div className="flex gap-2">
                    <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 font-medium select-none bg-white">
                      +91
                    </div>
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                      placeholder="Enter 10 digit number"
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all bg-white"
                      maxLength={10}
                      required
                    />
                  </div>
                </div>

                <div className="text-left">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Create Password (to login later)</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a secure password"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all bg-white"
                    minLength={6}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-brand-600 text-white font-medium py-3.5 px-4 rounded-xl hover:bg-brand-700 active:scale-[0.98] transition-all shadow-sm mt-4 flex justify-center items-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
                >
                  {isLoading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Get Referral Code"
                  )}
                </button>
              </form>
            ) : (
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200"
              >
                <h3 className="text-gray-500 text-sm font-medium mb-3 uppercase tracking-wider">Your Unique Code</h3>
                
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-4 mb-6 flex items-center justify-between group">
                  <span className="text-3xl font-bold text-gray-900 font-mono tracking-widest">{referralCode}</span>
                  <button 
                    onClick={handleCopy}
                    className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors focus:outline-none"
                    title="Copy Code"
                  >
                    {copied ? <CheckCircle2 className="w-6 h-6 text-green-500" /> : <Copy className="w-6 h-6" />}
                  </button>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={handleCopy}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white py-3 px-4 rounded-xl font-medium hover:bg-gray-800 transition-colors text-sm"
                  >
                    {copied ? "Copied!" : "Copy Code"}
                  </button>
                  <a 
                    href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 px-4 rounded-xl font-medium hover:bg-[#20bd5a] transition-colors text-sm"
                  >
                    <Share2 className="w-5 h-5" />
                    Share
                  </a>
                </div>
                
                <button 
                  onClick={() => {
                    setReferralCode(null);
                    setName("");
                    setMobile("");
                    setPassword("");
                  }}
                  className="mt-6 text-sm font-medium text-brand-600 hover:text-brand-700 underline underline-offset-4"
                >
                  Generate another code
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
