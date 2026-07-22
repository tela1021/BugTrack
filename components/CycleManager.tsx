'use client';

import { useCallback, useEffect, useState } from 'react';
import { createCycle, getCycles, updateCycle } from '@/actions/cycles';
import { useToast } from '@/components/ToastProvider';

type Cycle = Awaited<ReturnType<typeof getCycles>>[number];
const statusLabels: Record<string, string> = { DRAFT: 'Черновик', ACTIVE: 'Активен', COMPLETED: 'Завершён' };

export default function CycleManager({ teamId }: { teamId: string }) {
    const toast = useToast();
    const [cycles, setCycles] = useState<Cycle[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', goal: '', startsAt: '', endsAt: '', status: 'DRAFT' });

    const load = useCallback(async () => setCycles(await getCycles(teamId)), [teamId]);
    useEffect(() => { void load(); }, [load]);

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        const result = await createCycle(teamId, { ...form, goal: form.goal || null });
        if (!result.success) return toast.error(result.error || 'Не удалось создать цикл');
        toast.success('Цикл создан');
        setShowForm(false);
        setForm({ name: '', goal: '', startsAt: '', endsAt: '', status: 'DRAFT' });
        await load();
    };
    const changeStatus = async (cycle: Cycle, status: string) => {
        const result = await updateCycle(cycle.id, { status });
        if (!result.success) return toast.error(result.error || 'Не удалось обновить цикл');
        toast.success('Статус цикла обновлён');
        await load();
    };

    return <section className="glass" style={{ marginBottom: '24px', padding: '16px' }} aria-label="Циклы команды">
        <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
            <div><h2 style={{ fontSize: '16px' }}>Циклы</h2><p style={{ color: 'var(--muted-foreground)', fontSize: '13px' }}>Одна активная итерация на команду.</p></div>
            <button type="button" className="btn glass" onClick={() => setShowForm((value) => !value)}>Новый цикл</button>
        </div>
        {showForm && <form onSubmit={submit} style={{ display: 'grid', gap: '8px', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', marginBottom: '12px' }}>
            <input className="input" required placeholder="Название" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            <input className="input" placeholder="Цель (необязательно)" value={form.goal} onChange={(event) => setForm({ ...form, goal: event.target.value })} />
            <input className="input" required type="date" value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} />
            <input className="input" required type="date" value={form.endsAt} onChange={(event) => setForm({ ...form, endsAt: event.target.value })} />
            <select className="input" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="DRAFT">Черновик</option><option value="ACTIVE">Активный</option></select>
            <button className="btn btn-primary" type="submit">Создать</button>
        </form>}
        {cycles.length ? <div style={{ display: 'grid', gap: '8px' }}>{cycles.map((cycle) => <div key={cycle.id} style={{ alignItems: 'center', borderTop: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'space-between', paddingTop: '8px' }}>
            <div><strong>{cycle.name}</strong>{cycle.goal && <span style={{ color: 'var(--muted-foreground)' }}> — {cycle.goal}</span>}<div style={{ color: 'var(--muted-foreground)', fontSize: '12px' }}>{new Date(cycle.startsAt).toLocaleDateString()} — {new Date(cycle.endsAt).toLocaleDateString()} · задач: {cycle._count.issues}</div></div>
            <select className="input" aria-label={`Статус цикла ${cycle.name}`} value={cycle.status} onChange={(event) => void changeStatus(cycle, event.target.value)}><option value="DRAFT">{statusLabels.DRAFT}</option><option value="ACTIVE">{statusLabels.ACTIVE}</option><option value="COMPLETED">{statusLabels.COMPLETED}</option></select>
        </div>)}</div> : <p style={{ color: 'var(--muted-foreground)', fontSize: '14px' }}>Циклов пока нет.</p>}
    </section>;
}
