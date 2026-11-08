import type { Metadata } from "next";
import { ActivateAccountForm } from "@/src/modules/auth/ActivateAccountForm";

export const metadata: Metadata = {
  title: "Activar cuenta",
};

export default function ActivateAccountPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-5 py-10 md:p-10">
      <div className="w-full max-w-[440px]">
        <ActivateAccountForm />
      </div>
    </div>
  );
}
