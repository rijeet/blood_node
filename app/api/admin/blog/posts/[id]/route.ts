import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/middleware/admin-auth';
import { ObjectId } from 'mongodb';
import { 
  getBlogPostById,
  updateBlogPost,
  deleteBlogPost
} from '@/lib/db/blog';
import { generateSlug } from '@/lib/models/blog';

// GET - Get specific blog post (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(async (adminRequest) => {
    try {
      const resolvedParams = await params;
      const postId = resolvedParams.id;

      const post = await getBlogPostById(new ObjectId(postId));
      if (!post) {
        return NextResponse.json(
          { error: 'Blog post not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: post
      });

    } catch (error) {
      console.error('Get blog post error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(request);
}

// PUT - Update blog post (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(async (adminRequest) => {
    try {
      const resolvedParams = await params;
      const postId = resolvedParams.id;
      const body = await request.json();
      const {
        title,
        content,
        excerpt,
        featured_image,
        category,
        tags,
        status,
        seo_title,
        seo_description
      } = body;

      // Check if post exists
      const existingPost = await getBlogPostById(new ObjectId(postId));
      if (!existingPost) {
        return NextResponse.json(
          { error: 'Blog post not found' },
          { status: 404 }
        );
      }

      // Prepare update data
      const updateData: any = {};
      
      if (title !== undefined) {
        updateData.title = title;
        updateData.slug = generateSlug(title);
      }
      if (content !== undefined) updateData.content = content;
      if (excerpt !== undefined) updateData.excerpt = excerpt;
      if (featured_image !== undefined) updateData.featured_image = featured_image;
      if (category !== undefined) updateData.category = category;
      if (tags !== undefined) updateData.tags = tags;
      if (status !== undefined) {
        updateData.status = status;
        if (status === 'published' && existingPost.status !== 'published') {
          updateData.published_at = new Date();
        }
      }
      if (seo_title !== undefined) updateData.seo_title = seo_title;
      if (seo_description !== undefined) updateData.seo_description = seo_description;

      const updatedPost = await updateBlogPost(new ObjectId(postId), updateData);
      
      if (!updatedPost) {
        return NextResponse.json(
          { error: 'Failed to update blog post' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: updatedPost,
        message: 'Blog post updated successfully'
      });

    } catch (error) {
      console.error('Update blog post error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(request);
}

// DELETE - Delete blog post (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(async (adminRequest) => {
    try {
      const resolvedParams = await params;
      const postId = resolvedParams.id;

      // Check if post exists
      const existingPost = await getBlogPostById(new ObjectId(postId));
      if (!existingPost) {
        return NextResponse.json(
          { error: 'Blog post not found' },
          { status: 404 }
        );
      }

      const deleted = await deleteBlogPost(new ObjectId(postId));
      
      if (!deleted) {
        return NextResponse.json(
          { error: 'Failed to delete blog post' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Blog post deleted successfully'
      });

    } catch (error) {
      console.error('Delete blog post error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(request);
}
