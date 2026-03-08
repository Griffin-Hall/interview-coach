import type { InterviewType, CategoryInfo } from '../types';

interface InterviewTypeSelectorProps {
  categories: CategoryInfo[];
  selectedType: InterviewType | null;
  onSelect: (type: InterviewType) => void;
  onStart: () => void;
}

const typeDescriptions: Record<InterviewType, string> = {
  cs_ops: 'Practice customer support scenarios, ticket prioritization, and enablement situations.',
  tech_support: 'Technical troubleshooting, API issues, and SaaS platform support scenarios.',
  behavioral: 'STAR-method questions about teamwork, conflict resolution, and professional growth.'
};

const typeIcons: Record<InterviewType, string> = {
  cs_ops: '🎧',
  tech_support: '🔧',
  behavioral: '⭐'
};

export default function InterviewTypeSelector({ 
  categories, 
  selectedType, 
  onSelect,
  onStart 
}: InterviewTypeSelectorProps) {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-white mb-2">Choose Interview Type</h2>
      <p className="text-gray-400 mb-8">Select the type of interview you want to practice</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelect(category.id)}
            className={`p-6 rounded-xl text-left transition-all duration-200 border-2 ${
              selectedType === category.id
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-700 bg-gray-800 hover:border-gray-600 hover:bg-gray-750'
            }`}
          >
            <div className="text-4xl mb-3">{typeIcons[category.id]}</div>
            <h3 className="text-lg font-semibold text-white mb-2">{category.name}</h3>
            <p className="text-sm text-gray-400 mb-4">{typeDescriptions[category.id]}</p>
            <div className="text-xs text-gray-500">
              {category.count} questions available
            </div>
          </button>
        ))}
      </div>
      
      {selectedType && (
        <div className="flex justify-center">
          <button
            onClick={onStart}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Start Interview →
          </button>
        </div>
      )}
    </div>
  );
}
