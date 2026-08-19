// BarberServices/BarberServices.jsx
import React, { useState } from 'react';
import { IoCut } from 'react-icons/io5';
import ScheduleModal from './ScheduleTime/ScheduleTime';
import './BarberServices.css';

const BarberServices = ({ services = [], clientName = "Miguel Oliveira Rodrigues" }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  const defaultServices = [
    { id: 1, name: 'Cabelo', price: 30.00 },
    { id: 2, name: 'Barba', price: 20.00 },
    { id: 3, name: 'Sombrancelha', price: 10.00 },
    { id: 4, name: 'Limpeza de Pele', price: 30.00 },
    { id: 5, name: 'Pigmentação', price: 20.00 },
    { id: 6, name: 'Platinado', price: 120.00 }
  ];

  const servicesList = services.length > 0 ? services : defaultServices;

  const handleSchedule = (service) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  if (servicesList.length === 0) {
    return (
      <div className="barber-services-empty">
        <IoCut className="empty-icon" size={48} />
        <h3>Nenhum serviço disponível</h3>
        <p>Esta barbearia ainda não cadastrou serviços</p>
      </div>
    );
  }

  return (
    <div className="barber-services-container">
      <div className="barber-services-list">
        {servicesList.map((service) => (
          <div key={service.id} className="barber-service-card">
            <div className="barber-service-left">
              <div className="barber-service-avatar">
                <IoCut size={20} />
              </div>
              <div className="barber-service-info">
                <h4 className="barber-service-name">{service.name}</h4>
                <p className="barber-service-price">
                  R$ {service.price.toFixed(2).replace('.', ',')}
                </p>
              </div>
            </div>
            <div className="barber-service-right">
              <button 
                className="barber-service-button"
                onClick={() => handleSchedule(service)}
              >
                Agendar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Agendamento */}
      <ScheduleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        clientName={clientName}
        service={selectedService}
      />
    </div>
  );
};

export default BarberServices;
