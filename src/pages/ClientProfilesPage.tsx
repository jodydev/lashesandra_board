import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Client, ClientProfileData, ClientWithProfile } from '../types';
import ClientProfileForm from '../components/ClientProfileForm';
import { supabaseService } from '../lib/supabaseService';
import { useAppColors } from '../hooks/useAppColors';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../hooks/useToast';
import { User, Eye, Calendar, Edit3, Search, Filter, Users, FileText, List } from 'lucide-react';
import PageHeader from '../components/PageHeader';

const textPrimaryColor = '#2C2C2C';
const textSecondaryColor = '#7A7A7A';
const surfaceColor = '#FFFFFF';

const ClientProfilesPage: React.FC = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<ClientWithProfile[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientWithProfile[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<ClientProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'list' | 'form'>('list');
  const colors = useAppColors();
  const { appType } = useApp();
  const { showSuccess, showError } = useToast();
  const backgroundColor = appType === 'isabellenails' ? '#F7F3FA' : '#faede0';
  const accentColor = colors.primary;
  const accentGradient = colors.cssGradient;
  const accentSofter = `${colors.primary}14`;
  const accentSoft = `${colors.primary}29`;

  // Carica i clienti e i loro profili
  useEffect(() => {
    loadClients();
  }, []);

  // Filtra i clienti in base al termine di ricerca
  useEffect(() => {
    const filtered = clients.filter(client =>
      `${client.nome} ${client.cognome}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.telefono?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredClients(filtered);
  }, [clients, searchTerm]);

  const loadClients = async () => {
    try {
      setIsLoading(true);
      
      // Carica solo i clienti - i profili verranno caricati quando necessario
      const clientsData = await supabaseService.getClients();
      const clientsWithoutProfiles = clientsData.map(client => ({ ...client, profile: undefined }));
      setClients(clientsWithoutProfiles);
      
      showSuccess(`${clientsData.length} clienti caricati con successo`);
    } catch (error) {
      console.error('Errore nel caricamento dei clienti:', error);
      showError('Errore nel caricamento dei clienti. Riprova.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProfile = async (client: ClientWithProfile) => {
    setSelectedClient(client);
    
    // Carica il profilo del cliente solo quando necessario
    try {
      const profile = await supabaseService.getClientProfile(client.id);
      setSelectedProfile(profile);
    } catch (error) {
      console.warn('Nessun profilo esistente per questo cliente:', error);
      setSelectedProfile(null);
    }
    
    setView('form');
  };

  const handleSaveProfile = async (profileData: ClientProfileData) => {
    if (!selectedClient) return;

    try {
      setIsSaving(true);
      const savedProfile = await supabaseService.saveClientProfile(profileData);
      
      // Aggiorna solo il cliente specifico invece di ricaricare tutti i clienti
      setClients(prevClients => 
        prevClients.map(client => 
          client.id === selectedClient.id 
            ? { ...client, profile: savedProfile }
            : client
        )
      );
      
      showSuccess(`Profilo di ${selectedClient.nome} ${selectedClient.cognome} salvato con successo!`);
      
      // Torna alla lista
      setView('list');
      setSelectedClient(null);
      setSelectedProfile(null);
    } catch (error) {
      console.error('Errore nel salvataggio del profilo:', error);
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

  const getProfileCompletion = (client: ClientWithProfile) => {
    // Se il profilo non è caricato, restituisce null per indicare "non disponibile"
    // Questo evita di fare chiamate API automatiche per calcolare il completamento
    if (!client.profile) return null;
    
    const profile = client.profile;
    let completed = 0;
    let total = 0;

    // Informazioni personali
    total += 1;
    if (profile.data_nascita) completed += 1;

    // Caratteristiche occhi (9 campi)
    total += 9;
    const eyeFields = Object.values(profile.caratteristiche_occhi);
    completed += eyeFields.filter(value => value !== undefined && value !== '').length;

    // Profilo cliente (8 campi)
    total += 8;
    const profileFields = Object.values(profile.profilo_cliente);
    completed += profileFields.filter(value => value !== undefined && value !== '').length;

    // Trattamenti
    total += 1;
    if (profile.trattamenti && profile.trattamenti.length > 0) completed += 1;

    return Math.round((completed / total) * 100);
  };

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

  // Loading skeleton (stile ClientList)
  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor }}>
        <PageHeader title="Schede Cliente" showBack backLabel="Indietro" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Skeleton carosello statistiche */}
          <div className="mb-6 sm:mb-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
            <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[min(88vw,320px)] sm:w-72 snap-center rounded-2xl border p-6 sm:p-7 bg-white dark:bg-gray-900 animate-pulse" style={{ borderColor: accentSofter }}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 sm:h-5 bg-gray-200 dark:bg-gray-800 rounded w-20 sm:w-24" />
                      <div className="h-6 sm:h-8 bg-gray-200 dark:bg-gray-800 rounded w-16 sm:w-20" />
                    </div>
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gray-200 dark:bg-gray-800 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mb-6">
            <div className="relative flex-1 max-w-xs">
              <div className="h-10 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse w-full" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl border p-6 shadow-lg" style={{ backgroundColor: surfaceColor, borderColor: accentSofter }}>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                  </div>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full w-full mb-4" />
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor }}>
      <PageHeader title="Schede Cliente" showBack backLabel="Indietro" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Carosello statistiche scrollabile */}
        <div className="mb-6 sm:mb-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
          <div
            className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory"
          >
            {[
              { title: 'Clienti totali', value: clients.length, icon: Users },
              { title: 'In lista', value: filteredClients.length, icon: List },
              { title: 'Con scheda', value: clients.filter((c) => c.profile).length, icon: FileText },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.title}
                  className="flex-shrink-0 w-[min(88vw,320px)] sm:w-72 snap-center group relative overflow-hidden rounded-2xl border p-6 sm:p-7"
                  style={{ backgroundColor: surfaceColor, borderColor: accentSofter }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-2 sm:space-y-2.5">
                      <p className="text-xs sm:text-sm font-medium uppercase tracking-wide" style={{ color: textSecondaryColor }}>
                        {stat.title}
                      </p>
                      <p className="text-2xl sm:text-3xl font-semibold dark:text-white truncate" style={{ color: textPrimaryColor }}>
                        {stat.value}
                      </p>
                    </div>
                    <span
                      className="flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-xl"
                      style={{ background: accentGradient }}
                      aria-hidden
                    >
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" strokeWidth={2} aria-hidden />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Barra ricerca (stile ClientList: una riga, no box) */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative flex-1 min-w-0 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca per nome, cognome, telefono o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 dark:bg-gray-800 dark:text-white"
              style={{ borderColor: accentSoft }}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">{filteredClients.length} clienti</span>
          </div>
        </div>

        {/* Lista clienti in griglia (stile ClientList) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredClients.map((client) => {
            const completion = getProfileCompletion(client);
            const hasProfile = !!client.profile;
            return (
              <div
                key={client.id}
                className="rounded-2xl border p-4 shadow-lg sm:p-6 transition-shadow hover:shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${surfaceColor}F8, rgba(255,255,255,0.9))`,
                  borderColor: accentSofter,
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center min-w-0 flex-1">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-semibold text-lg shadow-lg flex-shrink-0"
                      style={{ background: accentGradient }}
                    >
                      {client.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-3 min-w-0">
                      <h3 className="text-base font-semibold truncate sm:text-lg" style={{ color: textPrimaryColor }}>
                        {client.nome} {client.cognome}
                      </h3>
                      <p className="text-sm truncate" style={{ color: textSecondaryColor }}>
                        {client.telefono || 'Nessun telefono'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleEditProfile(client)}
                    className="rounded-xl border bg-white/70 p-2 flex-shrink-0 hover:bg-white dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                    style={{ borderColor: accentSofter }}
                  >
                    <Edit3 className="w-4 h-4" style={{ color: colors.primaryDark }} />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: textSecondaryColor }}>Profilo</span>
                    <span
                      className="text-sm font-medium"
                      style={{ color: hasProfile ? '#047857' : textSecondaryColor }}
                    >
                      {hasProfile ? 'Completato' : 'Non creato'}
                    </span>
                  </div>

                  {hasProfile && completion !== null && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span style={{ color: textSecondaryColor }}>Completamento</span>
                        <span style={{ color: textPrimaryColor }}>{completion}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-300"
                          style={{ width: `${completion}%`, background: accentGradient }}
                        />
                      </div>
                    </div>
                  )}

                  {hasProfile && client.profile && (
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t" style={{ borderColor: accentSofter }}>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/70 shadow-inner dark:bg-gray-800">
                          <Eye className="h-4 w-4" style={{ color: accentColor }} />
                        </div>
                        <span className="text-xs" style={{ color: textSecondaryColor }}>Occhi</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/70 shadow-inner dark:bg-gray-800">
                          <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-xs" style={{ color: textSecondaryColor }}>
                          {client.profile.trattamenti?.length || 0} Trattamenti
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t" style={{ borderColor: accentSofter }}>
                  <button
                    type="button"
                    onClick={() => handleEditProfile(client)}
                    className="w-full flex items-center justify-center px-4 py-2.5 text-white rounded-xl font-medium transition-opacity hover:opacity-90 shadow-lg"
                    style={{ background: accentGradient }}
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    {hasProfile ? 'Modifica Profilo' : 'Crea Profilo'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State (stile ClientList) */}
        {filteredClients.length === 0 && (
          <div
            className="rounded-2xl border p-10 text-center shadow-lg sm:p-14"
            style={{
              background: `linear-gradient(135deg, ${surfaceColor}F7, rgba(255,255,255,0.9))`,
              borderColor: accentSofter,
            }}
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl" style={{ background: accentSofter }}>
              <User className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold sm:text-xl" style={{ color: textPrimaryColor }}>
              {searchTerm ? 'Nessun cliente trovato' : 'Nessun cliente disponibile'}
            </h3>
            <p className="mx-auto max-w-lg text-sm sm:text-base" style={{ color: textSecondaryColor }}>
              {searchTerm
                ? 'Prova a modificare i termini di ricerca'
                : 'Aggiungi dei clienti per iniziare a creare i profili'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientProfilesPage;
