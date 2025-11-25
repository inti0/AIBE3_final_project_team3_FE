// src/app/find/components/AISituationModal.tsx
import React from "react";
import { AI_SITUATION_CATEGORIES, AICategory } from "../constants/aiSituations";
import { X } from "lucide-react";

interface AISituationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (category: AICategory) => void;
}

const AISituationModal: React.FC<AISituationModalProps> = ({
  isOpen,
  onClose,
  onSelectCategory,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">AI 상황극 대화방 만들기</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">
              <X size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {AI_SITUATION_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category)}
                className="bg-gray-700 hover:bg-gray-600 text-white p-4 rounded-lg text-left transition-colors"
              >
                <h3 className="text-lg font-semibold">{category.title}</h3>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISituationModal;
