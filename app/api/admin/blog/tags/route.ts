import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/middleware/admin-auth';
import { 
  createBlogTag, 
  getBlogTags,
  getOrCreateBlogTag 
} from '@/lib/db/blog';
import { generateSlug } from '@/lib/models/blog';

// GET - Get all blog tags (admin only)
export async function GET(request: NextRequest) {
  return withAdminAuth(async (adminRequest) => {
    try {
      const tags = await getBlogTags();

      return NextResponse.json({
        success: true,
        data: tags
      });

    } catch (error) {
      console.error('Get blog tags error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(request);
}

// POST - Create new blog tag (admin only)
export async function POST(request: NextRequest) {
  return withAdminAuth(async (adminRequest) => {
    try {
      const body = await request.json();
      const { name } = body;

      // Validate required fields
      if (!name) {
        return NextResponse.json(
          { error: 'Tag name is required' },
          { status: 400 }
        );
      }

      // Create or get existing tag
      const tag = await getOrCreateBlogTag(name);

      return NextResponse.json({
        success: true,
        data: tag,
        message: 'Blog tag created successfully'
      });

    } catch (error) {
      console.error('Create blog tag error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(request);
}
