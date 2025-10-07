import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/middleware/admin-auth';
import { 
  createBlogCategory,
  getBlogCategories
} from '@/lib/db/blog';
import { generateSlug } from '@/lib/models/blog';

// GET - Get all blog categories (admin only)
export async function GET(request: NextRequest) {
  return withAdminAuth(async (adminRequest) => {
    try {
      const categories = await getBlogCategories();

      return NextResponse.json({
        success: true,
        data: categories
      });

    } catch (error) {
      console.error('Get blog categories error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(request);
}

// POST - Create new blog category (admin only)
export async function POST(request: NextRequest) {
  return withAdminAuth(async (adminRequest) => {
    try {
      const body = await request.json();
      const { name, description, color } = body;

      // Validate required fields
      if (!name) {
        return NextResponse.json(
          { error: 'Category name is required' },
          { status: 400 }
        );
      }

      // Generate slug from name
      const slug = generateSlug(name);

      // Create blog category
      const category = await createBlogCategory({
        name,
        description,
        color: color || '#3B82F6'
      });

      return NextResponse.json({
        success: true,
        data: category,
        message: 'Blog category created successfully'
      });

    } catch (error) {
      console.error('Create blog category error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(request);
}
