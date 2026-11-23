import React, { useState, useEffect, useRef } from 'react';
import { Search, X, MapPin, Loader2 } from 'lucide-react';
import { searchCities } from '../services/airQualityService';

export default function CitySearch({ onSelectCity, currentCity }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Debounced search
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const cities = await searchCities(query);
        setResults(cities);
        setIsOpen(true);
      } catch (err) {
        console.error('City search failed:', err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (city) => {
    onSelectCity(city);
    setQuery('');
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div className="city-search-container" ref={containerRef}>
      <div className="city-search-input-wrap">
        <Search size={15} className="city-search-icon" />
        <input
          type="text"
          className="city-search-input"
          placeholder="Search city (e.g. Hyderabad, Delhi)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          aria-label="Search city for air quality telemetry"
        />
        {isSearching && (
          <span style={{ position: 'absolute', right: '1.75rem', display: 'flex', color: 'var(--color-teal)' }}>
            <Loader2 size={14} className="spin-animate" />
          </span>
        )}
        {query && (
          <button className="city-search-clear" onClick={handleClear} aria-label="Clear search">
            <X size={14} />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <ul className="city-dropdown" role="listbox">
          {results.map((item) => (
            <li
              key={`${item.id}-${item.latitude}-${item.longitude}`}
              className="city-dropdown-item"
              onClick={() => handleSelect(item)}
              role="option"
              aria-selected={currentCity?.name === item.name}
            >
              <div>
                <div className="city-dropdown-name">{item.name}</div>
                <div className="city-dropdown-sub">
                  {[item.admin1, item.country].filter(Boolean).join(', ')}
                </div>
              </div>
              <MapPin size={13} style={{ color: 'var(--color-teal)', opacity: 0.7 }} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
