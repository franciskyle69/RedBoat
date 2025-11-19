import { useState } from "react";

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'small' | 'medium' | 'large';
}

function StarRating({ rating, onRatingChange, readonly = false, size = 'medium' }: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const getSizeClass = () => {
    switch (size) {
      case 'small': return 'star-small';
      case 'large': return 'star-large';
      default: return 'star-medium';
    }
  };

  const handleClick = (value: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(value);
    }
  };

  const handleMouseEnter = (value: number) => {
    if (!readonly) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0);
    }
  };

  const getStarClass = (starValue: number) => {
    const currentRating = hoverRating || rating;
    const baseClass = `star ${getSizeClass()}`;
    
    if (currentRating >= starValue) {
      return `${baseClass} star-filled`;
    } else if (currentRating >= starValue - 0.5) {
      return `${baseClass} star-half`;
    } else {
      return `${baseClass} star-empty`;
    }
  };

  return (
    <div className={`star-rating ${readonly ? 'readonly' : 'interactive'}`}>
      {[1, 2, 3, 4, 5].map((starValue) => (
        <span
          key={starValue}
          className={getStarClass(starValue)}
          onClick={() => handleClick(starValue)}
          onMouseEnter={() => handleMouseEnter(starValue)}
          onMouseLeave={handleMouseLeave}
          style={{
            cursor: readonly ? 'default' : 'pointer',
            color: (hoverRating || rating) >= starValue ? '#fbbf24' : '#d1d5db',
            fontSize: size === 'small' ? '16px' : size === 'large' ? '32px' : '24px',
            marginRight: '4px',
            transition: 'color 0.2s ease',
          }}
        >
          ★
        </span>
      ))}
      {!readonly && (
        <span className="rating-text" style={{ marginLeft: '8px', fontSize: '14px', color: '#6b7280' }}>
          {hoverRating || rating}/5
        </span>
      )}
    </div>
  );
}

export default StarRating;
