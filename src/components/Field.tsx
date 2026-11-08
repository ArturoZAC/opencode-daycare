import type { InputHTMLAttributes, ReactNode, Ref } from "react";

export const fieldLabelClass =
  "mb-2 block text-[12px] font-extrabold tracking-[.7px] text-muted";

export const fieldControlClass =
  "w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[14px] text-[15px] text-ink placeholder:text-[#B6A99B] focus:border-[#F2A78E] focus:outline-none";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: ReactNode;
  id: string;
  ref?: Ref<HTMLInputElement>;
};

export function Field({ label, id, className, ref, ...inputProps }: FieldProps) {
  return (
    <div className="mb-[18px]">
      <label htmlFor={id} className={fieldLabelClass}>
        {label}
      </label>
      <input
        id={id}
        ref={ref}
        className={`${fieldControlClass} ${className ?? ""}`}
        {...inputProps}
      />
    </div>
  );
}
