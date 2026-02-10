import React, { useState, useEffect } from 'react';
import apiClient from '../api/client.js';

const StarRating = ({ rating, onRate, interactive = false, size = 20 }) => {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'inline-flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          onClick={() => interactive && onRate && onRate(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          style={{
            cursor: interactive ? 'pointer' : 'default',
            fontSize: `${size}px`,
            color: star <= (hover || rating) ? '#f59e0b' : '#d1d5db',
            transition: 'color 0.15s',
          }}
        >
          &#9733;
        </span>
      ))}
    </div>
  
+};
