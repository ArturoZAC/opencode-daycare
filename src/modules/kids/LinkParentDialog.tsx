"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Field, fieldLabelClass } from "@/src/components/Field";
import { CloseIcon, InfoIcon, PlusIcon, SendIcon } from "@/src/components/Icons";

const RELATIONS = ["Mamá", "Papá", "Tutor/a"] as const;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Relation = (typeof RELATIONS)[number];

type FormErrors = {
  name?: string;
  email?: string;
};

export function LinkParentDialog({ childName }: { childName: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [relation, setRelation] = useState<Relation>("Mamá");
  const [errors, setErrors] = useState<FormErrors>({});

  const firstName = childName.split(" ")[0];

  function resetForm() {
    setName("");
    setEmail("");
    setRelation("Mamá");
    setErrors({});
  }

  // Validación en tiempo real: limpia errores cuando los valores se vuelven válidos.
  useEffect(() => {
    setErrors((prev) => {
      const next = { ...prev };
      if (next.name && name.trim()) {
        delete next.name;
      }
      if (next.email && EMAIL_PATTERN.test(email.trim())) {
        delete next.email;
      }
      return next;
    });
  }, [name, email]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const nextErrors: FormErrors = {};

    if (!trimmedName) {
      nextErrors.name = "Ingresá el nombre del padre o la madre.";
    }

    if (!trimmedEmail) {
      nextErrors.email = "Ingresá el email.";
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      nextErrors.email = "Ingresá un email válido.";
    }

    setErrors(nextErrors);

    if (nextErrors.name) {
      nameRef.current?.focus();
      return;
    }

    if (nextErrors.email) {
      emailRef.current?.focus();
      return;
    }

    dialogRef.current?.close();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        aria-haspopup="dialog"
        className="flex w-full cursor-pointer items-center gap-3 pt-0.5 text-left"
      >
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border-[1.5px] border-dashed border-[#D8CBBA] text-[#B0A290]">
          <PlusIcon size={18} />
        </span>
        <span className="text-[14.5px] font-extrabold text-coral-deep">
          Vincular otro padre
        </span>
      </button>

      <dialog
        ref={dialogRef}
        onClose={resetForm}
        aria-labelledby="link-parent-title"
        className="m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-[480px] overflow-y-auto rounded-[24px] border border-line bg-[#FBF4EC] p-0 backdrop:bg-[rgba(63,54,46,.35)]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-[26px] py-5">
          <div>
            <div
              id="link-parent-title"
              className="font-display text-[18px] font-semibold text-ink"
            >
              Vincular padre
            </div>
            <div className="text-[13px] text-muted-2">a {childName}</div>
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Cerrar"
            className="flex h-[34px] w-[34px] flex-none cursor-pointer items-center justify-center rounded-[10px] bg-[#F0E6D8] text-muted"
          >
            <CloseIcon />
          </button>
        </div>

        <form noValidate onSubmit={handleSubmit} className="px-[26px] py-[22px]">
          <div className="mb-5 flex gap-[11px] rounded-[14px] bg-[#E3ECFB] px-4 py-[13px]">
            <InfoIcon className="mt-px flex-none text-[#4E72C8]" />
            <span className="text-[13.5px] leading-[1.45] text-[#3F5694]">
              Le enviaremos un correo con un código para que active su cuenta.
              Solo verá el feed de {firstName}.
            </span>
          </div>

          <Field
            id="link-parent-name"
            ref={nameRef}
            label="NOMBRE DEL PADRE/MADRE"
            placeholder="Ej. Diego Fernández"
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "link-parent-name-error" : undefined}
            className={errors.name ? "border-[#E08A7E]" : ""}
          />
          {errors.name ? (
            <p
              id="link-parent-name-error"
              className="-mt-3 mb-[18px] text-[12.5px] font-bold text-coral-deep"
            >
              {errors.name}
            </p>
          ) : null}

          <Field
            id="link-parent-email"
            ref={emailRef}
            type="email"
            label="EMAIL"
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "link-parent-email-error" : undefined}
            className={errors.email ? "border-[#E08A7E]" : ""}
          />
          {errors.email ? (
            <p
              id="link-parent-email-error"
              className="-mt-3 mb-[18px] text-[12.5px] font-bold text-coral-deep"
            >
              {errors.email}
            </p>
          ) : null}

          <fieldset className="mb-5 min-w-0">
            <legend className={fieldLabelClass}>PARENTESCO</legend>
            <div className="flex gap-[9px]">
              {RELATIONS.map((option) => (
                <label key={option} className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    name="relation"
                    value={option}
                    checked={relation === option}
                    onChange={() => setRelation(option)}
                    className="peer sr-only"
                  />
                  <span className="flex items-center justify-center rounded-full border-[1.5px] border-[#ECE0D0] bg-[#FFFDF9] px-[11px] py-[11px] text-[14px] font-extrabold text-[#6E6359] peer-checked:border-[#9FB8EC] peer-checked:bg-[#CCD8F4] peer-checked:text-[#4E72C8] peer-focus-visible:ring-2 peer-focus-visible:ring-[#9FB8EC]">
                    {option}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mb-5 rounded-2xl border-[1.5px] border-dashed border-[#E6D08A] bg-[#FBF1D6] p-[18px] text-center">
            <div className="mb-2 text-[12px] font-extrabold tracking-[.7px] text-[#A88526]">
              CÓDIGO DE INVITACIÓN
            </div>
            <div className="font-display text-[34px] tracking-[7px] text-[#8A7234]">
              7K4P9
            </div>
            <div className="mt-1.5 text-[13px] text-[#A88526]">
              Vence en 7 días
            </div>
          </div>

          <button
            type="submit"
            className="flex w-full cursor-pointer items-center justify-center gap-[9px] rounded-[14px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] p-[14px] text-[15.5px] font-extrabold text-white shadow-cta"
          >
            <SendIcon />
            Enviar invitación
          </button>
        </form>
      </dialog>
    </>
  );
}
