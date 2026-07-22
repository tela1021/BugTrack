'use client';

import { useEffect, useState } from 'react';
import { getSlaSummary, saveSlaPolicy } from '@/actions/sla';

type SlaSummary = Awaited<ReturnType<typeof getSlaSummary>>;
export default function SlaPanel({ teamId }: { teamId: string }) {
    const [data, setData] = useState<SlaSummary | null>(null);
    const [editing, setEditing] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => { void getSlaSummary(teamId).then(setData); }, [teamId]);
    const save = async (form: HTMLFormElement) => {
        if (!data) return;
        const fields = new FormData(form);
        const policy = { ...data.policy, timezone: String(fields.get('timezone')), startHour: Number(fields.get('startHour')), endHour: Number(fields.get('endHour')), responseMinutes: { ...data.policy.responseMinutes, URGENT: Number(fields.get('responseUrgent')), HIGH: Number(fields.get('responseHigh')), MEDIUM: Number(fields.get('responseMedium')), LOW: Number(fields.get('responseLow')) }, resolutionMinutes: { ...data.policy.resolutionMinutes, URGENT: Number(fields.get('resolutionUrgent')), HIGH: Number(fields.get('resolutionHigh')), MEDIUM: Number(fields.get('resolutionMedium')), LOW: Number(fields.get('resolutionLow')) } };
        const result = await saveSlaPolicy(teamId, policy);
        if (!result.success) return setError(result.error || 'Не удалось сохранить SLA policy');
        setError(''); setEditing(false); setData(await getSlaSummary(teamId));
    };
    return <section className="glass" style={{ marginBottom: '24px', padding: '16px' }} aria-label="SLA bug">
        <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', gap: '12px' }}><h2 style={{ fontSize: '16px' }}>SLA bug</h2><button type="button" className="btn glass" onClick={() => setEditing((value) => !value)}>Настроить SLA</button></div>
        {!data ? <p style={{ color: 'var(--muted-foreground)' }}>Загрузка SLA…</p> : <><p style={{ color: 'var(--muted-foreground)', fontSize: '13px' }}>Рабочее время: {data.policy.timezone}, {data.policy.startHour}:00–{data.policy.endHour}:00. Открытых bug: {data.openBugs}.</p><p>Риск нарушения: {data.atRisk.length}; нарушено: {data.breached.length}.</p>{[...data.breached, ...data.atRisk].map((item) => <div key={item.readableId}>{item.readableId}: {item.level === 'breach' ? 'нарушение SLA' : 'риск SLA'}</div>)}
        {editing && <form onSubmit={(event) => { event.preventDefault(); void save(event.currentTarget); }} style={{ display: 'grid', gap: '8px', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', marginTop: '12px' }}><input className="input" name="timezone" defaultValue={data.policy.timezone} aria-label="Timezone SLA" /><input className="input" name="startHour" type="number" min="0" max="23" defaultValue={data.policy.startHour} aria-label="Начало рабочего дня" /><input className="input" name="endHour" type="number" min="1" max="24" defaultValue={data.policy.endHour} aria-label="Конец рабочего дня" />{(['URGENT', 'HIGH', 'MEDIUM', 'LOW'] as const).flatMap((priority) => [<input key={`r-${priority}`} className="input" name={`response${priority[0]}${priority.slice(1).toLowerCase()}`} type="number" min="1" defaultValue={data.policy.responseMinutes[priority]} aria-label={`First response ${priority}`} />, <input key={`s-${priority}`} className="input" name={`resolution${priority[0]}${priority.slice(1).toLowerCase()}`} type="number" min="1" defaultValue={data.policy.resolutionMinutes[priority]} aria-label={`Resolution ${priority}`} />])}<button className="btn btn-primary" type="submit">Сохранить SLA</button></form>}{error && <p role="alert" style={{ color: 'var(--destructive)' }}>{error}</p>}</>}
    </section>;
}
