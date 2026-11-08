import type { Metadata } from "next";
import { LoginBrandPanel } from "@/src/modules/auth/LoginBrandPanel";
import { LoginForm } from "@/src/modules/auth/LoginForm";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <LoginBrandPanel />
      <div className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-[392px]">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
