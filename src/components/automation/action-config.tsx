"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";

interface ActionConfigProps {
    type: "reply_comment" | "send_dm";
    title: string;
    messages: string[];
    onMessagesChange: (messages: string[]) => void;
    isActive: boolean;
    onIsActiveChange: (value: boolean) => void;
}

export function ActionConfig({
    title,
    messages,
    onMessagesChange,
    isActive,
    onIsActiveChange,
}: ActionConfigProps) {
    const t = useTranslations("automations.actions");

    const addVariant = () => {
        onMessagesChange([...messages, ""]);
    };

    const updateVariant = (index: number, value: string) => {
        const updated = [...messages];
        updated[index] = value;
        onMessagesChange(updated);
    };

    const removeVariant = (index: number) => {
        const updated = messages.filter((_, i) => i !== index);
        onMessagesChange(updated);
    };

    return (
        <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold">{title}</h3>
                <div className="flex items-center gap-2">
                    <Label className="text-sm">{t("enabled")}</Label>
                    <Switch checked={isActive} onCheckedChange={onIsActiveChange} />
                </div>
            </div>

            {isActive && (
                <div className="space-y-3">
                    <Label>{t("responses")}</Label>
                    {messages.map((msg, index) => (
                        <div key={index} className="flex gap-2">
                            <Input
                                value={msg}
                                placeholder={t("variantPlaceholder")}
                                onChange={(e) =>
                                    updateVariant(index, e.target.value)
                                }
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeVariant(index)}
                                disabled={messages.length <= 1}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addVariant}
                    >
                        <Plus className="mr-1 h-4 w-4" />
                        {t("addVariant")}
                    </Button>
                </div>
            )}
        </div>
    );
}
