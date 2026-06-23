"use client";

export function AppFooter() {
  return (
    <footer className="mt-8 border-t border-bone/10 pb-4 pt-5 text-center">
      <p className="text-[15px] font-medium tracking-tight text-bone/75">
        voiceflow<span className="text-ember">.</span>
      </p>
      <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.24em] text-bone/35">
        mj
      </p>
      <p className="mx-auto mt-4 max-w-[300px] text-xs leading-relaxed text-bone/38">
        Notion today. Obsidian Brain next: send captured thoughts into a vault,
        arrange them into linked notes, surface tasks, and keep ideas findable.
      </p>
    </footer>
  );
}
