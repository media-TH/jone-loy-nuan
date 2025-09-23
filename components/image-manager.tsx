"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { IconTrash, IconUpload, IconRefresh, IconPhoto } from "@tabler/icons-react";

interface ImageManagerProps {
  title?: string;
  prefix?: string; // folder path prefix e.g. "123" -> lists objects under 123/
}

interface ListedFile {
  name: string;
  path: string; // full storage path including prefix
  size: number | null;
  lastModified: string | null;
  publicUrl: string | null;
}

const BUCKET = "scenario-images";

export default function ImageManager({ title = "รูปภาพประกอบ (Global Storage)", prefix = "" }: ImageManagerProps) {
  const supabase = useMemo(() => createClient(), []);
  const [files, setFiles] = useState<ListedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const normalizedPrefix = prefix?.trim().replace(/^\/+|\/+$/g, "");

  const fullPath = (name: string) => (normalizedPrefix ? `${normalizedPrefix}/${name}` : name);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage.from(BUCKET).list(normalizedPrefix || undefined, {
        limit: 1000,
        sortBy: { column: "name", order: "asc" },
      });
      if (error) throw error;

      const listed: ListedFile[] = (data || [])
        // Filter out folders; list returns both files and subfolders
        .filter((entry) => entry.id) // files have id; folders don't
        .map((entry) => {
          const path = fullPath(entry.name);
          const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
          return {
            name: entry.name,
            path,
            size: (entry as any).metadata?.size ?? null,
            lastModified: (entry as any).updated_at ?? null,
            publicUrl: pub?.publicUrl ?? null,
          };
        });
      setFiles(listed);
    } catch (e: any) {
      console.error("List error:", e);
      toast.error(`โหลดรายการรูปภาพไม่สำเร็จ: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const path = fullPath(selectedFile.name);
      const { error } = await supabase.storage.from(BUCKET).upload(path, selectedFile, {
        upsert: true,
        contentType: selectedFile.type || "application/octet-stream",
      });
      if (error) throw error;
      toast.success("อัปโหลดไฟล์สำเร็จ");
      setSelectedFile(null);
      await fetchFiles();
    } catch (e: any) {
      console.error("Upload error:", e);
      toast.error(`อัปโหลดไฟล์ไม่สำเร็จ: ${e.message ?? e}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (path: string) => {
    if (!confirm(`ต้องการลบไฟล์นี้หรือไม่?\n${path}`)) return;
    try {
      const { error } = await supabase.storage.from(BUCKET).remove([path]);
      if (error) throw error;
      toast.success("ลบไฟล์สำเร็จ");
      await fetchFiles();
    } catch (e: any) {
      console.error("Delete error:", e);
      toast.error(`ลบไฟล์ไม่สำเร็จ: ${e.message ?? e}`);
    }
  };

  useEffect(() => {
    fetchFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedPrefix]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <IconPhoto className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>
              บัคเก็ต: {BUCKET} {normalizedPrefix ? `· โฟลเดอร์: ${normalizedPrefix}` : ""}
            </CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="file"
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            className="max-w-xs"
          />
          <Button onClick={handleUpload} disabled={!selectedFile || uploading}>
            <IconUpload className="mr-2 h-4 w-4" />
            {uploading ? "กำลังอัปโหลด..." : "อัปโหลด"}
          </Button>
          <Button variant="outline" onClick={fetchFiles} disabled={loading}>
            <IconRefresh className="mr-2 h-4 w-4" /> โหลดใหม่
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อไฟล์</TableHead>
                <TableHead>ขนาด</TableHead>
                <TableHead>อัปเดตล่าสุด</TableHead>
                <TableHead>ลิงก์</TableHead>
                <TableHead className="text-right">การจัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    กำลังโหลด...
                  </TableCell>
                </TableRow>
              ) : files.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    ไม่พบไฟล์ในที่เก็บนี้
                  </TableCell>
                </TableRow>
              ) : (
                files.map((f) => (
                  <TableRow key={f.path}>
                    <TableCell className="font-medium break-all">{f.name}</TableCell>
                    <TableCell>{f.size ? `${Math.round(f.size / 1024)} KB` : "-"}</TableCell>
                    <TableCell>{f.lastModified ? new Date(f.lastModified).toLocaleString() : "-"}</TableCell>
                    <TableCell>
                      {f.publicUrl ? (
                        <a href={f.publicUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                          เปิดดู
                        </a>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(f.path)}>
                        <IconTrash className="mr-2 h-4 w-4" /> ลบ
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
