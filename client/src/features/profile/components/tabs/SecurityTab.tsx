import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Field } from "../Field";
import { SectionCard } from "../SectionCard";

export function SecurityTab() {
  return (
    <div className="space-y-6">
      <SectionCard title="Password" description="Last changed 3 months ago.">
        <form
          className="grid gap-3 sm:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <Field label="Current" type="password" defaultValue="••••••••" />
          <Field label="New" type="password" />
          <Field label="Confirm" type="password" />
          <div className="sm:col-span-3 flex justify-end">
            <Button type="submit">Update password</Button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Two-factor authentication"
        description="Add an extra layer of security using an authenticator app."
      >
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <div className="font-medium">Authenticator app</div>
            <div className="text-muted-foreground">
              Enabled · configured 2 months ago
            </div>
          </div>
          <Switch defaultChecked />
        </div>
      </SectionCard>

      <SectionCard
        title="Danger zone"
        description="Irreversible account actions."
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            Permanently delete your account and all data.
          </div>
          <AlertDialog>
            <AlertDialogTrigger>
              <Button variant="destructive">Delete account</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove your workspace, files and
                  sharing links. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Yes, delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SectionCard>
    </div>
  );
}
