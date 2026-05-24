import { useState } from "react";
import { ChevronDown, FolderOpen, Download, FileText } from "lucide-react";

const reports = [
  { id: "pdf-mes", label: "PDF mensual", type: "PDF", color: "bg-rose-500" },
  { id: "xls-mes", label: "Excel mensual", type: "Excel", color: "bg-emerald-500" },
  { id: "pdf-tri", label: "PDF trimestral", type: "PDF", color: "bg-rose-500" },
  { id: "xls-tri", label: "Excel trimestral", type: "Excel", color: "bg-emerald-500" },
  { id: "pdf-anu", label: "PDF anual", type: "PDF", color: "bg-rose-500" },
  { id: "xls-anu", label: "Excel anual", type: "Excel", color: "bg-emerald-500" },
];

export default function ReportsDocumentation() {
  const [open, setOpen] = useState(true);

  const handleDownload = (id) => {
    // Hook para conectar al backend
    console.log("Descargar:", id);
  };

  return (
    <section className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition"
      >
        <div className="flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Reportes y Documentación
          </h3>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
              {reports.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleDownload(r.id)}
                  className="group flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition"
                >
                  <div
                    className={`flex items-center justify-center w-10 h-10 ${r.color} rounded-lg shrink-0`}
                  >
                    <span className="text-[10px] font-bold text-white">
                      {r.type === "PDF" ? "PDF" : "Exel"}
                    </span>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {r.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Descargar
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}