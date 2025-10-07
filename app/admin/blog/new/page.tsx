'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Upload,
  X,
  Plus
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
  status: 'draft' | 'published';
  seo_title: string;
  seo_description: string;
}

export default function NewBlogPostPage() {
  const router = useRouter();
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

  const handleSave = async (status: 'draft' | 'published') => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Please fill in the title and content');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/admin/blog/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({
          ...formData,
          status
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save post');
      }

      const data = await response.json();
      router.push('/admin/blog');
    } catch (error) {
      console.error('Error saving post:', error);
      alert('Failed to save post');
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

  useEffect(() => {
    if (formData.title && !formData.seo_title) {
      setFormData(prev => ({
        ...prev,
        seo_title: prev.title
      }));
    }
  }, [formData.title]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-green-50">
      <AdminNav />
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-green-600 shadow-xl border-b-4 border-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div className="flex items-center gap-6">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="flex items-center gap-3 bg-white/20 hover:bg-white/30 text-white font-semibold px-4 py-2 rounded-xl transition-all duration-300"
              >
                <ArrowLeft className="h-5 w-5" />
                Back
              </Button>
              <div>
                <h1 className="text-4xl font-bold text-white drop-shadow-lg">Create New Post</h1>
                <p className="text-red-100 mt-2 text-lg">Write and publish your blog post</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setPreviewMode(!previewMode)}
                className="flex items-center gap-3 bg-white/20 hover:bg-white/30 text-white border-white/30 hover:border-white/50 font-semibold px-4 py-3 rounded-xl transition-all duration-300"
              >
                <Eye className="h-5 w-5" />
                {previewMode ? 'Edit' : 'Preview'}
              </Button>
              <Button
                onClick={() => handleSave('draft')}
                disabled={loading}
                className="flex items-center gap-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <Save className="h-5 w-5" />
                Save Draft
              </Button>
              <Button
                onClick={() => handleSave('published')}
                disabled={loading}
                className="bg-white text-red-600 hover:bg-red-50 hover:text-red-700 font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-3"
              >
                <Save className="h-5 w-5" />
                Publish
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title */}
            <Card className="bg-white/80 backdrop-blur-sm border-2 border-red-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-red-500 to-green-500 text-white rounded-t-lg">
                <CardTitle className="text-xl flex items-center">
                  <span className="mr-3">📝</span>
                  Post Title
                </CardTitle>
                <CardDescription className="text-red-100">
                  Enter a compelling title for your blog post
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <Input
                  placeholder="Enter post title..."
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="text-xl h-14 border-2 border-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 rounded-xl bg-white/50 font-semibold"
                />
              </CardContent>
            </Card>

            {/* Content */}
            <Card className="bg-white/80 backdrop-blur-sm border-2 border-green-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-green-500 to-red-500 text-white rounded-t-lg">
                <CardTitle className="text-xl flex items-center">
                  <span className="mr-3">✍️</span>
                  Content
                </CardTitle>
                <CardDescription className="text-green-100">
                  Write your blog post content using the rich text editor
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {previewMode ? (
                  <div 
                    className="prose max-w-none bg-white/50 p-6 rounded-xl border-2 border-green-200"
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
            <Card className="bg-white/80 backdrop-blur-sm border-2 border-red-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-red-500 to-green-500 text-white rounded-t-lg">
                <CardTitle className="text-xl flex items-center">
                  <span className="mr-3">🔍</span>
                  SEO Settings
                </CardTitle>
                <CardDescription className="text-red-100">
                  Optimize your post for search engines
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <Label htmlFor="seo_title" className="text-lg font-bold text-red-700 mb-3 block">SEO Title</Label>
                  <Input
                    id="seo_title"
                    placeholder="SEO optimized title..."
                    value={formData.seo_title}
                    onChange={(e) => handleInputChange('seo_title', e.target.value)}
                    className="h-12 border-2 border-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 rounded-xl bg-white/50 font-medium"
                  />
                </div>
                <div>
                  <Label htmlFor="seo_description" className="text-lg font-bold text-green-700 mb-3 block">Meta Description</Label>
                  <Textarea
                    id="seo_description"
                    placeholder="Brief description for search engines..."
                    value={formData.seo_description}
                    onChange={(e) => handleInputChange('seo_description', e.target.value)}
                    rows={3}
                    className="border-2 border-green-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl bg-white/50 font-medium"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Featured Image */}
            <Card className="bg-white/80 backdrop-blur-sm border-2 border-green-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-green-500 to-red-500 text-white rounded-t-lg">
                <CardTitle className="text-xl flex items-center">
                  <span className="mr-3">🖼️</span>
                  Featured Image
                </CardTitle>
                <CardDescription className="text-green-100">
                  Add a featured image for your post
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <Input
                  placeholder="Image URL..."
                  value={formData.featured_image}
                  onChange={(e) => handleInputChange('featured_image', e.target.value)}
                  className="h-12 border-2 border-green-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl bg-white/50 font-medium"
                />
                {formData.featured_image && (
                  <div className="relative border-2 border-green-200 rounded-xl overflow-hidden">
                    <img
                      src={formData.featured_image}
                      alt="Featured"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Category */}
            <Card className="bg-white/80 backdrop-blur-sm border-2 border-red-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-red-500 to-green-500 text-white rounded-t-lg">
                <CardTitle className="text-xl flex items-center">
                  <span className="mr-3">📂</span>
                  Category
                </CardTitle>
                <CardDescription className="text-red-100">
                  Select a category for your post
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full h-12 px-4 border-2 border-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 rounded-xl bg-white/50 text-gray-700 font-medium"
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
            <Card className="bg-white/80 backdrop-blur-sm border-2 border-green-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-green-500 to-red-500 text-white rounded-t-lg">
                <CardTitle className="text-xl flex items-center">
                  <span className="mr-3">🏷️</span>
                  Tags
                </CardTitle>
                <CardDescription className="text-green-100">
                  Add tags to help categorize your post
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="flex gap-3">
                  <Input
                    placeholder="Add a tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="h-12 border-2 border-green-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl bg-white/50 font-medium"
                  />
                  <Button 
                    onClick={handleAddTag} 
                    className="bg-gradient-to-r from-green-500 to-red-500 hover:from-green-600 hover:to-red-600 text-white font-bold px-4 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {formData.tags.map((tag) => (
                    <Badge 
                      key={tag} 
                      className="bg-gradient-to-r from-red-500 to-green-500 text-white font-bold px-4 py-2 rounded-full flex items-center gap-2 hover:shadow-lg transition-all duration-300"
                    >
                      {tag}
                      <X
                        className="h-4 w-4 cursor-pointer hover:text-red-200 transition-colors duration-300"
                        onClick={() => handleRemoveTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Excerpt */}
            <Card className="bg-white/80 backdrop-blur-sm border-2 border-red-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-red-500 to-green-500 text-white rounded-t-lg">
                <CardTitle className="text-xl flex items-center">
                  <span className="mr-3">📄</span>
                  Excerpt
                </CardTitle>
                <CardDescription className="text-red-100">
                  A brief summary of your post
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <Textarea
                  placeholder="Post excerpt..."
                  value={formData.excerpt}
                  onChange={(e) => handleInputChange('excerpt', e.target.value)}
                  rows={4}
                  className="border-2 border-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 rounded-xl bg-white/50 font-medium"
                />
                <Button
                  onClick={generateExcerpt}
                  className="w-full bg-gradient-to-r from-red-500 to-green-500 hover:from-red-600 hover:to-green-600 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  Generate from content
                </Button>
              </CardContent>
            </Card>

            {/* Status */}
            <Card className="bg-white/80 backdrop-blur-sm border-2 border-green-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-green-500 to-red-500 text-white rounded-t-lg">
                <CardTitle className="text-xl flex items-center">
                  <span className="mr-3">⚡</span>
                  Status
                </CardTitle>
                <CardDescription className="text-green-100">
                  Choose the publication status
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value as 'draft' | 'published')}
                  className="w-full h-12 px-4 border-2 border-green-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl bg-white/50 text-gray-700 font-medium"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
