"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RiCalendarScheduleLine,
  RiCheckDoubleLine,
  RiLinksLine,
  RiBarChartBoxLine,
} from "react-icons/ri";

const mockStats = [
  { label: "scheduledPosts", value: 12, icon: RiCalendarScheduleLine, color: "text-blue-500" },
  { label: "publishedToday", value: 3, icon: RiCheckDoubleLine, color: "text-green-500" },
  { label: "connectedAccounts", value: 2, icon: RiLinksLine, color: "text-purple-500" },
];

const mockActivity = [
  { id: 1, action: "Post published", platform: "Instagram", time: "2 hours ago" },
  { id: 2, action: "Post scheduled", platform: "YouTube", time: "5 hours ago" },
  { id: 3, action: "Account connected", platform: "TikTok", time: "1 day ago" },
  { id: 4, action: "Post published", platform: "Facebook", time: "2 days ago" },
];

const mockUpcoming = [
  { id: 1, content: "New product launch", platform: "Instagram", date: "Today, 3:00 PM" },
  { id: 2, content: "Weekly tips video", platform: "YouTube", date: "Tomorrow, 10:00 AM" },
  { id: 3, content: "Behind the scenes", platform: "TikTok", date: "May 4, 6:00 PM" },
];

export default function DashboardPage() {
  const t = useTranslations("dashboard");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">Overview of your social media activity</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {mockStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t(stat.label as never)}
                </CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("recentActivity")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockActivity.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{item.action}</p>
                  <p className="text-xs text-muted-foreground">{item.platform}</p>
                </div>
                <span className="text-xs text-muted-foreground">{item.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("upcomingPosts")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockUpcoming.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{item.content}</p>
                  <p className="text-xs text-muted-foreground">{item.platform}</p>
                </div>
                <span className="text-xs text-muted-foreground">{item.date}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
