// BarberProducts/BarberProducts.jsx
// Produtos de balcão da barbearia (cadastrados no painel). A compra é feita na barbearia,
// por isso cada produto mostra se está disponível ou esgotado, em vez de um carrinho.
import React from 'react';
import { IoBag } from 'react-icons/io5';
import './BarberProducts.css';

const CATEGORIAS = { cuidados: 'Cuidados', styling: 'Finalização', barba: 'Barba', acessorios: 'Acessórios' };

const BarberProducts = ({ products = [], carregando = false }) => {
  if (carregando) {
    return (
      <div className="barber-products-empty">
        <p>Carregando produtos...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="barber-products-empty">
        <IoBag className="empty-icon" size={48} />
        <h3>Nenhum produto disponível</h3>
        <p>Esta barbearia ainda não cadastrou produtos</p>
      </div>
    );
  }

  return (
    <div className="barber-products-container">
      <p className="barber-products-aviso">Produtos vendidos no balcão da barbearia. Peça no dia do seu atendimento.</p>
      <div className="barber-products-list">
        {products.map((product) => (
          <div key={product.id} className={`barber-product-card ${product.available === false ? 'esgotado' : ''}`}>
            <div className="barber-product-left">
              <div className="barber-product-avatar">
                <IoBag size={20} />
              </div>
              <div className="barber-product-info">
                <h4 className="barber-product-name">{product.name}</h4>
                {product.description && <p className="barber-product-desc">{product.description}</p>}
                <p className="barber-product-price">
                  R$ {Number(product.price).toFixed(2).replace('.', ',')}
                  {product.category && <span className="barber-product-categoria">{CATEGORIAS[product.category] || product.category}</span>}
                </p>
              </div>
            </div>
            <div className="barber-product-right">
              <span className={`barber-product-estoque ${product.available === false ? 'off' : 'on'}`}>
                {product.available === false ? 'Esgotado' : 'Disponível'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BarberProducts;
