import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NewsletterManager from "@/components/admin/newsletter/NewsletterManager";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { runQuery } from "@/components/admin/adminActions";
import { NewsletterSubscription } from "@/types/automation";

interface Subscriber {
  id: string;
  email: string;
  frequency: string;
  created_at: string;
}

const NewsletterAdmin = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isAutomationEnabled, setIsAutomationEnabled] = useState(false);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState({
    automation: false,
    subscribers: false
  });

  const checkAutomationStatus = async () => {
    setLoading(prev => ({ ...prev, automation: true }));
    try {
      const { data, error } = await supabase.functions.invoke('check-newsletter-automation', {
        body: {}
      });
      
      if (!error && data) {
        setIsAutomationEnabled(data.enabled);
      }
    } catch (error) {
      console.error("Failed to check automation status:", error);
    } finally {
      setLoading(prev => ({ ...prev, automation: false }));
    }
  };

  const fetchSubscribers = async () => {
    setLoading(prev => ({ ...prev, subscribers: true }));
    try {
      const { data, error } = await runQuery<NewsletterSubscription>(
        `SELECT * FROM newsletter_subscriptions ORDER BY created_at DESC`
      );
        
      if (error) {
        throw error;
      }
      
      // Type safety: ensure we only set valid subscriber objects
      if (data && Array.isArray(data)) {
        const validSubscribers: Subscriber[] = data
          .filter(item => 
            item && 
            typeof item === 'object' && 
            'id' in item && 
            'email' in item && 
            'frequency' in item &&
            'created_at' in item
          )
          .map(item => ({
            id: item.id,
            email: item.email,
            frequency: item.frequency,
            created_at: item.created_at
          }));
            
        setSubscribers(validSubscribers);
      }
    } catch (error) {
      console.error("Failed to fetch subscribers:", error);
    } finally {
      setLoading(prev => ({ ...prev, subscribers: false }));
    }
  };

  // Check automation status on component mount
  useEffect(() => {
    checkAutomationStatus();
    fetchSubscribers();
  }, []);

  if (isMobile) {
    return (
      <div className="container mx-auto px-4 py-4">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-xl font-bold">Newsletter</h1>
          <Button onClick={() => navigate("/admin")} size="sm">Back</Button>
        </div>
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="manager">
            <AccordionTrigger className="font-medium">Newsletter Manager</AccordionTrigger>
            <AccordionContent>
              <div className="bg-white rounded-lg p-4">
                <NewsletterManager 
                  isAutomationEnabled={isAutomationEnabled} 
                  onAutomationToggle={setIsAutomationEnabled} 
                />
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="subscribers">
            <AccordionTrigger className="font-medium">Subscribers</AccordionTrigger>
            <AccordionContent>
              <Card className="border-0 shadow-none">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-base">Newsletter Subscribers</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {loading.subscribers ? (
                    <div className="space-y-3">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ) : subscribers.length === 0 ? (
                    <p className="text-center py-4 text-gray-500 text-sm">No subscribers yet.</p>
                  ) : (
                    <div className="overflow-x-auto -mx-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Frequency</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {subscribers.map((subscriber) => (
                            <TableRow key={subscriber.id}>
                              <TableCell className="text-xs">{subscriber.email}</TableCell>
                              <TableCell className="capitalize text-xs">{subscriber.frequency}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    );
  }

  // Desktop view with tabs
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Newsletter Administration</h1>
        <Button onClick={() => navigate("/admin")}>Back to Admin Dashboard</Button>
      </div>
      
      <Tabs defaultValue="manager" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="manager">Newsletter Manager</TabsTrigger>
          <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
        </TabsList>
        
        <TabsContent value="manager" className="bg-white shadow-md rounded-lg p-6">
          <NewsletterManager 
            isAutomationEnabled={isAutomationEnabled} 
            onAutomationToggle={setIsAutomationEnabled} 
          />
        </TabsContent>
        
        <TabsContent value="subscribers">
          <Card>
            <CardHeader>
              <CardTitle>Newsletter Subscribers</CardTitle>
            </CardHeader>
            <CardContent>
              {loading.subscribers ? (
                <div className="space-y-3">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : subscribers.length === 0 ? (
                <p className="text-center py-6 text-gray-500">No subscribers yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead>Subscribed On</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscribers.map((subscriber) => (
                        <TableRow key={subscriber.id}>
                          <TableCell>{subscriber.email}</TableCell>
                          <TableCell className="capitalize">{subscriber.frequency}</TableCell>
                          <TableCell>{new Date(subscriber.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NewsletterAdmin;
