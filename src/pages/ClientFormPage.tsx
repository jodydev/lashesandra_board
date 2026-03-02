import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import ClientForm from '../components/ClientForm';

const backgroundColor = (appType: string) => (appType === 'isabellenails' ? '#F7F3FA' : '#ffffff');

export default function ClientFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { appType } = useApp();

  const goBackToList = () => {
    navigate('..', { relative: 'path' });
  };

  const handleRequestDelete = () => {
    navigate('..', { relative: 'path', state: { confirmDeleteId: id } });
  };

  return (
    <div className="h-full min-h-[100dvh] flex flex-col" style={{ backgroundColor: backgroundColor(appType) }}>
      <ClientForm
        clientId={id}
        onSuccess={goBackToList}
        onCancel={goBackToList}
        onRequestDelete={id ? handleRequestDelete : undefined}
      />
    </div>
  );
}
