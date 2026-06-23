"use client";

export function TopBar() {
  return (
    <header className="flex shrink-0 items-center px-6 pt-[calc(env(safe-area-inset-top)_+_18px)]">
      <p className="text-[15px] font-medium tracking-tight text-bone">
        voiceflow<span className="text-ember">.</span>
      </p>
    </header>
  );
}
