"use client";

import { BookOpen, ArrowRight } from "lucide-react";
const results = [
  {
    id: 1,
    subject: "Компьютерийн ухаан",
    title: "Алгоритмын шинжилгээний сорил",
    date: "2026.03.18",
    score: 85,
    maxScore: 100,
  },
  {
    id: 2,
    subject: "Англи хэлний уран зохиол",
    title: "Эссэ бичлэг",
    date: "2026.03.15",
    status: "Хүлээгдэж буй",
  },
  {
    id: 3,
    subject: "Математик",
    title: "Математик анализын явцын шалгалт",
    date: "2026.03.12",
    score: 92,
    maxScore: 100,
  },
];

export default function RecentResults() {
  return (
    <div>
      <h2 className="mb-4 text-base font-semibold text-foreground">
        Өгсөн шалгалтууд
      </h2>

      <div className="space-y-3">
        {results.map((r) => (
          <div
            key={r.id}
            className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-6 py-4"
          >
            {/* LEFT */}
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
                <BookOpen className="w-5 h-5 text-indigo-600" />
              </div>

              <div>
                <p className="text-base font-medium text-gray-900">{r.title}</p>
                <p className="text-xs text-gray-500">
                  {r.subject} · {r.date}
                </p>
              </div>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-6">
              {r.status ? (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-500">
                  {r.status}
                </span>
              ) : (
                <span className="text-xs font-medium text-indigo-600">
                  {r.score}
                  <span className="text-xs text-gray-500 font-normal">
                    /{r.maxScore}
                  </span>
                </span>
              )}

              <ArrowRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
