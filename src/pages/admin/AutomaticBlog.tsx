
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { sendPostToN8N, processAndSaveWebhookResponse } from "@/services/blog/writeBlogPosts";

const AutomaticBlog = () => {
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: 'AI',
    tags: '',
    author: 'Automatizalo',
    date: new Date().toISOString().split('T')[0],
    readTime: '5',
    image: '',
    url: '',
  });
  const [webhookUrl, setWebhookUrl] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();

  const categories = ["AI", "Automation", "Technology", "Marketing", "Productivity"];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({ ...prev, category: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      const { data, error } = await sendPostToN8N(prompt, formData.category, webhookUrl);

      if (error) {
        toast.error(error);
        return;
      }

      if (!data) {
        toast.error("No data received from webhook");
        return;
      }

      const savedPost = await processAndSaveWebhookResponse(data, formData.category);

      if (savedPost) {
        toast.success("Blog post generated and saved successfully!");
        navigate("/admin/blog");
      } else {
        toast.error("Failed to save the generated blog post.");
      }
    } catch (err: any) {
      console.error("Error generating blog post:", err);
      toast.error(`Failed to generate blog post: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Generate Blog Post with AI</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="webhookUrl">Webhook URL</Label>
              <Input
                type="url"
                id="webhookUrl"
                name="webhookUrl"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="Enter webhook URL"
                required
              />
            </div>
            <div>
              <Label htmlFor="prompt">Prompt</Label>
              <Textarea
                id="prompt"
                name="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter prompt for AI"
                required
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select onValueChange={handleCategoryChange} defaultValue={formData.category}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isGenerating}>
              {isGenerating ? "Generating..." : "Generate Blog Post"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AutomaticBlog;
