import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Egg, Camera, Bell } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths } from 'date-fns';
import { tr } from 'date-fns/locale';

interface CalendarEvent {
  id: string;
  date: string;
  type: 'egg_laid' | 'hatch_expected' | 'hatch_actual' | 'note' | 'photo' | 'reminder';
  title: string;
  incubationId?: string;
}

export const CalendarView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  // Mock events data
  const events: CalendarEvent[] = [
    {
      id: '1',
      date: '2024-01-15',
      type: 'egg_laid',
      title: 'Yumurta bırakıldı - Luna & Apollo'
    },
    {
      id: '2',
      date: '2024-02-04',
      type: 'hatch_expected',
      title: 'Tahmini çıkım - Luna & Apollo'
    },
    {
      id: '3',
      date: '2024-01-20',
      type: 'note',
      title: 'Gelişim notu eklendi'
    },
    {
      id: '4',
      date: '2024-01-22',
      type: 'photo',
      title: 'Fotoğraf çekildi'
    }
  ];

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return events.filter(event => event.date === dateStr);
  };

  const getEventIcon = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'egg_laid':
      case 'hatch_expected':
      case 'hatch_actual':
        return Egg;
      case 'photo':
        return Camera;
      case 'reminder':
        return Bell;
      default:
        return CalendarIcon;
    }
  };

  const getEventColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'egg_laid':
        return 'bg-blue-100 text-blue-600';
      case 'hatch_expected':
        return 'bg-secondary-100 text-secondary-600';
      case 'hatch_actual':
        return 'bg-primary-100 text-primary-600';
      case 'photo':
        return 'bg-purple-100 text-purple-600';
      case 'reminder':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-neutral-100 text-neutral-600';
    }
  };

  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-neutral-800">Takvim</h2>
        <div className="flex items-center gap-4">
          <div className="flex bg-neutral-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'month'
                  ? 'bg-white text-neutral-800 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-800'
              }`}
            >
              Aylık
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'week'
                  ? 'bg-white text-neutral-800 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-800'
              }`}
            >
              Haftalık
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-neutral-800">
            {format(currentDate, 'MMMM yyyy', { locale: tr })}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={previousMonth}
              className="p-2 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day) => (
            <div key={day} className="p-3 text-center text-sm font-medium text-neutral-500">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dayEvents = getEventsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isCurrentDay = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[100px] p-2 border border-neutral-100 rounded-lg ${
                  isCurrentMonth ? 'bg-white' : 'bg-neutral-50'
                } ${isCurrentDay ? 'ring-2 ring-primary-500' : ''}`}
              >
                <div className={`text-sm font-medium mb-2 ${
                  isCurrentMonth ? 'text-neutral-800' : 'text-neutral-400'
                } ${isCurrentDay ? 'text-primary-600' : ''}`}>
                  {format(day, 'd')}
                </div>
                
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map((event) => {
                    const Icon = getEventIcon(event.type);
                    const colorClass = getEventColor(event.type);
                    
                    return (
                      <div
                        key={event.id}
                        className={`px-2 py-1 rounded-md text-xs flex items-center gap-1 ${colorClass}`}
                      >
                        <Icon className="w-3 h-3" />
                        <span className="truncate">{event.title}</span>
                      </div>
                    );
                  })}
                  
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-neutral-500 px-2">
                      +{dayEvents.length - 2} daha
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
