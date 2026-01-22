import { useState, useEffect } from "react";

// Discord Widget API
const DISCORD_GUILD_ID = "1322278831184281721";
const DISCORD_WIDGET_URL = `https://discord.com/api/guilds/${DISCORD_GUILD_ID}/widget.json`;
const DISCORD_INVITE_URL = "https://discord.gg/iii"; // Fallback invite link

interface DiscordWidget {
  id: string;
  name: string;
  instant_invite: string | null;
  presence_count: number;
  members: Array<{
    id: string;
    username: string;
    avatar_url: string;
    status: string;
  }>;
}

interface DiscordStats {
  memberCount: string;
  onlineCount: number;
  members: Array<{
    id: string;
    username: string;
    avatar_url: string;
    status: string;
  }>;
  inviteUrl: string | null;
  serverName: string;
  isLoading: boolean;
  error: string | null;
}

const defaultStats: DiscordStats = {
  memberCount: "...",
  onlineCount: 0,
  members: [],
  inviteUrl: null,
  serverName: "iii Community",
  isLoading: true,
  error: null,
};

const communityHighlights = [
  {
    icon: "💬",
    title: "Get Help",
    description: "Ask questions, get help, and help your fellow users",
  },
];

const fallbackAvatars = ["👨‍💻", "👩‍💼", "👨‍🔬", "👩‍💻", "👨‍💼", "👩‍🔬", "👨‍🎓", "👩‍🎓"];

function useDiscordWidget(): DiscordStats {
  const [stats, setStats] = useState<DiscordStats>(defaultStats);

  useEffect(() => {
    const fetchDiscordData = async () => {
      try {
        const response = await fetch(DISCORD_WIDGET_URL);

        if (!response.ok) {
          throw new Error(
            response.status === 403
              ? "Widget is disabled for this server"
              : `Failed to fetch: ${response.status}`
          );
        }

        const data: DiscordWidget = await response.json();

        setStats({
          memberCount: `${data.presence_count}+`,
          onlineCount: data.presence_count,
          members: data.members.slice(0, 12), // Show up to 12 members
          inviteUrl: data.instant_invite || DISCORD_INVITE_URL,
          serverName: data.name,
          isLoading: false,
          error: null,
        });
      } catch (err) {
        setStats({
          ...defaultStats,
          isLoading: false,
          error:
            err instanceof Error ? err.message : "Failed to fetch Discord data",
          inviteUrl: DISCORD_INVITE_URL,
        });
      }
    };

    fetchDiscordData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchDiscordData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return stats;
}

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
  const discord = useDiscordWidget();

  // Build stats from Discord data
  const communityStats = [
    {
      label: "Online Now",
      value: discord.isLoading ? "..." : discord.onlineCount.toString(),
      icon: "🟢",
    },
    {
      label: "Channels",
      value: "10+",
      icon: "#",
    },
    {
      label: "Status",
      value: discord.isLoading ? "..." : discord.error ? "Offline" : "Live",
      icon: discord.error ? "🔴" : "✓",
    },
  ];

  // Use Discord member avatars or fallback
  const displayMembers =
    discord.members.length > 0
      ? discord.members
      : fallbackAvatars.map((emoji, i) => ({
          id: `fallback-${i}`,
          username: `Member ${i + 1}`,
          avatar_url: "",
          status: "online",
          emoji,
        }));

  const handleJoinClick = () => {
    const url = discord.inviteUrl || DISCORD_INVITE_URL;
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <section
      className={`relative overflow-hidden font-mono transition-colors duration-300 ${
        isDarkMode ? "text-iii-light" : "text-iii-black"
      }`}
    >
      <div className="relative z-10">
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
            Connect with developers building with iii. Share ideas, ask
            questions, and learn together.
          </p>
        </div>

        {/* Community preview card */}
        <div
          className={`mb-16 p-4 sm:p-6 md:p-8 rounded-xl border ${
            isDarkMode
              ? "border-iii-light/20 bg-gradient-to-br from-iii-dark/50 to-iii-black/50"
              : "border-iii-black/20 bg-gradient-to-br from-white/50 to-iii-light/50"
          }`}
        >
          {/* Discord header */}
          <div className="flex flex-col sm:flex-row items-center gap-3 mb-6 text-center sm:text-left">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                isDarkMode ? "bg-[#5865F2]" : "bg-[#5865F2]"
              }`}
            >
              <svg
                className="w-7 h-7 text-white"
                fill="currentColor"
                viewBox="0 0 127.14 96.36"
              >
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
              </svg>
            </div>
            <div>
              <h3
                className={`font-semibold text-lg ${
                  isDarkMode ? "text-iii-light" : "text-iii-black"
                }`}
              >
                {discord.serverName}
              </h3>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    discord.error ? "bg-red-500" : "bg-green-500"
                  } ${discord.isLoading ? "animate-pulse" : ""}`}
                />
                <p
                  className={`text-sm ${
                    isDarkMode ? "text-iii-light/70" : "text-iii-medium"
                  }`}
                >
                  {discord.isLoading
                    ? "Connecting..."
                    : discord.error
                    ? "Widget unavailable"
                    : `${discord.onlineCount} members online now`}
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8">
            {communityStats.map((stat, index) => (
              <div
                key={index}
                className={`p-3 sm:p-4 rounded-lg border transition-all text-center ${
                  isDarkMode
                    ? "bg-iii-dark/50 border-iii-light/20 hover:border-iii-light/40"
                    : "bg-white/50 border-iii-black/20 hover:border-iii-black/40"
                }`}
              >
                <p
                  className={`text-xs sm:text-sm mb-1 ${
                    isDarkMode ? "text-iii-light/70" : "text-iii-medium"
                  }`}
                >
                  {stat.label}
                </p>
                <p
                  className={`text-xl sm:text-2xl font-bold ${
                    isDarkMode ? "text-iii-accent" : "text-iii-accent-light"
                  } ${discord.isLoading ? "animate-pulse" : ""}`}
                >
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Member avatars */}
          <div className="mb-8">
            <p
              className={`text-xs sm:text-sm mb-3 text-center sm:text-left ${
                isDarkMode ? "text-iii-light/70" : "text-iii-medium"
              }`}
            >
              {discord.members.length > 0 ? "Online members" : "Active members"}
            </p>
            <div className="flex items-center gap-1 flex-wrap justify-center sm:justify-start">
              {displayMembers.slice(0, 12).map((member, index) => (
                <div
                  key={"id" in member ? member.id : index}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold border-2 hover:scale-110 transition-transform cursor-pointer relative group ${
                    isDarkMode ? "border-iii-black" : "border-iii-light"
                  }`}
                  style={{
                    background:
                      "avatar_url" in member && member.avatar_url
                        ? `url(${member.avatar_url}) center/cover`
                        : isDarkMode
                        ? "linear-gradient(135deg, var(--iii-accent), var(--iii-accent-light))"
                        : "linear-gradient(135deg, var(--iii-accent-light), #60a5fa)",
                  }}
                  title={
                    "username" in member
                      ? member.username
                      : `Member ${index + 1}`
                  }
                >
                  {!("avatar_url" in member && member.avatar_url) && (
                    <span className="text-white text-sm">
                      {"emoji" in member
                        ? member.emoji
                        : member.username?.charAt(0).toUpperCase()}
                    </span>
                  )}
                  {/* Status indicator */}
                  {"status" in member && member.status && (
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 ${
                        isDarkMode ? "border-iii-black" : "border-white"
                      } ${
                        member.status === "online"
                          ? "bg-green-500"
                          : member.status === "idle"
                          ? "bg-yellow-500"
                          : member.status === "dnd"
                          ? "bg-red-500"
                          : "bg-gray-500"
                      }`}
                    />
                  )}
                  {/* Tooltip */}
                  {"username" in member && (
                    <span
                      className={`absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap ${
                        isDarkMode
                          ? "bg-iii-black text-iii-light"
                          : "bg-white text-iii-black shadow-lg"
                      }`}
                    >
                      {member.username}
                    </span>
                  )}
                </div>
              ))}
              {discord.onlineCount > 12 && (
                <div
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-medium ${
                    isDarkMode
                      ? "bg-iii-dark border-iii-light/30 text-iii-light/70"
                      : "bg-white border-iii-black/30 text-iii-black/70"
                  }`}
                >
                  +{discord.onlineCount - 12}
                </div>
              )}
            </div>
          </div>

          {/* CTA */}
          <div className="flex justify-center sm:justify-end">
            <button
              onClick={handleJoinClick}
              className={`font-semibold py-3 px-6 sm:px-8 rounded-lg transition-all flex items-center justify-center gap-2 sm:gap-3 hover:scale-105 active:scale-95 w-full sm:w-auto ${
                isDarkMode
                  ? "bg-[#5865F2] text-white hover:bg-[#4752C4]"
                  : "bg-[#5865F2] text-white hover:bg-[#4752C4]"
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
