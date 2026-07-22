import type { ReactNode } from 'react';
import styles from './MarkdownPreview.module.css';

const inlineTokenPattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g;
const externalLinkPattern = /^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/;

function renderInline(value: string): ReactNode[] {
    return value.split(inlineTokenPattern).filter(Boolean).map((token, index) => {
        if (token.startsWith('`') && token.endsWith('`')) {
            return <code key={index}>{token.slice(1, -1)}</code>;
        }
        if (token.startsWith('**') && token.endsWith('**')) {
            return <strong key={index}>{token.slice(2, -2)}</strong>;
        }
        if (token.startsWith('*') && token.endsWith('*')) {
            return <em key={index}>{token.slice(1, -1)}</em>;
        }
        const link = token.match(externalLinkPattern);
        if (link) {
            return <a key={index} href={link[2]} target="_blank" rel="noopener noreferrer">{link[1]}</a>;
        }
        return token;
    });
}

export default function MarkdownPreview({ content, className }: { content: string; className?: string }) {
    const blocks = content.trim().split(/\n{2,}/).filter(Boolean);

    return (
        <div className={[styles.markdown, className].filter(Boolean).join(' ')}>
            {blocks.map((block, index) => {
                const heading = block.match(/^(#{1,3})\s+(.+)$/);
                if (heading) {
                    const level = heading[1].length;
                    const Heading = (`h${level}` as 'h1' | 'h2' | 'h3');
                    return <Heading key={index}>{renderInline(heading[2])}</Heading>;
                }

                const lines = block.split('\n');
                if (lines.every((line) => /^[-*+]\s+/.test(line))) {
                    return <ul key={index}>{lines.map((line, lineIndex) => <li key={lineIndex}>{renderInline(line.replace(/^[-*+]\s+/, ''))}</li>)}</ul>;
                }

                return <p key={index}>{lines.flatMap((line, lineIndex) => lineIndex === 0 ? renderInline(line) : [<br key={`break-${lineIndex}`} />, ...renderInline(line)])}</p>;
            })}
        </div>
    );
}
