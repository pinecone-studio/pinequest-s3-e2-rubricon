"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Monitor, Wifi } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import { students } from "./_data/students";
import { MonitoringHeader } from "./_components/MonitoringHeader";
import { StatCard } from "./_components/StatCard";
import { MonitoringFilters } from "./_components/MonitoringFilters";
import { StudentCard } from "./_components/StudentCard";

type StudentFilter = "all" | "alert";

export default function MonitoringPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [studentFilter, setStudentFilter] = useState<StudentFilter>("all");
  const [classFilter, setClassFilter] = useState("all");

  const classOptions = useMemo(() => {
    return Array.from(new Set(students.map((student) => student.className)));
  }, []);

  const classFilteredStudents = useMemo(() => {
    if (classFilter === "all") {
      return students;
    }

    return students.filter((student) => student.className === classFilter);
  }, [classFilter]);

  const visibleStudents = useMemo(() => {
    return classFilteredStudents.filter((student) => {
      const matchesSearch = student.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesStudentFilter =
        studentFilter === "all" ? true : student.tabSwitches > 0;

      return matchesSearch && matchesStudentFilter;
    });
  }, [classFilteredStudents, searchTerm, studentFilter]);

  const stats = useMemo(() => {
    return {
      total: classFilteredStudents.length,
      online: classFilteredStudents.filter(
        (student) => student.status === "online",
      ).length,
      submitted: classFilteredStudents.filter(
        (student) => student.status === "submitted",
      ).length,
      alerts: classFilteredStudents.filter((student) => student.tabSwitches > 0)
        .length,
    };
  }, [classFilteredStudents]);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <MonitoringHeader
          classFilter={classFilter}
          classOptions={classOptions}
          onClassChange={setClassFilter}
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Нийт сурагч"
            value={stats.total}
            icon={Monitor}
            iconWrapperClassName="bg-slate-100"
            iconClassName="text-slate-700"
          />

          <StatCard
            title="Одоо онлайн"
            value={stats.online}
            icon={Wifi}
            iconWrapperClassName="bg-green-100"
            iconClassName="text-green-700"
          />

          <StatCard
            title="Илгээсэн"
            value={stats.submitted}
            icon={CheckCircle2}
            iconWrapperClassName="bg-blue-100"
            iconClassName="text-blue-700"
          />

          <StatCard
            title="Таб сольсон анхааруулга"
            value={stats.alerts}
            icon={AlertTriangle}
            iconWrapperClassName="bg-red-100"
            iconClassName="text-red-700"
          />
        </div>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <h2 className="text-2xl font-semibold">Сурагчдын явц</h2>

              <MonitoringFilters
                searchTerm={searchTerm}
                studentFilter={studentFilter}
                onSearchChange={setSearchTerm}
                onStudentFilterChange={setStudentFilter}
              />
            </div>

            {visibleStudents.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-white p-10 text-center text-muted-foreground">
                Илэрц олдсонгүй.
              </div>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                {visibleStudents.map((student) => (
                  <StudentCard key={student.id} student={student} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
