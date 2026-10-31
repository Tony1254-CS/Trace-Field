"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console for field diagnosis
    console.error("TRACE route error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-red-950 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-200">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/60 dark:text-red-400">
          <AlertCircle size={22} aria-hidden="true" />
        </div>
        <h2 className="mt-3 text-lg font-semibold">Something went wrong</h2>
        <p className="mt-1 text-xs text-red-800 dark:text-red-300">
          {error?.message || "An unexpected error occurred while loading this notebook view."}
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => reset()}
          className="mt-4 inline-flex items-center gap-1.5"
        >
          <RotateCcw size={14} aria-hidden="true" />
          Reload view
        </Button>
      </div>
    </div>
  );
}

