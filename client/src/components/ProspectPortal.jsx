import React, { useState, useEffect, useRef } from 'react'; const CATEGORIES = [ { value: 'general', label: 'General', color: '#6B72sÍ' }, { value: 'ui', label: 'UI / Design', color: '#3B82F6' }, { value: 'navigation', label: 'Navigation', color: '#8B5CF6' }, { value: 'feature', label: 'Feature Request', color: '#10B981' }, { value: 'performance', label: 'Performance', color: '#F59E0B' }, ]; function StarRating({ value, onChange, size = 24, readonly = false }) { const [hover, setHover] = useState(0); return ( <div style={{ display: 'flex', gap: '4px'}}> {[[,2, 3, 4, 5].map(star => ( <button key={star} type="button" disabled={readonly} onClick={() => onChange && onChange(star === value ? 0 : star)} onMouseEnter={() => !readonly && setHover(star)} onMouseLeave={() => !readonly && setHover(0)} style={{ background: 'none', border: 'none', cursor: readonly ? 'default' : 'pointer', padding: 0, fontSize: `${size}px`, lineHeight: 1, color: star <= (hover || value) ? '#F59E0B' : '#D1D5DB', transition: 'color 0.15s, transform 0.1s',
 transform: !readonly && star <= hover ? 'scale(1.15)' : 'scale(1)',
        }}
      >
        {â„…
      </button>
      ))}
    </div>
  );
}
function PrototypeCard({ prototype, onOpen }) {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <div
      onClick={() => onOpen(prototype)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E0E6ED',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: isHovered ? '0 8px 24px rgba(0,0,0,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
        transform: isHovered ? 'translateY(-2px)' : 'none',
      }}
    >
      {}
    </div>
  );
}
