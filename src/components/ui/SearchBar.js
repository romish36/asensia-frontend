import React from 'react';
import './SearchBar.css';

const SearchBar = ({ value, onChange, placeholder = "Search...", label = "SEARCH", className = "" }) => {
    return (
        <div className={`custom-search-container ${className}`}>
            {label && <label className="custom-search-label">{label}</label>}
            <div className="custom-search-wrapper">
                <input
                    type="text"
                    className="custom-search-input"
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                />
                <div className="custom-search-icon-wrapper">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="custom-search-icon"
                    >
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default SearchBar;
