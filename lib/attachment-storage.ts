import { mkdir, readFile, rename, unlink, writeFile } from 'fs/promises';
import { createHash, randomUUID } from 'crypto';
import { join } from 'path';

const storageDirectory = join(process.cwd(), 'storage', 'attachments');
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const MAX_ATTACHMENTS_PER_REQUEST = 5;

const allowedMimeTypes = new Set([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/csv',
    'text/plain',
]);

function attachmentPath(attachmentId: string) {
    if (!/^[a-zA-Z0-9_-]+$/.test(attachmentId)) {
        throw new Error('Invalid attachment identifier');
    }
    return join(storageDirectory, attachmentId);
}

export function validateAttachmentFiles(files: File[]) {
    if (files.length === 0) throw new Error('At least one file must be provided');
    if (files.length > MAX_ATTACHMENTS_PER_REQUEST) {
        throw new Error(`A maximum of ${MAX_ATTACHMENTS_PER_REQUEST} files can be uploaded at once`);
    }

    for (const file of files) {
        if (!(file instanceof File) || file.size <= 0) throw new Error('Empty files are not allowed');
        if (file.size > MAX_ATTACHMENT_BYTES) throw new Error('Each attachment must be 10 MB or smaller');
        if (!file.name.trim() || file.name.length > 255) throw new Error('Attachment name is invalid');
        if (!allowedMimeTypes.has(file.type)) throw new Error(`Unsupported attachment type: ${file.type || 'unknown'}`);
    }
}

export async function saveAttachmentFile(attachmentId: string, file: File) {
    await mkdir(storageDirectory, { recursive: true });
    const path = attachmentPath(attachmentId);
    const content = Buffer.from(await file.arrayBuffer());
    const checksum = createHash('sha256').update(content).digest('hex');
    const temporaryPath = `${path}.${randomUUID()}.tmp`;
    await writeFile(temporaryPath, content, { flag: 'wx' });
    await rename(temporaryPath, path);
    return { checksum, size: content.byteLength };
}

export async function readAttachmentFile(attachmentId: string) {
    return readFile(attachmentPath(attachmentId));
}

export async function deleteAttachmentFile(attachmentId: string) {
    try {
        await unlink(attachmentPath(attachmentId));
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
}
