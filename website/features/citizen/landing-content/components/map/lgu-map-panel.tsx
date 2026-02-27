"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import type { LguOverviewVM } from "@/lib/domain/landing-content";
import { cn } from "@/lib/ui/utils";
import LguMapPanelPlaceholder from "./lgu-map-panel-placeholder";

type LguMapPanelProps = {
  map: LguOverviewVM["map"];
  heightClass?: string;
};

const LguMapPanelLeaflet = dynamic(() => import("./lgu-map-panel-leaflet"), {
  ssr: false,
  loading: () => null,
});

export default function LguMapPanel({ map, heightClass = "h-[420px]" }: LguMapPanelProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const [isMapReady, setIsMapReady] = useState(false);
  const fadeDuration = reducedMotion ? 0.22 : 0.35;

  return (
    <div className={cn("relative rounded-2xl border border-slate-200 bg-white/70 p-3 backdrop-blur-sm", heightClass)}>
      <motion.div
        className="absolute inset-3 z-20 pointer-events-none"
        animate={{ opacity: isMapReady ? 0 : 1 }}
        transition={{ duration: fadeDuration, ease: "easeOut" }}
      >
        <LguMapPanelPlaceholder />
      </motion.div>

      <motion.div
        className="absolute inset-3 z-10"
        animate={{ opacity: isMapReady ? 1 : 0 }}
        transition={{ duration: fadeDuration, ease: "easeOut" }}
      >
        <LguMapPanelLeaflet map={map} onReady={() => setIsMapReady(true)} />
      </motion.div>
    </div>
  );
}
