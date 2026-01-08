import React from 'react';
import { Check, Zap, Globe, Shield, Layers, Radio, Clock } from 'lucide-react';

interface FeaturesProps {
  isDarkMode?: boolean;
}

const features = [
  {
    icon: Layers,
    title: 'Unified Runtime',
    description: 'APIs, streams, cron, events. One binary handles them all.',
  },
  {
    icon: Globe,
    title: 'Language Agnostic',
    description: 'Write workers in Node.js, Python, or Rust. Same protocol.',
  },
  {
    icon: Radio,
    title: 'Real-time Streams',
    description: 'WebSocket sync with automatic pub/sub and state management.',
  },
  {
    icon: Zap,
    title: 'Service Discovery',
    description: 'Workers find each other. No service mesh required.',
  },
  {
    icon: Clock,
    title: 'Distributed Cron',
    description: 'Scheduled jobs with Redis-backed distributed locking.',
  },
  {
    icon: Shield,
    title: 'Built-in Observability',
    description: 'Structured logging with automatic trace context.',
  },
];

export const Features: React.FC<FeaturesProps> = ({ isDarkMode = true }) => {
  // iii Brand Colors
  const textPrimary = isDarkMode ? 'text-iii-light' : 'text-iii-black';
  const textSecondary = isDarkMode ? 'text-iii-medium' : 'text-iii-medium';
  const cardBg = isDarkMode ? 'bg-iii-dark/50' : 'bg-white';
  const cardBorder = isDarkMode ? 'border-iii-dark' : 'border-iii-medium/30';
  const iconColor = isDarkMode ? 'text-iii-accent' : 'text-iii-accent-light';

  return (
    <section className="w-full max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-24">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className={`text-2xl md:text-3xl font-bold mb-4 ${textPrimary}`}>
          Everything You Need
        </h2>
        <p className={`max-w-xl mx-auto ${textSecondary}`}>
          Stop stitching together infrastructure. iii provides the primitives.
        </p>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {features.map(({ icon: Icon, title, description }, index) => (
          <div
            key={index}
            className={`group p-6 rounded-xl border transition-all hover:scale-[1.02] ${cardBg} ${cardBorder}`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-iii-accent/10' : 'bg-iii-accent-light/10'}`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
              <div>
                <h3 className={`font-semibold mb-1 ${textPrimary}`}>{title}</h3>
                <p className={`text-sm ${textSecondary}`}>{description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Checklist */}
      <div className="mt-16 max-w-2xl mx-auto">
        <h3 className={`text-center text-lg font-semibold mb-6 ${textPrimary}`}>
          What iii Eliminates
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            'Service mesh configuration',
            'Connection pool management',
            'Manual service discovery',
            'Separate queue consumers',
            'Complex YAML orchestration',
            'Scattered logging setup',
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                isDarkMode ? 'bg-iii-accent/20' : 'bg-iii-accent-light/20'
              }`}>
                <Check className={`w-3 h-3 ${isDarkMode ? 'text-iii-accent' : 'text-iii-accent-light'}`} />
              </div>
              <span className={`text-sm ${textSecondary}`}>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
