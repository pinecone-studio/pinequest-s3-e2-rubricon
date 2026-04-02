"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { SubmissionsHeader } from "./_components/SubmissionsHeader";
import { SubmissionsSearch } from "./_components/SubmissionsSearch";
import { SubmissionsList } from "./_components/SubmissionsList";
import { Skeleton } from "@/components/ui/skeleton";

import type { Student } from "@/lib/grading/types";
import { fetchClassStudents } from "../mockData";

type FilterTab = "Бүгд" | "Хүлээгдэж байна" | "Дүгнэгдсэн";

const SubmissionsPageSkeleton = () => {
  return (
    <div className="min-h-screen bg-[#f0f4f8] flex flex-col">
      <header className="flex items-center gap-4 border-b border-gray-200 bg-white px-6 py-4">
        <Skeleton className="h-9 w-9 rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-3 w-32" />
        </div>
      </header>

      <div className="mx-auto w-full max-w-4xl flex-1 p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <Skeleton className="h-10 w-72 max-w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>

        <div className="space-y-3">
          {Array.from({ length: 7 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-gray-200 bg-white px-5 py-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const SubmissionsPage = () => {
  const params = useParams();
  const classId = params.classId as string;

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("Бүгд");
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<{
    code: string;
    name: string;
    pending: number;
  } | null>(null);
  const [allStudents, setAllStudents] = useState<Student[]>([]);

  useEffect(() => {
    fetchClassStudents(classId)
      .then((res) => {
        setCourse(
          res.course
            ? {
                code: res.course.code,
                name: res.course.name,
                pending: res.course.pending,
              }
            : null,
        );
        setAllStudents(res.students);
      })
      .finally(() => setLoading(false));
  }, [classId]);

  const filtered = useMemo(() => {
    return allStudents.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase());

      const matchFilter =
        filter === "Бүгд" ||
        (filter === "Хүлээгдэж байна" && s.status === "Хүлээгдэж байна") ||
        (filter === "Дүгнэгдсэн" && s.status === "Дүгнэгдсэн");

      return matchSearch && matchFilter;
    });
  }, [allStudents, search, filter]);

  const counts = {
    all: allStudents.length,
    pending: allStudents.filter((s) => s.status === "Хүлээгдэж байна").length,
    graded: allStudents.filter((s) => s.status === "Дүгнэгдсэн").length,
  };

  if (loading) return <SubmissionsPageSkeleton />;
  if (!course)
    return <div className="p-8 text-gray-500">Хичээл олдсонгүй.</div>;

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex flex-col">
      <SubmissionsHeader
        classCode={course.code}
        className={course.name}
        pendingCount={counts.pending}
      />

      <div className="flex-1 p-6 max-w-4xl w-full mx-auto">
        <SubmissionsSearch
          search={search}
          onSearchChange={setSearch}
          activeFilter={filter}
          onFilterChange={setFilter}
          counts={counts}
        />
        <SubmissionsList students={filtered} classId={classId} />
      </div>
    </div>
  );
};

export default SubmissionsPage;
