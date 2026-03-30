import CompletedExams from "../_components/CompletedExams";
import UpcomingExams from "../_components/UpcomingExams";

const ExamsPage = () => {
  return (
    <div className="min-h-screen bg-background px-10 py-8">
      <div className="mx-auto max-w-6xl">
        <UpcomingExams />
        <CompletedExams />
      </div>
    </div>
  );
};

export default ExamsPage;
