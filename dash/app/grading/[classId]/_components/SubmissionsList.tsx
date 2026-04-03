"use client";

import { Student } from "@/lib/grading/types";
import { CircleCheckBig, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

type SubmissionsListProps = {
  students: Student[];
  classId: string;
};

export const SubmissionsList = ({
  students,
  classId,
}: SubmissionsListProps) => {
  const router = useRouter();

  if (students.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400 text-sm">
        Тохирох оюутан олдсонгүй.
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-700">Дараалал</h2>

        <div className="grid grid-cols-[84px_120px_160px] items-center gap-3 text-[10px] uppercase tracking-wide text-gray-400">
          <p className="text-center">Оноо</p>
          <p className="text-center">Цаг</p>
          <p className="text-center">Төлөв</p>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {students.map((student) => (
          <div
            key={student.id}
            onClick={() => router.push(`/grading/${classId}/${student.id}`)}
            className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#31A8E0]/10 text-[#31A8E0] flex items-center justify-center text-xs font-bold">
                {student.initials}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {student.name}
                </p>
                <p className="text-xs text-gray-400">{student.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-[84px_120px_160px] items-center gap-3 text-xs min-h-[56px]">
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-800">
                  {student.finalScore ?? "-"}
                </p>
              </div>

              <div className="text-center">
                <p className="inline-flex items-center justify-center gap-1 text-gray-600">
                  <Clock size={13} strokeWidth={2.3} />
                  {student.submittedAt || "-"}
                </p>
              </div>

              <div className="text-center">
                {student.status === "Дүгнэгдсэн" ? (
                  <span className="inline-flex items-center justify-center gap-1 text-xs font-medium text-[#1F9D8B] bg-[#E8F8F5] border border-[#BFEDE5] px-2.5 py-1 rounded-full min-w-[130px]">
                    <CircleCheckBig size={14} strokeWidth={2.5} />
                    Дүгнэгдсэн
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center gap-1 text-xs font-medium text-[#C27A17] bg-[#FFF7E8] border border-[#F5D8A8] px-2.5 py-1 rounded-full min-w-[130px]">
                    <Clock size={14} strokeWidth={2.5} />
                    Хүлээгдэж байна
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
