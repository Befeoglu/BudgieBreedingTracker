import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, X } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

interface DatePickerProps {
  value?: string;
  onChange: (date: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
  className?: string;
}

interface DateWheelProps {
  type: 'day' | 'month' | 'year';
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  disabled?: boolean;
}

const DateWheel: React.FC<DateWheelProps> = ({ type, value, onChange, min, max, disabled }) => {
  const { t } = useTranslation();
  const wheelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  const items = [];
  for (let i = min; i <= max; i++) {
    items.push(i);
  }

  const itemHeight = 40;
  const visibleItems = 5;
  const containerHeight = visibleItems * itemHeight;

  useEffect(() => {
    if (wheelRef.current) {
      const index = items.indexOf(value);
      const scrollPosition = index * itemHeight - (containerHeight / 2) + (itemHeight / 2);
      wheelRef.current.scrollTop = Math.max(0, scrollPosition);
    }
  }, [value, items, itemHeight, containerHeight]);

  const handleScroll = () => {
    if (!wheelRef.current || disabled) return;
    
    const scrollTop = wheelRef.current.scrollTop;
    const index = Math.round((scrollTop + containerHeight / 2 - itemHeight / 2) / itemHeight);
    const clampedIndex = Math.max(0, Math.min(items.length - 1, index));
    
    if (items[clampedIndex] !== value) {
      onChange(items[clampedIndex]);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    setIsDragging(true);
    setStartY(e.pageY - (wheelRef.current?.offsetTop || 0));
    setScrollTop(wheelRef.current?.scrollTop || 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || disabled) return;
    e.preventDefault();
    const y = e.pageY - (wheelRef.current?.offsetTop || 0);
    const walk = (y - startY) * 2;
    if (wheelRef.current) {
      wheelRef.current.scrollTop = scrollTop - walk;
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    handleScroll();
  };

  const formatValue = (val: number) => {
    if (type === 'month') {
      const months = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
      ];
      return months[val - 1] || val.toString();
    }
    return val.toString().padStart(2, '0');
  };

  return (
    <div className="flex flex-col items-center">
      <div className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
        {type === 'day' ? t('birds.birthDate') : 
         type === 'month' ? 'Ay' : 'Yıl'}
      </div>
      <div 
        className="relative overflow-hidden"
        style={{ height: containerHeight }}
      >
        {/* Selection indicator */}
        <div 
          className="absolute left-0 right-0 bg-primary-100 dark:bg-primary-900/30 border-y-2 border-primary-300 dark:border-primary-700 pointer-events-none z-10"
          style={{ 
            top: (containerHeight / 2) - (itemHeight / 2),
            height: itemHeight 
          }}
        />
        
        <div
          ref={wheelRef}
          className={`overflow-y-auto scrollbar-hide ${disabled ? 'opacity-50' : 'cursor-grab'} ${isDragging ? 'cursor-grabbing' : ''}`}
          style={{ 
            height: containerHeight,
            paddingTop: containerHeight / 2 - itemHeight / 2,
            paddingBottom: containerHeight / 2 - itemHeight / 2
          }}
          onScroll={handleScroll}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {items.map((item) => (
            <div
              key={item}
              className={`flex items-center justify-center transition-all duration-200 select-none ${
                item === value 
                  ? 'text-primary-600 dark:text-primary-400 font-bold text-lg' 
                  : 'text-neutral-600 dark:text-neutral-400 text-base hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
              style={{ height: itemHeight }}
              onClick={() => !disabled && onChange(item)}
            >
              {formatValue(item)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder,
  label,
  required,
  error,
  disabled,
  minDate,
  maxDate,
  className = ''
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (value) {
      return new Date(value);
    }
    // Default to 6 months ago
    const defaultDate = new Date();
    defaultDate.setMonth(defaultDate.getMonth() - 6);
    return defaultDate;
  });

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      setSelectedDate(new Date(value));
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const currentYear = new Date().getFullYear();
  const minYear = 2000;
  const maxYear = currentYear + 1;

  const handleDateChange = (type: 'day' | 'month' | 'year', newValue: number) => {
    const newDate = new Date(selectedDate);
    
    if (type === 'day') {
      newDate.setDate(newValue);
    } else if (type === 'month') {
      newDate.setMonth(newValue - 1);
    } else if (type === 'year') {
      newDate.setFullYear(newValue);
    }

    // Validate against min/max dates
    const today = new Date();
    if (newDate > today) {
      return; // Don't allow future dates
    }

    if (minDate && newDate < new Date(minDate)) {
      return;
    }

    if (maxDate && newDate > new Date(maxDate)) {
      return;
    }

    setSelectedDate(newDate);
  };

  const handleQuickSelect = (daysAgo: number) => {
    const newDate = new Date();
    newDate.setDate(newDate.getDate() - daysAgo);
    setSelectedDate(newDate);
  };

  const handleSave = () => {
    const formattedDate = selectedDate.toISOString().split('T')[0];
    onChange(formattedDate);
    setIsOpen(false);
  };

  const formatDisplayDate = (date: string) => {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  const quickSelectOptions = [
    { label: 'Bugün', days: 0 },
    { label: '1 Hafta Önce', days: 7 },
    { label: '1 Ay Önce', days: 30 },
    { label: '3 Ay Önce', days: 90 },
    { label: '6 Ay Önce', days: 180 },
    { label: '1 Yıl Önce', days: 365 }
  ];

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(true)}
          disabled={disabled}
          className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary-200 dark:focus:ring-primary-900/50 focus:border-primary-400 dark:focus:border-primary-600 transition-all duration-300 text-left flex items-center justify-between bg-white dark:bg-neutral-700 ${
            error 
              ? 'border-red-300 dark:border-red-700 focus:ring-red-200 dark:focus:ring-red-900/50 focus:border-red-400 dark:focus:border-red-600' 
              : 'border-neutral-200 dark:border-neutral-600'
          } ${
            disabled 
              ? 'opacity-50 cursor-not-allowed bg-neutral-50 dark:bg-neutral-800' 
              : 'hover:border-neutral-300 dark:hover:border-neutral-500'
          }`}
        >
          <span className={`${
            value 
              ? 'text-neutral-800 dark:text-neutral-200' 
              : 'text-neutral-500 dark:text-neutral-400'
          }`}>
            {value ? formatDisplayDate(value) : (placeholder || t('birds.birthDateRequired'))}
          </span>
          <Calendar className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
        </button>

        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400 animate-shake">{error}</p>
        )}
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            ref={modalRef}
            className="bg-white dark:bg-neutral-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden shadow-2xl animate-slide-up transition-colors duration-300"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
              <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">
                {t('birds.birthDate')} Seçin
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Select */}
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
              <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
                Hızlı Seçim
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {quickSelectOptions.map((option) => (
                  <button
                    key={option.days}
                    onClick={() => handleQuickSelect(option.days)}
                    className="px-3 py-2 text-sm bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Wheels */}
            <div className="p-6">
              <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4 text-center">
                Tarih Seçici
              </h4>
              
              <div className="flex justify-center gap-8 mb-6">
                <DateWheel
                  type="day"
                  value={selectedDate.getDate()}
                  onChange={(value) => handleDateChange('day', value)}
                  min={1}
                  max={getDaysInMonth(selectedDate.getFullYear(), selectedDate.getMonth() + 1)}
                  disabled={disabled}
                />
                <DateWheel
                  type="month"
                  value={selectedDate.getMonth() + 1}
                  onChange={(value) => handleDateChange('month', value)}
                  min={1}
                  max={12}
                  disabled={disabled}
                />
                <DateWheel
                  type="year"
                  value={selectedDate.getFullYear()}
                  onChange={(value) => handleDateChange('year', value)}
                  min={minYear}
                  max={maxYear}
                  disabled={disabled}
                />
              </div>

              {/* Selected Date Display */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg">
                  <Calendar className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  <span className="font-medium text-primary-700 dark:text-primary-300">
                    {selectedDate.toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              {/* Age Display */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-100 dark:bg-neutral-700 rounded-lg">
                  <Clock className="w-3 h-3 text-neutral-500 dark:text-neutral-400" />
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    {(() => {
                      const today = new Date();
                      const diffTime = today.getTime() - selectedDate.getTime();
                      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                      const diffMonths = Math.floor(diffDays / 30);
                      const diffYears = Math.floor(diffDays / 365);
                      
                      if (diffDays === 0) return 'Bugün';
                      if (diffDays < 30) return `${diffDays} gün`;
                      if (diffMonths < 12) return `${diffMonths} ay`;
                      return `${diffYears} yaş`;
                    })()}
                  </span>
                </div>
              </div>

              {/* Validation Warning */}
              {selectedDate > new Date() && (
                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 text-center">
                    ⚠️ Gelecekteki bir tarih seçemezsiniz
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-3 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl font-medium hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleSave}
                  disabled={selectedDate > new Date()}
                  className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {t('common.save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;