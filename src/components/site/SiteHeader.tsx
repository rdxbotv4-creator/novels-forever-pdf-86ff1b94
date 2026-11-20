import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Menu, UserRound, X } from "lucide-react";
import { Logo } from "./Logo";
import { OwnerStrip } from "./OwnerStrip";
import { InstallAppButton } from "./InstallAppButton";
import { Button } from "@/components/ui/button";
import { openLogin, useReaderName } from "@/lib/reader";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/novels", label: "Novels" },
  { to: "/authors", label: "Authors" },
  { to: "/playlists", label: "Playlists" },
  { to: "/pdfs", label: "PDF Library" },
  { to: "/contact", label: "Support" },
] as const;

export function SiteHeader() {
  const name = useReaderName();
  const [open, setOpen] = useState(false);

  return (
    <header className="glass pt-safe sticky top-0 z-40 border-b border-border">
      <OwnerStrip />
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 sm:h-20 sm:px-6 lg:flex lg:justify-between">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-primary data-[status=active]:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div className="relative">
            {!name && (
              <span
                aria-hidden
                className="animate-point-x absolute -left-5 top-1/2 -mt-2 text-primary"
              >
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
            <Button variant={name ? "glass" : "gold"} size="sm" onClick={openLogin}>
              <UserRound />
              <span className="max-w-20 truncate sm:max-w-28">{name ?? "Login"}</span>
            </Button>
          </div>
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/auth">Admin</Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      <nav
        className={cn(
          "max-h-[calc(100dvh-7rem)] overflow-y-auto border-t border-border px-4 pb-4 lg:hidden",
          open ? "block" : "hidden",
        )}
        aria-label="Mobile"
      >
        <div className="grid grid-cols-2 gap-x-2">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              activeOptions={{ exact: item.to === "/" }}
              className="block rounded-md px-3 py-3 text-base text-muted-foreground data-[status=active]:text-primary"
            >
              {item.label}
            </Link>
          ))}
          <Link
            to="/auth"
            onClick={() => setOpen(false)}
            className="block rounded-md px-3 py-3 text-base text-muted-foreground"
          >
            Admin
          </Link>
        </div>
        <InstallAppButton variant="gold" size="lg" className="mt-3 w-full" />
      </nav>
    </header>
  );
}
