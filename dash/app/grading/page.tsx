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

  const totalPending = useMemo(
    () => classes.reduce((sum, course) => sum + course.pending, 0),
    [classes],
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Дүн Үнэлгээ</h1>
        <p className="mt-1 text-sm text-gray-500">
          Дүгнэх хичээлээ сонгоно уу. Нийт {totalPending} хүлээгдэж байна.
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Уншиж байна...</div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {classes.map((course) => (
            <ExamCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
};

export default GradingPage;
