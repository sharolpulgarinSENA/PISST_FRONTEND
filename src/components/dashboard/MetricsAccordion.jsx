import { useState } from "react";
import { ChevronDown, Info } from "lucide-react";

export default function MetricsAccordion({
  title,
  metrics,
  withProgress = false,
  defaultOpen = true,
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          <Info className="w-4 h-4 text-gray-400" />
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`grid transition-all duration-300 ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5">
            <div
              className={`grid gap-5 ${
                metrics.length === 3
                  ? "grid-cols-1 sm:grid-cols-3"
                  : metrics.length === 5
                  ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
              }`}
            >
              {metrics.map((m) => (
                <div key={m.id}>
                  <div className="flex items-start gap-2 mb-2">
                    <m.Icon className={`w-4 h-4 mt-0.5 ${m.iconColor}`} />
                    <span className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                      {m.label}
                    </span>
                  </div>

                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                    {m.value}
                  </div>

                  <div
                    className={`text-xs mb-2 ${
                      m.deltaPositive
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {m.delta}
                  </div>

                  {withProgress && (
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${m.barColor} rounded-full transition-all duration-500`}
                        style={{ width: `${m.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}