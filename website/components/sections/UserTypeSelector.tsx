import { useState } from "react";

export type UserType = "backend-engineer" | "system-architect" | "cto";

interface UserTypeSelectorProps {
  selectedType: UserType;
  onSelectType: (type: UserType) => void;
}

const userTypes = [
  {
    id: "backend-engineer" as const,
    label: "Backend Engineer",
    icon: "⚙️",
    description: "Building reliable services",
  },
  {
    id: "system-architect" as const,
    label: "System Architect",
    icon: "🏗️",
    description: "Designing scalable systems",
  },
  {
    id: "cto" as const,
    label: "CTO",
    icon: "📊",
    description: "Leading technical strategy",
  },
];

export function UserTypeSelector({
  selectedType,
  onSelectType,
}: UserTypeSelectorProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-neutral-400 text-sm">I am a...</p>
      <div className="flex flex-wrap justify-center gap-3">
        {userTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => onSelectType(type.id)}
            className={`group px-5 py-3 rounded-lg border transition-all duration-200 ${
              selectedType === type.id
                ? "border-green-400/50 bg-green-500/10 text-white"
                : "border-neutral-800 bg-neutral-900/30 text-neutral-400 hover:border-neutral-700 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{type.icon}</span>
              <span className="font-medium">{type.label}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
