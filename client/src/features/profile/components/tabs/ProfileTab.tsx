import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "../Field";
import { SectionCard } from "../SectionCard";
import useUserStore, { selectUser } from "@/store/useUserStore";
import type { AuthProvider } from "@/features/auth/api";

const PROVIDERS: {
  key: AuthProvider;
  label: string;
  description: string;
  alwaysConnected?: boolean;
}[] = [
  {
    key: "local",
    label: "Email & Password",
    description: "Sign in with your email and password.",
    alwaysConnected: true,
  },
  {
    key: "google",
    label: "Google",
    description:
      "Link your Google account for one-tap sign-in. Works automatically when the email matches.",
  },
];

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function ProfileTab() {
  const user = useUserStore(selectUser);
  if (!user) return null;

  const connectedProviders = new Set(user.authProviders ?? []);

  return (
    <>
      <SectionCard
        title="Personal details"
        description="Update how your name and contact info appear across DesiStorage."
      >
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <Field label="Full name" defaultValue={user.fullName} />
          <Field
            label="Email address"
            type="email"
            defaultValue={user.email}
            icon={Mail}
          />
          <div className="md:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="ghost">
              Cancel
            </Button>
            <Button type="submit">Save changes</Button>
          </div>
        </form>
      </SectionCard>

      <div className="my-4" />

      <SectionCard
        title="Linked Accounts"
        description="Manage how you sign in to DesiStorage."
      >
        <div className="divide-y rounded-xl border">
          {PROVIDERS.map((provider) => {
            const isConnected =
              provider.alwaysConnected || connectedProviders.has(provider.key);
            const Icon =
              provider.key === "google" ? GoogleIcon : undefined;

            return (
              <div
                key={provider.key}
                className="flex items-center gap-3 px-4 py-3"
              >
                {Icon ? (
                  <Icon className="h-5 w-5 shrink-0" />
                ) : (
                  <Mail className="h-5 w-5 shrink-0 text-muted-foreground" />
                )}

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{provider.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {provider.description}
                  </p>
                </div>

                {isConnected ? (
                  <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {provider.alwaysConnected ? "Primary" : "Connected"}
                  </span>
                ) : (
                  <Button variant="outline" size="sm">
                    Connect
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </SectionCard>
    </>
  );
}
