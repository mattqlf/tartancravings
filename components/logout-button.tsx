"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <Button
      onClick={logout}
      variant="outline"
      size="sm"
      className="border-cmu-red text-cmu-red hover:bg-cmu-red hover:text-white"
    >
      Logout
    </Button>
  );
}
