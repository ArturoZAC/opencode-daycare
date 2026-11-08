import Link from "next/link";
import { Field } from "@/src/components/Field";
import { CheckIcon, SunIcon } from "@/src/components/Icons";

export function ActivateAccountForm() {
  return (
    <>
      <div className="mb-[22px] flex h-[58px] w-[58px] items-center justify-center rounded-[18px] bg-[linear-gradient(155deg,#F8C3A8,#F2937A)] shadow-[0_12px_26px_-10px_rgba(238,129,100,.65)]">
        <SunIcon size={30} />
      </div>

      <h1 className="mb-2 font-display text-[32px] font-semibold leading-[1.15] text-ink">
        Bienvenida a OpenDayCare
      </h1>
      <p className="mb-[26px] text-[15.5px] leading-[1.55] text-muted">
        Te invitaron a seguir el día de tu hijo. Creá tu contraseña para activar
        la cuenta.
      </p>

      <div className="mb-[22px] flex items-center gap-3.5 rounded-2xl border-[1.5px] border-[#EADFD0] bg-white px-4 py-3.5">
        <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-[#A9D9E8] font-display text-[19px] font-semibold text-[#1F7A93]">
          M
        </div>
        <div>
          <div className="text-[13px] text-muted">Te invitaron a seguir a</div>
          <div className="font-display text-[17px] font-semibold text-ink">
            Mateo · Sala Soles
          </div>
        </div>
      </div>

      <Field
        id="invitation-code"
        label="CÓDIGO DE INVITACIÓN"
        defaultValue="7K4P9"
        className="font-display text-[18px] font-bold tracking-[3px]"
      />
      <Field
        id="email"
        label="EMAIL"
        type="email"
        autoComplete="email"
        defaultValue="lucia.fernandez@gmail.com"
      />
      <Field
        id="password"
        label="CREAR CONTRASEÑA"
        type="password"
        autoComplete="new-password"
        defaultValue="contraseña"
      />

      <label className="mb-6 flex cursor-pointer items-start gap-3 rounded-[14px] bg-[#FBF1D6] px-4 py-3.5">
        <input type="checkbox" className="peer sr-only" defaultChecked />
        <span className="mt-px flex h-6 w-6 flex-none items-center justify-center rounded-lg bg-[#EADFD0] text-transparent peer-checked:bg-[#5FB97E] peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#5FB97E]">
          <CheckIcon />
        </span>
        <span className="text-[14px] leading-[1.45] text-[#8A7234]">
          Autorizo a la guardería a tomar y compartir fotos de mi hijo dentro de
          la app.
        </span>
      </label>

      <button
        type="button"
        className="w-full rounded-[15px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] py-[15px] text-[16px] font-extrabold text-white shadow-cta"
      >
        Activar mi cuenta
      </button>

      <p className="mt-[22px] text-center text-[14.5px] text-muted">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="font-extrabold text-coral-deep">
          Iniciar sesión
        </Link>
      </p>
    </>
  );
}
