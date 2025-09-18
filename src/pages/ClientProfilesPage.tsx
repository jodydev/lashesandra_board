import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Client, ClientProfileData, ClientWithProfile } from '../types';
import ClientProfileForm from '../components/ClientProfileForm';
import { supabaseService } from '../lib/supabaseService';
import { useAppColors } from '../hooks/useAppColors';
import { useToast } from '../hooks/useToast';
import { 
  FiUser, 
  FiEye, 
  FiCalendar, 
  FiEdit3, 
  FiSearch,
  FiFilter
} from 'react-icons/fi';

const ClientProfilesPage: React.FC = () => {
  const [clients, setClients] = useState<ClientWithProfile[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientWithProfile[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<ClientProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'list' | 'form'>('list');
  const colors = useAppColors();
  const { showSuccess, showError } = useToast();

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Schede Cliente
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
            Gestisci i profili dettagliati dei tuoi clienti
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Cerca per nome, cognome, telefono o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border-2 ${colors.borderPrimary} dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 ${colors.focusRing} focus:border-transparent transition-colors duration-200`}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                <FiFilter className="w-4 h-4 mr-2" />
                Filtri
              </button>
            </div>
          </div>
        </div>

        {/* Clients List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredClients.map((client) => {
                const completion = getProfileCompletion(client);
                const hasProfile = !!client.profile;
                
                return (
                  <motion.div
                    key={client.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
                  >
                    {/* Client Info */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className={`w-12 h-12 ${colors.bgPrimary} dark:${colors.bgPrimaryDark} rounded-xl flex items-center justify-center`}>
                          <FiUser className={`w-6 h-6 ${colors.textPrimary} dark:${colors.textPrimaryDark}`} />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {client.nome} {client.cognome}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {client.telefono || 'Nessun telefono'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditProfile(client)}
                          className={`p-2 ${colors.textPrimary} hover:opacity-80 dark:${colors.textPrimaryDark} dark:hover:opacity-80 transition-colors duration-200`}
                        >
                          <FiEdit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Profile Status */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Profilo
                        </span>
                        <span className={`text-sm font-medium ${
                          hasProfile ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {hasProfile ? 'Completato' : 'Non creato'}
                        </span>
                      </div>

                      {hasProfile && completion !== null && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Completamento</span>
                            <span className="text-gray-900 dark:text-gray-100">{completion}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-pink-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${completion}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Quick Stats */}
                      {hasProfile && client.profile && (
                        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="text-center">
                            <div className={`flex items-center justify-center ${colors.textPrimary} dark:${colors.textPrimaryDark} mb-1`}>
                              <FiEye className="w-4 h-4" />
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {client.profile.caratteristiche_occhi.colore_occhi ? 'Occhi' : 'Occhi'}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center text-green-600 dark:text-green-400 mb-1">
                              <FiCalendar className="w-4 h-4" />
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {client.profile.trattamenti?.length || 0} Trattamenti
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => handleEditProfile(client)}
                        className={`w-full flex items-center justify-center px-4 py-2 ${colors.bgGradient} text-white rounded-xl hover:opacity-90 transition-all duration-200 shadow-lg ${colors.shadowPrimary}`}
                      >
                        <FiEdit3 className="w-4 h-4 mr-2" />
                        {hasProfile ? 'Modifica Profilo' : 'Crea Profilo'}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredClients.length === 0 && (
          <div className="text-center py-12">
            <FiUser className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {searchTerm ? 'Nessun cliente trovato' : 'Nessun cliente disponibile'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm 
                ? 'Prova a modificare i termini di ricerca'
                : 'Aggiungi dei clienti per iniziare a creare i profili'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientProfilesPage;
