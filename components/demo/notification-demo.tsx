'use client';

import { Bell, AlertTriangle, MapPin, Check, X, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function NotificationDemo() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="bg-card border shadow-lg">
          <CardContent className="p-0">
            <div className="p-5 sm:p-6 border-b flex items-start justify-between">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  <Bell className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-xl font-semibold">Notifications</div>
                  <p className="text-sm text-muted-foreground">Stay updated with nearby emergency alerts and important notifications</p>
                </div>
              </div>
              <Button variant="secondary">Mark all read</Button>
            </div>

            <div className="p-5 sm:p-6">
              <div className="rounded-xl border p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-700">
                    <AlertTriangle className="h-4 w-4" />
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="font-semibold">Emergency Blood Alert</div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">CRITICAL</span>
                    </div>
                    <p className="mt-2 text-sm">CRITICAL - B- blood needed near 23.8200, 90.3600</p>
                    <div className="mt-3 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                      <MapPin className="h-4 w-4" /> 23.8200, 90.3600
                      <ExternalLink className="h-4 w-4 opacity-60" />
                    </div>
                    <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                      <span className="text-xs rounded-md bg-muted px-3 py-1">Just now</span>
                      <div className="flex gap-2">
                        <Button className="bg-red-600 hover:bg-red-700"><ExternalLink className="h-4 w-4 mr-2" />Respond to Alert</Button>
                        <Button variant="secondary"><Check className="h-4 w-4" /></Button>
                        <Button variant="secondary"><X className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}


