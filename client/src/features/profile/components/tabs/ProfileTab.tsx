import { Mail, Phone, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "../Field";
import { SectionCard } from "../SectionCard";
import useUserStore, { selectUser } from "@/store/useUserStore";

export function ProfileTab() {
  const user = useUserStore(selectUser);
  if (!user) return null;
  return (
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
  );
}
