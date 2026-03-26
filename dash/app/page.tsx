"use client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/nextjs";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

const Page = () => {
  const { userId } = useAuth();
  console.log({ userId });
  return (
    <div>
      <header className="flex justify-end items-center p-4 gap-4 h-16 bg-blue-50">
        <Show when="signed-out">
          <SignInButton />
          <SignUpButton>
            <Button>Sign Up</Button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </header>
      <Button>Dash deployed</Button>
    </div>
  );
};

export default Page;
