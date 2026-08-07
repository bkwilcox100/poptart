// PROTOTYPE — throwaway.
// Variant A: one continuous page, no tabs. A thin sticky rail on the right
// tracks where you are and jumps you around. Bet: settings are few enough that
// navigation is a scroll, and the sidebar was costing more than it bought.
import React, { useEffect, useMemo, useRef, useState } from "react";

import { SettingsGroup } from "../../ui/SettingsGroup";
import { useSettings } from "../../../hooks/useSettings";
import { visibleCatalog } from "./catalog";

export const VARIANT_A_NAME = "One page + rail";

export const VariantA: React.FC = () => {
  const { settings } = useSettings();
  const CATALOG = useMemo(() => visibleCatalog(settings), [settings]);
  const [active, setActive] = useState(CATALOG[0].id);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          )[0];
        if (visible) setActive(visible.target.id.replace("proto-", ""));
      },
      { root, rootMargin: "0px 0px -70% 0px", threshold: 0 },
    );
    CATALOG.forEach((group) => {
      const el = document.getElementById(`proto-${group.id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [CATALOG]);

  const jump = (id: string) => {
    document
      .getElementById(`proto-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-4xl gap-10 px-8 pb-32 pt-10">
        <div className="min-w-0 flex-1 space-y-14">
          {CATALOG.map((group) => (
            <section key={group.id} id={`proto-${group.id}`}>
              <h2 className="text-2xl font-semibold tracking-tight">
                {group.title}
              </h2>
              <p className="mt-1 mb-4 text-sm text-mid-gray">{group.blurb}</p>
              <div className="space-y-4">
                {group.items.some((item) => item.kind !== "block") && (
                  <SettingsGroup>
                    {group.items
                      .filter((item) => item.kind !== "block")
                      .map((item) => (
                        <React.Fragment key={item.id}>
                          {item.render()}
                        </React.Fragment>
                      ))}
                  </SettingsGroup>
                )}
                {group.items
                  .filter((item) => item.kind === "block")
                  .map((item) => (
                    <React.Fragment key={item.id}>
                      {item.render()}
                    </React.Fragment>
                  ))}
              </div>
            </section>
          ))}
        </div>

        <nav className="sticky top-10 hidden h-fit w-40 shrink-0 lg:block">
          <ul className="space-y-1 border-s border-mid-gray/20 ps-4">
            {CATALOG.map((group) => (
              <li key={group.id}>
                <button
                  onClick={() => jump(group.id)}
                  className={`w-full text-start text-sm transition-colors ${
                    active === group.id
                      ? "font-medium text-text"
                      : "text-mid-gray hover:text-text"
                  }`}
                >
                  {group.title}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
};
