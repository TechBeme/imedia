"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface TriggerConfigProps {
    keywords: string[];
    onKeywordsChange: (keywords: string[]) => void;
    matchMode: "exact" | "contains";
    onMatchModeChange: (mode: "exact" | "contains") => void;
    caseSensitive: boolean;
    onCaseSensitiveChange: (value: boolean) => void;
}

export function TriggerConfig({
    keywords,
    onKeywordsChange,
    matchMode,
    onMatchModeChange,
    caseSensitive,
    onCaseSensitiveChange,
}: TriggerConfigProps) {
    const t = useTranslations("automations.trigger");

    const addKeyword = () => {
        onKeywordsChange([...keywords, ""]);
    };

    const updateKeyword = (index: number, value: string) => {
        const updated = [...keywords];
        updated[index] = value;
        onKeywordsChange(updated);
    };

    const removeKeyword = (index: number) => {
        const updated = keywords.filter((_, i) => i !== index);
        onKeywordsChange(updated);
    };

    return (
        <div className="space-y-4 rounded-lg border p-4">
            <h3 className="font-semibold">{t("title")}</h3>
            <div className="space-y-3">
                <Label>{t("keywords")}</Label>
                {keywords.map((kw, index) => (
                    <div key={index} className="flex gap-2">
                        <Input
                            value={kw}
                            placeholder={t("keywordsPlaceholder")}
                            onChange={(e) =>
                                updateKeyword(index, e.target.value)
                            }
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeKeyword(index)}
                            disabled={keywords.length <= 1}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addKeyword}
                >
                    <Plus className="mr-1 h-4 w-4" />
                    {t("addKeyword")}
                </Button>
                <p className="text-xs text-muted-foreground">
                    {keywords.filter(Boolean).length} keyword(s)
                </p>
            </div>
            <div className="space-y-2">
                <Label>{t("matchMode")}</Label>
                <Select
                    value={matchMode}
                    onValueChange={(v) =>
                        onMatchModeChange(v as "exact" | "contains")
                    }
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="contains">{t("contains")}</SelectItem>
                        <SelectItem value="exact">{t("exact")}</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="flex items-center gap-2">
                <Switch
                    checked={caseSensitive}
                    onCheckedChange={onCaseSensitiveChange}
                />
                <Label className="cursor-pointer">{t("caseSensitive")}</Label>
            </div>
        </div>
    );
}
