import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

const Logo = ({ className = "", isText = true }) => {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span
        className={cn(
          "relative h-8 w-8 xs:h-12 xs:w-12 overflow-hidden rounded-full bg-white shadow-sm",
          className,
        )}
      >
        <Image
          src="/logo.png"
          alt="Logo"
          fill
          sizes="(max-width: 375px) 32px, 48px"
          className="object-contain"
        />
      </span>

      {isText && (
        <h2 className="xs:text-lg font-semibold tracking-tight text-foreground">
          <span className="text-secondary-foreground">Desi</span>
          <span className="text-primary">Storage</span>
        </h2>
      )}
    </Link>
  );
};

export default Logo;
