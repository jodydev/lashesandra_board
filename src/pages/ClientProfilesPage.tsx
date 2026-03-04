import { useState, useEffect, useMemo } from 'react';
import type React from 'react';
import type { Client, ClientProfileData, ClientWithProfile } from '../types';
import ClientProfileForm from '../components/ClientProfileForm';
import { useSupabaseServices } from '../lib/supabaseService';
import { useToast } from '../hooks/useToast';
import {
  User, Eye, Calendar, Edit3, Search,
  Users, FileText, ChevronRight, Sparkles,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg:       '#FAF0E8',
  surface:  '#FFFFFF',
  accent:   '#C07850',
  accentDk: '#A05830',
  accentSft:'rgba(192,120,80,0.10)',
  accentMid:'rgba(192,120,80,0.20)',
  border:   '#EDE0D8',
  text:     '#2C2C2C',
  muted:    '#9A8880',
  ok:       '#22C55E',
  okBg:     '#F0FDF4',
  okBdr:    'rgba(34,197,94,0.25)',
} as const;

const GRAD = `linear-gradient(135deg, ${C.accent}, ${C.accentDk})`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getProfileCompletion(client: ClientWithProfile): number | null {
  if (!client.profile) return null;
  const p = client.profile;
  let completed = 0;
  let total = 0;
  total += 1;
  if (p.data_nascita) completed += 1;
  const eye = p.caratteristiche_occhi && typeof p.caratteristiche_occhi === 'object'
    ? Object.values(p.caratteristiche_occhi)
    : [];
  total += eye.length;
  completed += eye.filter(v => v !== undefined && v !== '' && v !== null).length;
  const prof = p.profilo_cliente && typeof p.profilo_cliente === 'object'
    ? Object.values(p.profilo_cliente)
    : [];
  total += prof.length;
  completed += prof.filter(v => v !== undefined && v !== '' && v !== null).length;
  total += 1;
  if (p.trattamenti?.length) completed += 1;
  return total > 0 ? Math.round((completed / total) * 100) : 0;
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{
      background: C.surface, border: `1.5px solid ${C.border}`,
      borderRadius: 22, padding: '18px 16px',
      display: 'flex', gap: 14, alignItems: 'center',
    }}>
      <div style={{ width: 48, height: 48, borderRadius: 16, background: C.border, flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ height: 14, borderRadius: 8, background: C.border, width: '60%' }} />
        <div style={{ height: 10, borderRadius: 6, background: C.accentSft, width: '40%' }} />
        <div style={{ height: 4, borderRadius: 100, background: C.border, width: '80%' }} />
      </div>
      <div style={{ width: 36, height: 36, borderRadius: 12, background: C.border, flexShrink: 0 }} />
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, accent }: {
  label: string; value: number; icon: React.ElementType; accent?: boolean;
}) {
  return (
    <div style={{
      background: C.surface, border: `1.5px solid ${C.border}`,
      borderRadius: 20, padding: '14px 16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      position: 'relative', overflow: 'hidden', flexShrink: 0,
    }}>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: C.muted }}>
        {label}
      </p>
      <p style={{ fontSize: 28, fontWeight: 900, color: accent ? C.accent : C.text, lineHeight: 1.1, marginTop: 4 }}>
        {value}
      </p>
      <div style={{
        position: 'absolute', right: 10, bottom: 10,
        width: 34, height: 34, borderRadius: 11,
        background: C.accentSft,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={16} color={C.accent} strokeWidth={2} />
      </div>
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? C.ok : pct >= 40 ? C.accent : C.muted;
  return (
    <div style={{ height: 5, borderRadius: 100, background: '#F0E8E0', overflow: 'hidden' }}>
      <div
        style={{
          height: '100%',
          width: `${pct}%`,
          borderRadius: 100,
          background: color,
        }}
      />
    </div>
  );
}

// ─── Client card ─────────────────────────────────────────────────────────────
function ClientCard({
  client, onEdit,
}: {
  client: ClientWithProfile;
  onEdit: (c: ClientWithProfile) => void;
  key?: string;
}) {
  const hasProfile = !!client.profile;
  const completion = getProfileCompletion(client);

  return (
    <div
      style={{
        background: C.surface,
        border: `1.5px solid ${hasProfile ? C.accentMid : C.border}`,
        borderRadius: 22,
        overflow: 'hidden',
        boxShadow: hasProfile
          ? '0 3px 14px rgba(192,120,80,0.12)'
          : '0 1px 6px rgba(0,0,0,0.04)',
      }}
    >
      {/* Top accent line if profile exists */}
      {hasProfile && (
        <div style={{ height: 3, background: GRAD }} />
      )}

      <div style={{ padding: '16px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          {/* Avatar */}
          <div style={{
            width: 48, height: 48, borderRadius: 16, flexShrink: 0,
            background: GRAD,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}>
            {client.foto_url
              ? <img src={client.foto_url} alt={`${client.nome} ${client.cognome}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontWeight: 800, fontSize: 18, color: '#FFF' }}>
                  {client.nome.charAt(0).toUpperCase()}
                </span>
            }
          </div>

          {/* Name + phone */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 3 }}>
              {client.nome} {client.cognome}
            </p>
            <p style={{ fontSize: 13, color: C.muted }}>
              {client.telefono || 'Nessun telefono'}
            </p>
          </div>

          {/* Edit icon */}
          <button
            type="button"
            onClick={() => onEdit(client)}
            aria-label="Modifica profilo"
            style={{
              width: 38, height: 38, borderRadius: 13,
              background: C.accentSft, border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            <Edit3 size={15} color={C.accent} />
          </button>
        </div>

        {/* Profile status */}
        {!hasProfile ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', borderRadius: 14,
            background: C.accentSft, border: `1px dashed ${C.accentMid}`,
          }}>
            <span style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>Profilo non ancora creato</span>
            <ChevronRight size={14} color={C.muted} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Completion bar */}
            {completion !== null && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>Completamento scheda</span>
                  <span style={{
                    fontSize: 12, fontWeight: 800,
                    color: completion >= 80 ? C.ok : completion >= 40 ? C.accent : C.muted,
                  }}>
                    {completion}%
                  </span>
                </div>
                <ProgressBar pct={completion} />
              </div>
            )}

            {/* Profile pills */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', borderRadius: 100,
                background: C.accentSft, fontSize: 12, fontWeight: 700, color: C.accent,
              }}>
                <Eye size={11} /> Occhi
              </span>
              {(() => {
                const treatmentsCount = client.profile?.trattamenti?.length ?? 0;
                if (treatmentsCount <= 0) return null;
                return (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px', borderRadius: 100,
                  background: C.okBg, fontSize: 12, fontWeight: 700, color: '#15803D',
                }}>
                    <Calendar size={11} /> {treatmentsCount} trattament{treatmentsCount === 1 ? 'o' : 'i'}
                </span>
                );
              })()}
              {completion !== null && completion >= 80 && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px', borderRadius: 100,
                  background: C.okBg, fontSize: 12, fontWeight: 700, color: '#15803D',
                }}>
                  <Sparkles size={11} /> Completo
                </span>
              )}
            </div>
          </div>
        )}

        {/* CTA */}
        <button
          type="button"
          onClick={() => onEdit(client)}
          style={{
            width: '100%', marginTop: 14, height: 46,
            borderRadius: 15, border: 'none',
            background: GRAD,
            fontWeight: 800, fontSize: 14, color: '#FFF',
            cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 4px 16px rgba(192,120,80,0.28)',
          }}
        >
          <Edit3 size={15} strokeWidth={2.5} />
          {hasProfile ? 'Modifica scheda' : 'Crea scheda'}
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
const ClientProfilesPage: React.FC = () => {
  const [clients,        setClients]        = useState<ClientWithProfile[]>([]);
  const [selectedClient, setSelectedClient]  = useState<Client | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<ClientProfileData | null>(null);
  const [isLoading,      setIsLoading]       = useState(true);
  const [isSaving,       setIsSaving]        = useState(false);
  const [searchTerm,     setSearchTerm]      = useState('');
  const [view,           setView]            = useState<'list' | 'form'>('list');

  const { clientService, clientProfileService } = useSupabaseServices();
  const { showSuccess, showError } = useToast();

  const filteredClients = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return clients;
    return clients.filter(c => {
      const fullName = `${(c.nome ?? '')} ${(c.cognome ?? '')}`.toLowerCase();
      const phone = (c.telefono || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      return fullName.includes(q) || phone.includes(q) || email.includes(q);
    });
  }, [clients, searchTerm]);

  // ── Load ───────────────────────────────────────────────────────────────────
  useEffect(() => { loadClients(); }, []);

  const loadClients = async () => {
    try {
      setIsLoading(true);
      const [baseClients, allProfiles] = await Promise.all([
        clientService.getAll(),
        clientProfileService.getAll(),
      ]);
      const profileByClientId = new Map(allProfiles.map(p => [p.client_id, p]));
      const clientsWithProfiles: ClientWithProfile[] = baseClients.map(c => ({
        ...c,
        profile: profileByClientId.get(c.id) ?? undefined,
      }));
      setClients(clientsWithProfiles);
    } catch {
      showError('Errore nel caricamento dei clienti. Riprova.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Edit profile ───────────────────────────────────────────────────────────
  const handleEditProfile = async (client: ClientWithProfile) => {
    setSelectedClient(client);
    try {
      const profile = await clientProfileService.getByClientId(client.id);
      setSelectedProfile(profile);
    } catch {
      setSelectedProfile(null);
    }
    setView('form');
  };

  const handleSaveProfile = async (profileData: ClientProfileData) => {
    if (!selectedClient) return;
    try {
      setIsSaving(true);
      const saved = await clientProfileService.save(profileData);
      setClients(prev => prev.map(c =>
        c.id === selectedClient.id ? { ...c, profile: saved } : c
      ));
      showSuccess(`Scheda di ${selectedClient.nome} ${selectedClient.cognome} salvata!`);
      setView('list');
      setSelectedClient(null);
      setSelectedProfile(null);
    } catch {
      showError('Errore nel salvataggio del profilo. Riprova.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setView('list');
    setSelectedClient(null);
    setSelectedProfile(null);
  };

  // ── Form view ──────────────────────────────────────────────────────────────
  if (view === 'form' && selectedClient) {
    return (
      <ClientProfileForm
        client={selectedClient}
        initialData={selectedProfile || undefined}
        onSave={handleSaveProfile}
        onCancel={handleCancel}
        isLoading={isSaving}
      />
    );
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  const withProfileCount = clients.filter(c => c.profile).length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <PageHeader title="Schede Cliente" showBack backLabel="Indietro" />

      <main style={{ maxWidth: 540, margin: '0 auto', padding: '20px 16px 80px' }}
        className="safe-area-content-below-header">

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
          <StatCard label="Totali"     value={clients.length}          icon={Users}    />
          <StatCard label="In lista"   value={filteredClients.length}  icon={FileText} />
          <StatCard label="Con scheda" value={withProfileCount}        icon={Eye}      accent />
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <Search size={16} color={C.muted} style={{
            position: 'absolute', left: 16, top: '50%',
            transform: 'translateY(-50%)', pointerEvents: 'none',
          }} />
          <input
            type="text"
            placeholder="Cerca per nome, telefono o email…"
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              height: 50, paddingLeft: 44, paddingRight: 16,
              borderRadius: 16, border: `1.5px solid ${C.border}`,
              background: C.surface, fontSize: 15, color: C.text,
              fontFamily: 'inherit', outline: 'none',
            }}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                width: 24, height: 24, borderRadius: 12,
                background: C.border, border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 12, color: C.muted, fontWeight: 700, lineHeight: 1 }}>✕</span>
            </button>
          )}
        </div>

        {/* Section header */}
        {!isLoading && clients.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ fontWeight: 800, fontSize: 16, color: C.text }}>
              {searchTerm ? `Risultati (${filteredClients.length})` : 'Clienti'}
            </p>
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
              padding: '4px 10px', borderRadius: 100,
              background: C.accentSft, color: C.accent,
            }}>
              {clients.length} totali
            </span>
          </div>
        )}

        {/* Loading skeletons */}
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Array.from({ length: 5 }, (_, i) => (
              <div key={`skeleton-${i}`}>
                <SkeletonCard />
              </div>
            ))}
          </div>
        ) : filteredClients.length === 0 ? (
          /* Empty state */
          <div
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '52px 24px',
              borderRadius: 28, border: `2px dashed ${C.border}`,
              background: C.surface, textAlign: 'center',
            }}
          >
            <div style={{
              width: 72, height: 72, borderRadius: 24,
              background: C.accentSft,
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
            }}>
              <User size={32} color={C.accent} />
            </div>
            <p style={{ fontWeight: 800, fontSize: 18, color: C.text }}>
              {searchTerm ? 'Nessun risultato' : 'Nessun cliente'}
            </p>
            <p style={{ fontSize: 14, color: C.muted, marginTop: 8, maxWidth: 260, lineHeight: 1.6 }}>
              {searchTerm
                ? `Nessun cliente corrisponde a "${searchTerm}"`
                : 'Aggiungi clienti per iniziare a creare le schede personali'}
            </p>
          </div>
        ) : (
          /* Client list */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredClients.map(client => (
              <ClientCard
                key={client.id}
                client={client}
                onEdit={handleEditProfile}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ClientProfilesPage;