import React from 'react';
import './StarRating.css';

// Separate Star Rating Component
const StarRating = ({ criteriaId, maxStars = 5, value = 0, onChange }) => {
  const stars = Array.from({ length: maxStars }, (_, index) => index + 1);
  
  return (
    <div className="star-rating-wrapper">
      <div className="star-rating">
        {stars.map((star) => (
          <span
            key={star}
            className={`star ${star <= value ? "active" : ""}`}
            onClick={() => onChange(criteriaId, star)}
            onMouseEnter={(e) => {
              const parent = e.currentTarget.parentNode;
              const children = Array.from(parent.children);
              children.forEach((child, index) => {
                if (index < star) {
                  child.classList.add("hover");
                } else {
                  child.classList.remove("hover");
                }
              });
            }}
            onMouseLeave={(e) => {
              const parent = e.currentTarget.parentNode;
              const children = Array.from(parent.children);
              children.forEach((child) => {
                child.classList.remove("hover");
              });
            }}
          >
            <i className="fas fa-star"></i>
          </span>
        ))}
      </div>
      
      <div className="star-rating-labels">
        <span>ต่ำ</span>
        <span>สูง</span>
      </div>
    </div>
  );
};

// Static Component to Display Stars (read-only)
export const StarDisplay = ({ score, maxStars = 5 }) => {
  const stars = [];
  for (let i = 1; i <= maxStars; i++) {
    stars.push(
      <i 
        key={i}
        className={`fas fa-star ${i <= score ? "star-filled" : "star-empty"}`}
      ></i>
    );
  }
  return <div className="stars-display">{stars}</div>;
};

export default StarRating;