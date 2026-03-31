"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { SubmissionsHeader } from "./_components/SubmissionsHeader";
import { SubmissionsSearch } from "./_components/SubmissionsSearch";
import { SubmissionsList } from "./_components/SubmissionsList";

import type { Student } from "@/lib/grading/types";
import { fetchClassStudents } from "../mockData";

type FilterTab = "Бүгд" | "Хүлээгдэж байна" | "Дүгнэгдсэн";

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

  if (loading) return <div className="p-8 text-gray-500">Уншиж байна...</div>;
  if (!course)
    return <div className="p-8 text-gray-500">Хичээл олдсонгүй.</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
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
