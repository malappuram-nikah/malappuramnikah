"use client";

import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { apiClient } from "@/lib/apiClient";

interface StatItem {
  numericValue: number;
  suffix: string;
  label: string;
}

export default function StatsSection() {
  const [statsData, setStatsData] = useState({
    registeredMembers: 50,
    happyMarriages: 12,
    verifiedPercentage: 98,
    yearsOfTrust: 5,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchStats() {
      try {
        const response = await apiClient.get<{
          success: boolean;
          stats: {
            registeredMembers: number;
            happyMarriages: number;
            verifiedPercentage: number;
            yearsOfTrust: number;
          };
        }>("/user/public-stats");

        if (isMounted && response?.success && response.stats) {
          setStatsData({
            registeredMembers: response.stats.registeredMembers || 0,
            happyMarriages: response.stats.happyMarriages || 0,
            verifiedPercentage: response.stats.verifiedPercentage || 98,
            yearsOfTrust: response.stats.yearsOfTrust || 1,
          });
          setIsLoaded(true);
        }
      } catch (err) {
        console.error("Failed to load live public stats:", err);
      }
    }
    fetchStats();
    return () => {
      isMounted = false;
    };
  }, []);

  const statsList: StatItem[] = [
    {
      numericValue: statsData.registeredMembers,
      suffix: "+",
      label: "Registered Members",
    },
    {
      numericValue: statsData.happyMarriages,
      suffix: "+",
      label: "Happy Marriages",
    },
    {
      numericValue: statsData.verifiedPercentage,
      suffix: "%",
      label: "Verified Profiles",
    },
    {
      numericValue: statsData.yearsOfTrust,
      suffix: "+",
      label: "Years of Trust",
    },
  ];

  return (
    <section className="py-14 sm:py-16 bg-[#026d77] relative overflow-hidden text-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[size:32px_32px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4 text-center">
          {statsList.map((stat, index) => (
            <StatCard key={`${index}-${stat.numericValue}`} stat={stat} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StatCard({ stat, index }: { stat: StatItem; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="flex flex-col items-center justify-center"
    >
      <h3 className="text-4xl sm:text-5xl font-bold font-playfair text-white tracking-tight mb-2">
        <AnimatedCounter value={stat.numericValue} suffix={stat.suffix} />
      </h3>
      <p className="text-brand-100 text-sm sm:text-base font-medium tracking-wide">
        {stat.label}
      </p>
    </motion.div>
  );
}

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-20px" });
  const motionVal = useMotionValue(0);
  const displayVal = useTransform(motionVal, (current) => {
    return Math.floor(current).toLocaleString("en-IN");
  });

  useEffect(() => {
    if (isInView) {
      const controls = animate(motionVal, value, {
        duration: 1.8,
        ease: [0.16, 1, 0.3, 1],
      });
      return () => controls.stop();
    }
  }, [isInView, value, motionVal]);

  return (
    <span ref={ref} className="inline-flex items-baseline">
      <motion.span>{displayVal}</motion.span>
      {suffix && <span>{suffix}</span>}
    </span>
  );
}
