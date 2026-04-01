/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, type KeyboardEvent } from "react";
import {
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  Minus,
  Mail,
  Download,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogHeader,
} from "@/components/ui/dialog";

import { Student } from "../type";

interface StudentTableProps {
  students: Student[];
}

const trendMeta = {
  up: { icon: TrendingUp, className: "text-green-600" },
  down: { icon: TrendingDown, className: "text-red-500" },
  stable: { icon: Minus, className: "text-gray-500" },
};

const getInitials = (name: string) =>
  name
    ?.split(" ")
    ?.filter(Boolean)
    ?.map((p) => p[0])
    ?.join("")
    ?.toUpperCase() || "";

const StudentTable = ({ students }: StudentTableProps) => {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [open, setOpen] = useState(false);

  const handleView = (student: Student) => {
    setSelectedStudent(student);
    setOpen(true);
  };

  const handleKey = (
    e: KeyboardEvent<HTMLTableRowElement>,
    student: Student
  ) => {
    if (e.key === "Enter") handleView(student);
  };

  return (
    <>
      <div className="rounded-2xl border bg-white overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b bg-white">
              <th className="px-6 py-4 text-sm font-semibold">Оюутан</th>
              <th className="px-6 py-4 text-sm font-semibold">Курс</th>
              <th className="px-6 py-4 text-sm font-semibold">Дундаж</th>
              <th className="px-6 py-4 text-sm font-semibold">Шалгалт</th>
              <th className="px-6 py-4 text-sm font-semibold">Ахиц</th>
              <th className="px-6 py-4 text-sm font-semibold">Сүүлд</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {students.map((s) => {
              const isMissing = s.examsTaken === 0;
              const isLow = s.averageScore < 70 && !isMissing;

              const safeScore = Math.min(
                Math.max(s.averageScore, 0),
                100
              );

              return (
                <tr
                  key={s.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleView(s)}
                  onKeyDown={(e) => handleKey(e, s)}
                  className={`cursor-pointer transition
                    ${
                      isMissing
                        // ? "bg-red-50 hover:bg-red-100"
                        // : isLow
                        // ? "bg-yellow-50 hover:bg-yellow-100"
                        // : "hover:bg-gray-50"
                    }`}
                >
                  {/* NAME */}
                  <td className="px-6 py-4">
                    <div className="flex gap-3 items-center">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                        {getInitials(s.name)}
                      </div>
                      <div>
                        <div className="font-semibold">{s.name}</div>
                        <div className="text-xs text-gray-500">
                          {s.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* COURSE */}
                  <td className="px-6 py-4">{s.course}</td>

                  {/* SCORE */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold
                          ${
                            isMissing
                              ? "text-red-500"
                              : isLow
                              ? "text-yellow-600"
                              : safeScore > 80
                              ? "text-green-600"
                              : "text-blue-600"
                          }`}
                      >
                        {isMissing ? "—" : `${safeScore}%`}
                      </span>

                      {!isMissing && (
                        <div className="w-24 h-2 bg-gray-100 rounded-full">
                          <div
                            className={`h-full rounded-full
                              ${
                                isLow
                                  ? "bg-yellow-500"
                                  : "bg-blue-500"
                              }`}
                            style={{ width: `${safeScore}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </td>

                  {/* EXAMS */}
                  <td className="px-6 py-4 text-sm">
                    {isMissing ? (
                      <span className="font-medium">
                        -
                      </span>
                    ) : isLow ? (
                      <span className="text-yellow-600 font-medium">
                        ⚠ Тэнцээгүй
                      </span>
                    ) : (
                      `${s.examsTaken} шалгалт`
                    )}
                  </td>
                  {/* LAST */}
                  <td className="px-6 py-4 text-gray-500">
                    {s.lastActive}
                  </td>

                  {/* ACTION */}
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 hover:bg-gray-100 rounded"
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Mail className="w-4 h-4 mr-2" />
                          И-мэйл
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="w-4 h-4 mr-2" />
                          Татах
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {students.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            Илэрц олдсонгүй
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl space-y-4">
          <DialogHeader>
            <DialogTitle>{selectedStudent?.name}</DialogTitle>
            <DialogDescription>
              {selectedStudent?.email}
            </DialogDescription>
          </DialogHeader>

          {selectedStudent && (
            <div className="space-y-4">

              {/* INFO */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Курс</p>
                  <p className="font-medium">{selectedStudent.course}</p>
                </div>

                <div>
                  <p className="text-gray-500">Мэргэжил</p>
                  <p className="font-medium">{selectedStudent.major}</p>
                </div>

                <div>
                  <p className="text-gray-500">Дундаж</p>
                  <p className="font-medium">
                    {selectedStudent.examsTaken === 0
                      ? "—"
                      : `${selectedStudent.averageScore}%`}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">Шалгалт</p>
                  <p className="font-medium">
                    {selectedStudent.examsTaken}
                  </p>
                </div>
              </div>

              {/* STATUS */}
              {selectedStudent.examsTaken === 0 && (
                <div className="p-3 bg-red-50 text-red-600 rounded">
                  ⚠ Шалгалт өгөөгүй
                </div>
              )}

              {selectedStudent.averageScore < 60 &&
                selectedStudent.examsTaken > 0 && (
                  <div className="p-3 bg-yellow-50 text-yellow-700 rounded">
                    ⚠ Тэнцээгүй
                  </div>
                )}

              {/* EXAM HISTORY */}
              {selectedStudent.examHistory?.length > 0 && (
                <div>
                  <p className="font-medium mb-2">
                    Шалгалтын түүх
                  </p>

                  <div className="space-y-2">
                    {selectedStudent.examHistory.map((exam) => (
                      <div
                        key={exam.id}
                        className="flex justify-between border rounded p-2 text-sm"
                      >
                        <div>
                          <p className="font-medium">{exam.name}</p>
                          <p className="text-xs text-gray-500">
                            {exam.date}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="font-semibold">
                            {exam.score}/{exam.maxScore}
                          </p>
                          <p className="text-xs text-gray-500">
                            {exam.grade}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StudentTable;