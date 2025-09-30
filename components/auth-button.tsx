import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

export async function AuthButton() {
  const supabase = await createClient();

  // You can also use getUser() which will be slower.
  const { data } = await supabase.auth.getClaims();

  const user = data?.claims;

  return user ? (
    <div className="flex items-center gap-4">
      <span className="text-sm">
        Welcome, <span className="font-medium text-cmu-red">{user.email?.split('@')[0]}</span>
      </span>
      <LogoutButton />
    </div>
  ) : (
    <Button asChild size="sm" className="bg-cmu-red hover:bg-cmu-darkred text-white">
      <Link href="/auth/signin">Sign in</Link>
    </Button>
  );
}
