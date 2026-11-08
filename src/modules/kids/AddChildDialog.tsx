"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { Field, fieldControlClass, fieldLabelClass } from "@/src/components/Field";
import { ChevronDownIcon, PlusIcon } from "@/src/components/Icons";
import { DateField } from "./DateField";
import {
  ageFromIso,
  formatBirthDate,
  isoFromTypedDate,
  monthYear,
  parseAllergyTags,
  slugify,
  type Child,
} from "./kids";
import { addChild, nextChildColor, uniqueSlug } from "./kidsStore";

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

  function resetForm() {
    setName("");
    setBirthDate("");
    setRoom("Soles");
    setAllergies("");
    setAllergyNote("");
    setErrors({});
  }

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
    } else if (iso > todayIso()) {
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
        className="flex flex-none items-center gap-2 rounded-[14px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] px-[18px] py-[11px] text-[14.5px] font-extrabold text-white shadow-cta"
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
              className="text-[15px] font-bold text-muted"
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
              className="text-[15px] font-extrabold text-coral-deep"
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

            <DateField
              id="child-birth-date"
              ref={birthDateRef}
              label={<RequiredLabel>FECHA DE NACIMIENTO</RequiredLabel>}
              value={birthDate}
              onChange={setBirthDate}
              error={errors.birthDate}
            />

            <div className="mb-[18px]">
              <label htmlFor="child-room" className={fieldLabelClass}>
                <RequiredLabel>SALA</RequiredLabel>
              </label>
              <div className="relative">
                <select
                  id="child-room"
                  value={room}
                  onChange={(event) => setRoom(event.target.value)}
                  className={`${fieldControlClass} appearance-none pr-11 font-bold`}
                >
                  <option value="Soles">Soles</option>
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#B0A290]">
                  <ChevronDownIcon />
                </span>
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
