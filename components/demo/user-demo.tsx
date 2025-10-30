'use client';

import { Activity, Users, Shield, MapPin, Search, Bell, Heart, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function UserDemo() {
  return (
    <section className="relative py-16 md:py-24 bg-background">
      <div className="absolute inset-0 pointer-events-none select-none">
        <div className="mx-auto max-w-6xl h-full opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]">
          <div className="h-full bg-[radial-gradient(circle_at_20%_20%,rgba(239,68,68,0.12),transparent_40%),radial-gradient(circle_at_80%_30%,rgba(59,130,246,0.12),transparent_40%),radial-gradient(circle_at_50%_80%,rgba(16,185,129,0.12),transparent_40%)]" />
        </div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 md:mb-16">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold">Live Preview</span>
          <h2 className="mt-4 text-3xl md:text-5xl font-extrabold tracking-tight">See the app in action</h2>
          <p className="mt-3 text-muted-foreground text-lg max-w-2xl mx-auto">A quick, interactive demo of the dashboard you get after signing in. No data required.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          {/* Left: Info cards */}
          <div className="space-y-6 lg:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <DemoStat title="Your Code" value="MUGOLQNB" icon={<Shield className="h-4 w-4" />} hue="from-rose-500 to-red-600" />
              <DemoStat title="Status" value="Active" icon={<Users className="h-4 w-4" />} hue="from-emerald-500 to-green-600" />
            </div>

            <Card className="group bg-card border overflow-hidden">
              <CardContent className="p-0">
                <div className="p-5 sm:p-6 border-b">
                  <h3 className="text-xl font-semibold">Family Network</h3>
                  <p className="text-sm text-muted-foreground">Manage family connections and blood network</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 sm:p-6">
                  {demoGroups.map((g) => (
                    <DemoGroupCard key={g.type} group={g} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Quick Actions */}
          <div className="space-y-6">
            <Card className="bg-card border">
              <CardContent className="p-5 sm:p-6">
                <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <DemoAction icon={<Search className="h-4 w-4" />} label="Find Blood Donors" />
                  <DemoAction icon={<Bell className="h-4 w-4" />} label="Send Emergency Alert" />
                  <DemoAction icon={<Users className="h-4 w-4" />} label="Manage Family" />
                  <DemoAction icon={<Shield className="h-4 w-4" />} label="Profile Settings" />
                </div>
                <Button className="w-full mt-5">
                  <Heart className="h-4 w-4 mr-2" />
                  Try the full app
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card border">
              <CardContent className="p-5 sm:p-6">
                <h4 className="font-semibold">Location Preview</h4>
                <div className="mt-3 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  <MapPin className="h-5 w-5 mx-auto mb-2" />
                  Location sharing is opt‑in. Demo shows safe defaults.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

function DemoStat({ title, value, icon, hue }: { title: string; value: string; icon: React.ReactNode; hue: string }) {
  return (
    <div className={`relative rounded-xl p-5 sm:p-6 bg-card border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl`}> 
      <div className={`absolute inset-0 rounded-xl pointer-events-none [mask-image:linear-gradient(to_bottom,black,transparent_70%)] bg-gradient-to-br ${hue} opacity-10`} />
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground font-medium">{title}</div>
        <div className="p-2 rounded-md bg-muted text-foreground">{icon}</div>
      </div>
      <div className="mt-3 text-3xl font-extrabold tracking-tight">{value}</div>
    </div>
  );
}

function DemoAction({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button type="button" className="w-full text-left rounded-lg border bg-background hover:bg-accent/50 transition-colors p-3 flex items-center gap-3">
      <span className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-muted">{icon}</span>
      <span className="font-medium">{label}</span>
    </button>
  );
}

type DemoMember = {
  name: string;
  relation: string;
  address: string;
  phone: string;
  lastDonation: string;
  available: boolean;
};

type DemoGroup = {
  type: string; // e.g., A+
  color: string; // tailwind gradient hue base
  count: number;
  members: DemoMember[];
};

const demoGroups: DemoGroup[] = [
  {
    type: 'A+',
    color: 'from-rose-500/15 to-rose-400/10',
    count: 2,
    members: [
      { name: 'Lamia Akter', relation: 'Sibling', address: 'Azimpur 97, Dhaka', phone: '+8801700000097', lastDonation: 'Never', available: true },
      { name: '—', relation: '—', address: '', phone: '', lastDonation: '', available: true }
    ]
  },
  {
    type: 'A-',
    color: 'from-rose-500/15 to-rose-400/10',
    count: 1,
    members: [
      { name: 'Nusrat Jahan', relation: 'Uncle/Aunt', address: 'Gulshan 2, Dhaka', phone: '+8801700000002', lastDonation: 'Never', available: true }
    ]
  },
  {
    type: 'B+',
    color: 'from-sky-500/15 to-indigo-400/10',
    count: 1,
    members: [
      { name: 'Masud Rana', relation: 'Spouse', address: 'Mirpur 1, Dhaka', phone: '+8801787350116', lastDonation: 'Never', available: true }
    ]
  },
  {
    type: 'B-',
    color: 'from-sky-500/15 to-indigo-400/10',
    count: 1,
    members: [
      { name: 'Shamima Parveen', relation: 'Parent', address: 'Paltan 12, Dhaka', phone: '+8801700000012', lastDonation: 'Never', available: true }
    ]
  },
  {
    type: 'AB+',
    color: 'from-fuchsia-500/15 to-purple-400/10',
    count: 1,
    members: [
      { name: 'Md. Habibullah', relation: 'Other', address: 'Uttara 69, Dhaka', phone: '+8801700000069', lastDonation: 'Never', available: true }
    ]
  },
  {
    type: 'AB-',
    color: 'from-fuchsia-500/15 to-purple-400/10',
    count: 1,
    members: [
      { name: 'Khadija Tamanna', relation: 'Niece/Nephew', address: 'Sweet Pee School, Tongi', phone: '+8801700000070', lastDonation: 'Never', available: true }
    ]
  },
  {
    type: 'O+',
    color: 'from-emerald-500/15 to-green-400/10',
    count: 1,
    members: [
      { name: 'Sadia Rahman', relation: 'Niece/Nephew', address: 'Gendaria 95, Dhaka', phone: '+8801700000095', lastDonation: 'Never', available: true }
    ]
  },
  {
    type: 'O-',
    color: 'from-emerald-500/15 to-green-400/10',
    count: 1,
    members: [
      { name: 'Foysal Ahmed', relation: 'Cousin', address: 'Bashundhara 88, Dhaka', phone: '+8801700000088', lastDonation: 'Never', available: true }
    ]
  }
];

function DemoGroupCard({ group }: { group: DemoGroup }) {
  const m = group.members[0];
  return (
    <div className="relative">
      <div className={`relative rounded-xl p-4 bg-card border overflow-hidden transition-all duration-200 hover:shadow-lg`}> 
        <div className={`absolute inset-0 rounded-xl pointer-events-none bg-gradient-to-br ${group.color}`} />
        <div className="flex items-start justify-between">
          <div className="text-sm font-semibold">{group.type}</div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10">{group.count}</span>
        </div>
        <div className="mt-3 space-y-1 text-sm">
          <div className="font-medium">{m.name}</div>
          <div className="text-muted-foreground">{m.relation}</div>
          <div className="text-muted-foreground">{m.address}</div>
          <div className="text-muted-foreground">{m.phone}</div>
          <div className="text-muted-foreground">Last donation: {m.lastDonation}</div>
        </div>
        <div className="mt-3">
          <span className={`inline-flex items-center text-xs font-medium px-2 py-1 rounded-md ${m.available ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}`}>
            {m.available ? 'Available' : 'Unavailable'}
          </span>
        </div>
      </div>
    </div>
  );
}


