import type { InputHTMLAttributes } from "react";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  id: string;
};

export function Field({ label, id, className, ...inputProps }: FieldProps) {
  return (
    <div className="mb-[18px]">
      <label
        htmlFor={id}
        className="mb-2 block text-[12px] font-extrabold tracking-[.7px] text-muted"
      >
        {label}
      </label>
      <input
        id={id}
        className={`w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[14px] text-[15px] text-ink placeholder:text-[#B6A99B] focus:border-[#F2A78E] focus:outline-none ${className ?? ""}`}
        {...inputProps}
      />
    </div>
  );
}
