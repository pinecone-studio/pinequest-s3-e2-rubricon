"use client";

import React, { useState } from "react";
import { Search, Plus } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { ExamCard } from "./_components/ExamCard";
import { EXAMS_DATA } from "./mockdata";
import { SearchExam } from "./_components/SearchExam";
import { SearchTabs } from "./_components/SearchTabs";

const ExamDashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredExams = EXAMS_DATA.filter((exam) => {
    const matchesSearch = exam.title.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesStatus = true;
    if (statusFilter !== "all") {
      if (statusFilter === "in-progress" && exam.status !== "Авагдаж байгаа") matchesStatus = false;
      if (statusFilter === "scheduled" && exam.status !== "Төлөвлөгдсөн") matchesStatus = false;
      if (statusFilter === "completed" && exam.status !== "Дууссан") matchesStatus = false;
      if (statusFilter === "drafts" && exam.status !== "Драфт") matchesStatus = false;
    }

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8 bg-[#f9fafb] min-h-screen">
      {/* Header хэсэг */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Шалгалтууд</h1>
          <p className="text-slate-500 text-sm">Шалгалтуудаа үүсгэж удирдана уу</p>
        </div>
        <Button className="bg-[#006fee] hover:bg-[#005bc4] text-white flex gap-2">
          <Plus size={18} /> Шалгалт нэмэх
        </Button>
      </div>

      {/* Хайлт болон Шүүлтүүр */}
      <div className="space-y-4 mb-8">
        <SearchExam value={searchQuery} onChange={setSearchQuery} />
        <SearchTabs value={statusFilter} onValueChange={setStatusFilter} />
      </div>

      {/* Картуудын Grid (Нэг мөрөнд 3) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredExams.map((exam) => (
          <ExamCard key={exam.id} exam={exam} />
        ))}
      </div>
    </div>
  );
};

export default ExamDashboard;
