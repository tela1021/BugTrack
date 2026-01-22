'use client';

import { useState, useRef } from 'react';
import { Paperclip, X, Image as ImageIcon, FileText } from 'lucide-react';
import styles from './FileAttachment.module.css';

interface FileAttachmentProps {
    onFilesSelected: (files: File[]) => void;
}

interface AttachmentItem {
    id: string;
    file: File;
    previewUrl: string;
    isImage: boolean;
}

export default function FileAttachment({ onFilesSelected }: FileAttachmentProps) {
    const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newFiles = Array.from(e.target.files || []);
        if (newFiles.length === 0) return;

        const newItems: AttachmentItem[] = newFiles.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file: file,
            previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
            isImage: file.type.startsWith('image/')
        }));

        setAttachments(prev => {
            const updated = [...prev, ...newItems];
            // Defer the parent update to avoid side-effects in render/updater
            setTimeout(() => onFilesSelected(updated.map(item => item.file)), 0);
            return updated;
        });

        // Reset input so same file can be selected again if needed
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeFile = (id: string) => {
        setAttachments(prev => {
            const itemToRemove = prev.find(p => p.id === id);
            if (itemToRemove?.previewUrl) URL.revokeObjectURL(itemToRemove.previewUrl);

            const filtered = prev.filter(p => p.id !== id);
            // Defer the parent update
            setTimeout(() => onFilesSelected(filtered.map(item => item.file)), 0);
            return filtered;
        });
    };

    return (
        <div className={styles.container}>
            <div className={styles.previewList}>
                {attachments.map((item) => (
                    <div key={item.id} className={styles.previewItem}>
                        {item.isImage ? (
                            <img src={item.previewUrl} alt={item.file.name} className={styles.imagePreview} />
                        ) : (
                            <div className={styles.fileIcon}>
                                <FileText size={20} />
                                <span className={styles.fileName}>{item.file.name}</span>
                            </div>
                        )}
                        <button
                            type="button"
                            className={styles.removeBtn}
                            onClick={() => removeFile(item.id)}
                        >
                            <X size={12} />
                        </button>
                    </div>
                ))}
            </div>

            <button
                type="button"
                className="btn glass"
                onClick={() => fileInputRef.current?.click()}
                style={{ fontSize: '12px', padding: '4px 8px' }}
            >
                <Paperclip size={14} />
                Attach Files
            </button>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                style={{ display: 'none' }}
            />
        </div>
    );
}
