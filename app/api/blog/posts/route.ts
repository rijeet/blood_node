import { NextRequest, NextResponse } from 'next/server';
import { getBlogPosts } from '@/lib/db/blog';

// Public endpoint: list published blog posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category') || undefined;
    const tag = searchParams.get('tag') || undefined;

    const skip = (page - 1) * limit;

    const posts = await getBlogPosts({
      status: 'published',
      category,
      tag,
      limit,
      skip,
      sortBy: 'published_at',
      sortOrder: 'desc'
    });

    return NextResponse.json({
      success: true,
      data: posts,
      pagination: {
        page,
        limit,
        total: posts.length
      }
    });
  } catch (error) {
    console.error('Public get blog posts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


