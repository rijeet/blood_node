import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/middleware/admin-auth';
import { 
  createBlogPost,
  getBlogPosts
} from '@/lib/db/blog';
import { generateSlug } from '@/lib/models/blog';

// GET - Get all blog posts (admin only)
export async function GET(request: NextRequest) {
  return withAdminAuth(async (adminRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const search = searchParams.get('search');
      const status = searchParams.get('status') as 'draft' | 'published' | 'archived' | null;
      const category = searchParams.get('category');
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const sortBy = searchParams.get('sortBy') as 'created_at' | 'published_at' | 'view_count' | 'title' || 'created_at';
      const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc';

      const skip = (page - 1) * limit;

      let posts;
      if (search) {
        posts = await getBlogPosts({
          search: search,
          status: status || undefined,
          category: category || undefined,
          limit,
          skip
        });
      } else {
        posts = await getBlogPosts({
          status: status || undefined,
          category: category || undefined,
          author_id: adminRequest.admin?.id,
          limit,
          skip,
          sortBy,
          sortOrder
        });
      }

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
      console.error('Get blog posts error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(request);
}

// POST - Create new blog post (admin only)
export async function POST(request: NextRequest) {
  return withAdminAuth(async (adminRequest) => {
    try {
      const body = await request.json();
      const {
        title,
        content,
        excerpt,
        featured_image,
        category,
        tags,
        status = 'draft',
        seo_title,
        seo_description
      } = body;

      // Validate required fields
      if (!title || !content) {
        return NextResponse.json(
          { error: 'Title and content are required' },
          { status: 400 }
        );
      }

      // Generate slug from title
      const slug = generateSlug(title);

      // Create blog post
      const blogPost = await createBlogPost({
        title,
        content,
        excerpt: excerpt || content.substring(0, 200) + '...',
        featured_image,
        category,
        tags: tags || [],
        author_id: new (await import('mongodb')).ObjectId(adminRequest.admin!.id),
        author_name: adminRequest.admin!.email,
        status,
        published_at: status === 'published' ? new Date() : undefined,
        seo_title,
        seo_description,
        view_count: 0,
        reading_time: Math.ceil(content.split(' ').length / 200) // Estimate reading time
      });

      return NextResponse.json({
        success: true,
        data: blogPost,
        message: 'Blog post created successfully'
      });

    } catch (error) {
      console.error('Create blog post error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(request);
}
