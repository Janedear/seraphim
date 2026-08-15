import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { Plus, Copy, Eye, EyeOff, Trash2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/api/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const CredentialCard = ({ cred, team, onDelete, onRotate }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Card className={cn('bg-transparent backdrop-blur-md border', team === 'blue' ? 'border-cyan-500/20' : 'border-red-500/20')}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-white text-sm">{cred.name}</CardTitle>
            <p className="text-xs text-slate-400 mt-1">{cred.type} • {cred.target}</p>
          </div>
          <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">Stored</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <label className="text-[10px] sm:text-xs text-slate-400">Username</label>
          <div className="flex items-center gap-1 sm:gap-2">
            <Input value={cred.username} readOnly className="bg-black/50 border-slate-700 text-slate-300 text-[10px] sm:text-xs" />
            <Button size="icon" variant="ghost" className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0" onClick={() => {
              navigator.clipboard.writeText(cred.username);
              toast.success('Copied');
            }}>
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] sm:text-xs text-slate-400">Secret</label>
          <div className="flex items-center gap-1">
            <Input type={showPassword ? 'text' : 'password'} value={cred.password} readOnly className="bg-black/50 border-slate-700 text-slate-300 text-[10px] sm:text-xs" />
            <Button size="icon" variant="ghost" className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </Button>
            <Button size="icon" variant="ghost" className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0" onClick={() => {
              navigator.clipboard.writeText(cred.password);
              toast.success('Copied');
            }}>
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button size="sm" variant="ghost" className="flex-1 text-xs" onClick={() => onRotate?.(cred)}>
            <RefreshCw className="w-3 h-3 mr-1" />
            Rotate
          </Button>
          <Button size="sm" variant="destructive" className="flex-1 text-xs" onClick={() => onDelete(cred.id)}>
            <Trash2 className="w-3 h-3 mr-1" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

function randomSecret() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@$%';
  return Array.from({ length: 20 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function CredentialVault() {
  const { user } = useAuth();
  const team = user?.team || localStorage.getItem('secureGuardTeam') || 'blue';
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'Domain', target: '', username: '', password: '' });

  const { data: credentials = [] } = useQuery({
    queryKey: ['credentials'],
    queryFn: () => api.entities.Credential.list(),
  });

  const createCred = useMutation({
    mutationFn: (payload) => api.entities.Credential.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
      setShowForm(false);
      setForm({ name: '', type: 'Domain', target: '', username: '', password: '' });
      toast.success('Credential stored');
    },
    onError: (e) => toast.error(e.message || 'Save failed'),
  });

  const deleteCred = useMutation({
    mutationFn: (id) => api.entities.Credential.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
      toast.success('Credential deleted');
    },
  });

  const rotateCred = useMutation({
    mutationFn: (cred) => api.entities.Credential.update(cred.id, {
      password: randomSecret(),
      lastUsed: new Date().toISOString().slice(0, 10),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
      toast.success('Secret rotated');
    },
  });

  const nextRotation = credentials[0]?.updated_date
    ? new Date(new Date(credentials[0].updated_date).getTime() + 30 * 86400000).toLocaleDateString()
    : '—';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Credential Vault"
        description="Local encrypted-at-rest store for lab account secrets. Starts empty — no demo passwords."
        actions={
          <Button
            className={team === 'blue' ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-red-600 hover:bg-red-700'}
            onClick={() => setShowForm((v) => !v)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Credential
          </Button>
        }
      />

      {showForm && (
        <Card className={cn('bg-transparent backdrop-blur-md border', team === 'blue' ? 'border-cyan-500/20' : 'border-red-500/20')}>
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-black/50 border-slate-700 text-white" />
            <Input placeholder="Type (Domain / Local / API)" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="bg-black/50 border-slate-700 text-white" />
            <Input placeholder="Target" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} className="bg-black/50 border-slate-700 text-white" />
            <Input placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="bg-black/50 border-slate-700 text-white" />
            <Input placeholder="Secret" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="bg-black/50 border-slate-700 text-white md:col-span-2" />
            <Button
              className="md:col-span-2"
              disabled={!form.name || !form.username || createCred.isPending}
              onClick={() => createCred.mutate({
                ...form,
                created: new Date().toISOString().slice(0, 10),
                lastUsed: 'never',
              })}
            >
              Save
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {credentials.map((cred) => (
          <CredentialCard
            key={cred.id}
            cred={cred}
            team={team}
            onDelete={(id) => deleteCred.mutate(id)}
            onRotate={(c) => rotateCred.mutate(c)}
          />
        ))}
      </div>

      <Card className={cn('bg-transparent backdrop-blur-md border', team === 'blue' ? 'border-cyan-500/20' : 'border-red-500/20')}>
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Rotation Policy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between p-3 bg-black/50 rounded border border-slate-700">
              <span className="text-slate-300">Auto-rotate every</span>
              <span className="text-white font-medium">30 days</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-black/50 rounded border border-slate-700">
              <span className="text-slate-300">Suggested next rotation</span>
              <span className="text-white font-medium">{nextRotation}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
