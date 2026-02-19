import Image from "next/image";

export function NavTitle() {
  return (
    <span className="relative inline-flex h-6 items-center">
      <Image
        src="/icons/iii-black.svg"
        alt="iii"
        width={32}
        height={24}
        className="h-6 w-auto dark:hidden"
        unoptimized
      />
      <Image
        src="/icons/iii-white.svg"
        alt="iii"
        width={32}
        height={24}
        className="hidden h-6 w-auto dark:block"
        unoptimized
      />
    </span>
  );
}
