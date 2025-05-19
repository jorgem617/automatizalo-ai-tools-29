import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import BlogFormContainer from "@/components/admin/blog/BlogFormContainer";
import TranslationTools from "@/components/admin/blog/TranslationTools";
import { BlogPost } from "@/types/blog";
import { BlogFormData, TranslationFormData } from "@/types/form";
import { toast } from "sonner";
import { Editor } from "@tinymce/tinymce-react";
import { getTranslations } from "@/services/blog/translationService";

const BlogPostForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [editingTranslation, setEditingTranslation] = useState(false);
  
  const [formData, setFormData] = useState<BlogFormData>({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "Technology",
    tags: "",
    author: "",
    date: new Date().toISOString().split('T')[0],
    readTime: "5",
    image: "",
    featured: false,
    status: 'draft',
    translations: {
      fr: { title: "", excerpt: "", content: "" },
      es: { title: "", excerpt: "", content: "" }
    }
  });

  const [translationData, setTranslationData] = useState<TranslationFormData>({
    fr: { title: "", excerpt: "", content: "" },
    es: { title: "", excerpt: "", content: "" }
  });

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("You must be logged in to create or update posts");
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const fetchBlogPost = async (id: string) => {
    try {
      const response = await fetch(`/api/blog/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setPost(data);
      setFormData({
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: data.content,
        category: data.category,
        tags: data.tags ? data.tags.join(", ") : "",
        author: data.author,
        date: data.date.split('T')[0],
        readTime: data.readTime,
        image: data.image,
        featured: data.featured || false,
        status: data.status || 'draft',
        translations: data.translations || {
          fr: { title: "", excerpt: "", content: "" },
          es: { title: "", excerpt: "", content: "" }
        }
      });
    } catch (error) {
      console.error("Error fetching blog post:", error);
      toast.error("Failed to load blog post");
    }
  };

  useEffect(() => {
    if (id) {
      fetchBlogPost(id);
      // Load translations if editing
      loadTranslations(id);
    }
  }, [id]);

  const loadTranslations = async (postId: string) => {
    try {
      const translations = await getTranslations(postId);
      
      const frTranslation = translations.find(t => t.language === 'fr');
      const esTranslation = translations.find(t => t.language === 'es');

      setTranslationData({
        fr: {
          title: frTranslation?.title || '',
          excerpt: frTranslation?.excerpt || '',
          content: frTranslation?.content || ''
        },
        es: {
          title: esTranslation?.title || '',
          excerpt: esTranslation?.excerpt || '',
          content: esTranslation?.content || ''
        }
      });
    } catch (error) {
      console.error("Error loading translations:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, category: value }));
  };

  const handleEditorChange = (content: string) => {
    setFormData(prev => ({ ...prev, content: content }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, date: e.target.value }));
  };

  const handleTranslationChange = (lang: 'fr' | 'es', field: 'title' | 'excerpt' | 'content', value: string) => {
    setTranslationData(prev => ({
      ...prev,
      [lang]: {
        ...prev[lang],
        [field]: value
      }
    }));
  };

  return (
    <BlogFormContainer 
      id={id}
      formData={formData}
      setFormData={setFormData}
      translationData={translationData}
      editingTranslation={editingTranslation}
    >
      <div className="container py-10">
        <div className="grid gap-6">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input
              type="text"
              id="slug"
              name="slug"
              value={formData.slug}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              name="excerpt"
              value={formData.excerpt}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <Label htmlFor="content">Content</Label>
            <Editor
              apiKey="YOUR_API_KEY"
              value={formData.content}
              init={{
                height: 500,
                menubar: true,
                plugins: [
                  'advlist autolink lists link image charmap print preview anchor',
                  'searchreplace visualblocks code fullscreen',
                  'insertdatetime media table paste code help wordcount'
                ],
                toolbar:
                  'undo redo | formatselect | ' +
                  'bold italic backcolor | alignleft aligncenter ' +
                  'alignright alignjustify | bullist numlist outdent indent | ' +
                  'removeformat | help'
              }}
              onEditorChange={handleEditorChange}
            />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select onValueChange={handleSelectChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a category" defaultValue={formData.category} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Technology">Technology</SelectItem>
                <SelectItem value="AI">AI</SelectItem>
                <SelectItem value="Automation">Automation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <Label htmlFor="author">Author</Label>
            <Input
              type="text"
              id="author"
              name="author"
              value={formData.author}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <Label htmlFor="date">Date</Label>
              <Input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleDateChange}
              />
          </div>

          <div>
            <Label htmlFor="readTime">Read Time (minutes)</Label>
            <Input
              type="number"
              id="readTime"
              name="readTime"
              value={formData.readTime}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <Label htmlFor="image">Image URL</Label>
            <Input
              type="text"
              id="image"
              name="image"
              value={formData.image}
              onChange={handleInputChange}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Label htmlFor="featured">Featured</Label>
            <Switch
              id="featured"
              name="featured"
              checked={formData.featured || false}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: checked }))}
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as 'draft' | 'published' }))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select status" defaultValue={formData.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-md p-4">
            <h3 className="text-xl font-semibold mb-4">Translations</h3>
            <TranslationTools 
              id={id}
              post={post}
              formData={formData}
              setFormData={setFormData}
              translationData={translationData}
              setTranslationData={setTranslationData}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <h4 className="text-lg font-medium">French Translation</h4>
                <Input
                  type="text"
                  placeholder="Title (French)"
                  value={translationData.fr.title}
                  onChange={(e) => handleTranslationChange('fr', 'title', e.target.value)}
                />
                <Textarea
                  placeholder="Excerpt (French)"
                  className="mt-2"
                  value={translationData.fr.excerpt}
                  onChange={(e) => handleTranslationChange('fr', 'excerpt', e.target.value)}
                />
                <Editor
                  apiKey="YOUR_API_KEY"
                  value={translationData.fr.content}
                  init={{
                    height: 300,
                    menubar: false,
                    plugins: [
                      'advlist autolink lists link image charmap print preview anchor',
                      'searchreplace visualblocks code fullscreen',
                      'insertdatetime media table paste code help wordcount'
                    ],
                    toolbar:
                      'undo redo | formatselect | ' +
                      'bold italic backcolor | alignleft aligncenter ' +
                      'alignright alignjustify | bullist numlist outdent indent | ' +
                      'removeformat | help'
                  }}
                  onEditorChange={(content) => handleTranslationChange('fr', 'content', content)}
                />
              </div>

              <div>
                <h4 className="text-lg font-medium">Spanish Translation</h4>
                <Input
                  type="text"
                  placeholder="Title (Spanish)"
                  value={translationData.es.title}
                  onChange={(e) => handleTranslationChange('es', 'title', e.target.value)}
                />
                <Textarea
                  placeholder="Excerpt (Spanish)"
                  className="mt-2"
                  value={translationData.es.excerpt}
                  onChange={(e) => handleTranslationChange('es', 'excerpt', e.target.value)}
                />
                <Editor
                  apiKey="YOUR_API_KEY"
                  value={translationData.es.content}
                  init={{
                    height: 300,
                    menubar: false,
                    plugins: [
                      'advlist autolink lists link image charmap print preview anchor',
                      'searchreplace visualblocks code fullscreen',
                      'insertdatetime media table paste code help wordcount'
                    ],
                    toolbar:
                      'undo redo | formatselect | ' +
                      'bold italic backcolor | alignleft aligncenter ' +
                      'alignright alignjustify | bullist numlist outdent indent | ' +
                      'removeformat | help'
                  }}
                  onEditorChange={(content) => handleTranslationChange('es', 'content', content)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </BlogFormContainer>
  );
};

export default BlogPostForm;
