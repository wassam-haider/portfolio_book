import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import path from "path";
import { mkdir, writeFile } from "fs/promises";

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};
const VIDEO_TYPES: Record<string, string> = {
  "video/mp4": ".mp4",
  "video/webm": ".webm",
};
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const ext = IMAGE_TYPES[file.type] ?? VIDEO_TYPES[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "Unsupported file type. Allowed: JPEG, PNG, WebP, GIF images; MP4, WebM videos." },
      { status: 415 },
    );
  }
  const isVideo = Boolean(VIDEO_TYPES[file.type]);
  const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > maxBytes) {
    return NextResponse.json(
      { error: `File too large. Limit is ${Math.round(maxBytes / 1024 / 1024)} MB.` },
      { status: 413 },
    );
  }

  const name = `archives/${Date.now()}-${randomBytes(6).toString("hex")}${ext}`;

  // Production: Vercel Blob. Local dev without a token: public/uploads.
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(name, file, { access: "public", contentType: file.type });
    return NextResponse.json({ url: blob.url });
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });
  const fileName = name.replace("archives/", "");
  await writeFile(path.join(uploadsDir, fileName), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ url: `/uploads/${fileName}` });
}
