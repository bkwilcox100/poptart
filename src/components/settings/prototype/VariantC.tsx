// PROTOTYPE — throwaway.
// Variant C: the handful of settings people actually touch sit on the surface;
// everything else is folded into collapsed drawers. Bet: the page feels small
// because it *is* small, and depth is opt-in rather than paid for up front.
// Native <details> so there's no disclosure state to manage.
import React, { useMemo } from "react";
import { ChevronRight } from "lucide-react";

import { SettingsGroup } from "../../ui/SettingsGroup";
import { useSettings } from "../../../hooks/useSettings";
import { visibleCatalog, type CatalogItem } from "./catalog";

export const VARIANT_C_NAME = "Essentials + drawers";

const HEADING = "Essentials";
const REST = "Everything else";

const renderItems = (items: CatalogItem[]) => (
  <div className="space-y-4">
    {items.some((item) => item.kind !== "block") && (
      <SettingsGroup>
        {items
          .filter((item) => item.kind !== "block")
          .map((item) => (
            <React.Fragment key={item.id}>{item.render()}</React.Fragment>
          ))}
      </SettingsGroup>
    )}
    {items
      .filter((item) => item.kind === "block")
      .map((item) => (
        <React.Fragment key={item.id}>{item.render()}</React.Fragment>
      ))}
  </div>
);

export const VariantC: React.FC = () => {
  const { settings } = useSettings();
  const groups = useMemo(() => visibleCatalog(settings), [settings]);
  const essentials = groups.flatMap((group) =>
    group.items.filter((item) => item.essential),
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-xl px-6 pb-32 pt-10">
        <h2 className="mb-3 px-1 text-xs font-medium uppercase tracking-wide text-mid-gray">
          {HEADING}
        </h2>
        {renderItems(essentials)}

        <h2 className="mb-2 mt-10 px-1 text-xs font-medium uppercase tracking-wide text-mid-gray">
          {REST}
        </h2>
        <div className="divide-y divide-mid-gray/20 border-y border-mid-gray/20">
          {groups.map((group) => {
            const rest = group.items.filter((item) => !item.essential);
            if (rest.length === 0) return null;
            return (
              <details key={group.id} className="group">
                <summary className="flex cursor-pointer list-none items-center gap-2 py-3 ps-1 pe-2 hover:bg-mid-gray/5">
                  <ChevronRight
                    size={15}
                    className="shrink-0 text-mid-gray transition-transform group-open:rotate-90"
                  />
                  <span className="text-sm font-medium">{group.title}</span>
                  <span className="ms-auto text-xs text-mid-gray">
                    {rest.length}
                  </span>
                </summary>
                <div className="pb-4 ps-6 pe-1">
                  <p className="mb-2 text-xs text-mid-gray">{group.blurb}</p>
                  {renderItems(rest)}
                </div>
              </details>
            );
          })}
        </div>
      </div>
    </div>
  );
};
