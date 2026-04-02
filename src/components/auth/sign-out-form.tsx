import { signOutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export function SignOutForm() {
  return (
    <form action={signOutAction}>
      <Button type="submit" variant="outline" size="sm">
        Çıkış yap
      </Button>
    </form>
  );
}
