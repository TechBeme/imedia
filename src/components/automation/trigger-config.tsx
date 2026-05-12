"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

    const handleKeywordsInput = (value: string) => {
        const split = value
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean);
        onKeywordsChange(split);
    };

    return (
        <div className="space-y-4 rounded-lg border p-4">
            <h3 className="font-semibold">{t("title")}</h3>
            <div className="space-y-2">
                <Label>{t("keywords")}</Label>
                <Input
                    placeholder={t("keywordsPlaceholder")}
                    defaultValue={keywords.join(", ")}
                    onChange={(e) => handleKeywordsInput(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                    {keywords.length} keyword(s)
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
