'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CustomSelect } from '@/components/ui/custom-select';
import { 
  Heart, 
  Users, 
  MapPin, 
  Droplets, 
  Shield, 
  Clock, 
  Calendar,
  CheckCircle,
  Search,
  ArrowRight,
  Phone,
  Mail,
  Globe,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';

const bloodGroups = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
];

const districts = [
  'Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Rangpur', 'Mymensingh'
];

const donorTypes = [
  'All', 'Regular', 'Emergency', 'Plasma', 'Platelet'
];

export default function LandingPage() {
  const [searchForm, setSearchForm] = useState({
    bloodGroup: '',
    district: '',
    date: '',
    donorType: 'All'
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [blogLoading, setBlogLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setBlogLoading(true);
        const response = await fetch('/api/blog/posts?limit=2');
        if (!response.ok) return;
        const data = await response.json();
        setBlogPosts(data.data || []);
      } catch (e) {
        // ignore on landing
      } finally {
        setBlogLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect to main app with search parameters
    const params = new URLSearchParams();
    if (searchForm.bloodGroup) params.set('blood_group', searchForm.bloodGroup);
    if (searchForm.district) params.set('district', searchForm.district);
    if (searchForm.date) params.set('date', searchForm.date);
    if (searchForm.donorType !== 'All') params.set('donor_type', searchForm.donorType);
    
    window.location.href = `/?${params.toString()}`;
  };

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-red-600 text-white sticky top-0 z-50 shadow-lg">
        {/* Top Bar */}
        <div className="bg-red-700 py-2">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center text-sm">
              <div className="flex space-x-4">
                <a href="#" className="hover:text-red-200 transition-colors">
                  <Globe className="h-4 w-4" />
                </a>
                <a href="#" className="hover:text-red-200 transition-colors">
                  <Phone className="h-4 w-4" />
                </a>
                <a href="#" className="hover:text-red-200 transition-colors">
                  <Mail className="h-4 w-4" />
                </a>
              </div>
              <div className="text-sm">
                Emergency: <span className="font-semibold">SMS to 01625524255</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              {/* Logo */}
              <Link href="/" className="flex items-center space-x-2">
                <div className="bg-white rounded-full p-2">
                  <Droplets className="h-8 w-8 text-red-600" />
                </div>
                <span className="text-2xl font-bold">Blood Node</span>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-8">
                <Link href="/" className="hover:text-red-200 transition-colors">Home</Link>
                <Link href="#about" className="hover:text-red-200 transition-colors">About Us</Link>
                <Link href="#features" className="hover:text-red-200 transition-colors">Features</Link>
                <Link href="#pricing" className="hover:text-red-200 transition-colors">Pricing</Link>
                <Link href="#blog" className="hover:text-red-200 transition-colors">Blog</Link>
                <Link href="#faq" className="hover:text-red-200 transition-colors">FAQ</Link>
                <button 
                  onClick={() => window.location.href = '/?view=signup'} 
                  className="hover:text-red-200 transition-colors"
                >
                  Register
                </button>
                <button 
                  onClick={() => window.location.href = '/?view=login'} 
                  className="hover:text-red-200 transition-colors"
                >
                  Login
                </button>
                <Button className="bg-white text-red-600 hover:bg-red-50">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </nav>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>

            {/* Mobile Navigation */}
            {mobileMenuOpen && (
              <div className="md:hidden mt-4 pb-4">
                <nav className="flex flex-col space-y-4">
                  <Link href="/" className="hover:text-red-200 transition-colors">Home</Link>
                  <Link href="#about" className="hover:text-red-200 transition-colors">About Us</Link>
                  <Link href="#features" className="hover:text-red-200 transition-colors">Features</Link>
                  <Link href="#pricing" className="hover:text-red-200 transition-colors">Pricing</Link>
                  <Link href="#blog" className="hover:text-red-200 transition-colors">Blog</Link>
                  <Link href="#faq" className="hover:text-red-200 transition-colors">FAQ</Link>
                  <button 
                    onClick={() => window.location.href = '/?view=signup'} 
                    className="hover:text-red-200 transition-colors"
                  >
                    Register
                  </button>
                  <button 
                    onClick={() => window.location.href = '/?view=login'} 
                    className="hover:text-red-200 transition-colors"
                  >
                    Login
                  </button>
                </nav>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-red-50 to-red-100 py-20 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23dc2626' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Secure family blood network with{' '}
              <span className="text-red-600">end-to-end encryption</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Advanced security and privacy features to protect your family's sensitive health information
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 text-lg"
                onClick={() => window.location.href = '/?view=signup'}
              >
                <Heart className="h-5 w-5 mr-2" />
                Register Now
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-red-600 text-red-600 hover:bg-red-50 px-8 py-4 text-lg"
                onClick={() => window.location.href = '/?view=login'}
              >
                <Shield className="h-5 w-5 mr-2" />
                Login
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Security Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Secure family blood network with end-to-end encryption
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Advanced security and privacy features to protect your family's sensitive health information
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Privacy First */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="bg-blue-600 rounded-full p-3 mr-4">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">🔒 Privacy First</h3>
              </div>
              <p className="text-gray-600 mb-6">
                All your family data is encrypted end-to-end. We never see your private information.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-3 flex-shrink-0" />
                  AES-256-GCM encryption
                </li>
                <li className="flex items-center text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-3 flex-shrink-0" />
                  Browser-only decryption
                </li>
                <li className="flex items-center text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-3 flex-shrink-0" />
                  Shamir Secret Sharing recovery
                </li>
              </ul>
            </div>

            {/* Blood Network */}
            <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-8 border border-red-100 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="bg-red-600 rounded-full p-3 mr-4">
                  <Droplets className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">🩸 Blood Network</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Map your family's blood types and donation history securely.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-3 flex-shrink-0" />
                  Track blood group compatibility
                </li>
                <li className="flex items-center text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-3 flex-shrink-0" />
                  Find nearby donors
                </li>
                <li className="flex items-center text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-3 flex-shrink-0" />
                  Consent-based sharing
                </li>
              </ul>
            </div>

            {/* Global Network */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="bg-green-600 rounded-full p-3 mr-4">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">🌐 Global Network</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Connect with family members worldwide with geolocation privacy.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-3 flex-shrink-0" />
                  Coarse geohash location
                </li>
                <li className="flex items-center text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-3 flex-shrink-0" />
                  Distance-based search
                </li>
                <li className="flex items-center text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-3 flex-shrink-0" />
                  Invite flow with consent
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">What is Blood Node?</h2>
              <p className="text-lg text-gray-600 mb-6">
                Blood Node is an automated blood service that connects blood searchers 
                with voluntary donors in a moment through SMS and web platform. 
                Blood Node is always a free service for all.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-gray-700">100% Automated</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-gray-700">Always free</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-gray-700">24x7 service</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-gray-700">All data is secured</span>
                </div>
              </div>
            </div>
            <div className="bg-red-50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Why Blood Node?</h3>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-red-600 rounded-full p-2">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Secure & Private</h4>
                    <p className="text-gray-600">Your personal information is encrypted and protected</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-red-600 rounded-full p-2">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Real-time Matching</h4>
                    <p className="text-gray-600">Instant connection with compatible donors</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-red-600 rounded-full p-2">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Community Driven</h4>
                    <p className="text-gray-600">Built by and for the blood donation community</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SMS Format Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">SMS Format</h2>
            <p className="text-lg text-gray-600">To place a blood request via SMS</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-red-600 mb-6">NEED</h3>
              <p className="text-gray-600 mb-6">To contact donors when you need blood</p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">FORMAT:</h4>
                  <code className="bg-gray-100 p-3 rounded block text-sm">
                    need group district unit date
                  </code>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">EXAMPLE:</h4>
                  <code className="bg-gray-100 p-3 rounded block text-sm">
                    need O+ Thakurgaon 4 10-9-2024
                  </code>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="bg-red-600 text-white p-6 rounded-2xl inline-block relative">
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-600 transform rotate-45"></div>
                <div className="text-sm font-medium mb-2">SMS Example</div>
                <div className="text-lg font-mono">
                  need O+ Thakurgaon 4 10-9-2024
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search Donors Section */}
      <section id="search" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Search Donors</h2>
            <p className="text-lg text-gray-600">Find compatible blood donors in your area</p>
          </div>

          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-8">
              <form onSubmit={handleSearch} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Blood Group
                    </label>
                    <CustomSelect
                      value={searchForm.bloodGroup}
                      onChange={(value) => setSearchForm(prev => ({ ...prev, bloodGroup: value }))}
                      placeholder="Select"
                      options={bloodGroups.map(group => ({ value: group, label: group }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      District
                    </label>
                    <CustomSelect
                      value={searchForm.district}
                      onChange={(value) => setSearchForm(prev => ({ ...prev, district: value }))}
                      placeholder="Select"
                      options={districts.map(district => ({ value: district, label: district }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Blood Donation
                    </label>
                    <div className="relative">
                      <Input
                        type="date"
                        value={searchForm.date}
                        onChange={(e) => setSearchForm(prev => ({ ...prev, date: e.target.value }))}
                        className="pr-10"
                      />
                      <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Donor Type
                    </label>
                    <CustomSelect
                      value={searchForm.donorType}
                      onChange={(value) => setSearchForm(prev => ({ ...prev, donorType: value }))}
                      options={donorTypes.map(type => ({ value: type, label: type }))}
                    />
                  </div>
                </div>
                <div className="text-center">
                  <Button type="submit" size="lg" className="bg-red-600 hover:bg-red-700 text-white px-8">
                    <Search className="h-5 w-5 mr-2" />
                    Search Donors
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 bg-red-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">We're a network of</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-white rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-red-600" />
              </div>
              <div className="text-4xl font-bold mb-2">1,205</div>
              <div className="text-xl">Donors</div>
            </div>
            <div className="text-center">
              <div className="bg-white rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <MapPin className="h-8 w-8 text-red-600" />
              </div>
              <div className="text-4xl font-bold mb-2">64</div>
              <div className="text-xl">Districts</div>
            </div>
            <div className="text-center">
              <div className="bg-white rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Droplets className="h-8 w-8 text-red-600" />
              </div>
              <div className="text-4xl font-bold mb-2">8</div>
              <div className="text-xl">Blood Groups</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Pricing</h2>
            <p className="text-xl text-gray-600">Simple & Predictable pricing. No Surprises.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-all duration-300">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">$0</div>
                <p className="text-gray-600">Perfect for individuals</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-gray-700">Basic blood type tracking</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-gray-700">Find nearby donors</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-gray-700">Emergency alerts</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-gray-700">Community support</span>
                </li>
              </ul>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => window.location.href = '/?view=signup'}
              >
                Get Started
              </Button>
            </div>

            {/* Family Plan */}
            <div className="bg-white rounded-2xl p-8 border-2 border-red-500 hover:shadow-lg transition-all duration-300 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                  Popular
                </span>
              </div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Family</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">$9.99<span className="text-lg text-gray-600">/month</span></div>
                <p className="text-gray-600">For families and small groups</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-gray-700">All Free features</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-gray-700">Up to 10 family members</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-gray-700">Advanced privacy controls</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-gray-700">Priority support</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-gray-700">Donation history tracking</span>
                </li>
              </ul>
              <Button 
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                onClick={() => window.location.href = '/?view=signup'}
              >
                Get Started
              </Button>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-all duration-300">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">Custom</div>
                <p className="text-gray-600">For hospitals and organizations</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-gray-700">All Family features</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-gray-700">Unlimited users</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-gray-700">API access</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-gray-700">24/7 dedicated support</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-gray-700">Custom integrations</span>
                </li>
              </ul>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => window.location.href = '/?view=signup'}
              >
                Contact Us
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section id="blog" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Latest from our Blog</h2>
            <p className="text-xl text-gray-600">Stay updated with blood donation news and health tips</p>
          </div>

          {blogLoading ? (
            <div className="text-center text-gray-500">Loading posts...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {(blogPosts.length ? blogPosts : []).map((post) => {
                const publishedDate = post.published_at 
                  ? new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                  : '';
                return (
                  <Link key={post._id} href={`/blog/${post.slug}`} className="group">
                    <article className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden h-full flex flex-col transform hover:-translate-y-1">
                      {/* Image */}
                      {post.featured_image ? (
                        <div className="relative h-52 overflow-hidden">
                          <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        </div>
                      ) : (
                        <div className="h-52 bg-gradient-to-br from-red-100 via-pink-100 to-red-200 flex items-center justify-center">
                          <Droplets className="h-16 w-16 text-red-400" />
                        </div>
                      )}

                      {/* Content */}
                      <div className="p-6 flex flex-col flex-grow">
                        {post.category && (
                          <div className="mb-3">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                              {post.category}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                          <Calendar className="h-4 w-4" />
                          <time>{publishedDate}</time>
                          <span className="mx-2">•</span>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{post.reading_time || 2} min read</span>
                          </div>
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-red-600 transition-colors line-clamp-2">{post.title}</h3>
                        <p className="text-gray-600 mb-4 flex-grow line-clamp-3">{post.excerpt}</p>

                        <div className="flex items-center text-red-600 font-semibold group-hover:gap-2 transition-all">
                          <span>Read more</span>
                          <ArrowRight className="h-5 w-5 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </article>
                  </Link>
                );
              })}
              {!blogPosts.length && (
                <div className="col-span-1 md:col-span-2 text-center text-gray-500">No posts available yet.</div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600">Everything you need to know about Blood Node</p>
          </div>

          <div className="space-y-4">
            {[
              {
                question: "How does Blood Node protect my privacy?",
                answer: "Blood Node uses end-to-end encryption (AES-256-GCM) to protect all your data. Your information is encrypted on your device and can only be decrypted by you. We never see your private health information."
              },
              {
                question: "Is Blood Node really free?",
                answer: "Yes! Our basic service is completely free for individual users. We also offer premium family plans for advanced features, but the core blood donation matching service remains free for everyone."
              },
              {
                question: "How do I recover my account if I forget my password?",
                answer: "We use Shamir Secret Sharing for account recovery. When you sign up, you'll receive recovery shares via email that you can use to regain access to your account if you forget your password."
              },
              {
                question: "Can I use Blood Node outside of Bangladesh?",
                answer: "Yes! Blood Node is designed as a global platform. While we started in Bangladesh, our geolocation privacy features allow you to connect with family members and find donors worldwide."
              },
              {
                question: "How accurate is the blood type compatibility matching?",
                answer: "Our blood type compatibility is based on established medical standards. We use the standard ABO and Rh compatibility rules to ensure accurate matching for both emergency situations and regular donations."
              },
              {
                question: "What if I need to contact support?",
                answer: "You can reach our support team through the support page in your dashboard, or email us directly. We offer different support levels based on your plan, with 24/7 support available for enterprise customers."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-inset"
                >
                  <h3 className="text-lg font-bold text-gray-900 pr-4">{faq.question}</h3>
                  <ChevronDown 
                    className={`h-5 w-5 text-gray-500 transition-transform duration-200 flex-shrink-0 ${
                      expandedFAQ === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {expandedFAQ === index && (
                  <div className="px-6 pb-4 border-t border-gray-100">
                    <p className="text-gray-600 pt-4 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Ready to make a difference?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of donors who are saving lives every day. 
            Your blood donation can save up to 3 lives.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 text-lg"
              onClick={() => window.location.href = '/?view=signup'}
            >
              <Heart className="h-5 w-5 mr-2" />
              Register Now
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-red-600 text-red-600 hover:bg-red-50 px-8 py-4 text-lg"
              onClick={() => window.location.href = '/?view=login'}
            >
              <Shield className="h-5 w-5 mr-2" />
              Login
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Droplets className="h-8 w-8 text-red-500" />
                <span className="text-2xl font-bold">Blood Node</span>
              </div>
              <p className="text-gray-400 mb-4">
                Blood Node is an automated blood service that connects blood searchers 
                with voluntary donors in a moment through SMS and website.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Globe className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Phone className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Mail className="h-5 w-5" />
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Important Links</h3>
              <ul className="space-y-2">
                <li><Link href="/" className="text-gray-400 hover:text-white transition-colors">Home</Link></li>
                <li><Link href="#emergency" className="text-gray-400 hover:text-white transition-colors">Emergency Alert</Link></li>
                <li><Link href="#search" className="text-gray-400 hover:text-white transition-colors">Search Blood Donors</Link></li>
                <li><Link href="#about" className="text-gray-400 hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/support" className="text-gray-400 hover:text-white transition-colors">Contact Us</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">About Blood</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">What is blood?</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">What is blood donation?</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Who can donate blood?</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">How often can I donate?</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blood Groups</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              Copyright © Blood Node 2024 - Present | Made with ❤️ for saving lives
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
