
import React from 'react';
import { Plus, Monitor } from 'lucide-react';

interface EmptyBedCardProps {
  bedNumber: string;
  bedLabel?: string; // NEW PROP
  onClick: () => void;
  compact?: boolean;
  stretch?: boolean; // New prop for Big Screen mode
}

const EmptyBedCard: React.FC<EmptyBedCardProps> = ({ bedNumber, bedLabel, onClick, compact, stretch = false }) => {
  // If stretch is true (Big Screen), fill height. Otherwise use fixed heights based on compact mode.
  const heightClass = stretch ? 'h-full' : (compact ? 'h-48' : 'h-80');

  return (
    <div 
      onClick={onClick}
      className={`
        relative flex flex-col items-center justify-center
        rounded-xl border-2 border-dashed border-gray-800 bg-[#0f1115]/50
        hover:border-blue-600 hover:bg-blue-900/10 cursor-pointer transition-all group
        ${heightClass}
      `}
    >
      <div className="absolute top-2 left-3 font-mono font-bold text-gray-600 text-lg group-hover:text-blue-400 transition-colors">
        {/* PRIORITIZE BED LABEL */}
        {bedLabel || bedNumber}
      </div>

      <div className="flex flex-col items-center gap-3 opacity-30 group-hover:opacity-100 transition-all duration-300">
        <div className="p-4 rounded-full bg-gray-800 group-hover:bg-blue-600 transition-colors">
            <Plus size={32} className="text-gray-500 group-hover:text-white" />
        </div>
        <div className="text-center">
            <div className="font-bold text-gray-400 group-hover:text-blue-300">空闲床位</div>
            <div className="text-xs text-gray-600 group-hover:text-blue-400 flex items-center justify-center gap-1 mt-1">
                <Monitor size={12} /> 点击接入设备
            </div>
        </div>
      </div>
    </div>
  );
};

export default EmptyBedCard;
