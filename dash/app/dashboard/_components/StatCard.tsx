import { StatCardProps } from "../types";

export const StatCard = ({ title, value, subtitle, icon, color }: StatCardProps) => (
  <div className="bg-white rounded-2xl shadow-sm p-4 border">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <h2 className="text-3xl font-semibold mt-2">{value}</h2>
        <p className="text-gray-400 text-sm mt-1">{subtitle}</p>
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);