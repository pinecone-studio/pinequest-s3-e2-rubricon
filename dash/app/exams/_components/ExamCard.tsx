import {
  Calendar,
  Clock,
  Users,
  MoreHorizontal,
  Play,
  FileText,
  CircleCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const ExamCard = ({ exam }: { exam: any }) => {
  const statusConfig: any = {
    "Авагдаж байгаа": {
      bg: "bg-green-50 text-green-700",
      icon: <Play size={12} className="fill-green-700" />,
      label: "Авагдаж байгаа",
    },
    Төлөвлөгдсөн: {
      bg: "bg-blue-50 text-blue-600",
      icon: <Calendar size={12} />,
      label: "Төлөвлөгдсөн",
    },
    Дууссан: {
      bg: "bg-slate-50 text-slate-600",
      icon: <CircleCheck size={12} />,
      label: "Дууссан",
    },
    Драфт: {
      bg: "bg-orange-50 text-orange-700",
      icon: <FileText size={12} />,
      label: "Драфт",
    },
  };

  const config = statusConfig[exam.status] || statusConfig["Драфт"];

  return (

    <Card className="shadow-sm border-slate-200 rounded-xl overflow-hidden bg-white">

      <CardHeader className="flex flex-row justify-between items-start pt-6 px-6 pb-2">
        <Badge
          variant="secondary"
          className={`${config.bg} border-none px-3 py-1 rounded-md flex gap-2 items-center font-medium text-[13px]`}
        >
          {config.icon}
          {config.label}
        </Badge>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-900">
          <MoreHorizontal size={20} strokeWidth={2.5} />
        </Button>
      </CardHeader>

      <CardContent className="px-6 pb-6 space-y-5">
        <div>
          <h3 className="font-bold text-[20px] text-slate-900 leading-tight">
            {exam.title}
          </h3>
          <p className="text-[16px] text-slate-500 mt-2">{exam.course}</p>
        </div>

        <div className="flex items-center gap-6 text-slate-600">
          <div className="flex items-center gap-2 text-[15px]">
            <Calendar size={18} className="text-slate-700" /> {exam.date}
          </div>
          <div className="flex items-center gap-2 text-[15px]">
            <Clock size={18} className="text-slate-700" /> {exam.time}
          </div>
        </div>

        <div className="border-t border-slate-200" />

        <div className="flex items-center gap-6 text-slate-600">
          <div className="flex items-center gap-2 text-[15px]">
            <Users size={18} className="text-slate-700" /> {exam.students}{" "}
            сурагчид
          </div>
          <div className="flex items-center gap-2 text-[15px]">
            <Clock size={18} className="text-slate-700" /> {exam.duration}
          </div>
        </div>

        {/* Энд нөхцөлт дүрслэлүүд орж байна */}
        <div className="mt-2">
          {/* 1. Авагдаж байгаа үед: Бөглөсөн мэдээлэл харуулах */}
          {exam.status === "Авагдаж байгаа" && (
            <div className="flex justify-between items-center bg-[#f7fcf9] p-4 rounded-xl">
              <span className="text-slate-600 text-[15px]">Бөглөсөн</span>
              <span className="font-bold text-green-700 text-[16px]">
                {exam.submissions}/{exam.students}
              </span>
            </div>
          )}

          {/* 2. Дууссан үед: Дундаж оноо харуулах */}
          {exam.status === "Дууссан" && (
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl">
              <span className="text-slate-600 text-[15px]">Дундаж оноо</span>
              <span className="font-bold text-slate-900 text-[16px]">
                {exam.averageScore}%
              </span>
            </div>
          )}

          {/* 3. Драфт үед: Засах товч харуулах */}
          {exam.status === "Драфт" && (
            <Button
              variant="outline"
              className="w-full h-[48px] text-[15px] font-semibold border-slate-200 text-slate-900 rounded-xl hover:bg-slate-50"
            >
              Үргэлжлүүлэн засах
            </Button>
          )}

          {/* 4. Төлөвлөгдсөн үед: Хоосон зай эсвэл өөр мэдээлэл харуулж болно */}
          {exam.status === "Төлөвлөгдсөн" && <div className="h-[56px]" />}
        </div>
      </CardContent>
    </Card>
  );
};
