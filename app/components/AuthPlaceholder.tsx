"use client";

export function AuthPlaceholder({ error }: { error?: string }) {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <p className="text-sm font-mono text-red-400">{error}</p>
        ) : (
          <>
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-mono text-[#bdbdbd]">
              Authenticating...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
