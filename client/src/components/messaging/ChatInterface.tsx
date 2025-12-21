import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Send, 
  Smile, 
  Paperclip, 
  Heart,
  DollarSign,
  Image as ImageIcon
} from "lucide-react";

interface Message {
  id: string;
  fromUserId: string;
  toUserId: string;
  content: string;
  messageType: 'text' | 'image' | 'tip' | 'system';
  mediaPath?: string;
  tipId?: string;
  readAt?: string;
  createdAt: string;
}

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (content: string) => void;
  isOwnMessage: (message: Message) => boolean;
}

export default function ChatInterface({ 
  messages, 
  isLoading, 
  onSendMessage, 
  isOwnMessage 
}: ChatInterfaceProps) {
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Simulate typing indicator
  useEffect(() => {
    let typingTimer: NodeJS.Timeout;
    if (newMessage.length > 0) {
      setIsTyping(true);
      typingTimer = setTimeout(() => setIsTyping(false), 1000);
    } else {
      setIsTyping(false);
    }
    return () => clearTimeout(typingTimer);
  }, [newMessage]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    onSendMessage(newMessage.trim());
    setNewMessage("");
  };

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const renderMessage = (message: Message) => {
    const isOwn = isOwnMessage(message);
    
    if (message.messageType === 'tip') {
      return (
        <div key={message.id} className="flex justify-center mb-4">
          <div className="bg-success/20 border border-success/30 rounded-lg p-4 max-w-sm text-center">
            <Heart className="h-5 w-5 text-success mx-auto mb-2" />
            <p className="font-medium text-success">
              Tip sent: $25.00
            </p>
            <p className="text-sm text-muted mt-1">
              {formatMessageTime(message.createdAt)}
            </p>
          </div>
        </div>
      );
    }

    if (message.messageType === 'system') {
      return (
        <div key={message.id} className="flex justify-center mb-4">
          <div className="bg-muted/20 border border-border rounded-lg p-3 max-w-sm text-center">
            <p className="text-sm text-muted">{message.content}</p>
          </div>
        </div>
      );
    }

    return (
      <div key={message.id} className={`flex mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}>
        {!isOwn && (
          <Avatar className="w-8 h-8 mr-3 mt-1">
            <AvatarImage src={`https://images.unsplash.com/photo-1566753323558-f4e0952af115?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32`} />
            <AvatarFallback className="text-xs">U</AvatarFallback>
          </Avatar>
        )}
        
        <div className={`max-w-xs lg:max-w-md ${isOwn ? 'ml-12' : 'mr-12'}`}>
          <div className={`chat-message ${isOwn ? 'chat-message-sent' : 'chat-message-received'}`}>
            {message.messageType === 'image' && message.mediaPath ? (
              <div className="mb-2">
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted" />
                </div>
              </div>
            ) : null}
            
            <p className="text-sm" data-testid="text-message-content">{message.content}</p>
            
            {!message.readAt && isOwn && (
              <div className="flex items-center justify-end mt-1">
                <div className="w-2 h-2 bg-muted rounded-full"></div>
              </div>
            )}
          </div>
          
          <p className={`text-xs text-muted mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
            {formatMessageTime(message.createdAt)}
          </p>
        </div>
        
        {isOwn && (
          <Avatar className="w-8 h-8 ml-3 mt-1">
            <AvatarImage src={`https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32`} />
            <AvatarFallback className="text-xs bg-primary text-primary-foreground">M</AvatarFallback>
          </Avatar>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 p-4 overflow-y-auto min-h-0"
        data-testid="messages-container"
      >
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <div className="flex items-start space-x-3 max-w-xs">
                  {i % 2 === 0 && <Skeleton className="w-8 h-8 rounded-full" />}
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-48" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  {i % 2 === 1 && <Skeleton className="w-8 h-8 rounded-full" />}
                </div>
              </div>
            ))}
          </div>
        ) : messages.length > 0 ? (
          <div>
            {messages.map(renderMessage)}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start mb-4">
                <Avatar className="w-8 h-8 mr-3 mt-1">
                  <AvatarImage src={`https://images.unsplash.com/photo-1566753323558-f4e0952af115?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32`} />
                  <AvatarFallback className="text-xs">U</AvatarFallback>
                </Avatar>
                <div className="bg-background border border-border rounded-lg p-3 max-w-xs">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Heart className="h-12 w-12 text-muted mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Start the Conversation</h3>
              <p className="text-muted max-w-sm">
                Send a message to start connecting with this pack member
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-border bg-background">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <Button 
            type="button"
            variant="ghost" 
            size="sm" 
            className="flex-shrink-0"
            data-testid="button-attach"
          >
            <Paperclip className="h-4 w-4 text-muted" />
          </Button>
          
          <Button 
            type="button"
            variant="ghost" 
            size="sm" 
            className="flex-shrink-0"
            data-testid="button-tip"
          >
            <DollarSign className="h-4 w-4 text-muted" />
          </Button>
          
          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="form-input pr-10"
              maxLength={1000}
              data-testid="input-message"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1"
              data-testid="button-emoji"
            >
              <Smile className="h-4 w-4 text-muted" />
            </Button>
          </div>
          
          <Button 
            type="submit"
            className="flex-shrink-0 bg-primary text-primary-foreground hover:shadow-volt-glow transition-all duration-200"
            disabled={!newMessage.trim()}
            data-testid="button-send-message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        
        <div className="flex items-center justify-between mt-2 text-xs text-muted">
          <span>
            {newMessage.length}/1000 characters
          </span>
          <div className="flex items-center space-x-4">
            <kbd className="px-1.5 py-0.5 bg-muted/20 rounded text-xs">Enter</kbd>
            <span>to send</span>
          </div>
        </div>
      </div>
    </div>
  );
}
