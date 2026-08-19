// BarberDetails/BarberDetails.jsx
import React from 'react';
import './BarberDetails.css';

const BarberDetails = ({ barbershop = {} }) => {
  
  const defaultData = {
    address: {
      street: 'Rua Jardim Alegre, 355',
      neighborhood: 'Jardim Zaira',
      city: 'Guarulhos',
      state: 'SP'
    },
    openingHours: [
      { day: 'Segunda-feira', hours: '08:00 - 20:00' },
      { day: 'Terça-feira', hours: '08:00 - 20:00' },
      { day: 'Quarta-feira', hours: '08:00 - 20:00' },
      { day: 'Quinta-feira', hours: '08:00 - 20:00' },
      { day: 'Sexta-feira', hours: '08:00 - 20:00' },
      { day: 'Sábado', hours: '08:00 - 20:00' }
    ],
    paymentMethods: ['Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'PIX']
  };

  const data = Object.keys(barbershop).length > 0 ? barbershop : defaultData;

  return (
    <div className="barber-details-container">
      {/* Endereço */}
      <div className="barber-details-card">
        <h3 className="barber-details-title">Endereço</h3>
        <div className="barber-details-content">
          <p className="barber-details-text">
            {data.address.street}, {data.address.neighborhood}
          </p>
          <p className="barber-details-text">
            {data.address.city} - {data.address.state}
          </p>
        </div>
      </div>

      {/* Horário de Atendimento */}
      <div className="barber-details-card">
        <h3 className="barber-details-title">Horário de atendimento</h3>
        <div className="barber-details-hours">
          {data.openingHours.map((item, index) => (
            <div key={index} className="barber-details-hour-item">
              <span className="barber-details-day">{item.day}</span>
              <span className="barber-details-time">{item.hours}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Formas de Pagamento */}
      <div className="barber-details-card">
        <h3 className="barber-details-title">Formas de Pagamento</h3>
        <div className="barber-details-content">
          <ul className="barber-details-payment-list">
            {data.paymentMethods.map((method, index) => (
              <li key={index} className="barber-details-payment-item">
                {method}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BarberDetails;