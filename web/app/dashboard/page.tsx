import {
  ExamCalendar,
  Header,
  MyExamSessions,
  RecentSubmittedExams,
  StatCards,
} from "./_components";

const DashboardPage = () => {
  return (
    <div className="mx-14 mt-8">
      <Header />
      <StatCards />
      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-start">
        <MyExamSessions className="min-w-0 lg:basis-0 lg:flex-[2]" />
        <ExamCalendar className="min-w-0 lg:basis-0 lg:flex-[0.8]" />
      </div>
      <RecentSubmittedExams />
    </div>
  );
};

export default DashboardPage;
