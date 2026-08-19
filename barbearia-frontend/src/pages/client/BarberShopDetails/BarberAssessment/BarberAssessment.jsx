// BarberAssessment/BarberAssessment.jsx
import React, { useState } from 'react';
import { IoStar, IoStarOutline, IoPerson, IoSend, IoAdd } from 'react-icons/io5';
import './BarberAssessment.css';

const BarberAssessment = ({ reviews = [], averageRating = 5.0, totalReviews = 127, onSubmitReview }) => {
  const [visibleReviews, setVisibleReviews] = useState(3);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [userReviews, setUserReviews] = useState([]);

  const defaultReviews = [
    {
      id: 2,
      userName: 'Gustavo Ferreira Lima',
      rating: 5,
      comment: 'Excelente atendimento.',
      date: '14/02/2025'
    },
    {
      id: 3,
      userName: 'Miguel Oliveira Rodrigues',
      rating: 4,
      comment: '',
      date: '26/03/2025'
    },
    {
      id: 4,
      userName: 'Antônio Castro Lima',
      rating: 5,
      comment: 'Pessoal muito atencioso.',
      date: '11/04/2025'
    },
    {
      id: 5,
      userName: 'Carlos Eduardo Silva',
      rating: 5,
      comment: 'Melhor barbearia da região!',
      date: '10/04/2025'
    },
    {
      id: 6,
      userName: 'Rafael Santos',
      rating: 4,
      comment: 'Muito bom, recomendo.',
      date: '05/04/2025'
    },
    {
      id: 7,
      userName: 'João Pedro Costa',
      rating: 5,
      comment: 'Atendimento nota 10!',
      date: '01/04/2025'
    }
  ];

  const reviewsList = reviews.length > 0 ? reviews : defaultReviews;
  const allReviews = [...userReviews, ...reviewsList];
  const displayedReviews = allReviews.slice(0, visibleReviews);
  const hasMore = visibleReviews < allReviews.length;

  const loadMore = () => {
    setVisibleReviews(prev => prev + 3);
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    
    if (rating === 0) return;

    const newReview = {
      id: Date.now(),
      userName: 'Você',
      rating: rating,
      comment: comment,
      date: new Date().toLocaleDateString('pt-BR'),
      isNew: true
    };

    setUserReviews(prev => [newReview, ...prev]);
    
    if (onSubmitReview) {
      onSubmitReview(newReview);
    }

    setRating(0);
    setComment('');
    setShowReviewForm(false);
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <IoStar
        key={index}
        size={16}
        color={index < rating ? '#fbbf24' : '#64748b'}
      />
    ));
  };

  const renderInteractiveStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      const isActive = starValue <= (hoverRating || rating);
      
      return (
        <button
          key={index}
          type="button"
          className="star-button"
          onClick={() => setRating(starValue)}
          onMouseEnter={() => setHoverRating(starValue)}
          onMouseLeave={() => setHoverRating(0)}
        >
          {isActive ? (
            <IoStar size={32} color="#fbbf24" />
          ) : (
            <IoStarOutline size={32} color="#64748b" />
          )}
        </button>
      );
    });
  };

  return (
    <div className="barber-assessment-container">
      <div className="barber-assessment-overview">
        <p className="barber-assessment-label">Nota</p>
        <h2 className="barber-assessment-score">{averageRating.toFixed(1)}</h2>
        <div className="barber-assessment-stars">
          {renderStars(Math.round(averageRating))}
        </div>
        <p className="barber-assessment-count">
          Baseado em {totalReviews} avaliações
        </p>
      </div>

      {!showReviewForm ? (
        <button 
          className="add-review-button"
          onClick={() => setShowReviewForm(true)}
        >
          <div className="add-review-icon">
            <IoAdd size={24} />
          </div>
          <span className="add-review-text">Avaliar Estabelecimento</span>
        </button>
      ) : (
        <div className="barber-review-form">
          <div className="review-form-header">
            <h3 className="review-form-title">Sua Avaliação</h3>
            <button 
              className="review-form-close"
              onClick={() => {
                setShowReviewForm(false);
                setRating(0);
                setComment('');
              }}
            >
              ×
            </button>
          </div>
          
          <form onSubmit={handleSubmitReview}>
            <div className="review-rating-section">
              <label className="review-label">Avalie sua experiência:</label>
              <div className="review-stars-interactive">
                {renderInteractiveStars()}
              </div>
              {rating > 0 && (
                <p className="review-rating-text">
                  {rating === 1 && 'Muito insatisfeito'}
                  {rating === 2 && 'Insatisfeito'}
                  {rating === 3 && 'Regular'}
                  {rating === 4 && 'Satisfeito'}
                  {rating === 5 && 'Muito satisfeito'}
                </p>
              )}
            </div>

            <div className="review-comment-section">
              <label className="review-label" htmlFor="comment">
                Comentário (opcional):
              </label>
              <textarea
                id="comment"
                className="review-textarea"
                placeholder="Conte-nos sobre sua experiência..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                maxLength={500}
              />
              <span className="review-char-count">
                {comment.length}/500 caracteres
              </span>
            </div>

            <button 
              type="submit" 
              className="review-submit-button"
              disabled={rating === 0}
            >
              <IoSend size={18} />
              Enviar Avaliação
            </button>
          </form>
        </div>
      )}

      <div className="barber-assessment-list">
        {displayedReviews.map((review) => (
          <div 
            key={review.id} 
            className={`barber-assessment-item ${review.isNew ? 'new-review' : ''}`}
          >
            <div className="barber-assessment-avatar">
              <IoPerson size={20} />
            </div>
            <div className="barber-assessment-content">
              <div className="barber-assessment-header">
                <h4 className="barber-assessment-name">
                  {review.userName}
                  {review.isNew && <span className="new-badge">Novo</span>}
                </h4>
                <span className="barber-assessment-date">{review.date}</span>
              </div>
              <div className="barber-assessment-rating">
                {renderStars(review.rating)}
              </div>
              {review.comment && (
                <p className="barber-assessment-comment">{review.comment}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="barber-assessment-load-more">
          <button 
            className="barber-assessment-button"
            onClick={loadMore}
          >
            Carregar mais avaliações
          </button>
        </div>
      )}
    </div>
  );
};

export default BarberAssessment;