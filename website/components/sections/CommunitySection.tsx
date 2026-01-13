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
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900/30 hover:border-neutral-700 transition-colors">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-semibold text-white mb-2">{title}</h3>
      <p className="text-neutral-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

export function CommunitySection() {
  return (
    <section className="relative text-white py-24 overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            Join our engineering
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              community
            </span>
          </h2>
          <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
            Connect with thousands of developers using iii. Share ideas, ask
            questions, and learn together.
          </p>
        </div>

        {/* Community preview card */}
        <div className="mb-16 p-8 rounded-xl border border-neutral-800 bg-gradient-to-br from-neutral-900/50 to-neutral-950/50">
          {/* Discord header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold">#</span>
            </div>
            <div>
              <h3 className="font-semibold text-white">iii Community</h3>
              <p className="text-sm text-neutral-400">5K+ members</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {communityStats.map((stat, index) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-neutral-900/50 border border-neutral-800"
              >
                <p className="text-sm text-neutral-400">{stat.label}</p>
                <p className="text-xl font-bold text-green-400">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Member avatars */}
          <div className="mb-6">
            <p className="text-sm text-neutral-400 mb-3">Active members</p>
            <div className="flex items-center gap-1">
              {memberAvatars.map((avatar, index) => (
                <div
                  key={index}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-lg font-bold border-2 border-neutral-900 hover:scale-110 transition-transform"
                  title={`Member ${index + 1}`}
                >
                  {avatar}
                </div>
              ))}
              <div className="w-10 h-10 rounded-full bg-neutral-800 border-2 border-neutral-700 flex items-center justify-center text-xs text-neutral-400">
                +
              </div>
            </div>
          </div>

          {/* CTA */}
          <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.3671a19.8062 19.8062 0 00-4.885-1.515.0741.0741 0 00-.079.0371c-.211.3757-.445.8625-.607 1.25a18.27 18.27 0 00-5.487 0c-.165-.3875-.395-.8743-.607-1.25a.077.077 0 00-.079-.037A19.7513 19.7513 0 003.677 4.3671a.0605.0605 0 00-.006.0192C.3 9.769 1.23 15.1136 4.001 19.2242a.076.076 0 00.076.0316c1.498.211 2.948.969 4.276 1.756a.075.075 0 00.081-.0278 19.7850 19.7850 0 001.258-2.0744.074.074 0 00-.041-.1037c-.804-.306-1.564-.688-2.289-1.161a.075.075 0 01-.008-.1235c.153-.112.305-.23.452-.352a.075.075 0 01.078-.01c4.811 2.207 10.02 2.207 14.784 0a.075.075 0 01.078.009c.147.122.299.24.452.352a.075.075 0 01-.006.1235c-.724.473-1.484.855-2.289 1.161a.075.075 0 00-.041.1037c.282.695.769 1.341 1.258 2.074a.075.075 0 00.081.0277c1.328-.787 2.778-1.545 4.276-1.756a.075.075 0 00.076-.0317c2.781-4.099 3.716-9.447 1.713-14.146a.053.053 0 00-.006-.0192z" />
            </svg>
            Join us on Discord
          </button>
        </div>

        {/* Community highlights */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {communityHighlights.map((highlight, index) => (
            <CommunityCard key={index} {...highlight} />
          ))}
        </div>

        {/* Bottom text */}
        <div className="mt-12 text-center">
          <p className="text-neutral-400">
            Don't use Discord?{" "}
            <button className="text-blue-400 hover:text-blue-300 transition-colors underline">
              Join our forums
            </button>{" "}
            or{" "}
            <button className="text-blue-400 hover:text-blue-300 transition-colors underline">
              follow on Twitter
            </button>
          </p>
        </div>
      </div>
    </section>
  );
}
