'use client';

import { X, ZoomIn, ZoomOut, Download } from 'lucide-react';
import styles from './ImagePreviewer.module.css';
import { useState } from 'react';

interface ImagePreviewerProps {
    url: string;
    name: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function ImagePreviewer({ url, name, isOpen, onClose }: ImagePreviewerProps) {
    const [zoom, setZoom] = useState(1);

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <header className={styles.header} onClick={e => e.stopPropagation()}>
                <span className={styles.name}>{name}</span>
                <div className={styles.actions}>
                    <button onClick={() => setZoom(prev => Math.min(prev + 0.2, 5))}><ZoomIn size={18} /></button>
                    <button onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.5))}><ZoomOut size={18} /></button>
                    <a href={url} download={name} className={styles.downloadLink}><Download size={18} /></a>
                    <button onClick={onClose} className={styles.closeBtn}><X size={18} /></button>
                </div>
            </header>

            <div className={styles.content} onClick={onClose}>
                <img
                    src={url}
                    alt={name}
                    className={styles.image}
                    style={{ transform: `scale(${zoom})` }}
                    onClick={e => e.stopPropagation()}
                />
            </div>
        </div>
    );
}
