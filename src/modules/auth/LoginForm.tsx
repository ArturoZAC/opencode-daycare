import Link from "next/link";
import { Field } from "@/src/components/Field";

export function LoginForm() {
  return (
    <>
      <h1 className="mb-1.5 font-display text-[30px] font-semibold text-ink">
        Iniciar sesión
      </h1>
      <p className="mb-7 text-[15px] text-muted">Ingresá para ver el día de hoy.</p>

      <Field id="email" label="EMAIL" type="email" autoComplete="email" />
      <Field
        id="password"
        label="CONTRASEÑA"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
      />

      <div className="-mt-2 mb-5 text-right">
        <span className="cursor-pointer text-[13.5px] font-bold text-coral-deep">
          ¿Olvidaste tu contraseña?
        </span>
      </div>

      <button
        type="button"
        className="w-full rounded-[15px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] py-[15px] text-[16px] font-extrabold text-white shadow-cta"
      >
        Iniciar sesión
      </button>

      <p className="mt-6 text-center text-[14.5px] text-muted">
        ¿Te invitó la guardería?{" "}
        <Link href="/activate-account" className="font-extrabold text-coral-deep">
          Activá tu cuenta
        </Link>
      </p>
    </>
  );
}
