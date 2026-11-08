"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { fieldControlClass, fieldLabelClass } from "@/src/components/Field";
import { CloseIcon, PlusIcon } from "@/src/components/Icons";
import { CHILD_COLOR_STYLES, KIDS } from "@/src/modules/kids/kids";
import { listKids } from "@/src/modules/kids/kidsStore";

type PostType =
  | "food"
  | "nap"
  | "activity"
  | "achievement"
  | "mood"
  | "photo"
  | "announcement";

type PhotoDraft = {
  id: string;
  url: string;
  name: string;
};

type AudienceSelection = {
  allRoom: boolean;
  kidSlugs: string[];
};

type FormErrors = {
  audience?: string;
  description?: string;
};

const POST_TYPES: { value: PostType; label: string; className: string }[] = [
  { value: "food", label: "Comida", className: "bg-[#9A7B1E] text-white" },
  { value: "nap", label: "Siesta", className: "bg-[#E7DCF6] text-[#7B5FC0]" },
  { value: "activity", label: "Actividad", className: "bg-[#2E89A6] text-white" },
  { value: "achievement", label: "Logro", className: "bg-[#CFEBD8] text-[#3E9B6C]" },
  { value: "mood", label: "Ánimo", className: "bg-[#F9D2DE] text-[#C56486]" },
  { value: "photo", label: "Foto", className: "bg-[#FBD8CC] text-[#D9684A]" },
  { value: "announcement", label: "Anuncio", className: "bg-[#CCD8F4] text-[#4E72C8]" },
];

const DEFAULT_AUDIENCE: AudienceSelection = {
  allRoom: false,
  kidSlugs: [KIDS[0].slug],
};

const AUDIENCE_ERROR = "Elegí al menos un destinatario.";
const DESCRIPTION_ERROR = "Contá algo sobre el día.";

function firstName(fullName: string) {
  return fullName.split(" ")[0];
}

export function CreatePostDialog({
  className,
  ariaLabel,
  children,
}: {
  className: string;
  ariaLabel?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const audienceRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const titleId = useId();
  const audienceLabelId = useId();
  const audienceErrorId = useId();
  const descriptionId = useId();
  const descriptionErrorId = useId();
  const photosInputId = useId();

  const [kids, setKids] = useState(KIDS);
  const [audience, setAudience] = useState<AudienceSelection>(DEFAULT_AUDIENCE);
  const [postType, setPostType] = useState<PostType>("activity");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<PhotoDraft[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});

  function open() {
    setKids(listKids());
    dialogRef.current?.showModal();
  }

  function resetForm() {
    photos.forEach((photo) => URL.revokeObjectURL(photo.url));
    setAudience(DEFAULT_AUDIENCE);
    setPostType("activity");
    setDescription("");
    setPhotos([]);
    setErrors({});
  }

  // Validación en tiempo real: limpia errores cuando los valores se vuelven válidos.
  useEffect(() => {
    setErrors((prev) => {
      const next = { ...prev };
      if (next.audience && (audience.allRoom || audience.kidSlugs.length > 0)) {
        delete next.audience;
      }
      if (next.description && description.trim()) {
        delete next.description;
      }
      return next;
    });
  }, [audience, description]);

  function toggleKid(slug: string) {
    if (audience.allRoom) {
      setAudience({ allRoom: false, kidSlugs: [slug] });
      return;
    }

    const isSelected = audience.kidSlugs.includes(slug);
    setAudience({
      allRoom: false,
      kidSlugs: isSelected
        ? audience.kidSlugs.filter((selected) => selected !== slug)
        : [...audience.kidSlugs, slug],
    });
  }

  function toggleAllRoom() {
    setAudience((prev) =>
      prev.allRoom
        ? { allRoom: false, kidSlugs: [] }
        : { allRoom: true, kidSlugs: [] },
    );
  }

  function addPhotos(event: ChangeEvent<HTMLInputElement>) {
    const drafts = Array.from(event.target.files ?? []).map((file) => ({
      id: crypto.randomUUID(),
      url: URL.createObjectURL(file),
      name: file.name,
    }));

    setPhotos((prev) => [...prev, ...drafts]);
    event.target.value = "";
  }

  function removePhoto(id: string) {
    const photo = photos.find((item) => item.id === id);
    if (photo) {
      URL.revokeObjectURL(photo.url);
    }
    setPhotos((prev) => prev.filter((item) => item.id !== id));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FormErrors = {};

    if (!audience.allRoom && audience.kidSlugs.length === 0) {
      nextErrors.audience = AUDIENCE_ERROR;
    }

    if (!description.trim()) {
      nextErrors.description = DESCRIPTION_ERROR;
    }

    setErrors(nextErrors);

    if (nextErrors.audience) {
      audienceRef.current?.focus();
      return;
    }

    if (nextErrors.description) {
      descriptionRef.current?.focus();
      return;
    }

    dialogRef.current?.close();
    router.push("/");
  }

  const chipBase =
    "flex cursor-pointer items-center rounded-full border-[1.5px] text-[14px] font-bold peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#4E72C8]";

  function chipTone(selected: boolean) {
    return selected
      ? "border-[#3F362E] bg-[#3F362E] text-white"
      : "border-line bg-[#FFFDF9] text-[#6E6359]";
  }

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label={ariaLabel}
        onClick={open}
        className={className}
      >
        {children}
      </button>

      <dialog
        ref={dialogRef}
        onClose={resetForm}
        aria-labelledby={titleId}
        className="m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-[580px] overflow-y-auto rounded-[24px] border border-line bg-[#FBF4EC] p-0 shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)] backdrop:bg-[rgba(63,54,46,.35)]"
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
              id={titleId}
              className="font-display text-[18px] font-semibold text-ink"
            >
              Nueva publicación
            </span>
            <button
              type="submit"
              className="cursor-pointer text-[15px] font-extrabold text-coral-deep"
            >
              Publicar
            </button>
          </div>

          <div className="px-[26px] py-6">
            <div className="mb-[22px]">
              <div id={audienceLabelId} className={fieldLabelClass}>
                PARA
              </div>
              <div
                ref={audienceRef}
                role="group"
                aria-labelledby={audienceLabelId}
                aria-describedby={errors.audience ? audienceErrorId : undefined}
                tabIndex={-1}
                className="flex flex-wrap gap-[9px]"
              >
                {kids.map((child) => {
                  const selected =
                    !audience.allRoom && audience.kidSlugs.includes(child.slug);

                  return (
                    <label key={child.slug} className="cursor-pointer">
                      <input
                        type="checkbox"
                        name="audience"
                        value={child.slug}
                        checked={selected}
                        onChange={() => toggleKid(child.slug)}
                        className="peer sr-only"
                      />
                      <span
                        className={`${chipBase} gap-2 py-1.5 pl-1.5 pr-3.5 ${chipTone(selected)}`}
                      >
                        <span
                          className={`flex h-[26px] w-[26px] items-center justify-center rounded-full font-display text-[13px] font-semibold ${CHILD_COLOR_STYLES[child.color]}`}
                        >
                          {child.initial}
                        </span>
                        {firstName(child.name)}
                      </span>
                    </label>
                  );
                })}

                <label className="cursor-pointer">
                  <input
                    type="checkbox"
                    name="audience"
                    value="all-room"
                    checked={audience.allRoom}
                    onChange={toggleAllRoom}
                    className="peer sr-only"
                  />
                  <span
                    className={`${chipBase} px-4 py-1.5 ${chipTone(audience.allRoom)}`}
                  >
                    Toda la sala
                  </span>
                </label>
              </div>
              {errors.audience ? (
                <p
                  id={audienceErrorId}
                  className="mt-2 text-[12.5px] font-bold text-coral-deep"
                >
                  {errors.audience}
                </p>
              ) : null}
            </div>

            <fieldset className="mb-[22px] min-w-0">
              <legend className={fieldLabelClass}>TIPO</legend>
              <div className="flex flex-wrap gap-[9px]">
                {POST_TYPES.map((option) => (
                  <label key={option.value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="post-type"
                      value={option.value}
                      checked={postType === option.value}
                      onChange={() => setPostType(option.value)}
                      className="peer sr-only"
                    />
                    <span
                      className={`block rounded-full px-4 py-2 text-[13.5px] font-extrabold ${option.className} peer-checked:ring-2 peer-checked:ring-[#3F362E] peer-checked:ring-offset-2 peer-checked:ring-offset-[#FBF4EC] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#4E72C8]`}
                    >
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="mb-[22px]">
              <label htmlFor={descriptionId} className={fieldLabelClass}>
                DESCRIPCIÓN
              </label>
              <textarea
                id={descriptionId}
                ref={descriptionRef}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Contá cómo le fue hoy…"
                aria-invalid={errors.description ? true : undefined}
                aria-describedby={
                  errors.description ? descriptionErrorId : undefined
                }
                className={`${fieldControlClass} min-h-[120px] resize-y leading-[1.5]`}
              />
              {errors.description ? (
                <p
                  id={descriptionErrorId}
                  className="mt-2 text-[12.5px] font-bold text-coral-deep"
                >
                  {errors.description}
                </p>
              ) : null}
            </div>

            <div>
              <div className={fieldLabelClass}>FOTOS</div>
              <input
                id={photosInputId}
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={addPhotos}
                className="hidden"
              />
              <div className="flex flex-wrap gap-3">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative h-24 w-24 overflow-hidden rounded-[14px] border border-line bg-[#F4ECE1]"
                  >
                    <img
                      src={photo.url}
                      alt={photo.name}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(photo.id)}
                      aria-label="Quitar foto"
                      className="absolute right-1 top-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-[#3F362E] text-white"
                    >
                      <CloseIcon size={12} />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-dashed border-[#DBCDBA] bg-[#F4ECE1] text-[#B0A290]"
                >
                  <PlusIcon size={22} className="text-[#C5503A]" />
                  <span className="text-[12px]">Agregar</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </dialog>
    </>
  );
}
