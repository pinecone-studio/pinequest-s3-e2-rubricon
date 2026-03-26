"use client";

type FeedbackSectionProps = {
  feedback: string;
  onFeedbackChange: (val: string) => void;
};

export const FeedbackSection = ({
  feedback,
  onFeedbackChange,
}: FeedbackSectionProps) => {
  return (
    <div className="border border-gray-200 rounded-2xl p-5 bg-white">
      <h4 className="text-sm font-semibold text-gray-800 mb-3">
        Оюутанд Илгээх Санал Хүсэлт
      </h4>
      <textarea
        value={feedback}
        onChange={(e) => onFeedbackChange(e.target.value)}
        placeholder="Хувийн санал хүсэлт оруулна уу..."
        rows={4}
        className="w-full text-sm border border-gray-200 rounded-xl p-3 text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
      />
    </div>
  );
};
