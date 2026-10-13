import { HTTP_METHODS } from "@api-studio/core";

/** Temporary landing page until the studio shell arrives in milestone M1. */
export default function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-semibold tracking-tight">API Studio</h1>
      <p className="text-sm opacity-70">
        Foundation ready. Supported methods: {HTTP_METHODS.join(", ")}.
      </p>
    </main>
  );
}
