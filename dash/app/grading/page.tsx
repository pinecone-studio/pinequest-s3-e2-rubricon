"use client";

import { useEffect, useMemo, useState } from "react";
import { ExamCard } from "./_components/ExamCard";
import type { ClassCourse } from "@/lib/grading/types";
import { fetchGradingClasses } from "./mockData";

const GradingPage = () => {
  const [classes, setClasses] = useState<ClassCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchGradingClasses()
      .then((data) => {
        if (cancelled) return;
        setClasses(data);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleClasses = useMemo(
    () => classes.filter((course) => (course.total ?? 0) > 0),
    [classes],
  );
  const visiblePending = useMemo(
    () => visibleClasses.reduce((sum, course) => sum + course.pending, 0),
    [visibleClasses],
  );

  return (
    <div className="min-h-screen bg-[#f0f4f8] p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Дүн Үнэлгээ</h1>
        <p className="mt-1 text-sm text-gray-500">
          Дүгнэх хичээлээ сонгоно уу. Нийт {visiblePending} хүлээгдэж байна.
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Уншиж байна...</div>
      ) : visibleClasses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Оюутантай хичээл одоогоор алга байна.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {visibleClasses.map((course) => (
            <ExamCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
};

export default GradingPage;
