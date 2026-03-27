import { ActivityItemProps } from "../types";

export const ActivityItem = ({ text, time, color }: ActivityItemProps) => (
  <div className="flex items-start gap-3">
    <div className={`w-2 h-2 mt-2 rounded-full ${color}`} />
    <div>
      <p className="text-sm">{text}</p>
      <p className="text-xs text-gray-400">{time}</p>
    </div>
  </div>
);