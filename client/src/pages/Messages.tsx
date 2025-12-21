import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ChatInterface from "@/components/messaging/ChatInterface";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MessageCircle, 
  Search, 
  Users, 
  Phone, 
  Video, 
  MoreHorizontal,
  Heart,
  Star,
  Send
} from "lucide-react";

export default function Messages() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, toast]);

  const { data: conversations, isLoading: conversationsLoading, error: conversationsError } = useQuery({
    queryKey: ['/api/messages/conversations'],
    enabled: isAuthenticated,
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/messages', selectedConversation],
    enabled: isAuthenticated && !!selectedConversation,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { toUserId: string; content: string; messageType?: string }) => {
      await apiRequest('POST', '/api/messages', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages', selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  // WebSocket for real-time messages
  useWebSocket({
    onMessage: (data) => {
      if (data.type === 'new_message') {
        queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
        queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
      }
    },
  });

  // Handle errors
  useEffect(() => {
    if (conversationsError && isUnauthorizedError(conversationsError as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [conversationsError, toast]);

  const handleSendMessage = (content: string) => {
    if (!selectedConversation || !content.trim()) return;
    
    sendMessageMutation.mutate({
      toUserId: selectedConversation,
      content: content.trim(),
      messageType: 'text'
    });
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="pt-40 pb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="neon-heading text-3xl mb-2">
              Pack
              <span className="neon-text-accent ml-2">Messages</span>
            </h1>
            <p className="text-muted">Stay connected with your pack through real-time messaging</p>
          </div>

          <Card className="pack-card h-[calc(100vh-12rem)]">
            <div className="grid lg:grid-cols-3 h-full">
              {/* Conversation List */}
              <div className="border-r border-border bg-background">
                <div className="p-4 border-b border-border">
                  <h3 className="font-semibold text-foreground mb-3">Messages</h3>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="form-input pl-10"
                      data-testid="input-search-conversations"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted" />
                  </div>
                </div>
                
                <div className="overflow-y-auto h-full">
                  {conversationsLoading ? (
                    <div className="space-y-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="p-4">
                          <div className="flex items-center space-x-3">
                            <Skeleton className="w-10 h-10 rounded-lg" />
                            <div className="flex-1">
                              <Skeleton className="h-4 w-24 mb-2" />
                              <Skeleton className="h-3 w-32" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : conversations?.length > 0 ? (
                    conversations.map((conversation: any) => (
                      <div
                        key={conversation.otherUserId}
                        className={`p-4 border-b border-border hover:bg-card/50 transition-colors cursor-pointer ${
                          selectedConversation === conversation.otherUserId ? 'bg-card/50' : ''
                        }`}
                        onClick={() => setSelectedConversation(conversation.otherUserId)}
                        data-testid={`conversation-${conversation.otherUserId}`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={`https://images.unsplash.com/photo-${Math.random() > 0.5 ? '1566753323558-f4e0952af115' : '1507003211169-0a1dd7228f2d'}?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40`} />
                              <AvatarFallback>
                                {conversation.otherUserId.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-success rounded-full border-2 border-background"></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate" data-testid="text-conversation-name">
                              Creator_{conversation.otherUserId.slice(-4)}
                            </p>
                            <p className="text-sm text-muted truncate" data-testid="text-last-message">
                              {conversation.lastMessage || "Start a conversation"}
                            </p>
                          </div>
                          <div className="text-xs text-muted">
                            {conversation.unreadCount > 0 && (
                              <Badge className="bg-primary text-primary-foreground text-xs">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <MessageCircle className="h-12 w-12 text-muted mx-auto mb-4" />
                      <p className="text-muted">No conversations yet</p>
                      <p className="text-sm text-muted mt-2">Start chatting with creators!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Chat Area */}
              <div className="lg:col-span-2 flex flex-col">
                {selectedConversation ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 border-b border-border bg-background flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={`https://images.unsplash.com/photo-${Math.random() > 0.5 ? '1566753323558-f4e0952af115' : '1507003211169-0a1dd7228f2d'}?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40`} />
                          <AvatarFallback>
                            {selectedConversation.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground" data-testid="text-chat-partner">
                            Creator_{selectedConversation.slice(-4)}
                          </p>
                          <p className="text-sm text-success">Online now</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" data-testid="button-video-call">
                          <Video className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" data-testid="button-voice-call">
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" data-testid="button-more-options">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Chat Interface */}
                    <ChatInterface
                      messages={messages || []}
                      isLoading={messagesLoading}
                      onSendMessage={handleSendMessage}
                      isOwnMessage={(msg: any) => msg.fromUserId === user?.id}
                    />
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <MessageCircle className="h-16 w-16 text-muted mx-auto mb-4" />
                      <h3 className="font-semibold text-xl mb-2">Welcome to Pack Messages</h3>
                      <p className="text-muted max-w-sm">
                        Select a conversation from the left to start chatting with your pack members
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
