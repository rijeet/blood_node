import { ObjectId } from 'mongodb';

export interface BlogPost {
  _id?: ObjectId;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image?: string;
  category: string;
  tags: string[];
  author_id: ObjectId;
  author_name: string;
  status: 'draft' | 'published' | 'archived';
  published_at?: Date;
  created_at: Date;
  updated_at: Date;
  view_count: number;
  seo_title?: string;
  seo_description?: string;
  reading_time: number; // in minutes
}

export interface BlogCategory {
  _id?: ObjectId;
  name: string;
  slug: string;
  description?: string;
  color: string;
  created_at: Date;
  updated_at: Date;
}

export interface BlogTag {
  _id?: ObjectId;
  name: string;
  slug: string;
  created_at: Date;
  updated_at: Date;
}

export const BLOG_CATEGORIES = [
  { name: 'AI & VR', slug: 'ai-vr', color: '#3B82F6' },
  { name: 'Customer Success', slug: 'customer-success', color: '#F59E0B' },
  { name: 'Growth', slug: 'growth', color: '#10B981' },
  { name: 'Productivity', slug: 'productivity', color: '#3B82F6' },
  { name: 'Security', slug: 'security', color: '#1E40AF' },
  { name: 'Technology', slug: 'technology', color: '#8B5CF6' },
  { name: 'Blood Donation', slug: 'blood-donation', color: '#DC2626' },
  { name: 'Healthcare', slug: 'healthcare', color: '#059669' },
  { name: 'Privacy', slug: 'privacy', color: '#7C3AED' }
] as const;

export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
