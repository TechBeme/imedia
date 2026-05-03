"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const engagementData = [
  { name: "Mon", instagram: 120, facebook: 80, youtube: 45 },
  { name: "Tue", instagram: 150, facebook: 90, youtube: 60 },
  { name: "Wed", instagram: 180, facebook: 110, youtube: 55 },
  { name: "Thu", instagram: 140, facebook: 95, youtube: 70 },
  { name: "Fri", instagram: 200, facebook: 130, youtube: 80 },
  { name: "Sat", instagram: 250, facebook: 150, youtube: 90 },
  { name: "Sun", instagram: 220, facebook: 120, youtube: 85 },
];

const followersData = [
  { name: "Week 1", instagram: 5200, youtube: 1800 },
  { name: "Week 2", instagram: 5350, youtube: 1900 },
  { name: "Week 3", instagram: 5500, youtube: 2050 },
  { name: "Week 4", instagram: 5800, youtube: 2200 },
];

const platformDistribution = [
  { name: "Instagram", value: 45, color: "#ec4899" },
  { name: "YouTube", value: 25, color: "#ef4444" },
  { name: "Facebook", value: 20, color: "#2563eb" },
  { name: "TikTok", value: 10, color: "#000000" },
];

export default function AnalyticsPage() {
  const t = useTranslations("dashboard");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Track your social media performance</p>
      </div>

      <Tabs defaultValue="7d">
        <TabsList>
          <TabsTrigger value="7d">7 days</TabsTrigger>
          <TabsTrigger value="30d">30 days</TabsTrigger>
          <TabsTrigger value="90d">90 days</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Engagement by Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="instagram" fill="#ec4899" radius={[4, 4, 0, 0]} />
                <Bar dataKey="facebook" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="youtube" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Follower Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={followersData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Line type="monotone" dataKey="instagram" stroke="#ec4899" strokeWidth={2} />
                <Line type="monotone" dataKey="youtube" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Platform Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={platformDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {platformDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              {platformDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Performing Posts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { title: "Product launch video", platform: "Instagram", engagement: "2.4K" },
              { title: "Tutorial: How to...", platform: "YouTube", engagement: "1.8K" },
              { title: "Behind the scenes", platform: "TikTok", engagement: "1.2K" },
              { title: "Weekly tips", platform: "Facebook", engagement: "890" },
            ].map((post, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{post.title}</p>
                  <p className="text-xs text-muted-foreground">{post.platform}</p>
                </div>
                <span className="text-sm font-semibold">{post.engagement}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
