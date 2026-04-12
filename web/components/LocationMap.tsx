"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";

type Props = {
  lat: number;
  lng: number;
  name: string;
  className?: string;
};

/**
 * OpenStreetMap-based map via Leaflet (no API key). Tiles: CARTO dark basemap (OSM data).
 */
export function LocationMap({ lat, lng, name, className = "" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let cancelled = false;
    let mapInstance: LeafletMap | null = null;
    setLoadError(null);

    void (async () => {
      try {
        const L = (await import("leaflet")).default;
        if (cancelled || !containerRef.current) return;

        const el = containerRef.current;
        mapInstance = L.map(el, {
          center: [lat, lng],
          zoom: 11,
          scrollWheelZoom: true,
        });

        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 20,
        }).addTo(mapInstance);

        L.circleMarker([lat, lng], {
          radius: 10,
          color: "#c084fc",
          fillColor: "#8400ff",
          fillOpacity: 0.9,
          weight: 2,
        })
          .addTo(mapInstance)
          .bindPopup(name);

        requestAnimationFrame(() => {
          mapInstance?.invalidateSize();
        });
      } catch {
        if (!cancelled)
          setLoadError("Could not load the map. Check your network or try again.");
      }
    })();

    return () => {
      cancelled = true;
      mapInstance?.remove();
    };
  }, [lat, lng, name]);

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className={`min-h-[280px] w-full overflow-hidden rounded-xl border border-zinc-700 ${className}`}
      />
      {loadError ? (
        <p className="text-sm text-amber-400" role="alert">
          {loadError}{" "}
          <a
            className="text-primary-400 underline-offset-2 hover:underline"
            href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=12`}
            target="_blank"
            rel="noreferrer"
          >
            Open in OpenStreetMap
          </a>
        </p>
      ) : null}
    </div>
  );
}
