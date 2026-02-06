"use client";

import { useState, useEffect } from "react";
import { ReactorProvider, fetchInsecureJwtToken } from "@reactor-team/js-sdk";
import { MorpheusDemo } from "./components/MorpheusDemo";
import { AuthPlaceholder } from "./components/AuthPlaceholder";

const COORDINATOR_URL =
  process.env.NEXT_PUBLIC_COORDINATOR_URL ?? "https://api.reactor.inc";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "";

export default function Home() {
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!API_KEY) {
      setError("Missing NEXT_PUBLIC_API_KEY environment variable");
      return;
    }
    fetchInsecureJwtToken(API_KEY, COORDINATOR_URL)
      .then(setJwtToken)
      .catch((err) => {
        console.error("Failed to fetch JWT:", err);
        setError("Failed to authenticate. Check your API key.");
      });
  }, []);

  if (!jwtToken) {
    return <AuthPlaceholder error={error} />;
  }

  return (
    <ReactorProvider
      modelName="morpheus"
      coordinatorUrl={COORDINATOR_URL}
      jwtToken={jwtToken}
    >
      <MorpheusDemo />
    </ReactorProvider>
  );
}
