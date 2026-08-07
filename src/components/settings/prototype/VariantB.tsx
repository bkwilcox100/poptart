// PROTOTYPE — throwaway.
// Variant B: search is the primary affordance. Type and every matching setting
// surfaces across all groups, labelled with where it lives; the group list is a
// fallback for browsing. Bet: nobody navigates settings, they hunt for one.
//
// Carries the full shell — logo, accessibility/secure-input warnings, and the
// footer's model indicator + update/version readout — so it's judged at parity
// with the shipped page rather than as a bare content pane.
import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";

import PoptartLogo from "../../icons/PoptartLogo";
import Footer from "../../footer/Footer";
import AccessibilityPermissions from "../../AccessibilityPermissions";
import SecureInputWarning from "../../SecureInputWarning";
import { WhatsNewGate } from "../../whats-new";
import { SettingsGroup } from "../../ui/SettingsGroup";
import { useSettings } from "../../../hooks/useSettings";
import { matchesQuery, visibleCatalog, type CatalogItem } from "./catalog";

export const VARIANT_B_NAME = "Search first";

const renderItem = (item: CatalogItem) =>
  item.kind === "block" ? (
    item.render()
  ) : (
    <SettingsGroup>{item.render()}</SettingsGroup>
  );

export const VariantB: React.FC = () => {
  const { settings } = useSettings();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("dictation");

  const groups = useMemo(() => visibleCatalog(settings), [settings]);
  const searching = query.trim().length > 0;

  const results = useMemo(
    () =>
      groups.flatMap((group) =>
        group.items
          .filter((item) => matchesQuery(item, query))
          .map((item) => ({ group, item })),
      ),
    [groups, query],
  );

  const current = groups.find((group) => group.id === selected) ?? groups[0];

  return (
    <div className="flex h-screen flex-col select-none cursor-default">
      <WhatsNewGate />

      <header className="flex items-center gap-4 border-b border-mid-gray/20 px-4 py-2.5">
        <PoptartLogo width={52} className="shrink-0" />
        <div className="relative min-w-0 flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-mid-gray"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search settings"
            className="w-full rounded-full border border-mid-gray/25 bg-background py-1.5 ps-9 pe-3 text-sm outline-none focus:border-logo-primary"
          />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {!searching && (
          <nav className="w-44 shrink-0 overflow-y-auto border-e border-mid-gray/20 p-3">
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => setSelected(group.id)}
                className={`mb-0.5 w-full rounded-md px-3 py-1.5 text-start text-sm transition-colors ${
                  current?.id === group.id
                    ? "bg-mid-gray/15 font-medium"
                    : "text-mid-gray hover:bg-mid-gray/10 hover:text-text"
                }`}
              >
                {group.title}
              </button>
            ))}
          </nav>
        )}

        <div className="min-w-0 flex-1 overflow-y-auto px-6 pb-24 pt-5">
          <div className="mx-auto max-w-2xl space-y-4">
            <AccessibilityPermissions />
            <SecureInputWarning />

            {searching ? (
              <div className="space-y-3">
                <p className="px-1 text-xs uppercase tracking-wide text-mid-gray">
                  {`${results.length} result${results.length === 1 ? "" : "s"}`}
                </p>
                {results.map(({ group, item }) => (
                  <div key={`${group.id}-${item.id}`}>
                    <p className="px-4 pb-1 text-xs text-mid-gray">
                      {group.title}
                    </p>
                    {renderItem(item)}
                  </div>
                ))}
              </div>
            ) : (
              // No group heading — the nav already says where you are, and the
              // blurb was a second label for the same thing.
              current?.items.map((item) => (
                <React.Fragment key={item.id}>
                  {renderItem(item)}
                </React.Fragment>
              ))
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};
