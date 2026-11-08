"use client";

import { useEffect, useRef, useState, type ReactNode, type Ref } from "react";
import { fieldControlClass, fieldLabelClass } from "@/src/components/Field";
import { CalendarIcon } from "@/src/components/Icons";

function formatTypedDate(digits: string) {
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  return [day, month, year].filter(Boolean).join("/");
}

function digitsFromTypedDate(value: string) {
  return value.replace(/\D/g, "").slice(0, 8);
}

function isValidDate(day: number, month: number, year: number): boolean {
  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  
  const daysInMonth = new Date(year, month, 0).getDate();
  return day >= 1 && day <= daysInMonth;
}

function isoFromTypedDate(typed: string): string | null {
  const digits = typed.replace(/\D/g, "");
  if (digits.length !== 8) return null;

  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4, 8));

  if (!isValidDate(day, month, year)) return null;

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const DAYS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

type CalendarPickerProps = {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  max?: string;
};

function CalendarPicker({ value, onChange, onClose, max }: CalendarPickerProps) {
  const [viewYear, setViewYear] = useState(() => {
    const iso = value.replace(/\D/g, "");
    if (iso.length === 8) return Number(iso.slice(4, 8));
    return new Date().getFullYear();
  });

  const [viewMonth, setViewMonth] = useState(() => {
    const iso = value.replace(/\D/g, "");
    if (iso.length === 8) return Number(iso.slice(2, 4)) - 1;
    return new Date().getMonth();
  });

  const digits = value.replace(/\D/g, "");
  const selectedDay = digits.length === 8 ? Number(digits.slice(0, 2)) : null;
  const selectedMonth = digits.length === 8 ? Number(digits.slice(2, 4)) - 1 : null;
  const selectedYear = digits.length === 8 ? Number(digits.slice(4, 8)) : null;

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const blanks = Array(firstDay).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);

  const today = new Date();
  const todayIso = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`;

  function selectDay(day: number) {
    const month = String(viewMonth + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    onChange(`${dayStr}/${month}/${viewYear}`);
    onClose();
  }

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  const maxDate = max ? max.replace(/\D/g, "") : null;

  return (
    <div className="absolute left-0 top-full z-20 mt-1 w-[300px] rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white p-4 shadow-[0_8px_24px_-8px_rgba(63,54,46,0.3)]">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={prevMonth}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-[#F6ECDF]"
          aria-label="Mes anterior"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <span className="font-display text-[15px] font-semibold text-ink">
          {MONTHS_ES[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-[#F6ECDF]"
          aria-label="Mes siguiente"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1">
        {DAYS.map((day, index) => (
          <div key={index} className="whitespace-nowrap text-center text-[11px] font-bold text-muted">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {blanks.map((_, index) => (
          <div key={`blank-${index}`} className="h-8" />
        ))}
        {days.map((day) => {
          const isSelected = day === selectedDay && viewMonth === selectedMonth && viewYear === selectedYear;
          const formatted = `${String(day).padStart(2, "0")}/${String(viewMonth + 1).padStart(2, "0")}/${viewYear}`;
          const isToday = formatted === todayIso;

          let isDisabled = false;
          if (maxDate) {
            const dayNum = String(day).padStart(2, "0");
            const monthNum = String(viewMonth + 1).padStart(2, "0");
            const dateStr = `${dayNum}${monthNum}${viewYear}`;
            if (dateStr > maxDate) isDisabled = true;
          }

          return (
            <button
              key={day}
              type="button"
              onClick={() => !isDisabled && selectDay(day)}
              disabled={isDisabled}
              className={`flex h-8 cursor-pointer items-center justify-center rounded-lg text-[13px] font-bold transition-colors ${
                isDisabled
                  ? "cursor-not-allowed text-[#D8CBBA]"
                  : isSelected
                  ? "bg-coral text-white"
                  : isToday
                  ? "bg-[#F6ECDF] text-coral-deep"
                  : "text-ink hover:bg-[#F6ECDF]"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type DateFieldProps = {
  id: string;
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  ref?: Ref<HTMLInputElement>;
  className?: string;
  max?: string;
};

export function DateField({
  id,
  label,
  value,
  onChange,
  error,
  ref,
  className,
  max,
}: DateFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = `${id}-error`;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const input = inputRef.current;

    if (input) {
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }, [value]);

  function setInputRef(node: HTMLInputElement | null) {
    inputRef.current = node;

    if (typeof ref === "function") {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className ?? "mb-[18px]"}`}>
      <label htmlFor={id} className={fieldLabelClass}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          ref={setInputRef}
          value={formatTypedDate(digitsFromTypedDate(value))}
          onChange={(event) =>
            onChange(formatTypedDate(digitsFromTypedDate(event.target.value)))
          }
          inputMode="numeric"
          autoComplete="off"
          placeholder="dd/mm/aaaa"
          maxLength={10}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`${fieldControlClass} pr-11 ${
            error ? "border-[#E08A7E] focus:border-[#E08A7E]" : ""
          }`}
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Abrir calendario"
          className={`absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-[#F6ECDF] ${
            isOpen ? "text-coral" : "text-[#B0A290]"
          }`}
        >
          <CalendarIcon />
        </button>
      </div>

      {isOpen && (
        <CalendarPicker
          value={value}
          onChange={onChange}
          onClose={() => setIsOpen(false)}
          max={max}
        />
      )}

      {error ? (
        <p
          id={errorId}
          className="mt-1.5 text-[12.5px] font-bold text-coral-deep"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
