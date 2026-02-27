import {
  Brain,
  Search,
  FileCode,
  Bell,
  Workflow,
  ArrowRight,
} from "lucide-react";

interface AgentReadySectionProps {
  isDarkMode?: boolean;
}

const ClaudeCodeIcon = () => (
  <svg
    viewBox="25 25 50 50"
    className="w-8 h-8 md:w-10 md:h-10"
    fill="currentColor"
  >
    <path d="m39.0623 55.9433 7.0836-3.9744.1191-.3451-.1191-.192-.3452-.0001-1.1838-.073-4.0473-.1094-3.5101-.1458-3.4008-.1824-.8556-.1822-.8021-1.0574.0826-.5274.7196-.4838 1.0307.09 2.2776.1555 3.4177.2358 2.4795.1459 3.6731.3816h.5832l.0827-.2357-.1994-.1459-.1556-.1459-3.5368-2.3968-3.8286-2.533-2.0054-1.4585-1.0842-.7389-.5469-.6929-.2357-1.5119.9845-1.0841 1.3224.0899.3378.09 1.3395 1.0306 2.861 2.2145 3.7361 2.7517.5469.4546.2188-.1555.0268-.1094-.2456-.4108-2.0321-3.6731-2.1683-3.7361-.965-1.5484-.2553-.9286c-.0899-.3816-.1555-.7024-.1555-1.0938l1.1206-1.5218.6198-.1993 1.495.1993.6297.547.9285 2.1246 1.5047 3.3449 2.3336 4.548.6831 1.3491.3646 1.2495.1362.3816.2355-.0001v-.2188l.1921-2.5621.3549-3.1455.3451-4.0473.1192-1.14.5638-1.3663 1.1206-.7388.8751.4181.7196 1.0306-.0997.6661-.4278 2.7808-.8387 4.356-.5469 2.917h.3186l.3647-.3646 1.4755-1.9592 2.4795-3.0993 1.0939-1.23 1.2762-1.3588.819-.6467h1.5484l1.14 1.6942-.5103 1.7503-1.5947 2.0224-1.3223 1.7136-1.8962 2.5525-1.1837 2.0418.1094.1629.282-.0267 4.2831-.9117 2.3141-.418 2.7615-.474 1.2494.5834.1362.5931-.491 1.213-2.9535.7293-3.4639.6928-5.1583 1.2204-.0632.0461.0729.0899 2.3239.2188.9942.0535h2.4332l4.5311.338 1.1837.7827.7099.9578-.1191.7293-1.8231.9285-2.46-.5834-5.7417-1.3661-1.969-.4911-.2722-.0001v.163l1.6408 1.6043 3.0069 2.7152 3.7654 3.5004.192.8655-.4837.683-.5104-.0729-3.3084-2.4893-1.2762-1.1205-2.8903-2.4333-.1919-.0001v.2552l.6661.9748 3.5174 5.2871.1822 1.6214-.2551.5275-.9117.3184-1.0015-.1822-2.0588-2.8904-2.1247-3.2549-1.7137-2.9169-.209.119-1.0112 10.8926-.474.5566-1.0939.4182-.9115-.6929-.4838-1.1206.4838-2.2145.5834-2.8902.4739-2.2971.4279-2.8539.2552-.948-.017-.0632-.209.0267-2.1514 2.9535-3.2718 4.4217-2.5889 2.7712-.6198.2455-1.0745-.5567.0997-.9942.6004-.8847 3.5831-4.5578 2.161-2.8247 1.3952-1.6312-.0097-.2357h-.0826l-9.5166 6.1792-1.6944.2187-.7293-.6831.0901-1.1206.3451-.3645 2.8611-1.9691-.0098.0098z" />
  </svg>
);

const CursorIcon = () => (
  <svg
    viewBox="30 28 40 42"
    className="w-8 h-8 md:w-10 md:h-10"
    fill="currentColor"
  >
    <path d="m64.4023 41.0481-13.6917-7.8583c-.4396-.2524-.9821-.2524-1.4218 0l-13.691 7.8583c-.3696.2121-.5977.6045-.5977 1.0294v15.8463c0 .4249.2281.8173.5977 1.0294l13.6917 7.8583c.4396.2524.9821.2524 1.4218 0l13.6916-7.8583c.3696-.2121.5978-.6045.5978-1.0294v-15.8463c0-.4249-.2282-.8173-.5978-1.0294zm-.86 1.6646-13.2173 22.7582c-.0894.1534-.3253.0907-.3253-.0869v-14.9019c0-.2977-.16-.5731-.4197-.7227l-12.9814-7.4506c-.1542-.0888-.0912-.3233.0874-.3233h26.4346c.3754 0 .61.4045.4223.7278h-.0006z" />
  </svg>
);

const GeminiIcon = () => (
  <svg
    viewBox="28 28 44 44"
    className="w-8 h-8 md:w-10 md:h-10"
    fill="currentColor"
  >
    <path d="m48.56 60.9807c.96 2.19 1.44 4.53 1.44 7.02 0-2.49.465-4.83 1.395-7.02.96-2.19 2.25-4.095 3.87-5.715s3.525-2.895 5.715-3.825c2.19-.96 4.53-1.44 7.02-1.44-2.49 0-4.83-.465-7.02-1.395-2.1315-.919-4.0704-2.232-5.715-3.87-1.638-1.6446-2.951-3.5835-3.87-5.715-.93-2.19-1.395-4.53-1.395-7.02 0 2.49-.48 4.83-1.44 7.02-.93 2.19-2.205 4.095-3.825 5.715-1.6446 1.638-3.5835 2.951-5.715 3.87-2.19.93-4.53 1.395-7.02 1.395 2.49 0 4.83.48 7.02 1.44 2.19.93 4.095 2.205 5.715 3.825s2.895 3.525 3.825 5.715z" />
  </svg>
);

const CodexIcon = () => (
  <svg
    viewBox="28 28 44 44"
    className="w-8 h-8 md:w-10 md:h-10"
    fill="currentColor"
  >
    <path d="m65.6261 46.7346c.8277-2.4514.5427-5.1369-.781-7.3667-1.9907-3.42-5.9926-5.1796-9.9009-4.3515-1.7388-1.9328-4.2368-3.032-6.8557-3.0162-3.995-.009-7.5397 2.529-8.7688 6.2799-2.5664.5186-4.7817 2.1037-6.0781 4.3504-2.0055 3.4111-1.5483 7.7109 1.131 10.636-.8277 2.4514-.5427 5.1369.781 7.3667 1.9907 3.42 5.9926 5.1796 9.901 4.3515 1.7376 1.9328 4.2367 3.032 6.8556 3.0151 3.9974.0101 7.5432-2.5302 8.7723-6.2844 2.5664-.5186 4.7817-2.1038 6.078-4.3504 2.0033-3.4111 1.5449-7.7076-1.1333-10.6326zm-13.7136 18.9128c-1.5996.0022-3.149-.5501-4.377-1.5615.0559-.0293.1528-.0822.2155-.1204l7.265-4.1401c.3717-.2081.5997-.5985.5974-1.0204v-10.1061l3.0704 1.7494c.0331.0158.0547.0473.0593.0833v8.369c-.0046 3.7216-3.059 6.7389-6.8306 6.7468zm-14.6895-6.191c-.8015-1.3658-1.09-2.9667-.8152-4.5204.0536.0315.1482.0889.2155.1272l7.2649 4.14c.3683.2127.8244.2127 1.1938 0l8.8691-5.0536v3.4989c.0023.036-.0148.0708-.0433.0933l-7.3437 4.184c-3.271 1.8585-7.4485.7538-9.34-2.4694zm-1.912-15.648c.7981-1.368 2.0579-2.4143 3.5584-2.9577 0 .0619-.0035.171-.0035.2475v8.2813c-.0022.4208.2258.8112.5963 1.0193l8.8692 5.0525-3.0704 1.7494c-.0308.0203-.0696.0236-.1038.009l-7.3448-4.1873c-3.2642-1.8653-4.3838-5.9863-2.5026-9.2129zm25.2267 5.7928-8.8692-5.0536 3.0704-1.7483c.0308-.0203.0696-.0237.1038-.009l7.3447 4.1839c3.27 1.8642 4.3907 5.9919 2.5015 9.2185-.7992 1.3658-2.0579 2.412-3.5572 2.9565v-8.5288c.0034-.4207-.2235-.81-.5929-1.0192zm3.0555-4.5384c-.0536-.0326-.1482-.0889-.2155-.1271l-7.2649-4.1401c-.3683-.2126-.8243-.2126-1.1937 0l-8.8692 5.0536v-3.4988c-.0022-.036.0149-.0709.0434-.0934l7.3436-4.1806c3.271-1.8619 7.4531-.7537 9.3389 2.4751.7969 1.3635 1.0854 2.9599.8152 4.5113zm-19.2124 6.236-3.0716-1.7494c-.033-.0157-.0547-.0472-.0592-.0832v-8.3691c.0022-3.7261 3.0658-6.7456 6.8419-6.7434 1.5974 0 3.1434.5535 4.3713 1.5616-.0559.0292-.1516.0821-.2155.1203l-7.2649 4.1401c-.3717.2081-.5997.5974-.5975 1.0193l-.0045 10.1016zm1.668-3.5483 3.9506-2.2512 3.9506 2.2501v4.5012l-3.9506 2.25-3.9506-2.25z" />
  </svg>
);

const WindsurfIcon = () => (
  <svg
    viewBox="22 30 56 40"
    className="w-8 h-8 md:w-10 md:h-10"
    fill="currentColor"
  >
    <path d="m73.6959 36.1347h-.4574c-2.4075-.0037-4.3611 1.9459-4.3611 4.353v9.7352c0 1.944-1.6069 3.5187-3.5193 3.5187-1.1362 0-2.2705-.5718-2.9436-1.5316l-9.9428-14.2006c-.8249-1.1792-2.1673-1.8822-3.6204-1.8822-2.2668 0-4.3067 1.9271-4.3067 4.3061v9.7914c0 1.9441-1.5937 3.5188-3.5192 3.5188-1.14 0-2.2725-.5718-2.9456-1.5316l-11.1258-15.8916c-.2512-.36-.8156-.1818-.8156.2569v8.4903c0 .4293.1313.8455.3769 1.1979l10.9495 15.6367c.6469.9242 1.6013 1.6103 2.7018 1.8597 2.7543.6261 5.2892-1.4942 5.2892-4.1956v-9.7858c0-1.944 1.5749-3.5188 3.5192-3.5188h.0056c1.1719 0 2.2706.5718 2.9437 1.5317l9.9446 14.1988c.8268 1.181 2.0999 1.8821 3.6186 1.8821 2.3174 0 4.303-1.929 4.303-4.3061v-9.7895c0-1.944 1.5749-3.5188 3.5192-3.5188h.3881c.2437 0 .4406-.1969.4406-.4405v-9.2441c0-.2436-.1969-.4405-.4406-.4405z" />
  </svg>
);

const TraeIcon = () => (
  <svg
    viewBox="30 35 40 32"
    className="w-8 h-8 md:w-10 md:h-10"
    fill="currentColor"
  >
    <path
      clipRule="evenodd"
      d="m67 63.1005h-29.1437v-4.8535h-4.8563v-19.4296h34zm-29.1437-4.8535h24.2874v-14.5746h-24.2874zm12.1451-7.361-3.4354 3.434-3.434-3.434 3.434-3.434zm9.7141-.0014-3.434 3.4326-3.4354-3.4326 3.4354-3.4354z"
      fillRule="evenodd"
    />
  </svg>
);

const AmpIcon = () => (
  <svg
    viewBox="28 28 44 44"
    className="w-8 h-8 md:w-10 md:h-10"
    fill="currentColor"
  >
    <path d="m37.1786 64.235 9.0088-9.1362 3.2785 12.4474 4.7627-1.3025-4.7452-18.0735-17.7865-4.8172-1.2665 4.8664 12.2388 3.3247-8.9713 9.1227z" />
    <path d="m63.157 53.6443 4.7627-1.3026-4.745-18.0734-17.7866-4.8173-1.2665 4.8665 15.0198 4.0801z" />
    <path d="m56.3208 60.5908 4.7626-1.3026-4.7451-18.0734-17.7865-4.8172-1.2665 4.8664 15.0197 4.0801z" />
  </svg>
);

const RooIcon = () => (
  <svg
    viewBox="25 30 50 40"
    className="w-8 h-8 md:w-10 md:h-10"
    fill="currentColor"
  >
    <path d="m64.2039 38.0382-.7929 2.86c-.0413.1513-.2017.2384-.353.1925l-12.8837-3.992c-.0871-.0275-.1879-.0092-.2567.0504l-13.2687 10.6425c-.0367.0321-.0825.0504-.133.0596l-7.9062 1.2191c-.1421.0229-.2429.1467-.2383.2888l.0504 1.1321c.0046.142.1191.2566.2612.2658l9.2034.5637c.0504 0 .1008-.0091.142-.0275l6.71-3.3916c.0963-.0504.2109-.0367.2934.0275l4.2946 3.2221c.0733.055.1145.1375.11.2245l-.0413 5.3396c0 .0596.0183.1146.0504.1604l6.7559 9.6938c.0504.0733.1375.1192.2291.1192h2.3054c.2109 0 .3484-.2292.2475-.4125l-4.982-9.13c-.0459-.0825-.0459-.1834 0-.2659l2.5254-4.8033c.0275-.0504.0687-.0917.1191-.1192l8.965-4.5466c.0917-.0459.1971-.0413.2842.0183l2.5667 1.7096c.0458.0321.1008.0458.1558.0458h2.3604c.22 0 .3529-.2383.2384-.4262l-6.5084-10.78c-.1283-.2109-.4445-.165-.5087.0687z" />
  </svg>
);

const CopilotIcon = () => (
  <svg
    viewBox="-3 -3 30 30"
    className="w-8 h-8 md:w-10 md:h-10"
    fill="currentColor"
  >
    <path d="M23.922 16.997C23.061 18.492 18.063 22.02 12 22.02 5.937 22.02.939 18.492.078 16.997A.641.641 0 0 1 0 16.741v-2.869a.883.883 0 0 1 .053-.22c.372-.935 1.347-2.292 2.605-2.656.167-.429.414-1.055.644-1.517a10.098 10.098 0 0 1-.052-1.086c0-1.331.282-2.499 1.132-3.368.397-.406.89-.717 1.474-.952C7.255 2.937 9.248 1.98 11.978 1.98c2.731 0 4.767.957 6.166 2.093.584.235 1.077.546 1.474.952.85.869 1.132 2.037 1.132 3.368 0 .368-.014.733-.052 1.086.23.462.477 1.088.644 1.517 1.258.364 2.233 1.721 2.605 2.656a.841.841 0 0 1 .053.22v2.869a.641.641 0 0 1-.078.256Zm-11.75-5.992h-.344a4.359 4.359 0 0 1-.355.508c-.77.947-1.918 1.492-3.508 1.492-1.725 0-2.989-.359-3.782-1.259a2.137 2.137 0 0 1-.085-.104L4 11.746v6.585c1.435.779 4.514 2.179 8 2.179 3.486 0 6.565-1.4 8-2.179v-6.585l-.098-.104s-.033.045-.085.104c-.793.9-2.057 1.259-3.782 1.259-1.59 0-2.738-.545-3.508-1.492a4.359 4.359 0 0 1-.355-.508Zm2.328 3.25c.549 0 1 .451 1 1v2c0 .549-.451 1-1 1-.549 0-1-.451-1-1v-2c0-.549.451-1 1-1Zm-5 0c.549 0 1 .451 1 1v2c0 .549-.451 1-1 1-.549 0-1-.451-1-1v-2c0-.549.451-1 1-1Zm3.313-6.185c.136 1.057.403 1.913.878 2.497.442.544 1.134.938 2.344.938 1.573 0 2.292-.337 2.657-.751.384-.435.558-1.15.558-2.361 0-1.14-.243-1.847-.705-2.319-.477-.488-1.319-.862-2.824-1.025-1.487-.161-2.192.138-2.533.529-.269.307-.437.808-.438 1.578v.021c0 .265.021.562.063.893Zm-1.626 0c.042-.331.063-.628.063-.894v-.02c-.001-.77-.169-1.271-.438-1.578-.341-.391-1.046-.69-2.533-.529-1.505.163-2.347.537-2.824 1.025-.462.472-.705 1.179-.705 2.319 0 1.211.175 1.926.558 2.361.365.414 1.084.751 2.657.751 1.21 0 1.902-.394 2.344-.938.475-.584.742-1.44.878-2.497Z" />
  </svg>
);

const ClineIcon = () => (
  <svg
    viewBox="-3 -3 30 30"
    className="w-8 h-8 md:w-10 md:h-10"
    fill="currentColor"
    fillRule="evenodd"
  >
    <path d="M17.035 3.991c2.75 0 4.98 2.24 4.98 5.003v1.667l1.45 2.896a1.01 1.01 0 01-.002.909l-1.448 2.864v1.668c0 2.762-2.23 5.002-4.98 5.002H7.074c-2.751 0-4.98-2.24-4.98-5.002V17.33l-1.48-2.855a1.01 1.01 0 01-.003-.927l1.482-2.887V8.994c0-2.763 2.23-5.003 4.98-5.003h9.962zM8.265 9.6a2.274 2.274 0 00-2.274 2.274v4.042a2.274 2.274 0 004.547 0v-4.042A2.274 2.274 0 008.265 9.6zm7.326 0a2.274 2.274 0 00-2.274 2.274v4.042a2.274 2.274 0 104.548 0v-4.042A2.274 2.274 0 0015.59 9.6z" />
    <path d="M12.054 5.558a2.779 2.779 0 100-5.558 2.779 2.779 0 000 5.558z" />
  </svg>
);

const GooseIcon = () => (
  <svg
    viewBox="-3 -3 30 30"
    className="w-8 h-8 md:w-10 md:h-10"
    fill="currentColor"
    fillRule="evenodd"
  >
    <path d="M21.595 23.61c1.167-.254 2.405-.944 2.405-.944l-2.167-1.784a12.124 12.124 0 01-2.695-3.131 12.127 12.127 0 00-3.97-4.049l-.794-.462a1.115 1.115 0 01-.488-.815.844.844 0 01.154-.575c.413-.582 2.548-3.115 2.94-3.44.503-.416 1.065-.762 1.586-1.159.074-.056.148-.112.221-.17.003-.002.007-.004.009-.007.167-.131.325-.272.45-.438.453-.524.563-.988.59-1.193-.061-.197-.244-.639-.753-1.148.319.02.705.272 1.056.569.235-.376.481-.773.727-1.171.165-.266-.08-.465-.086-.471h-.001V3.22c-.007-.007-.206-.25-.471-.086-.567.35-1.134.702-1.639 1.021 0 0-.597-.012-1.305.599a2.464 2.464 0 00-.438.45l-.007.009c-.058.072-.114.147-.17.221-.397.521-.743 1.083-1.16 1.587-.323.391-2.857 2.526-3.44 2.94a.842.842 0 01-.574.153 1.115 1.115 0 01-.815-.488l-.462-.794a12.123 12.123 0 00-4.049-3.97 12.133 12.133 0 01-3.13-2.695L1.332 0S.643 1.238.39 2.405c.352.428 1.27 1.49 2.34 2.302C1.58 4.167.73 3.75.06 3.4c-.103.765-.063 1.92.043 2.816.726.317 1.961.806 3.219 1.066-1.006.236-2.11.278-2.961.262.15.554.358 1.119.64 1.688.119.263.25.52.39.77.452.125 2.222.383 3.164.171l-2.51.897a27.776 27.776 0 002.544 2.726c2.031-1.092 2.494-1.241 4.018-2.238-2.467 2.008-3.108 2.828-3.8 3.67l-.483.678c-.25.351-.469.725-.65 1.117-.61 1.31-1.47 4.1-1.47 4.1-.154.486.202.842.674.674 0 0 2.79-.861 4.1-1.47.392-.182.766-.4 1.118-.65l.677-.483c.227-.187.453-.37.701-.586 0 0 1.705 2.02 3.458 3.349l.896-2.511c-.211.942.046 2.712.17 3.163.252.142.509.272.772.392.569.28 1.134.49 1.688.64-.016-.853.026-1.956.261-2.962.26 1.258.75 2.493 1.067 3.219.895.106 2.051.146 2.816.043a73.87 73.87 0 01-1.308-2.67c.811 1.07 1.874 1.988 2.302 2.34h-.001z" />
  </svg>
);

const agentLogos = [
  { name: "Claude Code", icon: ClaudeCodeIcon },
  { name: "Cursor", icon: CursorIcon },
  { name: "Gemini", icon: GeminiIcon },
  { name: "Codex", icon: CodexIcon },
  { name: "Windsurf", icon: WindsurfIcon },
  { name: "Trae", icon: TraeIcon },
  { name: "Amp", icon: AmpIcon },
  { name: "Roo", icon: RooIcon },
  { name: "Copilot", icon: CopilotIcon },
  { name: "Cline", icon: ClineIcon },
  { name: "Goose", icon: GooseIcon },
];

export function AgentReadySection({
  isDarkMode = true,
}: AgentReadySectionProps) {
  const textPrimary = isDarkMode ? "text-iii-light" : "text-iii-black";
  const textSecondary = isDarkMode ? "text-iii-light/70" : "text-iii-black/70";
  const infoColor = isDarkMode ? "text-iii-info" : "text-[#0891b2]";
  const iconBase = isDarkMode
    ? "text-iii-medium-dark"
    : "text-iii-medium-light";
  const cardBg = isDarkMode ? "bg-iii-dark/30" : "bg-white/50";
  const cardBorder = isDarkMode ? "border-iii-light/15" : "border-iii-black/15";
  const cardHover = isDarkMode
    ? "hover:border-iii-info/40"
    : "hover:border-[#0891b2]/40";
  const iconBg = isDarkMode ? "bg-iii-black" : "bg-white";

  return (
    <section
      className={`relative overflow-hidden font-mono transition-colors duration-300 ${textPrimary}`}
    >
      <style>{`
        @keyframes agent-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-25%); }
        }
      `}</style>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-1/3 -left-1/4 w-1/2 h-1/2 rounded-full opacity-[0.025]"
          style={{
            background:
              "radial-gradient(circle, var(--color-info) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-1/4 -right-1/4 w-2/5 h-2/5 rounded-full opacity-[0.02]"
          style={{
            background:
              "radial-gradient(circle, var(--color-accent) 0%, transparent 70%)",
          }}
        />
      </div>
      <div className="relative z-10">
        <div className="text-center mb-10 md:mb-16 space-y-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Brain className={`w-5 h-5 md:w-6 md:h-6 ${infoColor}`} />
            <span
              className={`text-xs md:text-sm font-mono tracking-wider uppercase ${infoColor}`}
            >
              Agent-Ready
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tighter">
            AI agents are
            <br />
            <span className={infoColor}>first-class citizens</span>
          </h2>
          <p
            className={`text-sm md:text-base lg:text-lg max-w-3xl mx-auto ${textSecondary}`}
          >
            The engine operates as a universal tool discovery and invocation
            layer where intelligent agents participate as first-class execution
            entities — built in from day one.
          </p>
        </div>

        <div className="mb-10 md:mb-14 overflow-hidden">
          <p
            className={`text-center text-xs uppercase tracking-widest mb-6 ${textSecondary}`}
          >
            The universal agentic layer
          </p>
          <div
            className="flex w-max"
            style={{ animation: "agent-scroll 60s linear infinite" }}
          >
            {[...agentLogos, ...agentLogos, ...agentLogos, ...agentLogos].map(
              (logo, i) => {
                const Icon = logo.icon;
                return (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-2 px-4 md:px-6 shrink-0"
                  >
                    <div className={iconBase}>
                      <Icon />
                    </div>
                    <span
                      className={`text-[10px] whitespace-nowrap ${textPrimary}`}
                    >
                      {logo.name}
                    </span>
                  </div>
                );
              },
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
          <div
            className={`col-span-1 md:col-span-4 lg:col-span-4 group relative overflow-hidden rounded-xl border transition-all duration-300 p-6 md:p-8 ${cardBg} ${cardBorder} ${cardHover}`}
          >
            <div
              className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity opacity-0 group-hover:opacity-100 ${isDarkMode ? "bg-iii-info/5" : "bg-[#0891b2]/5"}`}
            />
            <div className="relative z-10 flex flex-col gap-4 md:gap-6">
              <div
                className={`p-2 border rounded-lg w-fit ${iconBg} ${cardBorder}`}
              >
                <Search className={`w-5 h-5 md:w-7 md:h-7 ${infoColor}`} />
              </div>
              <div className="space-y-3">
                <h3
                  className={`text-xl md:text-2xl font-semibold tracking-tight ${textPrimary}`}
                >
                  Discover & Trigger
                </h3>
                <p
                  className={`text-xs md:text-sm leading-relaxed max-w-lg ${textSecondary} transition-colors ${isDarkMode ? "group-hover:text-gray-300" : "group-hover:text-gray-600"}`}
                >
                  Agents find and execute functions across the system
                  automatically
                </p>
              </div>
              <div className="flex items-center gap-2 md:gap-3 mt-2">
                {["Agent", "Discover", "Trigger"].map((label, i) => (
                  <div key={label} className="flex items-center gap-2 md:gap-3">
                    <span
                      className={`px-3 py-1.5 rounded-lg border text-xs font-mono ${iconBg} ${cardBorder} ${textPrimary}`}
                    >
                      {label}
                    </span>
                    {i < 2 && (
                      <ArrowRight className={`w-3.5 h-3.5 ${infoColor}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            className={`col-span-1 md:col-span-2 lg:col-span-2 group relative overflow-hidden rounded-xl border transition-all duration-300 p-4 md:p-6 ${cardBg} ${cardBorder} ${cardHover}`}
          >
            <div
              className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity opacity-0 group-hover:opacity-100 ${isDarkMode ? "bg-iii-info/5" : "bg-[#0891b2]/5"}`}
            />
            <div className="relative z-10 flex flex-col gap-3">
              <div
                className={`p-2 border rounded-lg w-fit ${iconBg} ${cardBorder}`}
              >
                <FileCode className={`w-4 h-4 md:w-5 md:h-5 ${infoColor}`} />
              </div>
              <h3
                className={`text-base md:text-lg font-semibold ${textPrimary}`}
              >
                Self-Describing Schemas
              </h3>
              <p
                className={`text-[10px] md:text-xs leading-relaxed ${textSecondary}`}
              >
                Functions include input/output schemas for autonomous payload
                construction
              </p>
            </div>
          </div>

          <div
            className={`col-span-1 md:col-span-2 lg:col-span-2 group relative overflow-hidden rounded-xl border transition-all duration-300 p-4 md:p-6 ${cardBg} ${cardBorder} ${cardHover}`}
          >
            <div
              className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity opacity-0 group-hover:opacity-100 ${isDarkMode ? "bg-iii-info/5" : "bg-[#0891b2]/5"}`}
            />
            <div className="relative z-10 flex flex-col gap-3">
              <div
                className={`p-2 border rounded-lg w-fit ${iconBg} ${cardBorder}`}
              >
                <Bell className={`w-4 h-4 md:w-5 md:h-5 ${infoColor}`} />
              </div>
              <h3
                className={`text-base md:text-lg font-semibold ${textPrimary}`}
              >
                Real-Time Updates
              </h3>
              <p
                className={`text-[10px] md:text-xs leading-relaxed ${textSecondary}`}
              >
                Capabilities change — agents adapt instantly via push
              </p>
            </div>
          </div>

          <div
            className={`col-span-1 md:col-span-2 lg:col-span-2 group relative overflow-hidden rounded-xl border transition-all duration-300 p-4 md:p-6 ${cardBg} ${cardBorder} ${cardHover}`}
          >
            <div
              className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity opacity-0 group-hover:opacity-100 ${isDarkMode ? "bg-iii-info/5" : "bg-[#0891b2]/5"}`}
            />
            <div className="relative z-10 flex flex-col gap-3">
              <div
                className={`p-2 border rounded-lg w-fit ${iconBg} ${cardBorder}`}
              >
                <Workflow className={`w-4 h-4 md:w-5 md:h-5 ${infoColor}`} />
              </div>
              <h3
                className={`text-base md:text-lg font-semibold ${textPrimary}`}
              >
                Compose Workflows
              </h3>
              <p
                className={`text-[10px] md:text-xs leading-relaxed ${textSecondary}`}
              >
                Chain invocations across the distributed system
              </p>
            </div>
          </div>

          <div
            className={`col-span-1 md:col-span-2 lg:col-span-2 group relative overflow-hidden rounded-xl border transition-all duration-300 p-4 md:p-6 ${cardBg} ${cardBorder} ${cardHover}`}
          >
            <div
              className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity opacity-0 group-hover:opacity-100 ${isDarkMode ? "bg-iii-info/5" : "bg-[#0891b2]/5"}`}
            />
            <div className="relative z-10 flex flex-col gap-3">
              <div
                className={`p-2 border rounded-lg w-fit ${iconBg} ${cardBorder}`}
              >
                <Brain className={`w-4 h-4 md:w-5 md:h-5 ${infoColor}`} />
              </div>
              <h3
                className={`text-base md:text-lg font-semibold ${textPrimary}`}
              >
                Register Capabilities
              </h3>
              <p
                className={`text-[10px] md:text-xs leading-relaxed ${textSecondary}`}
              >
                Agents become active participants in the execution layer
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
