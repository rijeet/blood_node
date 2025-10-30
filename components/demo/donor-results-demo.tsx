'use client';

import { MapPin, Heart, MessageCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type Donor = {
  name: string;
  code: string;
  group: string;
  location: string;
  donations: number;
  available: boolean;
};

const donors: Donor[] = [
  { name: 'Anwara Islam', code: 'GHL2W4TG', group: 'B+', location: 'Gulistan 35, Dhaka', donations: 0, available: true },
  { name: 'Chayanika Das', code: 'J6Q14SE4', group: 'O+', location: 'Motijheel 39, Dhaka', donations: 0, available: true },
  { name: 'Hena Khatun', code: '4D5ZU60P', group: 'B+', location: 'Mirpur 43, Dhaka', donations: 0, available: true },
  { name: 'Arman Mia', code: '7BA1H79V', group: 'B-', location: 'Shantinagar 44, Dhaka', donations: 0, available: true }
];

export default function DonorResultsDemo() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 md:mb-14">
          <h3 className="text-2xl md:text-3xl font-bold">Search Results</h3>
          <p className="text-sm text-muted-foreground mt-2">Found <span className="text-red-600 dark:text-red-400 font-semibold">21</span> compatible donors within 10km</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {donors.map((d) => (
            <Card key={d.code} className="bg-card border shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-base font-semibold">{d.name}</div>
                    <div className="text-xs text-muted-foreground">{d.code}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${d.available ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}`}>{d.available ? 'Available' : 'Unavailable'}</span>
                </div>

                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-muted"><Heart className="h-4 w-4" /></span>
                    <div>
                      <div className="text-muted-foreground leading-4">Blood Group</div>
                      <div className="font-semibold">{d.group}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-muted"><MapPin className="h-4 w-4" /></span>
                    <div>
                      <div className="text-muted-foreground leading-4">Location</div>
                      <div className="font-medium">{d.location}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-muted"><MessageCircle className="h-4 w-4" /></span>
                    <div>
                      <div className="text-muted-foreground leading-4">Total Donations</div>
                      <div className="font-medium">Donate {d.donations} times</div>
                    </div>
                  </div>
                </div>

                <Button className="w-full mt-5">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contact Donor
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}


