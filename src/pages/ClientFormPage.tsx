import React from 'react';
import { useNavigate } from 'react-router-dom';
import ClientForm from '../components/ClientForm';

export default function ClientFormPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/clients');
  };

  const handleCancel = () => {
    navigate('/clients');
  };

  return (
    <ClientForm
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
}
