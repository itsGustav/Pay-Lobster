'use client';

interface Badge {
  icon: string;
  name: string;
  description?: string;
}

interface BadgeGridProps {
  badges: Badge[];
}

export function BadgeGrid({ badges }: BadgeGridProps) {
  if (badges.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 md:p-8">
      <h2 className="text-xl font-bold text-white mb-6">Badges</h2>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
        {badges.map((badge) => (
          <div
            key={badge.name}
            className="bg-gray-950 border border-gray-800 rounded-lg p-4 flex flex-col items-center text-center gap-2 hover:border-orange-600 transition-colors"
            title={badge.description}
          >
            <span className="text-3xl">{badge.icon}</span>
            <span className="text-white text-sm font-medium">{badge.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
