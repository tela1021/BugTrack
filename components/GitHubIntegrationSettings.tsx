'use client';

import { useCallback, useEffect, useState } from 'react';
import { getIssueFormData } from '@/actions/form-data';
import { getGitHubIntegration, saveGitHubIntegration } from '@/actions/integrations';
import { useToast } from '@/components/ToastProvider';

type Integration = Awaited<ReturnType<typeof getGitHubIntegration>>[number];
export default function GitHubIntegrationSettings({ teamId }: { teamId: string }) {
    const toast = useToast();
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [members, setMembers] = useState<{ id: string; name: string | null; email: string }[]>([]);
    const [statuses, setStatuses] = useState<{ id: string; name: string }[]>([]);
    const [form, setForm] = useState({ repository: '', actorUserId: '', reviewStatusId: '', doneStatusId: '', enabled: true });
    const load = useCallback(async () => setIntegrations(await getGitHubIntegration(teamId)), [teamId]);
    useEffect(() => { void load(); void getIssueFormData().then(({ teams }) => { const team = teams.find((item) => item.id === teamId); if (team) { setMembers(team.members); setStatuses(team.statuses); setForm((value) => ({ ...value, actorUserId: value.actorUserId || team.members[0]?.id || '' })); } }); }, [load, teamId]);
    const submit = async (event: React.FormEvent) => { event.preventDefault(); const result = await saveGitHubIntegration(teamId, { ...form, reviewStatusId: form.reviewStatusId || null, doneStatusId: form.doneStatusId || null }); if (!result.success) return toast.error(result.error || 'Не удалось сохранить интеграцию'); toast.success('GitHub-интеграция сохранена'); setForm({ ...form, repository: '' }); await load(); };
    return <section className="glass" style={{ marginBottom: '24px', padding: '16px' }} aria-label="GitHub integration">
        <h2 style={{ fontSize: '16px' }}>GitHub</h2><p style={{ color: 'var(--muted-foreground)', fontSize: '13px', marginBottom: '10px' }}>Webhook: <code>/api/webhooks/github</code>. Укажите `GITHUB_WEBHOOK_SECRET` на сервере и тот же секрет в GitHub.</p>
        <form onSubmit={submit} style={{ display: 'grid', gap: '8px', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
            <input className="input" required placeholder="owner/repository" aria-label="Репозиторий" value={form.repository} onChange={(event) => setForm({ ...form, repository: event.target.value })} />
            <select className="input" aria-label="Automation actor" value={form.actorUserId} onChange={(event) => setForm({ ...form, actorUserId: event.target.value })}>{members.map((member) => <option key={member.id} value={member.id}>{member.name || member.email}</option>)}</select>
            <select className="input" aria-label="Статус PR" value={form.reviewStatusId} onChange={(event) => setForm({ ...form, reviewStatusId: event.target.value })}><option value="">Не менять при PR</option>{statuses.map((status) => <option key={status.id} value={status.id}>{status.name}</option>)}</select>
            <select className="input" aria-label="Статус merged PR" value={form.doneStatusId} onChange={(event) => setForm({ ...form, doneStatusId: event.target.value })}><option value="">Не менять при merge</option>{statuses.map((status) => <option key={status.id} value={status.id}>{status.name}</option>)}</select>
            <label><input type="checkbox" checked={form.enabled} onChange={(event) => setForm({ ...form, enabled: event.target.checked })} /> Включена</label><button className="btn btn-primary" type="submit">Сохранить GitHub</button>
        </form>
        {integrations.length > 0 && <ul style={{ margin: '12px 0 0', paddingLeft: '18px' }}>{integrations.map((integration) => <li key={integration.id}>{integration.repository} — {integration.enabled ? 'включена' : 'выключена'}</li>)}</ul>}
    </section>;
}
