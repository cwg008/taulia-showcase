import React, { useState, useEffect } from 'react';

const SearchFilterBar = ({ searchPlaceholder = 'Search...', filters = [], onSearchChange, onFilterChange }) => {
  const [searchInput, setSearchInput] = useState('');

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, onSearchChange]);

  return (
    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
      <input
        type="text"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        placeholder={searchPlaceholder}
        style={{ flex: '1', minWidth: '200px', maxWidth: '400px', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
      />
      {filters.map(filter => (
        <select
          key={filter.key}
          onChange={(e) => onFilterChange(filter.key, e.target.value)}
          style={{ padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', background: 'white', color: '#1e293b' }}
        >
          <option value="">{filter.label}</option>
          {filter.options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ))}
    </div>
  );
};

export default SearchFilterBar;
