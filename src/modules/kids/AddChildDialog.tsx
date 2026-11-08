"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Field, fieldControlClass, fieldLabelClass } from "@/src/components/Field";
import { PlusIcon } from "@/src/components/Icons";
import { DateField } from "./DateField";
import { SelectField } from "./SelectField";
import {
  ageFromIso,
  formatBirthDate,
  monthYear,
  parseAllergyTags,
  slugify,
  type Child,
} from "./kids";
import { addChild, nextChildColor, uniqueSlug } from "./kidsStore";

const ROOMS = ["Soles", "Lunas", "Estrellas", "Arcoíris"];

const NAME_ERROR = "Ingresá el nombre completo.";
const BIRTH_DATE_REQUIRED = "Ingresá la fecha de nacimiento.";
const BIRTH_DATE_INVALID = "Ingresá una fecha válida.";
const BIRTH_DATE_FUTURE = "La fecha no puede ser futura.";

type FormErrors = {
  name?: string;
  birthDate?: string;
};

function RequiredLabel({ children }: { children: ReactNode }) {
  return (
    <>
      {children} <span className="text-coral">*</span>
    </>
  );
}

function todayIso() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${today.getFullYear()}-${month}-${day}`;
}

function todayTyped() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${day}/${month}/${today.getFullYear()}`;
}

function isoFromTypedDate(typed: string): string | null {
  const digits = typed.replace(/\D/g, "");
  if (digits.length !== 8) return null;

  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4, 8));

  if (year < 1900 || year > 2100) return null;
  if (month < 1 || month > 12) return null;
  
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) return null;

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function AddChildDialog({
  onAdded,
}: {
  onAdded: (child: Child) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const birthDateRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [room, setRoom] = useState("Soles");
  const [allergies, setAllergies] = useState("");
  const [allergyNote, setAllergyNote] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [today, setToday] = useState("");
  const [maxDate, setMaxDate] = useState("");

  useEffect(() => {
    setToday(todayIso());
    setMaxDate(todayTyped());
  }, []);

  function resetForm() {
    setName("");
    setBirthDate("");
    setRoom("Soles");
    setAllergies("");
    setAllergyNote("");
    setErrors({});
  }

  // Validación en tiempo real: limpia errores cuando los valores se vuelven válidos.
  useEffect(() => {
    setErrors((prev) => {
      const next = { ...prev };
      if (next.name && name.trim()) {
        delete next.name;
      }
      if (next.birthDate && birthDate) {
        const iso = isoFromTypedDate(birthDate);
        if (iso && (!today || iso <= today)) {
          delete next.birthDate;
        }
      }
      return next;
    });
  }, [name, birthDate, today]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    const iso = isoFromTypedDate(birthDate);
    const nextErrors: FormErrors = {};

    if (!trimmedName) {
      nextErrors.name = NAME_ERROR;
    }

    if (!birthDate) {
      nextErrors.birthDate = BIRTH_DATE_REQUIRED;
    } else if (!iso) {
      nextErrors.birthDate = BIRTH_DATE_INVALID;
    } else if (today && iso > today) {
      nextErrors.birthDate = BIRTH_DATE_FUTURE;
    }

    setErrors(nextErrors);

    if (nextErrors.name) {
      nameRef.current?.focus();
      return;
    }

    if (nextErrors.birthDate || !iso) {
      birthDateRef.current?.focus();
      return;
    }

    const now = new Date();
    const child: Child = {
      slug: uniqueSlug(slugify(trimmedName)),
      name: trimmedName,
      initial: trimmedName.charAt(0).toUpperCase(),
      color: nextChildColor(),
      ageYears: ageFromIso(iso, now),
      birthDate: formatBirthDate(iso),
      room,
      joinedAt: monthYear(now),
      allergyTags: parseAllergyTags(allergies),
      allergyNote: allergyNote.trim() || null,
      parents: [],
    };

    addChild(child);
    onAdded(child);
    dialogRef.current?.close();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="flex cursor-pointer flex-none items-center gap-2 rounded-[14px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] px-[18px] py-[11px] text-[14.5px] font-extrabold text-white shadow-cta"
      >
        <PlusIcon size={17} />
        Agregar niño
      </button>

      <dialog
        ref={dialogRef}
        onClose={resetForm}
        aria-labelledby="add-child-title"
        className="m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-[520px] overflow-y-auto rounded-[24px] border border-line bg-[#FBF4EC] p-0 backdrop:bg-[rgba(63,54,46,.35)]"
      >
        <form noValidate onSubmit={handleSubmit}>
          <div className="flex items-center justify-between gap-3 border-b border-line px-[26px] py-5">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="cursor-pointer text-[15px] font-bold text-muted"
            >
              Cancelar
            </button>
            <span
              id="add-child-title"
              className="font-display text-[18px] font-semibold text-ink"
            >
              Agregar niño
            </span>
            <button
              type="submit"
              className="cursor-pointer text-[15px] font-extrabold text-coral-deep"
            >
              Guardar
            </button>
          </div>

          <div className="px-[26px] py-6">
            <Field
              id="child-name"
              ref={nameRef}
              label={<RequiredLabel>NOMBRE COMPLETO</RequiredLabel>}
              placeholder="Ej. Martina López"
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={errors.name ? "child-name-error" : undefined}
              className={errors.name ? "border-[#E08A7E]" : ""}
            />
            {errors.name ? (
              <p
                id="child-name-error"
                className="-mt-3 mb-[18px] text-[12.5px] font-bold text-coral-deep"
              >
                {errors.name}
              </p>
            ) : null}

            <div className="flex gap-3.5">
              <DateField
                id="child-birth-date"
                ref={birthDateRef}
                label={<RequiredLabel>FECHA DE NACIMIENTO</RequiredLabel>}
                value={birthDate}
                onChange={setBirthDate}
                error={errors.birthDate}
                max={maxDate || undefined}
                className="flex-1 mb-[18px]"
              />

              <div className="flex-1 mb-[18px]">
                <SelectField
                  id="child-room"
                  label={<RequiredLabel>SALA</RequiredLabel>}
                  value={room}
                  onChange={setRoom}
                  options={ROOMS}
                />
              </div>
            </div>

            <Field
              id="child-allergies"
              label="ALERGIAS (ETIQUETAS)"
              placeholder="Ej. Maní, Lactosa"
              value={allergies}
              onChange={(event) => setAllergies(event.target.value)}
            />

            <div className="mb-[18px]">
              <label htmlFor="child-allergy-note" className={fieldLabelClass}>
                NOTAS MÉDICAS
              </label>
              <textarea
                id="child-allergy-note"
                value={allergyNote}
                onChange={(event) => setAllergyNote(event.target.value)}
                placeholder="Indicaciones, medicación, contactos…"
                className={`${fieldControlClass} min-h-[90px] resize-y leading-[1.5]`}
              />
            </div>
          </div>
        </form>
      </dialog>
    </>
  );
}
