import React, { useMemo, useState } from "react";
import { X, Filter, Search, Check, Square } from "lucide-react";
import { FilterState, TrainerDataset } from "../types";

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  dataset: TrainerDataset;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

const SectionTitle = ({ title }: { title: string }) => (
  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">{title}</h3>
);

const toProperCase = (s: string) =>
  s.replace(/\b\w/g, (c) => c.toUpperCase());

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  onClose,
  dataset,
  filters,
  onFiltersChange,
}) => {
  const [rootSearch, setRootSearch] = useState("");

  const toggleItem = (key: keyof FilterState, value: string) => {
    const current = new Set(filters[key]);
    if (current.has(value)) {
      current.delete(value);
    } else {
      current.add(value);
    }

    onFiltersChange({
      ...filters,
      [key]: Array.from(current),
    });
  };

  const setAll = (key: keyof FilterState, values: string[]) => {
    onFiltersChange({
      ...filters,
      [key]: values,
    });
  };

  const rootGroups = useMemo(() => {
    const lowered = rootSearch.trim().toLowerCase();
    const byName = new Map<string, string[]>();

    for (const root of dataset.roots) {
      const kindName = root.rootKindName || "Uncategorized";
      const searchable = `${root.root} ${root.translation || ""} ${kindName}`.toLowerCase();
      if (lowered && !searchable.includes(lowered)) {
        continue;
      }

      if (!byName.has(kindName)) {
        byName.set(kindName, []);
      }

      byName.get(kindName)!.push(root.root);
    }

    return Array.from(byName.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [dataset.roots, rootSearch]);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed inset-y-0 right-0 w-full sm:w-[30rem] bg-white dark:bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-gray-200 dark:border-gray-800 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
              <Filter className="w-5 h-5" />
              <h2 className="font-bold text-lg">Filters</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500 dark:text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-8">
            <section>
              <div className="flex justify-between items-center mb-3">
                <SectionTitle title="Stems" />
                <div className="flex gap-2">
                  <button
                    className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded"
                    onClick={() => setAll("stems", dataset.stems.map((stem) => stem.name))}
                  >
                    All
                  </button>
                  <button
                    className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded"
                    onClick={() => setAll("stems", [])}
                  >
                    None
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {dataset.stems.map((stem) => {
                  const checked = filters.stems.includes(stem.name);
                  return (
                    <button
                      key={stem.name}
                      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                        checked
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600"
                      }`}
                      onClick={() => toggleItem("stems", stem.name)}
                    >
                      <span>{stem.name}</span>
                      {checked ? <Check className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <div className="flex justify-between items-center mb-3">
                <SectionTitle title="Tenses" />
                <div className="flex gap-2">
                  <button
                    className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded"
                    onClick={() => setAll("tenses", dataset.tenses.map((tense) => tense.name))}
                  >
                    All
                  </button>
                  <button
                    className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded"
                    onClick={() => setAll("tenses", [])}
                  >
                    None
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {dataset.tenses.map((tense) => {
                  const checked = filters.tenses.includes(tense.name);
                  return (
                    <button
                      key={tense.name}
                      className={`w-full flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                        checked
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600"
                      }`}
                      onClick={() => toggleItem("tenses", tense.name)}
                    >
                      <span>{toProperCase(tense.name)}</span>
                      {checked ? <Check className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <div className="flex justify-between items-center mb-3">
                <SectionTitle title="Roots" />
                <div className="flex gap-2">
                  <button
                    className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded"
                    onClick={() => setAll("roots", dataset.roots.map((root) => root.root))}
                  >
                    All
                  </button>
                  <button
                    className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded"
                    onClick={() => setAll("roots", [])}
                  >
                    None
                  </button>
                </div>
              </div>

              <div className="relative mb-4">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  value={rootSearch}
                  onChange={(event) => setRootSearch(event.target.value)}
                  placeholder="Search roots or root kind"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 pl-10 pr-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                {rootGroups.length === 0 ? (
                  <p className="text-sm text-gray-500">No roots match your search.</p>
                ) : (
                  rootGroups.map(([kindName, roots]) => (
                    <div key={kindName} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      <h4 className="font-semibold text-sm mb-2">{kindName}</h4>
                      <div className="flex flex-wrap gap-2">
                        {roots.map((root) => {
                          const checked = filters.roots.includes(root);
                          return (
                            <button
                              key={`${kindName}-${root}`}
                              className={`hebrew-text text-lg rounded-lg border px-3 py-1 ${
                                checked
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600"
                              }`}
                              onClick={() => toggleItem("roots", root)}
                            >
                              {root}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-slate-900/50 text-center">
            <p className="text-xs text-gray-500">
              Selected: {filters.stems.length} stems, {filters.tenses.length} tenses, {filters.roots.length} roots
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
