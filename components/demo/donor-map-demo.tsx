'use client';
import dynamic from 'next/dynamic';
const LeafletMap = dynamic(() => import('./leaflet-map'), { ssr: false });

export default function DonorMapDemo() {
  // Center: Dhaka
  const center: [number, number] = [23.8103, 90.4125];
  // Fake donors with last-donation days; donors < 90 days unavailable, <120 days filtered
  const donors = [
    { lat: 23.818, lng: 90.40, group: 'B+', days: 140 },
    { lat: 23.805, lng: 90.43, group: 'O+', days: 40 },   // unavailable
    { lat: 23.799, lng: 90.39, group: 'B-', days: 200 },
    { lat: 23.825, lng: 90.425, group: 'A+', days: 100 }, // filtered
    { lat: 23.812, lng: 90.445, group: 'AB+', days: 180 },
  ];

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div>
            <h3 className="text-2xl font-bold mb-2">10km Radius Donor Preview</h3>
            <p className="text-sm text-muted-foreground">Shows compatible donors within 10km of your location. Donors with last donation less than 120 days are hidden; under 90 days are marked unavailable.</p>
            <div className="mt-4 flex items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-emerald-600 inline-block" /> Available (120+ days)</span>
              <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-amber-500 inline-block" /> &lt;120 days (filtered)</span>
              <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-red-600 inline-block" /> &lt;90 days (unavailable)</span>
            </div>
          </div>
          <div className="relative z-0 rounded-xl border overflow-hidden">
            <LeafletMap center={center} donors={donors as any} />
          </div>
        </div>
      </div>
    </section>
  );
}


