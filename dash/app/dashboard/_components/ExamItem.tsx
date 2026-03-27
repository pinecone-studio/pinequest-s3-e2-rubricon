import { ExamItemProps } from "../types";
import { FileText, Calendar, Clock } from "lucide-react";

export const ExamItem = ({ title, date, time, students, duration }: ExamItemProps) => (
  <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
        <FileText size={18} />
      </div>

      <div>
        <p className="font-medium">{title}</p>

        <div className="text-sm text-gray-500 mt-1 flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Calendar size={14} /> {date}
          </span>

          <span className="flex items-center gap-1">
            <Clock size={14} /> {time}
          </span>
        </div>
      </div>
    </div>

    <div className="text-right">
      <p className="text-sm font-medium">{students} Оюутанууд</p>
      <p className="text-xs text-gray-400">{duration}</p>
    </div>
  </div>
);