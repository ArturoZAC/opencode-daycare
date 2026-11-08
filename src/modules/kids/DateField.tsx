"use client";

import { useEffect, useRef, type ReactNode, type Ref } from "react";
import { fieldControlClass, fieldLabelClass } from "@/src/components/Field";

function formatTypedDate(digits: string) {
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  return [day, month, year].filter(Boolean).join("/");
}

function digitsFromTypedDate(value: string) {
  return value.replace(/\D/g, "").slice(0, 8);
}

type DateFieldProps = {
  id: string;
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  ref?: Ref<HTMLInputElement>;
};

export function DateField({
  id,
  label,
  value,
  onChange,
  error,
  ref,
}: DateFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = `${id}-error`;

  useEffect(() => {
    const input = inputRef.current;

    if (input) {
      // shortcut: el caret siempre vuelve al final; alcanza mientras se tipea de corrido.
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
    <div className="mb-[18px]">
      <label htmlFor={id} className={fieldLabelClass}>
        {label}
      </label>
      <input
        id={id}
        ref={setInputRef}
        value={formatTypedDate(digitsFromTypedDate(value))}
        onChange={(event) => onChange(formatTypedDate(digitsFromTypedDate(event.target.value)))}
        inputMode="numeric"
        autoComplete="off"
        placeholder="dd/mm/aaaa"
        maxLength={10}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`${fieldControlClass} ${
          error ? "border-[#E08A7E] focus:border-[#E08A7E]" : ""
        }`}
      />
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
