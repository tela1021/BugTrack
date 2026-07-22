import styles from './Skeleton.module.css';

export function Skeleton({ className = '' }: { className?: string }) { return <span aria-hidden="true" className={`${styles.skeleton} ${className}`} />; }

export function IssueListSkeleton() { return <div className={styles.table} aria-label="Загрузка списка задач" role="status">{Array.from({ length: 6 }, (_, index) => <div key={index} className={styles.row}><Skeleton className={styles.short} /><Skeleton className={styles.title} /><Skeleton className={styles.medium} /><Skeleton className={styles.medium} /></div>)}</div>; }

export function IssueDetailSkeleton() { return <div className={styles.detail} aria-label="Загрузка задачи" role="status"><Skeleton className={styles.heading} /><Skeleton className={styles.body} /><Skeleton className={styles.body} /><Skeleton className={styles.sidebar} /></div>; }
