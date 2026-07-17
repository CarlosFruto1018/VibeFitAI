import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";
import { uploadExtensionFor } from "@/lib/validation";

const client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;
const PUBLIC_URL = process.env.R2_PUBLIC_URL!;

export type UploadType = "audio" | "image";

export async function createPresignedUploadUrl(
  userId: string,
  type: UploadType,
  mimeType: string
): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
  const ext = uploadExtensionFor(type, mimeType);
  if (!ext) throw new Error(`MIME no permitido para subida: ${mimeType}`);
  const key = `${userId}/${type}/${Date.now()}-${nanoid(8)}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: mimeType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 });
  const publicUrl = `${PUBLIC_URL}/${key}`;

  return { uploadUrl, key, publicUrl };
}

export async function createPresignedDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(client, command, { expiresIn: 3600 });
}
