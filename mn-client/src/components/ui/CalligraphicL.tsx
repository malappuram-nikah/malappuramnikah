"use client";

import { motion } from "framer-motion";

export default function CalligraphicL({ className }: { className?: string }) {
  const pathD = "M 380 340 C 385 390, 370 415, 320 415 C 220 410, 110 365, 75 365 C 50 365, 40 390, 60 405 C 110 430, 170 420, 200 380 C 280 280, 380 165, 440 85 C 470 45, 485 45, 475 60 C 440 130, 360 190, 280 195 C 220 200, 180 170, 185 150";

  return (
    <svg
      viewBox="0 0 500 500"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <style>{`
        @keyframes write-move {
          0% {
            offset-distance: 0%;
            opacity: 0;
            transform: scale(0.5);
          }
          1% {
            opacity: 1;
            transform: scale(1);
          }
          95% {
            offset-distance: 95%;
            opacity: 1;
            transform: scale(1);
          }
          100% {
            offset-distance: 100%;
            opacity: 0;
            transform: scale(0);
          }
        }
        .pen-tip-follow {
          offset-path: path("${pathD}");
          offset-rotate: auto;
          animation: write-move 2.2s cubic-bezier(0.42, 0, 0.58, 1) 0.5s forwards;
          opacity: 0;
        }
      `}</style>
      <defs>
        <mask id="write-mask">
          {/* Skeleton path that draws along the stroke of L from bottom to top */}
          <motion.path
            d={pathD}
            fill="none"
            stroke="white"
            strokeWidth="50"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: 2.2,
              ease: "easeInOut",
              delay: 0.5,
            }}
          />
        </mask>
      </defs>

      {/* The beautiful calligraphic filled shape of L */}
      <path
        d="M 185 130 C 175 140, 170 165, 195 185 C 230 205, 290 205, 350 180 C 410 155, 460 115, 480 65 C 490 40, 480 30, 465 50 C 440 85, 385 155, 330 230 C 275 305, 220 380, 185 410 C 175 420, 160 435, 140 435 C 100 435, 65 425, 45 400 C 35 385, 45 365, 65 365 C 85 365, 120 380, 160 395 C 210 415, 270 425, 320 425 C 370 425, 385 405, 380 340 C 382 355, 375 390, 345 405 C 310 415, 260 415, 210 405 C 160 395, 115 375, 80 360 C 60 350, 50 355, 50 375 C 50 395, 80 415, 120 415 C 155 415, 205 380, 255 330 C 305 280, 355 220, 405 160 C 455 100, 475 65, 470 50 C 465 40, 450 45, 430 60 C 390 100, 340 140, 285 170 C 230 190, 195 185, 185 165 C 180 150, 183 135, 185 130 Z"
        mask="url(#write-mask)"
      />

      {/* Luxury calligraphic pen tip or nib drawing the path */}
      <g className="pen-tip-follow">
        {/* A tiny luxury calligraphic nib / diamond shape */}
        <path
          d="M -3 -8 L 3 -8 L 6 8 L -6 8 Z"
          fill="#d4af37"
          transform="rotate(-15)"
        />
        {/* Subtle glow / ink drop under the nib */}
        <circle r="4" fill="currentColor" opacity="0.8" />
      </g>
    </svg>
  );
}
