import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { ChangeEvent } from "react";

interface SearchExamProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchExam({ value, onChange }: SearchExamProps) {
  return (
    <div className="relative">
      <Search
        size={14}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
      <Input
        placeholder="Шалгалт хайх..."
        className="pl-9 h-8 w-64 bg-white border-gray-200 text-sm rounded-md font-sans placeholder:text-gray-400"
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      />
    </div>
  );
}
