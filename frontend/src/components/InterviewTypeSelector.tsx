import type { CategoryInfo, InterviewType } from '../types';

interface InterviewTypeSelectorProps {
  categories: CategoryInfo[];
  selectedType: InterviewType | null;
  onSelect: (type: InterviewType) => void;
  onStart: () => void;
}

const typeDescriptions: Record<InterviewType, string> = {
  cs_ops: 'Practice escalations, ticket triage, and process-led customer recovery.',
  tech_support: 'Practice technical troubleshooting, diagnostics, and stakeholder communication.',
  behavioral: 'Practice STAR-style storytelling, prioritization, and ownership examples.',
  custom: 'Generate role-specific interviews from a custom role description or job posting.'
};

const typeBadges: Record<InterviewType, string> = {
  cs_ops: 'CS Ops',
  tech_support: 'Tech Support',
  behavioral: 'Behavioral',
  custom: 'Custom'
};

export default function InterviewTypeSelector({
  categories,
  selectedType,
  onSelect,
  onStart
}: InterviewTypeSelectorProps) {
  return (
    <section className="panel selector-panel fade-in">
      <p className="panel-eyebrow">Landing</p>
      <h2 className="panel-title">Choose Interview Mode</h2>
      <p className="muted-text">Pick one track and start a focused coaching session.</p>

      <div className="selector-grid">
        {categories.map((category) => {
          const isSelected = selectedType === category.id;

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelect(category.id)}
              className={`selector-card ${isSelected ? 'selector-card-selected' : ''}`}
            >
              <p className="selector-badge">{typeBadges[category.id]}</p>
              <h3>{category.name}</h3>
              <p>{typeDescriptions[category.id]}</p>
              <span>{category.count} prompts available</span>
            </button>
          );
        })}
      </div>

      <div className="selector-actions">
        <button
          type="button"
          className="button button-primary"
          onClick={onStart}
          disabled={!selectedType}
        >
          Start Interview
        </button>
      </div>
    </section>
  );
}
