'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getTeamAnalytics } from '@/actions/analytics';

type Analytics = Awaited<ReturnType<typeof getTeamAnalytics>>;

export default function TeamAnalytics({ teamId }: { teamId: string }) {
    const [period, setPeriod] = useState<7 | 30 | 90>(30);
    const [data, setData] = useState<Analytics | null>(null);

    useEffect(() => { void getTeamAnalytics(teamId, period).then(setData); }, [period, teamId]);
    const metrics = data ? [
        ['Создано', data.created], ['Throughput', data.throughput], ['WIP', data.wip], ['Средний возраст', data.agingDays === null ? '—' : `${data.agingDays} дн.`], ['Lead time', data.leadTimeDays === null ? '—' : `${data.leadTimeDays} дн.`], ['MTTR bug', data.mttrDays === null ? '—' : `${data.mttrDays} дн.`],
    ] : [];

    return <section className="glass" style={{ marginBottom: '24px', padding: '16px' }} aria-label="Аналитика команды">
        <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div><h2 style={{ fontSize: '16px' }}>Dashboard команды</h2><p style={{ color: 'var(--muted-foreground)', fontSize: '13px' }}>Поток задач и состояние работы.</p></div>
            <label>Период <select className="input" value={period} onChange={(event) => setPeriod(Number(event.target.value) as 7 | 30 | 90)}><option value={7}>7 дней</option><option value={30}>30 дней</option><option value={90}>90 дней</option></select></label>
        </div>
        {!data ? <p style={{ color: 'var(--muted-foreground)' }}>Загрузка метрик…</p> : <>
            <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>{metrics.map(([label, value]) => <div key={label} style={{ background: 'var(--surface)', borderRadius: '8px', padding: '10px' }}><div style={{ color: 'var(--muted-foreground)', fontSize: '12px' }}>{label}</div><strong>{value}</strong></div>)}</div>
            <div style={{ marginTop: '12px' }}>{data.cycle ? <span>Активный цикл «{data.cycle.name}»: {data.cycle.completed}/{data.cycle.total} ({data.cycle.completion}%)</span> : <span style={{ color: 'var(--muted-foreground)' }}>Нет активного цикла.</span>}</div>
            <details style={{ marginTop: '12px' }}><summary>Методика</summary><p style={{ color: 'var(--muted-foreground)', fontSize: '13px', marginTop: '8px' }}>Throughput — завершённые и отменённые задачи за период. Lead time и MTTR — время от создания до последнего обновления завершённой задачи; это приближение, пока в workflow нет отдельного события закрытия. Aging — средний возраст незавершённых задач. Все даты хранятся в UTC.</p></details>
            <Link href={data.sourceHref} style={{ display: 'inline-block', fontSize: '13px', marginTop: '10px' }}>Исходная выборка задач</Link>
        </>}
    </section>;
}
