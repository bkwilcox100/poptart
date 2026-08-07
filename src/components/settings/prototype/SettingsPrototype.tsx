// PROTOTYPE — throwaway. Delete this directory once a variant wins.
//
// Mounted only in dev builds (see App.tsx). Renders the shipped settings shell
// or one of three variants, chosen by `?variant=` and cycled with the floating
// bar / arrow keys. "current" is included on purpose: a variant only reads as
// better or worse next to the thing it would replace.
//
// Note: variants render the *real* setting components, so toggling something
// in here changes your actual settings. That's deliberate — a settings page
// full of stubbed controls hides how the real ones behave at density.
import React, { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { VariantA, VARIANT_A_NAME } from "./VariantA";
import { VariantB, VARIANT_B_NAME } from "./VariantB";
import { VariantC, VARIANT_C_NAME } from "./VariantC";

type VariantKey = "current" | "A" | "B" | "C";

const VARIANTS: { key: VariantKey; name: string }[] = [
  { key: "current", name: "Shipped UI" },
  { key: "A", name: VARIANT_A_NAME },
  { key: "B", name: VARIANT_B_NAME },
  { key: "C", name: VARIANT_C_NAME },
];

const readVariant = (): VariantKey => {
  const param = new URLSearchParams(window.location.search).get("variant");
  return VARIANTS.some((variant) => variant.key === param)
    ? (param as VariantKey)
    : "current";
};

export const SettingsPrototype: React.FC<{ current: React.ReactNode }> = ({
  current,
}) => {
  const [variant, setVariant] = useState<VariantKey>(readVariant);

  const select = useCallback((key: VariantKey) => {
    setVariant(key);
    const url = new URL(window.location.href);
    url.searchParams.set("variant", key);
    window.history.replaceState({}, "", url);
  }, []);

  const cycle = useCallback(
    (step: number) => {
      const index = VARIANTS.findIndex((entry) => entry.key === variant);
      const next = (index + step + VARIANTS.length) % VARIANTS.length;
      select(VARIANTS[next].key);
    },
    [variant, select],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }
      if (event.key === "ArrowLeft") cycle(-1);
      if (event.key === "ArrowRight") cycle(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cycle]);

  const active = VARIANTS.find((entry) => entry.key === variant) ?? VARIANTS[0];

  return (
    <div className="relative h-screen overflow-hidden">
      {variant === "current" && current}
      {variant === "A" && <VariantA />}
      {variant === "B" && <VariantB />}
      {variant === "C" && <VariantC />}

      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center">
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/10 bg-black/85 px-1.5 py-1 text-white shadow-xl backdrop-blur">
          <button
            onClick={() => cycle(-1)}
            className="rounded-full p-1.5 hover:bg-white/15"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="min-w-44 px-1 text-center text-xs font-medium tabular-nums">
            {`${active.key} — ${active.name}`}
          </span>
          <button
            onClick={() => cycle(1)}
            className="rounded-full p-1.5 hover:bg-white/15"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
