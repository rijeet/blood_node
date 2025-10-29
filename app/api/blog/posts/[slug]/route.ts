import { NextRequest, NextResponse } from 'next/server';
import { getBlogPostBySlug } from '@/lib/db/blog';

// Public endpoint: get a single published blog post by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const post = await getBlogPostBySlug(slug);
    if (!post || post.status !== 'published') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: post });
  } catch (error) {
    console.error('Public get blog post by slug error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


