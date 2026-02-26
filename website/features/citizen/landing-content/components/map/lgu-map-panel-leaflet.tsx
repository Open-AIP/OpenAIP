"use client";

import { useEffect, useMemo } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import type { LguOverviewVM } from "@/lib/domain/landing-content";
import { cn } from "@/ui/utils";

const DEFAULT_MARKER_ICON = {
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
};

// Next.js + Leaflet marker compatibility.
L.Icon.Default.mergeOptions(DEFAULT_MARKER_ICON);

type LguMapPanelLeafletProps = {
  map: LguOverviewVM["map"];
  className?: string;
  onReady?: () => void;
};

type FitMapToMarkersProps = {
  markers: LguOverviewVM["map"]["markers"];
  fallbackCenter: LguOverviewVM["map"]["center"];
  fallbackZoom: number;
};

function FitMapToMarkers({ markers, fallbackCenter, fallbackZoom }: FitMapToMarkersProps) {
  const mapInstance = useMap();

  useEffect(() => {
    if (!markers.length) {
      mapInstance.setView(fallbackCenter, fallbackZoom);
      return;
    }

    if (markers.length === 1) {
      const marker = markers[0];
      mapInstance.setView([marker.lat, marker.lng], Math.max(fallbackZoom, 14));
      return;
    }

    const bounds = L.latLngBounds(markers.map((marker) => [marker.lat, marker.lng] as [number, number]));
    mapInstance.fitBounds(bounds, { padding: [36, 36], maxZoom: 14 });
  }, [fallbackCenter, fallbackZoom, mapInstance, markers]);

  return null;
}

export default function LguMapPanelLeaflet({
  map,
  className,
  onReady,
}: LguMapPanelLeafletProps) {
  const mainMarkerId = useMemo(
    () => map.markers.find((marker) => marker.kind === "main")?.id ?? null,
    [map.markers]
  );

  return (
    <div className={cn("h-full w-full overflow-hidden rounded-xl border border-slate-200", className)}>
      <MapContainer
        center={map.center}
        zoom={map.zoom}
        scrollWheelZoom={false}
        className="h-full w-full"
        aria-label="LGU budget map"
        whenReady={() => onReady?.()}
      >
        <FitMapToMarkers
          markers={map.markers}
          fallbackCenter={map.center}
          fallbackZoom={map.zoom}
        />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {map.markers.map((marker) => (
          <Marker key={marker.id} position={[marker.lat, marker.lng]}>
            <Tooltip
              direction="top"
              offset={[0, -10]}
              permanent={marker.id === mainMarkerId}
              opacity={0.96}
            >
              {marker.label}
            </Tooltip>
            <Popup>
              <div className="space-y-1">
                <p className="text-sm font-semibold">{marker.label}</p>
                {marker.valueLabel ? <p className="text-xs text-slate-600">{marker.valueLabel}</p> : null}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
