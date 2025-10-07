'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/admin/rich-text-editor';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  Eye, 
  ArrowLeft, 
  X,
  Plus,
  Trash2
} from 'lucide-react';
import { BLOG_CATEGORIES } from '@/lib/models/blog';
import { AdminNav } from '@/components/admin/admin-nav';

interface BlogPostForm {
  title: string;
  content: string;
  excerpt: string;
  featured_image: string;
  category: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  seo_title: string;
  seo_description: string;
}

export default function EditBlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  
  const [formData, setFormData] = useState<BlogPostForm>({
    title: '',
    content: '',
    excerpt: '',
    featured_image: '',
    category: '',
    tags: [],
    status: 'draft',
    seo_title: '',
    seo_description: ''
  });
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (postId) {
      fetchPost();
    }
  }, [postId]);

  const fetchPost = async () => {
    try {
      setInitialLoading(true);
      const response = await fetch(`/api/admin/blog/posts/${postId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch post');
      }

      const data = await response.json();
      const post = data.data;
      
      setFormData({
        title: post.title || '',
        content: post.content || '',
        excerpt: post.excerpt || '',
        featured_image: post.featured_image || '',
        category: post.category || '',
        tags: post.tags || [],
        status: post.status || 'draft',
        seo_title: post.seo_title || '',
        seo_description: post.seo_description || ''
      });
    } catch (error) {
      console.error('Error fetching post:', error);
      alert('Failed to load post');
      router.push('/admin/blog');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleInputChange = (field: keyof BlogPostForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSave = async (status?: 'draft' | 'published' | 'archived') => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Please fill in the title and content');
      return;
    }

    try {
      setLoading(true);
      
      const updateData = status ? { ...formData, status } : formData;
      
      const response = await fetch(`/api/admin/blog/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error('Failed to save post');
      }

      router.push('/admin/blog');
    } catch (error) {
      console.error('Error saving post:', error);
      alert('Failed to save post');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this blog post? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`/api/admin/blog/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete post');
      }

      router.push('/admin/blog');
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    } finally {
      setLoading(false);
    }
  };

  const generateExcerpt = () => {
    if (formData.content) {
      const textContent = formData.content.replace(/<[^>]*>/g, '');
      const excerpt = textContent.substring(0, 200);
      setFormData(prev => ({
        ...prev,
        excerpt: excerpt + (textContent.length > 200 ? '...' : '')
      }));
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Edit Post</h1>
                <p className="text-gray-600 mt-1">Update your blog post</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPreviewMode(!previewMode)}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                {previewMode ? 'Edit' : 'Preview'}
              </Button>
              <Button
                onClick={() => handleSave()}
                disabled={loading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
              <Button
                onClick={() => handleSave('published')}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Publish
              </Button>
              <Button
                onClick={handleDelete}
                disabled={loading}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <Card>
              <CardHeader>
                <CardTitle>Post Title</CardTitle>
                <CardDescription>
                  Enter a compelling title for your blog post
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="Enter post title..."
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="text-xl"
                />
              </CardContent>
            </Card>

            {/* Content */}
            <Card>
              <CardHeader>
                <CardTitle>Content</CardTitle>
                <CardDescription>
                  Write your blog post content using the rich text editor
                </CardDescription>
              </CardHeader>
              <CardContent>
                {previewMode ? (
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: formData.content }}
                  />
                ) : (
                  <RichTextEditor
                    content={formData.content}
                    onChange={(content) => handleInputChange('content', content)}
                    placeholder="Start writing your blog post..."
                  />
                )}
              </CardContent>
            </Card>

            {/* SEO Settings */}
            <Card>
              <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
                <CardDescription>
                  Optimize your post for search engines
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="seo_title">SEO Title</Label>
                  <Input
                    id="seo_title"
                    placeholder="SEO optimized title..."
                    value={formData.seo_title}
                    onChange={(e) => handleInputChange('seo_title', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="seo_description">Meta Description</Label>
                  <Textarea
                    id="seo_description"
                    placeholder="Brief description for search engines..."
                    value={formData.seo_description}
                    onChange={(e) => handleInputChange('seo_description', e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Featured Image */}
            <Card>
              <CardHeader>
                <CardTitle>Featured Image</CardTitle>
                <CardDescription>
                  Add a featured image for your post
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Image URL..."
                  value={formData.featured_image}
                  onChange={(e) => handleInputChange('featured_image', e.target.value)}
                />
                {formData.featured_image && (
                  <div className="relative">
                    <img
                      src={formData.featured_image}
                      alt="Featured"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Category */}
            <Card>
              <CardHeader>
                <CardTitle>Category</CardTitle>
                <CardDescription>
                  Select a category for your post
                </CardDescription>
              </CardHeader>
              <CardContent>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Select a category</option>
                  {BLOG_CATEGORIES.map((category) => (
                    <option key={category.slug} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
                <CardDescription>
                  Add tags to help categorize your post
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <Button onClick={handleAddTag} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleRemoveTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Excerpt */}
            <Card>
              <CardHeader>
                <CardTitle>Excerpt</CardTitle>
                <CardDescription>
                  A brief summary of your post
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Post excerpt..."
                  value={formData.excerpt}
                  onChange={(e) => handleInputChange('excerpt', e.target.value)}
                  rows={4}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateExcerpt}
                >
                  Generate from content
                </Button>
              </CardContent>
            </Card>

            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
                <CardDescription>
                  Choose the publication status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value as 'draft' | 'published' | 'archived')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
