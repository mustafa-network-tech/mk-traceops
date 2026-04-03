"use client";

import { Toaster } from "sonner";

export function SonnerToaster() {
  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      theme="light"
      toastOptions={{ duration: 5000 }}
    />
  );
}
