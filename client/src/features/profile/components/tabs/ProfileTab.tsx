import { Mail, Phone, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "../Field";
import { SectionCard } from "../SectionCard";

export function ProfileTab() {
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
        <Field label="Full name" defaultValue="Arjun Rathore" />
        <Field label="Display name" defaultValue="Arjun" />
        <Field
          label="Email address"
          type="email"
          defaultValue="arjun@desistorage.in"
          icon={Mail}
        />
        <Field
          label="Phone"
          defaultValue="+91 98••• ••432"
          icon={Phone}
        />
        <Field label="Company" defaultValue="DesiStorage Labs" />
        <Field label="Role" defaultValue="Senior Product Designer" />
        <Field label="Country / region" defaultValue="India" icon={Globe} />
        <Field label="Preferred language" defaultValue="English (India)" />
        <div className="md:col-span-2">
          <Label className="mb-1.5 block text-sm">Bio</Label>
          <Textarea
            rows={3}
            defaultValue="Designing calm, secure cloud tools for teams across India."
          />
        </div>
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
