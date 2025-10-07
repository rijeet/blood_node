'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar,
  User,
  Tag,
  Filter,
  MoreVertical
} from 'lucide-react';
import { AdminNav } from '@/components/admin/admin-nav';
import { BlogPost, BLOG_CATEGORIES } from '@/lib/models/blog';

interface BlogPostWithId extends Omit<BlogPost, '_id'> {
  _id: string;
}

export default function AdminBlogPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPostWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchPosts();
  }, [currentPage, statusFilter, categoryFilter, searchTerm]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter);
      }
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/admin/blog/posts?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const data = await response.json();
      setPosts(data.data.map((post: any) => ({
        ...post,
        _id: post._id.toString()
      })));
      setTotalPages(Math.ceil(data.pagination.total / 10));
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/blog/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete post');
      }

      // Refresh posts list
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: 'bg-yellow-100 text-yellow-800', label: 'Draft' },
      published: { color: 'bg-green-100 text-green-800', label: 'Published' },
      archived: { color: 'bg-gray-100 text-gray-800', label: 'Archived' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getCategoryColor = (category: string) => {
    const categoryConfig = BLOG_CATEGORIES.find(cat => cat.name === category);
    return categoryConfig?.color || '#3B82F6';
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-green-50">
      <AdminNav />
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-green-600 shadow-xl border-b-4 border-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div>
              <h1 className="text-4xl font-bold text-white drop-shadow-lg">Blog Management</h1>
              <p className="text-red-100 mt-2 text-lg">Create and manage blog posts</p>
            </div>
            <Button 
              onClick={() => router.push('/admin/blog/new')}
              className="bg-white text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Post
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-8 bg-white/80 backdrop-blur-sm border-2 border-red-200 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-red-500 to-green-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center text-xl">
              <Filter className="h-6 w-6 mr-3" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-bold text-red-700 mb-3">
                  Search Posts
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-400" />
                  <Input
                    placeholder="Search posts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 border-2 border-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 rounded-xl bg-white/50"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-green-700 mb-3">
                  Status Filter
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full h-12 px-4 border-2 border-green-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl bg-white/50 text-gray-700 font-medium"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-red-700 mb-3">
                  Category Filter
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full h-12 px-4 border-2 border-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 rounded-xl bg-white/50 text-gray-700 font-medium"
                >
                  <option value="all">All Categories</option>
                  {BLOG_CATEGORIES.map((category) => (
                    <option key={category.slug} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  onClick={fetchPosts}
                  className="w-full h-12 bg-gradient-to-r from-red-500 to-green-500 hover:from-red-600 hover:to-green-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posts List */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent mx-auto"></div>
              <p className="mt-4 text-xl font-semibold text-red-600">Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <Card className="bg-white/80 backdrop-blur-sm border-2 border-red-200 shadow-xl">
              <CardContent className="text-center py-16">
                <div className="w-24 h-24 bg-gradient-to-r from-red-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Plus className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">No blog posts found</h3>
                <p className="text-gray-600 mb-8 text-lg">Start creating amazing content for your audience</p>
                <Button 
                  onClick={() => router.push('/admin/blog/new')}
                  className="bg-gradient-to-r from-red-500 to-green-500 hover:from-red-600 hover:to-green-600 text-white font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create your first post
                </Button>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post._id} className="bg-white/80 backdrop-blur-sm border-2 border-red-200 hover:border-green-400 hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]">
                <CardContent className="p-8">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        {getStatusBadge(post.status)}
                        <Badge 
                          className="bg-gradient-to-r from-red-500 to-green-500 text-white font-bold px-4 py-2 rounded-full"
                        >
                          {post.category}
                        </Badge>
                      </div>
                      
                      <h3 className="text-2xl font-bold text-gray-800 mb-4 hover:text-red-600 transition-colors duration-300">
                        {post.title}
                      </h3>
                      
                      <p className="text-gray-600 mb-6 line-clamp-2 text-lg leading-relaxed">
                        {post.excerpt}
                      </p>
                      
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-2 bg-red-50 px-3 py-2 rounded-lg">
                          <User className="h-4 w-4 text-red-500" />
                          <span className="font-semibold">{post.author_name}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg">
                          <Calendar className="h-4 w-4 text-green-500" />
                          <span className="font-semibold">{formatDate(post.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                          <Eye className="h-4 w-4 text-blue-500" />
                          <span className="font-semibold">{post.view_count} views</span>
                        </div>
                        <div className="flex items-center gap-2 bg-purple-50 px-3 py-2 rounded-lg">
                          <Tag className="h-4 w-4 text-purple-500" />
                          <span className="font-semibold">{post.tags.length} tags</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 ml-6">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/admin/blog/${post._id}`)}
                        className="bg-green-50 hover:bg-green-100 text-green-600 hover:text-green-700 p-3 rounded-xl transition-all duration-300"
                      >
                        <Edit className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePost(post._id)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 p-3 rounded-xl transition-all duration-300"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-12">
            <div className="flex items-center gap-4 bg-white/80 backdrop-blur-sm border-2 border-red-200 rounded-2xl p-4 shadow-xl">
              <Button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="bg-gradient-to-r from-red-500 to-green-500 hover:from-red-600 hover:to-green-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                Previous
              </Button>
              <span className="px-6 py-3 text-lg font-bold text-gray-700 bg-gradient-to-r from-red-50 to-green-50 rounded-xl">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="bg-gradient-to-r from-red-500 to-green-500 hover:from-red-600 hover:to-green-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
