import type { Metadata } from "next";
import { LoginBrandPanel } from "@/src/modules/auth/LoginBrandPanel";
import { LoginForm } from "@/src/modules/auth/LoginForm";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

// Lee searchParams (runtime data): opt-out del prerender, mismo patrón que /kids/[slug].
export const instant = false;

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <LoginBrandPanel />
      <div className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-[392px]">
          {error === "1" && (
            <p className="mb-3 text-[13.5px] font-bold text-coral-deep">
              Email o contraseña incorrectos.
            </p>
          )}
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
