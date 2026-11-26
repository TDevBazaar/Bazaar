import Image from "next/image";
import { siteConfig } from "@/data/site";

interface DeveWordmarkProps {
  size?: "sm" | "md" | "hero";
  textColorClass?: string;
  priority?: boolean;
}

export function DeveWordmark({
  size = "sm",
  textColorClass = "text-[#5B21B6]",
  priority = false,
}: DeveWordmarkProps) {
  if (size === "hero") {
    return (
      <span className="inline-flex items-baseline align-baseline">
        <span className="sr-only">D</span>
        <Image
          src={siteConfig.logo}
          alt=""
          aria-hidden="true"
          width={80}
          height={67}
          priority={priority}
          className="inline-block h-[0.94em] w-auto translate-y-[0.07em] select-none object-contain"
        />
        <span
          className={`-ml-[0.06em] font-display font-bold tracking-tight ${textColorClass}`}
        >
          eve
        </span>
      </span>
    );
  }

  if (size === "md") {
    return (
      <span className="inline-flex items-baseline">
        <span className="sr-only">D</span>
        <Image
          src={siteConfig.logo}
          alt=""
          aria-hidden="true"
          width={38}
          height={32}
          priority={priority}
          className="inline-block h-[29px] w-auto translate-y-[2.5px] select-none object-contain"
        />
        <span
          className={`-ml-1 font-display text-2xl font-bold leading-none tracking-tight ${textColorClass}`}
        >
          eve
        </span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-baseline">
      <span className="sr-only">D</span>
      <Image
        src={siteConfig.logo}
        alt=""
        aria-hidden="true"
        width={34}
        height={29}
        priority={priority}
        className="inline-block h-[27px] w-auto translate-y-[2px] select-none object-contain"
      />
      <span
        className={`-ml-1 font-display text-[23px] font-bold leading-none tracking-tight ${textColorClass}`}
      >
        eve
      </span>
    </span>
  );
}
