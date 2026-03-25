"use client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/nextjs";
import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

const Page = () => {
  const { userId } = useAuth();
  console.log({ userId });
  const router = useRouter();

  return (
    <div className="w-screen h-screen mx-auto">
      <p>Web Deployed</p>
      <Button
        className="hover:cursor-pointer"
        onClick={() => router.push("./exam")}
      >
        Continue to Exam <ChevronRight />
      </Button>
    </div>
  );
};

export default Page;
