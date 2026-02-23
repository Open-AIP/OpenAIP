"use client";

import dynamic from "next/dynamic";
import type { LguOverviewVM } from "@/lib/domain/landing-content";
import LguMapPanelPlaceholder from "./LguMapPanelPlaceholder";

type LguMapPanelProps = {
  map: LguOverviewVM["map"];
  heightClass?: string;
};

const LguMapPanelLeaflet = dynamic(() => import("./LguMapPanelLeaflet"), {
  ssr: false,
  loading: () => <LguMapPanelPlaceholder heightClass="h-[420px]" />,
});

export default function LguMapPanel({ map, heightClass = "h-[420px]" }: LguMapPanelProps) {
  return <LguMapPanelLeaflet map={map} heightClass={heightClass} />;
}

