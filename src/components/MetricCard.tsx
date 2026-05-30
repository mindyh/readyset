import { motion } from "motion/react";
import React from "react";

interface MetricCardProps {
  id: string;
  title: string;
  value: number | string;
  icon: React.ReactNode;
  colorClass: string;
  subText: string;
  onClick?: () => void;
}

export default function MetricCard({
  id,
  title,
  value,
  icon,
  colorClass,
  subText,
  onClick
}: MetricCardProps) {
  return (
    <motion.div
      id={id}
      whileHover={{ y: -1, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`relative overflow-hidden cursor-pointer rounded-xl border border-gray-100 bg-white p-3 shadow-xs transition-all duration-200 ${
        onClick ? "hover:shadow-sm hover:border-gray-200" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            {title}
          </p>
          <h3 className="mt-0.5 text-2xl font-black tracking-tight text-gray-900 leading-none">
            {value}
          </h3>
        </div>
        <div className={`rounded-lg p-2 ${colorClass}`}>
          {icon}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[11px] font-medium text-gray-500">
          {subText}
        </span>
        {onClick && (
          <span className="text-[10px] text-gray-400 font-semibold hover:text-gray-600">
            Apply filter
          </span>
        )}
      </div>
    </motion.div>
  );
}
