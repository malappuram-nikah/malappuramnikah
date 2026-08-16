"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Home, LayoutDashboard, SearchX } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface NotFoundPageProps {
  variant?: "site" | "admin";
}

export default function NotFoundPage({ variant = "site" }: NotFoundPageProps) {
  const { status, isAdmin } = useAuth();
  const isAuthenticated = status === "authenticated";

  const primaryHref =
    variant === "admin"
      ? "/admin"
      : isAuthenticated
        ? isAdmin
          ? "/admin"
          : "/dashboard"
        : "/";

  const primaryLabel =
    variant === "admin"
      ? "Back to Admin Dashboard"
      : isAuthenticated
        ? isAdmin
          ? "Go to Admin Dashboard"
          : "Go to Dashboard"
        : "Back to Home";

  const PrimaryIcon = variant === "admin" || (isAuthenticated && isAdmin) ? LayoutDashboard : Home;

  const isEmbedded = variant === "admin";

  return (
    <div
      className={
        isEmbedded
          ? "min-h-[70vh] flex items-center justify-center px-4 py-10"
          : "min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 py-12 relative overflow-hidden"
      }
    >
      {!isEmbedded && (
        <>
          <div className="absolute top-0 left-1/4 w-[40rem] h-[40rem] bg-brand-100/30 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] bg-teal-50/40 rounded-full blur-[100px] translate-y-1/2 translate-x-1/2 pointer-events-none" />
        </>
      )}

      <div className="relative w-full max-w-lg">
        <div className="bg-white rounded-2xl border border-gray-150 shadow-xl p-8 sm:p-10 text-center">
          <Link
            href={variant === "admin" ? "/admin" : "/"}
            className="inline-flex justify-center mb-8 outline-none"
          >
            <Image
              src="/logoMain-01.svg"
              alt="Malappuram Nikah"
              width={150}
              height={75}
              className="h-14 sm:h-16 w-auto object-contain"
              priority
            />
          </Link>

          <div className="relative mx-auto mb-6 w-fit">
            <div className="absolute inset-0 bg-brand-50 rounded-2xl rotate-3 scale-110" />
            <div className="relative px-6 py-3 rounded-2xl border border-brand-100 bg-white/80 backdrop-blur-sm">
              <p className="text-6xl sm:text-7xl font-bold font-playfair text-brand-600 leading-none tracking-tight">
                404
              </p>
            </div>
          </div>

          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 border border-brand-100">
            <SearchX className="h-6 w-6" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold font-playfair text-gray-900 mb-2">
            {variant === "admin" ? "Admin page not found" : "Page not found"}
          </h1>

          <p className="text-sm text-gray-500 leading-relaxed max-w-sm mx-auto mb-8">
            {variant === "admin"
              ? "This admin route does not exist or may have been moved."
              : "The page you are looking for does not exist, may have been removed, or the link might be incorrect."}
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            <Link
              href={primaryHref}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-brand-600/10"
            >
              <PrimaryIcon className="w-4 h-4" />
              {primaryLabel}
            </Link>

            {variant === "site" && !isAuthenticated && (
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white hover:bg-gray-50 text-brand-700 text-sm font-semibold rounded-xl border border-brand-200 transition-colors"
              >
                Sign In
              </Link>
            )}

            {variant === "site" && isAuthenticated && !isAdmin && (
              <Link
                href="/dashboard/search"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white hover:bg-gray-50 text-brand-700 text-sm font-semibold rounded-xl border border-brand-200 transition-colors"
              >
                Browse Matches
              </Link>
            )}
          </div>

          {variant === "site" && (
            <button
              type="button"
              onClick={() => window.history.back()}
              className="mt-6 inline-flex items-center justify-center gap-1.5 text-xs font-medium text-gray-500 hover:text-brand-600 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Go back to previous page
            </button>
          )}
        </div>

        {!isEmbedded && (
          <p className="text-center text-xs text-gray-400 mt-6">
            Malappuram Nikah · Premium Matrimony
          </p>
        )}
      </div>
    </div>
  );
}
