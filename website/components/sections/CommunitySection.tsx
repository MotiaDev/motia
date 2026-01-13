const communityStats = [
  { label: "Active Users", value: "..." },
  { label: "Chats", value: "..." },
  { label: "Daily messages", value: "..." },
];

const communityHighlights = [
  {
    icon: "💬",
    title: "Get Help",
    description: "Ask questions, get help, and help your fellow users",
  },
];

const memberAvatars = [
  "👨‍💻",
  "👩‍💼",
  "👨‍🔬",
  "👩‍💻",
  "👨‍💼",
  "👩‍🔬",
  "👨‍🎓",
  "👩‍🎓",
  "👨‍💻",
  "👩‍💼",
  "👨‍🔬",
  "👩‍💻",
];

function CommunityCard({
  icon,
  title,
  description,
  isDarkMode,
}: {
  icon: string;
  title: string;
  description: string;
  isDarkMode: boolean;
}) {
  return (
    <div
      className={`p-6 rounded-xl border transition-colors ${
        isDarkMode
          ? "border-iii-dark bg-iii-dark/30 hover:border-iii-medium"
          : "border-iii-medium/30 bg-white/30 hover:border-iii-medium"
      }`}
    >
      <div className="text-3xl mb-3">{icon}</div>
      <h3
        className={`font-semibold mb-2 ${
          isDarkMode ? "text-iii-light" : "text-iii-black"
        }`}
      >
        {title}
      </h3>
      <p className="text-iii-medium text-sm leading-relaxed">{description}</p>
    </div>
  );
}

interface CommunitySectionProps {
  isDarkMode?: boolean;
}

export function CommunitySection({ isDarkMode = true }: CommunitySectionProps) {
  return (
    <section
      className={`relative py-24 overflow-hidden font-mono transition-colors duration-300 ${
        isDarkMode ? "text-iii-light" : "text-iii-black"
      }`}
    >
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">
            Join our engineering
            <br />
            <span
              className={`bg-clip-text text-transparent ${
                isDarkMode ? "bg-iii-accent" : "bg-iii-accent-light"
              }`}
            >
              community
            </span>
          </h2>
          <p className="text-iii-medium text-lg max-w-2xl mx-auto">
            Connect with ... of developers using iii. Share ideas, ask
            questions, and learn together.
          </p>
        </div>

        {/* Community preview card */}
        <div
          className={`mb-16 p-8 rounded-xl border ${
            isDarkMode
              ? "border-iii-dark bg-gradient-to-br from-iii-dark/50 to-iii-black/50"
              : "border-iii-medium/30 bg-gradient-to-br from-white/50 to-iii-light/50"
          }`}
        >
          {/* Discord header */}
          <div className="flex items-center gap-3 mb-6">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isDarkMode ? "bg-iii-accent" : "bg-iii-accent-light"
              }`}
            >
              <span
                className={`font-bold ${
                  isDarkMode ? "text-iii-black" : "text-white"
                }`}
              >
                #
              </span>
            </div>
            <div>
              <h3
                className={`font-semibold ${
                  isDarkMode ? "text-iii-light" : "text-iii-black"
                }`}
              >
                iii Community
              </h3>
              <p className="text-sm text-iii-medium">...K+ members</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {communityStats.map((stat, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  isDarkMode
                    ? "bg-iii-dark/50 border-iii-dark"
                    : "bg-white/50 border-iii-medium/30"
                }`}
              >
                <p className="text-sm text-iii-medium">{stat.label}</p>
                <p
                  className={`text-xl font-bold ${
                    isDarkMode ? "text-iii-accent" : "text-iii-accent-light"
                  }`}
                >
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Member avatars */}
          <div className="mb-6">
            <p className="text-sm text-iii-medium mb-3">Active members</p>
            <div className="flex items-center gap-1">
              {memberAvatars.map((avatar, index) => (
                <div
                  key={index}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold border-2 hover:scale-110 transition-transform ${
                    isDarkMode
                      ? "bg-gradient-to-br from-iii-accent to-iii-accent/70 border-iii-black"
                      : "bg-gradient-to-br from-iii-accent-light to-blue-400 border-iii-light"
                  }`}
                  title={`Member ${index + 1}`}
                >
                  {avatar}
                </div>
              ))}
              <div
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs ${
                  isDarkMode
                    ? "bg-iii-dark border-iii-medium text-iii-medium"
                    : "bg-white border-iii-medium/50 text-iii-medium"
                }`}
              >
                +
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex justify-end">
            <button
              className={`font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                isDarkMode
                  ? "bg-iii-accent text-iii-black hover:bg-iii-accent/90"
                  : "bg-iii-accent-light text-white hover:bg-iii-accent-light/90"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 127.14 96.36"
              >
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
              </svg>
              Join us on Discord
            </button>
          </div>
        </div>

        {/* Community highlights
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {communityHighlights.map((highlight, index) => (
            <CommunityCard key={index} {...highlight} isDarkMode={isDarkMode} />
          ))}
        </div> */}
      </div>
    </section>
  );
}
