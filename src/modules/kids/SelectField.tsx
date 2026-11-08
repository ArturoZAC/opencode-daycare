"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { fieldControlClass, fieldLabelClass } from "@/src/components/Field";
import { ChevronDownIcon } from "@/src/components/Icons";

type SelectFieldProps = {
  id: string;
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  error?: string;
};

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  error,
}: SelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
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

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor={id} className={fieldLabelClass}>
        {label}
      </label>
      <button
        type="button"
        id={id}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`flex w-full items-center justify-between rounded-[14px] border-[1.5px] bg-white px-4 py-[14px] text-[15px] text-ink focus:border-[#F2A78E] focus:outline-none ${
          error ? "border-[#E08A7E]" : "border-[#EADFD0]"
        }`}
      >
        <span className="font-bold">{value}</span>
        <span
          className={`text-[#B0A290] transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          <ChevronDownIcon />
        </span>
      </button>

      {isOpen && (
        <ul
          role="listbox"
          className="absolute z-10 mt-1 w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white py-1 shadow-[0_4px_12px_-4px_rgba(120,90,60,0.15)]"
        >
          {options.map((option) => (
            <li
              key={option}
              role="option"
              aria-selected={option === value}
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className={`cursor-pointer px-4 py-2.5 text-[15px] transition-colors hover:bg-[#F6ECDF] ${
                option === value
                  ? "font-bold text-coral-deep"
                  : "font-bold text-ink"
              }`}
            >
              {option}
            </li>
          ))}
        </ul>
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
