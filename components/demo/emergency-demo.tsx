'use client';

import { AlertTriangle, Calendar, Clock, Droplet, Hospital, Phone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function EmergencyDemo() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 md:mb-12">
          <h3 className="text-2xl md:text-3xl font-bold flex items-center justify-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            Emergency Blood Donation Request (Demo)
          </h3>
          <p className="text-sm text-muted-foreground mt-2">Real-time alert preview showing the information donors receive.</p>
        </div>

        <Card className="bg-card border shadow-xl overflow-hidden">
          <CardContent className="p-0">
            <div className="p-5 sm:p-6 border-b">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="inline-flex items-center gap-2">
                  <span className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-red-100 text-red-700">
                    <AlertTriangle className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-sm font-semibold">CRITICAL PRIORITY</div>
                    <div className="text-xs text-muted-foreground">Status: Active</div>
                  </div>
                </div>
                <div className="rounded-lg border px-3 py-2 text-sm">
                  Created • 2025-10-07 10:10 PM
                </div>
              </div>
            </div>

            {/* Patient Info */}
            <div className="p-5 sm:p-6 border-b">
              <h4 className="font-semibold mb-4">Patient's Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoBox title="Blood Group Required" accent="red">
                  <span className="text-2xl font-extrabold text-red-600">B-</span>
                </InfoBox>
                <InfoBox title="Required Blood Bags" accent="amber">
                  <span className="text-2xl font-extrabold text-amber-600">1 bag(s)</span>
                </InfoBox>
                <InfoBox title="Patient's Condition">
                  Operation
                </InfoBox>
                <InfoBox title="Hemoglobin Level" accent="emerald">
                  <span className="text-xl font-bold text-emerald-600">7.5</span>
                </InfoBox>
              </div>
            </div>

            {/* Hospital Details */}
            <div className="p-5 sm:p-6 border-b">
              <h4 className="font-semibold mb-4">Hospital & Donation Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoBox title="Hospital Name">
                  <span className="inline-flex items-center gap-2"><Hospital className="h-4 w-4" /> Square Hospital</span>
                </InfoBox>
                <InfoBox title="Donation Date" accent="violet">
                  <span className="inline-flex items-center gap-2"><Calendar className="h-4 w-4" /> 2025-10-08</span>
                </InfoBox>
                <InfoBox title="Time Required" accent="amber">
                  <span className="inline-flex items-center gap-2"><Clock className="h-4 w-4" /> 14:10 - 16:14</span>
                </InfoBox>
                <InfoBox title="Contact Information" accent="emerald">
                  <span className="inline-flex items-center gap-2"><Phone className="h-4 w-4" /> 01787370114</span>
                </InfoBox>
              </div>
              <div className="mt-4 rounded-lg border p-4 text-sm text-muted-foreground">
                Reference Details: Rijeet
              </div>
            </div>

            {/* Call to action */}
            <div className="p-5 sm:p-6">
              <div className="text-center mb-4">
                <h4 className="text-xl font-semibold text-red-600 inline-flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Can You Help Save a Life?</h4>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-center">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  Yes, I Can Help!
                </Button>
                <Button variant="secondary">Cannot Help Right Now</Button>
              </div>
              <p className="text-center text-xs text-muted-foreground mt-3">This interactive preview shows the emergency alert layout. No actions are sent.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function InfoBox({ title, children, accent }: { title: string; children: React.ReactNode; accent?: 'red' | 'amber' | 'emerald' | 'violet' }) {
  const ring = accent === 'red' ? 'ring-red-200' : accent === 'amber' ? 'ring-amber-200' : accent === 'emerald' ? 'ring-emerald-200' : accent === 'violet' ? 'ring-violet-200' : 'ring-border';
  const bg = accent === 'red' ? 'bg-red-50 dark:bg-red-950/20' : accent === 'amber' ? 'bg-amber-50 dark:bg-amber-950/20' : accent === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-950/20' : accent === 'violet' ? 'bg-violet-50 dark:bg-violet-950/20' : 'bg-muted';
  return (
    <div className={`rounded-lg border ${bg} ring-1 ${ring} p-4`}> 
      <div className="text-sm font-medium mb-1">{title}</div>
      <div className="text-sm">{children}</div>
    </div>
  );
}


