"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { RiImageAddLine, RiImageLine } from "react-icons/ri";

const mockMedia = [
    { id: 1, name: "product-shot-1.jpg", type: "image", size: "2.4 MB" },
    { id: 2, name: "tutorial-thumb.png", type: "image", size: "1.8 MB" },
    { id: 3, name: "behind-scenes.mp4", type: "video", size: "45 MB" },
    { id: 4, name: "banner-wide.jpg", type: "image", size: "3.2 MB" },
    { id: 5, name: "intro-video.mp4", type: "video", size: "120 MB" },
    { id: 6, name: "logo-final.png", type: "image", size: "0.5 MB" },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

export default function MediaPage() {
    return (
        <motion.div
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div variants={itemVariants} className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight font-heading">Media Library</h1>
                </div>
                <Button className="gap-2 rounded-xl cursor-pointer shadow-sm shadow-primary/20 h-11">
                    <RiImageAddLine className="h-4 w-4" />
                    Upload
                </Button>
            </motion.div>

            <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {mockMedia.map((media) => (
                    <motion.div
                        key={media.id}
                        variants={itemVariants}
                        whileHover={{ y: -2, transition: { duration: 0.2 } }}
                    >
                        <Card className="glass-card overflow-hidden cursor-pointer transition-shadow duration-200 hover:shadow-md">
                            <CardContent className="p-0">
                                <div className="aspect-square bg-muted flex items-center justify-center">
                                    <RiImageLine className="h-12 w-12 text-muted-foreground/40" />
                                </div>
                                <div className="p-4">
                                    <p className="text-sm font-medium truncate">{media.name}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{media.size}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </motion.div>
        </motion.div>
    );
}
