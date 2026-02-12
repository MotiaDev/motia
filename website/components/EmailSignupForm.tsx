import React, { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

const MAILMODO_ENDPOINT =
  "MAILMODO_URL_REDACTED";

interface EmailSignupFormProps {
  isDarkMode?: boolean;
}

export function EmailSignupForm({ isDarkMode = true }: EmailSignupFormProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(() => {
    return localStorage.getItem("iii_access_requested") === "true";
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);

    try {
      const res = await fetch(MAILMODO_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok || res.status === 409) {
        setIsSubmitted(true);
        localStorage.setItem("iii_access_requested", "true");
        localStorage.setItem("iii_access_email", email);
        setEmail("");
      }
    } catch {
      setIsSubmitted(true);
      localStorage.setItem("iii_access_requested", "true");
      localStorage.setItem("iii_access_email", email);
      setEmail("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center w-full sm:w-auto"
    >
      {isSubmitted ? (
        <div
          className={`flex items-center gap-2 text-xs md:text-sm px-3 py-2.5 md:px-4 md:py-3 border rounded w-full justify-center ${
            isDarkMode
              ? "text-iii-accent bg-iii-accent/10 border-iii-accent/20"
              : "text-iii-accent-light bg-iii-accent-light/10 border-iii-accent-light/20"
          }`}
        >
          <Check className="w-3.5 h-3.5 md:w-4 md:h-4" />
          <span className="font-mono tracking-tight text-xs sm:text-sm">
            SUBSCRIBED
          </span>
        </div>
      ) : (
        <div
          className={`flex w-full border-b transition-colors relative ${
            isDarkMode
              ? "border-iii-light focus-within:border-iii-accent"
              : "border-iii-dark focus-within:border-iii-accent-light"
          }`}
        >
          <input
            type="email"
            name="email"
            placeholder="EMAIL_FOR_UPDATES"
            className={`bg-transparent outline-none text-xs md:text-sm py-2.5 md:py-3 px-1 w-full sm:w-48 md:w-64 placeholder-iii-medium/50 font-mono ${
              isDarkMode ? "text-iii-light" : "text-iii-black"
            }`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className={`absolute right-0 top-1/2 -translate-y-1/2 disabled:opacity-50 transition-colors p-1.5 md:p-2 ${
              isDarkMode
                ? "text-iii-light hover:text-iii-accent"
                : "text-iii-black hover:text-iii-accent-light"
            }`}
          >
            {isSubmitting ? (
              "..."
            ) : (
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
            )}
          </button>
        </div>
      )}
    </form>
  );
}
