import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

// NOTE: Mock/demo implementation for now.
// Wire up to the real API:
//   - Resend  -> POST /auth/send-email
//   - Verify  -> POST /auth/verify-email
// Both endpoints require an authenticated session (register does not set
// one yet), so the backend needs an auto-login or public resend endpoint.
const DEMO_CODE = "482913";
const LENGTH = 6;

const VerifyEmail = ({ email }: { email: string }) => {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coolDown, setCoolDown] = useState(30);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (coolDown <= 0) return;
    const t = setTimeout(() => setCoolDown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [coolDown]);

  const code = digits.join("");

  function setAt(index: number, value: string) {
    setError(null);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function onChange(index: number, raw: string) {
    const value = raw.replace(/\D/g, "");
    if (!value) {
      setAt(index, "");
      return;
    }
    if (value.length > 1) {
      const chars = value.slice(0, LENGTH - index).split("");
      setError(null);
      setDigits((prev) => {
        const next = [...prev];
        chars.forEach((c, i) => (next[index + i] = c));
        return next;
      });
      inputs.current[Math.min(index + chars.length, LENGTH - 1)]?.focus();
      return;
    }
    setAt(index, value);
    if (index < LENGTH - 1) inputs.current[index + 1]?.focus();
  }

  function onKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) inputs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < LENGTH - 1)
      inputs.current[index + 1]?.focus();
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (code.length < LENGTH) {
      setError("Enter all 6 digits of the code we emailed you.");
      return;
    }
    setLoading(true);
    // TODO(API): Replace mock check with POST /auth/verify-email { otp: code }
    setTimeout(() => {
      setLoading(false);
      if (code !== DEMO_CODE) {
        setError("That code isn't valid or has expired. Try again.");
        // TODO(UI): Show an error toast on failed verification

        setDigits(Array(LENGTH).fill(""));
        inputs.current[0]?.focus();
        return;
      }
      // TODO(UI): Show a success toast ("Email verified")
      setVerified(true);
    }, 1000);
  }

  if (verified) {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/40 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <div className="text-sm">
            <p className="font-medium text-foreground">Verification complete</p>
            <p className="mt-1 text-muted-foreground">
              Two-factor recovery email set. You can now upload, share and
              manage files across your workspace.
            </p>
          </div>
        </div>
        <Button
          className="h-11 w-full rounded-xl shadow-sm"
          onClick={() => router.push("/dashboard")}
        >
          Go to my Dashboard
        </Button>
      </div>
    );
  }

  return (
    <>

          <div className="space-y-6">
            <p className="text-center text-sm text-muted-foreground">
              Sent to{" "}
              <span className="font-medium text-foreground">{email}</span>
            </p>
            <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <div className="flex justify-between gap-2">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputs.current[i] = el;
                }}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={LENGTH}
                aria-label={`Digit ${i + 1}`}
                value={d}
                onChange={(e) => onChange(i, e.target.value)}
                onKeyDown={(e) => onKeyDown(i, e)}
                className="h-14 w-full rounded-xl border-2 border-muted-foreground/50 bg-background text-center text-xl font-semibold text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/25"
              />
            ))}
          </div>

          {error && (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-xl text-sm shadow-sm"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Verifying…" : "Verify email"}
          </Button>

          <button
            type="button"
            disabled={coolDown > 0}
            onClick={() => {
              setCoolDown(30);
              // TODO(API): Call POST /auth/send-email to actually resend the OTP
              // TODO(UI): Show a success toast ("New code sent to <email>")
            }}
            className="flex w-full items-center justify-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
          >
            <RefreshCw className="h-4 w-4" />
            {coolDown > 0 ? `Resend code in ${coolDown}s` : "Resend code"}
          </button>
        </form>

        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          Codes are single-use and expire automatically.
        </p>
      </div>
    </>
  );
};

export default VerifyEmail;
