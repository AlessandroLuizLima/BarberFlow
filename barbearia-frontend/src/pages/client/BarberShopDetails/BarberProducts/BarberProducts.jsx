// BarberProducts/BarberProducts.jsx
import React from 'react';
import { IoBag } from 'react-icons/io5';
import { FiShoppingCart } from 'react-icons/fi';
import './BarberProducts.css';

const BarberProducts = ({ products = [], onAddToCart }) => {
  
  const defaultProducts = [
    { id: 1, name: 'Pomada em pó 150g', price: 30.00 },
    { id: 2, name: 'Pomada em pó 90g', price: 20.00 },
    { id: 3, name: 'Shampoo Anti caspa', price: 25.00 },
    { id: 4, name: 'Óleo para barba', price: 35.00 },
    { id: 5, name: 'Pó descolorante 300g', price: 35.00 },
    { id: 6, name: 'Máscara De Hidratação', price: 75.00 }
  ];

  const productsList = products.length > 0 ? products : defaultProducts;

  const handleAddToCart = (productId) => {
    if (onAddToCart) {
      onAddToCart(productId);
    } else {
      console.log('Adicionar ao carrinho:', productId);
    }
  };

  if (productsList.length === 0) {
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
      <div className="barber-products-list">
        {productsList.map((product) => (
          <div key={product.id} className="barber-product-card">
            <div className="barber-product-left">
              <div className="barber-product-avatar">
                <IoBag size={20} />
              </div>
              <div className="barber-product-info">
                <h4 className="barber-product-name">{product.name}</h4>
                <p className="barber-product-price">
                  R$ {product.price.toFixed(2).replace('.', ',')}
                </p>
              </div>
            </div>
            <div className="barber-product-right">
              <button 
                className="barber-product-button"
                onClick={() => handleAddToCart(product.id)}
              >
                <FiShoppingCart size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BarberProducts;