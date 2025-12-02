import { useState, useEffect, useRef } from 'react';

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  isOpen: boolean;
  onClose: () => void;
}

const DatePicker = ({ value, onChange, isOpen, onClose }: DatePickerProps) => {
  const [displayDate, setDisplayDate] = useState(value);
  const [selectedDate, setSelectedDate] = useState(value);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDisplayDate(value);
    setSelectedDate(value);
  }, [value, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const year = displayDate.getFullYear();
  const month = displayDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const prevMonth = () => {
    setDisplayDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setDisplayDate(new Date(year, month + 1, 1));
  };

  const selectDate = (day: number) => {
    const newDate = new Date(year, month, day, 12, 0, 0);
    setSelectedDate(newDate);
    onChange(newDate);
    onClose();
  };

  const monthName = displayDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const today = new Date();
  const isToday = (day: number) => 
    today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  
  const isSelected = (day: number) =>
    selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="w-10 h-10" />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(
      <button
        key={day}
        onClick={() => selectDate(day)}
        className={`w-10 h-10 rounded-full flex items-center justify-center text-[17px] font-normal transition-colors
          ${isSelected(day) 
            ? 'bg-[#007AFF] text-white' 
            : isToday(day)
              ? 'text-[#007AFF]'
              : 'text-[#000] hover:bg-[#f0f0f0]'
          }`}
      >
        {day}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div 
        ref={pickerRef}
        className="bg-[#f9f9f9] rounded-[14px] shadow-xl overflow-hidden"
        style={{ width: '320px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#f9f9f9] border-b border-[#e5e5e5]">
          <button 
            onClick={prevMonth}
            className="w-10 h-10 flex items-center justify-center text-[#007AFF] text-[20px]"
          >
            ‹
          </button>
          <span className="text-[17px] font-semibold text-[#000]">{monthName}</span>
          <button 
            onClick={nextMonth}
            className="w-10 h-10 flex items-center justify-center text-[#007AFF] text-[20px]"
          >
            ›
          </button>
        </div>

        {/* Calendar */}
        <div className="p-3 bg-white">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="w-10 h-8 flex items-center justify-center text-[13px] font-semibold text-[#8e8e93]">
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-y-1">
            {days}
          </div>
        </div>

        {/* Today button */}
        <div className="border-t border-[#e5e5e5] bg-[#f9f9f9]">
          <button
            onClick={() => {
              const now = new Date();
              setDisplayDate(now);
              selectDate(now.getDate());
            }}
            className="w-full py-3 text-[17px] text-[#007AFF] font-normal"
          >
            Today
          </button>
        </div>
      </div>
    </div>
  );
};

export default DatePicker;
