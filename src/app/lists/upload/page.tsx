"use client";

import { useState } from "react";
import { SimpleCard } from "@/components/ui/SimpleCard";
import { SimpleButton } from "@/components/ui/SimpleButton";
import { UploadCloud, File, AlertCircle, Plus, ArrowLeft, Type } from "lucide-react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function UploadPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"file" | "manual">("file");
    const [file, setFile] = useState<File | null>(null);
    const [manualText, setManualText] = useState("");
    const [listName, setListName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleUpload = async () => {
        if (!listName) return setError("Please provide a name for this list.");

        setError("");
        setLoading(true);

        if (activeTab === "file") {
            if (!file) {
                setLoading(false);
                return setError("Please select a CSV file.");
            }

            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: async (results) => {
                    await submitData(results.data);
                },
                error: (error) => {
                    setError(error.message);
                    setLoading(false);
                }
            });
        } else {
            // Manual parsing
            if (!manualText.trim()) {
                setLoading(false);
                return setError("Please enter at least one phone number.");
            }

            // Split by newlines, commas, or spaces
            const numbers = manualText
                .split(/[\n, ]+/)
                .map(n => n.trim())
                .filter(n => n.length > 0);

            if (numbers.length === 0) {
                setLoading(false);
                return setError("No valid numbers found.");
            }

            const formattedContacts = numbers.map(phone => ({ phone }));
            await submitData(formattedContacts);
        }
    };

    const submitData = async (contacts: { phone: string; [key: string]: string | number | null }[]) => {
        try {
            const res = await fetch("/api/lists/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: listName,
                    contacts
                }),
            });

            if (!res.ok) {
                const contentType = res.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || errorData.details || "Upload failed");
                } else {
                    throw new Error(`Server error: ${res.status}`);
                }
            }

            router.push("/lists");
        } catch (e: unknown) {
            const err = e as Error;
            setError(err.message || "Failed to upload numbers.");
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col p-6 gap-6 pb-32">
            <header className="flex items-center gap-4 py-4">
                <Link href="/lists">
                    <SimpleButton variant="ghost" size="icon" className="rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </SimpleButton>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Add Numbers</h1>
                    <p className="text-sm text-muted-foreground mt-1">Create a new contact list</p>
                </div>
            </header>

            <SimpleCard className="p-0 overflow-hidden max-w-2xl mx-auto w-full">
                <div className="p-6 space-y-8">
                    <div>
                        <label className="simple-label">Name your list</label>
                        <input
                            type="text"
                            placeholder="e.g. March Leads"
                            className="simple-input w-full"
                            value={listName}
                            onChange={(e) => setListName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl">
                            <button
                                onClick={() => setActiveTab("file")}
                                className={cn(
                                    "flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all",
                                    activeTab === "file" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <UploadCloud className="w-4 h-4" /> CSV File
                            </button>
                            <button
                                onClick={() => setActiveTab("manual")}
                                className={cn(
                                    "flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all",
                                    activeTab === "manual" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Type className="w-4 h-4" /> Type Manually
                            </button>
                        </div>

                        {activeTab === "file" ? (
                            <div className="space-y-3">
                                <div className="relative border-2 border-dashed border-border hover:border-primary/50 transition-all rounded-xl bg-muted/20 p-10 text-center">
                                    <input
                                        type="file"
                                        accept=".csv"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                        onChange={(e) => {
                                            const selectedFile = e.target.files?.[0] || null;
                                            setFile(selectedFile);
                                            if (selectedFile && !listName) {
                                                const suggestedName = selectedFile.name
                                                    .replace(/\.[^/.]+$/, "")
                                                    .replace(/_/g, " ");
                                                setListName(suggestedName);
                                            }
                                        }}
                                    />
                                    {file ? (
                                        <div className="flex flex-col items-center">
                                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                                <File className="w-6 h-6 text-primary" />
                                            </div>
                                            <p className="font-semibold text-sm">{file.name}</p>
                                            <p className="text-xs text-muted-foreground mt-1">Click to change file</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                                                <UploadCloud className="w-6 h-6 text-muted-foreground" />
                                            </div>
                                            <p className="font-medium text-sm">Drop your file here</p>
                                            <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <label className="simple-label">Enter numbers</label>
                                <textarea
                                    className="simple-input w-full min-h-[200px] font-mono text-sm leading-relaxed p-4"
                                    placeholder="Enter numbers separated by newlines or commas..."
                                    value={manualText}
                                    onChange={(e) => setManualText(e.target.value)}
                                />
                                <p className="text-[10px] text-muted-foreground italic">
                                    Tips: You can copy-paste columns from Excel or text files directly.
                                </p>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg flex gap-3 items-center">
                            <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                            <p className="text-xs font-medium text-destructive">{error}</p>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-muted/30 border-t border-border">
                    <SimpleButton
                        variant="primary"
                        className="w-full h-14 text-base font-bold"
                        onClick={handleUpload}
                        isLoading={loading}
                        disabled={activeTab === "file" ? (!file || !listName) : (!manualText.trim() || !listName)}
                    >
                        {activeTab === "file" ? "Upload List" : "Create List"}
                    </SimpleButton>
                </div>
            </SimpleCard>
        </div>
    );
}
