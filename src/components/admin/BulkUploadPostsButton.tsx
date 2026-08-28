"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface BulkUploadPostsButtonProps {
  onDone?: () => void;
}

export function BulkUploadPostsButton({ onDone }: BulkUploadPostsButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const form = new FormData();
    Array.from(fileList).forEach((f) => form.append("files", f));
    setUploading(true);
    const res = await fetch("/api/admin/posts/bulk-upload", { method: "POST", body: form }).then(
      (r) => r.json() as Promise<{ ok: boolean; message?: string; created?: { title: string }[]; errors?: { file: string; message: string }[] }>
    );
    setUploading(false);
    if (!res.ok) {
      toast.error(res.message || "Upload thất bại.");
      return;
    }
    toast.success(res.message || `Đã tạo ${res.created?.length ?? 0} bài nháp.`);
    if (res.errors?.length) {
      res.errors.forEach((e) => toast.error(`${e.file}: ${e.message}`));
    }
    onDone?.();
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".md,.txt"
        multiple
        className="hidden"
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 text-xs"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="w-3.5 h-3.5" />
        {uploading ? "Đang upload..." : "Upload .md/.txt"}
      </Button>
    </>
  );
}
