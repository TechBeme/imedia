"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RiImageAddLine, RiImageLine } from "react-icons/ri";

const mockMedia = [
    { id: 1, name: "product-shot-1.jpg", type: "image", size: "2.4 MB" },
    { id: 2, name: "tutorial-thumb.png", type: "image", size: "1.8 MB" },
    { id: 3, name: "behind-scenes.mp4", type: "video", size: "45 MB" },
    { id: 4, name: "banner-wide.jpg", type: "image", size: "3.2 MB" },
    { id: 5, name: "intro-video.mp4", type: "video", size: "120 MB" },
    { id: 6, name: "logo-final.png", type: "image", size: "0.5 MB" },
];

export default function MediaPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Media Library</h1>
                    <p className="text-muted-foreground">Manage your uploaded media</p>
                </div>
                <Button className="gap-2">
                    <RiImageAddLine className="h-4 w-4" />
                    Upload
                </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {mockMedia.map((media) => (
                    <Card key={media.id} className="overflow-hidden cursor-pointer hover:ring-1 hover:ring-primary transition-all">
                        <CardContent className="p-0">
                            <div className="aspect-square bg-muted flex items-center justify-center">
                                <RiImageLine className="h-12 w-12 text-muted-foreground/50" />
                            </div>
                            <div className="p-3">
                                <p className="text-sm font-medium truncate">{media.name}</p>
                                <p className="text-xs text-muted-foreground">{media.size}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
