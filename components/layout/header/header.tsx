import { GlobalNav } from "./global-nav";
import { ChurchRibbon } from "./church-ribbon";

// Two-part header: (a) the global navigation row, (b) the church ribbon strip.
// Server component shell; the interactive nav is a client island.
export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface-page/95 backdrop-blur supports-[backdrop-filter]:bg-surface-page/80">
      <GlobalNav />
      <ChurchRibbon />
    </header>
  );
}
