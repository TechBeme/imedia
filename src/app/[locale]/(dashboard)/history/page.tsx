"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  RiInstagramLine,
  RiYoutubeLine,
  RiFacebookCircleLine,
  RiHeartLine,
  RiMessage3Line,
  RiShareForwardLine,
  RiEyeLine,
} from "react-icons/ri";

const mockHistory = [
  { id: 1, content: "Summer collection drop!", platform: "instagram", date: "2026-05-01", likes: 245, comments: 32, shares: 12, views: 1200 },
  { id: 2, content: "How to style your outfits", platform: "youtube", date: "2026-04-30", likes: 890, comments: 120, shares: 45, views: 5600 },
  { id: 3, content: "Quick tip of the day", platform: "instagram", date: "2026-04-29", likes: 180, comments: 18, shares: 8, views: 900 },
  { id: 4, content: "Weekly vlog is live", platform: "youtube", date: "2026-04-28", likes: 1200, comments: 200, shares: 80, views: 8900 },
  { id: 5, content: "New blog post", platform: "facebook", date: "2026-04-27", likes: 95, comments: 14, shares: 22, views: 600 },
];

const platformColors: Record<string, string> = {
  instagram: "text-pink-500",
  youtube: "text-red-500",
  facebook: "text-blue-600",
};

export default function HistoryPage() {
  const t = useTranslations("dashboard");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">History</h1>
        <p className="text-muted-foreground">Your published content</p>
      </div>

      <div className="space-y-3">
        {mockHistory.map((post) => {
          const PlatformIcon = post.platform === "instagram" ? RiInstagramLine : post.platform === "youtube" ? RiYoutubeLine : RiFacebookCircleLine;
          return (
            <Card key={post.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`mt-0.5 ${platformColors[post.platform]}`}>
                      <PlatformIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{post.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">{post.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <RiHeartLine className="h-3.5 w-3.5" /> {post.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <RiMessage3Line className="h-3.5 w-3.5" /> {post.comments}
                    </span>
                    <span className="flex items-center gap-1">
                      <RiShareForwardLine className="h-3.5 w-3.5" /> {post.shares}
                    </span>
                    <span className="flex items-center gap-1">
                      <RiEyeLine className="h-3.5 w-3.5" /> {post.views}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
