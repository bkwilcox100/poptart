import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";

import PoptartLogo from "../icons/PoptartLogo";
import AccessibilityPermissions from "../AccessibilityPermissions";
import SecureInputWarning from "../SecureInputWarning";
import { SettingsGroup } from "../ui/SettingsGroup";
import {
  matchesQuery,
  useSettingsCatalog,
  type ResolvedGroup,
} from "./catalog";

type Item = ResolvedGroup["items"][number];

const renderItem = (item: Item) =>
  item.kind === "block" ? (
    item.render()
  ) : (
    <SettingsGroup>{item.render()}</SettingsGroup>
  );

/**
 * Settings shell: search across every setting, with the group list as the
 * browsing fallback. Searching replaces the group list with results labelled
 * by where each setting lives, so a match is findable without knowing which
 * group owns it.
 */
export const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const groups = useSettingsCatalog();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(groups[0]?.id ?? "");

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

  const current = groups.find((group) => group.id === selectedId) ?? groups[0];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
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
            placeholder={t("settings.search.placeholder")}
            aria-label={t("settings.search.placeholder")}
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
                onClick={() => setSelectedId(group.id)}
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

        <div className="min-w-0 flex-1 overflow-y-auto px-6 pb-8 pt-5">
          <div className="mx-auto max-w-2xl space-y-4">
            <AccessibilityPermissions />
            <SecureInputWarning />

            {searching ? (
              results.length === 0 ? (
                <p className="px-1 pt-4 text-sm text-mid-gray">
                  {t("settings.search.noResults")}
                </p>
              ) : (
                results.map(({ group, item }) => (
                  <div key={`${group.id}-${item.id}`}>
                    <p className="px-4 pb-1 text-xs text-mid-gray">
                      {group.title}
                    </p>
                    {renderItem(item)}
                  </div>
                ))
              )
            ) : (
              current?.items.map((item) => (
                <React.Fragment key={item.id}>
                  {renderItem(item)}
                </React.Fragment>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
