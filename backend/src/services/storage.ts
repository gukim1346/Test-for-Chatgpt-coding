import { Storage } from '@google-cloud/storage';
import { promises as fs } from 'fs';
import path from 'path';
import env from '../config/env.js';
import { v4 as uuid } from 'uuid';

const LOCAL_UPLOAD_DIR = path.resolve('uploads');

let storage: Storage | null = null;

export const getStorage = () => {
  if (!storage && env.GCS_BUCKET) {
    storage = new Storage({ projectId: env.GCP_PROJECT_ID });
  }
  return storage;
};

export const ensureLocalDir = async () => {
  await fs.mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
};

export type UploadedFile = {
  path: string;
  size: number;
  mimeType: string;
  filename: string;
};

export const persistFile = async (filePath: string, mimeType: string): Promise<{ storagePath: string; publicUrl: string | null }> => {
  const bucketName = env.GCS_BUCKET;
  if (bucketName && getStorage()) {
    const gcsFileName = `${uuid()}-${path.basename(filePath)}`;
    const bucket = getStorage()!.bucket(bucketName);
    await bucket.upload(filePath, { destination: gcsFileName, contentType: mimeType, resumable: false });
    return { storagePath: gcsFileName, publicUrl: `gs://${bucketName}/${gcsFileName}` };
  }
  await ensureLocalDir();
  const destination = path.join(LOCAL_UPLOAD_DIR, `${uuid()}-${path.basename(filePath)}`);
  await fs.copyFile(filePath, destination);
  return { storagePath: destination, publicUrl: destination };
};

export const getSignedUrl = async (storagePath: string): Promise<string> => {
  const bucketName = env.GCS_BUCKET;
  if (bucketName && getStorage()) {
    const [url] = await getStorage()!
      .bucket(bucketName)
      .file(storagePath)
      .getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + env.GCS_SIGNED_URL_TTL_SECONDS * 1000,
      });
    return url;
  }
  return storagePath;
};
