import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Video, 
  Users, 
  Radio,
  Calendar,
  Bell,
  Play,
  Clock
} from "lucide-react";

const liveStreams = [
  {
    id: "1",
    creator: "AlphaWolf",
    title: "Q&A Session - Ask Me Anything!",
    viewers: 234,
    isLive: true,
    thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=225&fit=crop",
    category: "Interactive"
  },
  {
    id: "2",
    creator: "MoonlightPup",
    title: "Behind the Scenes Studio Tour",
    viewers: 156,
    isLive: true,
    thumbnail: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&h=225&fit=crop",
    category: "Exclusive"
  }
];

const upcomingStreams = [
  {
    id: "3",
    creator: "StarlightCreator",
    title: "Special Performance Night",
    scheduledFor: "Today at 8:00 PM",
    subscribers: 892,
    category: "Performance"
  },
  {
    id: "4",
    creator: "WildHeart",
    title: "Exclusive Pack Member Stream",
    scheduledFor: "Tomorrow at 7:00 PM",
    subscribers: 445,
    category: "VIP"
  }
];

export default function Live() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Video className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Live Streams</h1>
          </div>
          <Button
            variant={notificationsEnabled ? "default" : "outline"}
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            data-testid="button-notifications"
          >
            <Bell className="h-4 w-4 mr-2" />
            {notificationsEnabled ? "Notifications On" : "Enable Notifications"}
          </Button>
        </div>
        <p className="text-muted-foreground text-lg">
          Watch your favorite creators live and interact in real-time
        </p>
      </div>

      {liveStreams.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Radio className="h-5 w-5 text-primary animate-pulse" />
            <h2 className="text-2xl font-bold">Live Now</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {liveStreams.map((stream) => (
              <Card key={stream.id} className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`card-live-${stream.id}`}>
                <div className="relative">
                  <img 
                    src={stream.thumbnail} 
                    alt={stream.title}
                    className="w-full h-48 object-cover"
                  />
                  <Badge className="absolute top-3 left-3 bg-red-500">
                    <Radio className="h-3 w-3 mr-1" />
                    LIVE
                  </Badge>
                  <div className="absolute bottom-3 left-3">
                    <div className="flex items-center gap-1 bg-black/70 px-2 py-1 rounded text-white text-sm">
                      <Users className="h-3 w-3" />
                      {stream.viewers}
                    </div>
                  </div>
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{stream.title}</CardTitle>
                      <CardDescription className="mt-1">by {stream.creator}</CardDescription>
                    </div>
                    <Badge variant="outline">{stream.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" data-testid={`button-watch-${stream.id}`}>
                    <Play className="h-4 w-4 mr-2" />
                    Watch Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">Upcoming Streams</h2>
        </div>
        <div className="grid gap-4">
          {upcomingStreams.map((stream) => (
            <Card key={stream.id} data-testid={`card-upcoming-${stream.id}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{stream.title}</h3>
                    <p className="text-muted-foreground mb-2">by {stream.creator}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {stream.scheduledFor}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        {stream.subscribers} interested
                      </div>
                      <Badge variant="outline">{stream.category}</Badge>
                    </div>
                  </div>
                  <Button variant="outline" data-testid={`button-remind-${stream.id}`}>
                    <Bell className="h-4 w-4 mr-2" />
                    Remind Me
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card className="mt-12">
        <CardHeader>
          <CardTitle>About Live Streaming</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Video className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <div className="font-medium">Real-Time Interaction</div>
              <div className="text-sm text-muted-foreground">
                Chat with creators and other fans during live streams
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <div className="font-medium">Exclusive Content</div>
              <div className="text-sm text-muted-foreground">
                Access subscriber-only streams and special events
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Bell className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <div className="font-medium">Never Miss a Stream</div>
              <div className="text-sm text-muted-foreground">
                Get notified when your favorite creators go live
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
