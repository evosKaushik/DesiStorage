import { Mail, MessageSquare, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "../Field";
import { SectionCard } from "../SectionCard";
import { SupportCard } from "../SupportCard";

export function SupportTab() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <SupportCard
          icon={MessageSquare}
          title="Chat with us"
          desc="Avg. response under 3 minutes."
          cta="Start chat"
        />
        <SupportCard
          icon={Mail}
          title="Email support"
          desc="support@desistorage.in"
          cta="Send email"
        />
        <SupportCard
          icon={BookOpen}
          title="Help center"
          desc="Guides, tutorials and API docs."
          cta="Browse articles"
        />
      </div>

      <SectionCard
        title="Contact support"
        description="Tell us what's going on and we'll get back within 24 hours."
      >
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            (e.target as HTMLFormElement).reset();
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Subject" placeholder="Briefly describe the issue" />
            <div>
              <Label className="mb-1.5 block text-sm">Category</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option>Billing</option>
                <option>Uploads</option>
                <option>Sharing & permissions</option>
                <option>Account & security</option>
                <option>Other</option>
              </select>
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">Message</Label>
            <Textarea
              rows={5}
              placeholder="Share as much detail as you can…"
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit">Submit ticket</Button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
