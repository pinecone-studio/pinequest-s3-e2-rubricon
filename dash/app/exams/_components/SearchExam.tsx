import { Input } from "@base-ui/react";
import { Search } from "lucide-react";


interface SearchExamProps {
  value: string;
  onChange: (value: string) => void;
}

export const SearchExam = ({ value, onChange }: SearchExamProps) => {
  return (
    <>
      <div className="relative max-w-sm">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          size={16}
        />
        <Input 
          placeholder="Search exams..." 
          className="pl-10 bg-white" 
          value={value}
          onChange={(e: any) => onChange(e.target.value)}
        />
      </div>
    </>
  );
};
