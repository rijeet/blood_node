'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface CustomSelectProps {
  options: readonly SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  required?: boolean;
}

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  disabled = false,
  className = "",
  id,
  required = false
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const selectRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && highlightedIndex >= 0) {
      const optionElement = selectRef.current?.querySelector(`[data-index="${highlightedIndex}"]`);
      optionElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex, isOpen]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (isOpen && highlightedIndex >= 0) {
          const option = options[highlightedIndex];
          if (!option.disabled) {
            onChange(option.value);
            setIsOpen(false);
          }
        } else {
          setIsOpen(true);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev => 
            prev < options.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : options.length - 1
          );
        }
        break;
    }
  };

  const handleOptionClick = (option: SelectOption) => {
    if (!option.disabled) {
      onChange(option.value);
      setIsOpen(false);
    }
  };

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        id={id}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`
          w-full px-4 py-3 text-sm border border-input rounded-lg bg-background text-foreground shadow-sm
          focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
          transition-all duration-200 appearance-none cursor-pointer
          hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center justify-between
          ${isOpen ? 'ring-2 ring-ring border-transparent' : ''}
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-required={required}
      >
        <span className={selectedOption ? 'text-foreground' : 'text-muted-foreground'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-input rounded-lg shadow-lg max-h-60 overflow-auto">
          {options.map((option, index) => (
            <div
              key={option.value}
              data-index={index}
              onClick={() => handleOptionClick(option)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`
                px-4 py-3 text-sm cursor-pointer flex items-center justify-between
                transition-colors duration-150
                ${option.disabled 
                  ? 'text-muted-foreground cursor-not-allowed bg-muted' 
                  : index === highlightedIndex 
                    ? 'bg-accent text-accent-foreground' 
                    : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                }
                ${option.value === value ? 'bg-accent/60' : ''}
              `}
              role="option"
              aria-selected={option.value === value}
              aria-disabled={option.disabled}
            >
              <span>{option.label}</span>
              {option.value === value && (
                <Check className="w-4 h-4" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
