"use client";

import { useMemo } from "react";
import { motion } from "motion/react";

interface MapDataPoint {
    country: string;
    clicks: number;
    lat: number;
    lng: number;
}

interface AnalyticsMapProps {
    data: MapDataPoint[];
    loading?: boolean;
}

// Simple world map outline using SVG path (Mercator projection approximation)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const worldPath = `M150,60 Q200,30 250,50 T350,40 Q400,30 450,50 T550,60 Q600,50 650,70
T750,80 Q800,70 850,90 L850,150 Q830,180 800,200 T750,250 Q700,280 650,300
T550,320 Q500,330 450,310 T350,300 Q300,310 250,290 T150,280 Q100,260 80,220
T60,150 Q50,100 80,70 T150,60 M200,100 Q220,120 210,140 T190,130 Q180,110 200,100
M300,80 Q320,90 310,110 T290,100 Q280,85 300,80 M400,70 Q420,80 410,100
T390,90 Q380,75 400,70 M500,60 Q520,70 510,90 T490,80 Q480,65 500,60
M600,80 Q620,90 610,110 T590,100 Q580,85 600,80 M700,90 Q720,100 710,120
T690,110 Q680,95 700,90 M250,200 Q270,210 260,230 T240,220 Q230,205 250,200
M350,220 Q370,230 360,250 T340,240 Q330,225 350,220 M450,240 Q470,250 460,270
T440,260 Q430,245 450,240 M550,260 Q570,270 560,290 T540,280 Q530,265 550,260
M650,280 Q670,290 660,310 T640,300 Q630,285 650,280`;

function latLngToXY(lat: number, lng: number): { x: number; y: number } {
    // Mercator projection simplified
    const x = ((lng + 180) / 360) * 900;
    const y = ((90 - lat) / 180) * 450;
    return { x, y };
}

function getIntensityColor(clicks: number, max: number): string {
    const ratio = max > 0 ? clicks / max : 0;
    if (ratio > 0.7) return "#dc2626"; // red-600
    if (ratio > 0.4) return "#ea580c"; // orange-600
    if (ratio > 0.2) return "#ca8a04"; // yellow-600
    if (ratio > 0.05) return "#16a34a"; // green-600
    return "#3b82f6"; // blue-500
}

export function AnalyticsMap({ data, loading }: AnalyticsMapProps) {
    const { points, maxClicks } = useMemo(() => {
        const valid = data.filter((d) => d.lat !== 0 || d.lng !== 0);
        const max = valid.length > 0 ? Math.max(...valid.map((d) => d.clicks)) : 0;
        return { points: valid, maxClicks: max };
    }, [data]);

    if (loading) {
        return (
            <div className="w-full h-[400px] bg-muted/30 rounded-xl animate-pulse flex items-center justify-center">
                <span className="text-muted-foreground text-sm">Loading map...</span>
            </div>
        );
    }

    if (points.length === 0) {
        return (
            <div className="w-full h-[400px] bg-muted/30 rounded-xl flex items-center justify-center">
                <span className="text-muted-foreground text-sm">No location data yet</span>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="relative w-full aspect-[2/1] bg-slate-50 dark:bg-slate-900 rounded-xl overflow-hidden border">
                <svg viewBox="0 0 900 450" className="w-full h-full">
                    {/* World map background */}
                    <rect width="900" height="450" fill="transparent" />

                    {/* Grid lines */}
                    {[0, 180, 360, 540, 720, 900].map((x) => (
                        <line key={`v${x}`} x1={x} y1={0} x2={x} y2={450} stroke="currentColor" strokeOpacity={0.05} className="text-foreground" />
                    ))}
                    {[0, 90, 180, 270, 360, 450].map((y) => (
                        <line key={`h${y}`} x1={0} y1={y} x2={900} y2={y} stroke="currentColor" strokeOpacity={0.05} className="text-foreground" />
                    ))}

                    {/* Data points */}
                    {points.map((point, i) => {
                        const { x, y } = latLngToXY(point.lat, point.lng);
                        const radius = Math.max(4, Math.min(20, (point.clicks / maxClicks) * 20 + 4));
                        const color = getIntensityColor(point.clicks, maxClicks);

                        return (
                            <g key={`${point.country}-${i}`}>
                                <motion.circle
                                    cx={x}
                                    cy={y}
                                    r={radius}
                                    fill={color}
                                    fillOpacity={0.6}
                                    stroke={color}
                                    strokeWidth={1.5}
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: i * 0.05, duration: 0.4 }}
                                >
                                    <title>{`${point.country}: ${point.clicks} clicks`}</title>
                                </motion.circle>
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
                <span>Low</span>
                {["#3b82f6", "#16a34a", "#ca8a04", "#ea580c", "#dc2626"].map((color) => (
                    <span key={color} className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                ))}
                <span>High</span>
            </div>
        </div>
    );
}
