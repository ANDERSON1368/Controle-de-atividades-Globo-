/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { X, FileSpreadsheet, Printer, Sliders, BarChart3, HelpCircle, CheckCircle, TrendingUp } from "lucide-react";
import { Task, Employee } from "../types";
import { computeTotalMinutes, formatMinutesToHM } from "../data";

interface ReportModalProps {
  tasks: Task[];
  employees: Employee[];
  selectedEmployeeId: string;
  onClose: () => void;
}

export default function ReportModal({
  tasks,
  employees,
  selectedEmployeeId,
  onClose
}: ReportModalProps) {
  const [employeeFilter, setEmployeeFilter] = useState<string>(selectedEmployeeId);
  const [selectedMonth, setSelectedMonth] = useState<number>(5); // June is 5 (0-indexed) or 6 (1-indexed input is easier)
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  // Lists of months
  const months = [
    { value: 1, label: "Janeiro" },
    { value: 2, label: "Fevereiro" },
    { value: 3, label: "Março" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Maio" },
    { value: 6, label: "Junho" },
    { value: 7, label: "Julho" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Setembro" },
    { value: 10, label: "Outubro" },
    { value: 11, label: "Novembro" },
    { value: 12, label: "Dezembro" }
  ];

  // Filtering logs
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Filter employee
      const matchEmp = employeeFilter === "all" || task.employeeId === employeeFilter;
      
      // Filter Date
      if (!task.date) return false;
      const [year, month] = task.date.split("-").map(Number);
      const matchMonth = month === selectedMonth;
      const matchYear = year === selectedYear;

      return matchEmp && matchMonth && matchYear;
    });
  }, [tasks, employeeFilter, selectedMonth, selectedYear]);

  // Current Employee details
  const activeEmployee = useMemo(() => {
    if (employeeFilter === "all") return { name: "Todos os Colaboradores", role: "Vários" };
    return employees.find((e) => e.id === employeeFilter) || { name: "Desconhecido", role: "" };
  }, [employees, employeeFilter]);

  // Computed metrics
  const stats = useMemo(() => {
    let totalMin = 0;
    const activityGroup: Record<string, number> = {};
    let totalCompleted = 0;
    let totalActive = 0;

    filteredTasks.forEach((task) => {
      if (task.endTime) {
        totalCompleted++;
        const minutes = computeTotalMinutes(task.startTime, task.endTime);
        totalMin += minutes;
        
        // Accumulate by simplified activity name
        const key = task.activity.trim().toLowerCase();
        // Capitalize for display key
        const displayKey = task.activity.trim();
        activityGroup[displayKey] = (activityGroup[displayKey] || 0) + minutes;
      } else {
        totalActive++;
      }
    });

    // Sort activities by total time spent
    const sortedActivities = Object.entries(activityGroup)
      .map(([name, min]) => ({
        name,
        minutes: min,
        formatted: formatMinutesToHM(min),
        percentage: totalMin > 0 ? Math.round((min / totalMin) * 100) : 0
      }))
      .sort((a, b) => b.minutes - a.minutes);

    return {
      totalMinutes: totalMin,
      totalHoursStr: formatMinutesToHM(totalMin),
      totalCompleted,
      totalActive,
      activities: sortedActivities
    };
  }, [filteredTasks]);

  // Function to download Excel CSV
  const handleExportExcel = () => {
    if (filteredTasks.length === 0) {
      alert("Não há dados para exportar com estes filtros.");
      return;
    }

    // Build standard Brazilian Excel CSV separator: Semicolon, with UTF-8 BOM
    let csvContent = "\uFEFF"; // Byte Order Mark for UTF-8 (forces Excel to read special characters and accents perfectly)
    
    // Header
    csvContent += "Colaborador;Atividade;Data;Hora Inicial;Hora Final;Total de Horas;Observação\n";

    filteredTasks.forEach((t) => {
      const empName = employees.find((e) => e.id === t.employeeId)?.name || "Desconhecido";
      // Format date from YYYY-MM-DD to DD/MM/YYYY
      const formattedDate = t.date ? t.date.split("-").reverse().join("/") : "";
      const endTimeStr = t.endTime || "Em andamento";
      const durationStr = t.endTime ? t.totalHours : "--:--";
      const notesStr = (t.notes || "").replace(/;/g, ",").replace(/\n/g, " ");

      csvContent += `"${empName}";"${t.activity}";"${formattedDate}";"${t.startTime}";"${endTimeStr}";"${durationStr}";"${notesStr}"\r\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    const formattedEmpName = activeEmployee.name.replace(/\s+/g, "_");
    const monthLabel = months.find((m) => m.value === selectedMonth)?.label || String(selectedMonth);

    link.setAttribute("href", url);
    link.setAttribute("download", `Relatorio_Produtividade_${formattedEmpName}_${monthLabel}_${selectedYear}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Printing trigger
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all animate-fadeIn" id="report-modal-backdrop">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col h-[92vh] max-h-[850px]">
        {/* Header - Screen visible */}
        <div className="px-6 py-4 bg-teal-800 text-white flex items-center justify-between border-b border-teal-700 shrink-0 print:hidden">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Relatório de Produtividade Mensal
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-teal-700/50 rounded-full transition-colors cursor-pointer"
            id="close-report-btn"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filters bar - Screen visible */}
        <div className="p-4 bg-teal-50 border-b border-teal-100 flex flex-wrap gap-3 items-end shrink-0 print:hidden" id="report-filters">
          <div className="flex-1 min-w-[150px]">
            <label className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block mb-1">Colaborador</label>
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="w-full bg-white border border-teal-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none transition-all"
            >
              <option value="all">Todos os Colaboradores</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>

          <div className="w-[120px]">
            <label className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block mb-1">Mês</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full bg-white border border-teal-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none transition-all"
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>

          <div className="w-[90px]">
            <label className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block mb-1">Ano</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full bg-white border border-teal-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none transition-all"
            >
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
              <option value={2025}>2025</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleExportExcel}
              className="bg-amber-600 hover:bg-amber-700 text-white font-medium px-3.5 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shadow-amber-500/10 active:scale-95"
              id="export-excel-btn"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Excel</span>
            </button>

            <button
              onClick={handlePrint}
              className="bg-teal-600 hover:bg-teal-700 text-white font-medium px-3.5 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shadow-teal-500/10 active:scale-95"
              id="export-pdf-btn"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>

        {/* Main report body - Prints beautifully and scrolls in screen */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-6 print:overflow-visible print:p-0 print:bg-white" id="printable-report">
          
          {/* Print only header */}
          <div className="hidden print:block border-b-2 border-teal-900 pb-4 mb-4">
            <h1 className="text-2xl font-extrabold text-teal-900 text-center">Planilha de Acompanhamento de Tarefas</h1>
            <h2 className="text-sm font-bold text-center text-gray-500 mt-1 uppercase tracking-wider">
              Relatório Mensal de Produtividade — {months.find(m => m.value === selectedMonth)?.label} / {selectedYear}
            </h2>
          </div>

          {/* Quick Info Block */}
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-neutral-100 pb-4 shrink-0 gap-2">
            <div>
              <span className="text-xs font-bold text-teal-700 uppercase tracking-widest block font-mono">Filtro Ativo</span>
              <h3 className="text-xl font-extrabold text-neutral-800">{activeEmployee.name}</h3>
              <p className="text-xs text-neutral-500 font-medium">Cargo/Setor: {activeEmployee.role || "Não definido"}</p>
            </div>
            
            <div className="text-left md:text-right bg-teal-50/50 p-2.5 rounded-xl border border-teal-100/50 md:bg-transparent md:p-0 md:border-none min-w-[150px]">
              <span className="text-xs font-bold text-gray-400 block font-mono uppercase">Período</span>
              <span className="text-sm font-bold text-teal-800">
                {months.find(m => m.value === selectedMonth)?.label} de {selectedYear}
              </span>
            </div>
          </div>

          {/* Core Analytics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 shrink-0">
            <div className="bg-gradient-to-br from-teal-500 to-teal-700 p-4 rounded-2xl text-white shadow-md flex flex-col justify-between print:bg-none print:border print:border-neutral-200 print:text-black">
              <span className="text-[10px] uppercase font-bold tracking-widest text-teal-100 font-mono print:text-neutral-500">Horas Totais Produzidas</span>
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono my-2">{stats.totalHoursStr}h</span>
              <span className="text-[10px] text-teal-100/95 print:text-neutral-400">Tempo líquido faturado</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Tarefas Finalizadas</span>
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800 font-mono my-2">{stats.totalCompleted}</span>
              <span className="text-[10px] text-teal-700 font-medium flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                No período selecionado
              </span>
            </div>

            <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-2xl flex flex-col justify-between col-span-2 lg:col-span-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 font-mono">Tarefas Ativas Atualmente</span>
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-amber-600 font-mono my-2">{stats.totalActive}</span>
              <span className="text-[10px] text-neutral-500">Sem fechar horário final</span>
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="py-12 text-center text-neutral-400 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-neutral-200 rounded-2xl">
              <span className="text-4xl text-neutral-300">📊</span>
              <p className="font-medium text-lg text-neutral-600">Nenhum registro encontrado</p>
              <p className="text-sm max-w-sm">Tente reajustar os filtros do colaborador, mês ou ano acima.</p>
            </div>
          ) : (
            <>
              {/* Productivity Breakdown List */}
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-bold text-teal-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-teal-100 pb-1.5 shrink-0 print:border-neutral-300">
                  <TrendingUp className="w-4 h-4 text-teal-600" />
                  Distribuição de Tempo por Atividade
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[180px] overflow-y-auto print:max-h-none print:grid-cols-1 print:gap-2">
                  {stats.activities.map((act, index) => (
                    <div key={index} className="bg-neutral-50 p-3 rounded-xl border border-neutral-200/60 flex flex-col gap-1.5 justify-between">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-neutral-800 truncate block max-w-[70%]">{act.name}</span>
                        <div className="text-right flex items-center gap-1.5">
                          <span className="text-xs font-mono font-bold text-teal-800">{act.formatted}</span>
                          <span className="text-[10px] font-mono font-semibold bg-teal-50 px-1.5 py-0.5 rounded text-teal-700">
                            {act.percentage}%
                          </span>
                        </div>
                      </div>
                      
                      {/* Percent progress indicator */}
                      <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-teal-600 h-1.5 rounded-full"
                          style={{ width: `${act.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed logs table matches user image spreadsheets precisely */}
              <div className="flex flex-col gap-3 print:mt-4">
                <h4 className="text-xs font-bold text-teal-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-teal-100 pb-1.5 shrink-0 print:border-neutral-300">
                  <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                  Visualização da Planilha Relacionada
                </h4>

                <div className="overflow-x-auto border border-neutral-200 rounded-xl bg-white shadow-xs print:border-neutral-300">
                  <table className="w-full min-w-[700px] text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-teal-800 text-white font-semibold print:bg-neutral-100 print:text-black print:border-b print:border-neutral-400">
                        {employeeFilter === "all" && <th className="p-3">Colaborador</th>}
                        <th className="p-3">Atividade</th>
                        <th className="p-3">Data</th>
                        <th className="p-3">Hora Inicial</th>
                        <th className="p-3">Hora Final</th>
                        <th className="p-3 text-right">Total de Horas</th>
                        <th className="p-3 max-w-[200px] truncate">Observação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200/60 print:divide-neutral-300">
                      {filteredTasks.map((t) => {
                        const empName = employees.find((e) => e.id === t.employeeId)?.name || "Desconhecido";
                        const formattedDate = t.date ? t.date.split("-").reverse().join("/") : "";
                        return (
                          <tr key={t.id} className="hover:bg-neutral-50/50 transition-colors print:hover:bg-transparent">
                            {employeeFilter === "all" && (
                              <td className="p-2.5 font-semibold text-neutral-800">{empName}</td>
                            )}
                            <td className="p-2.5 font-medium text-neutral-700">{t.activity}</td>
                            <td className="p-2.5 text-neutral-600">{formattedDate}</td>
                            <td className="p-2.5 font-mono text-neutral-500">{t.startTime}</td>
                            <td className="p-2.5 font-mono text-neutral-500">{t.endTime || <span className="text-amber-600 italic">Ativa...</span>}</td>
                            <td className="p-2.5 font-mono text-right font-bold text-teal-800">
                              {t.endTime ? t.totalHours : "--:--"}
                            </td>
                            <td className="p-2.5 max-w-[200px] truncate text-neutral-500 italic" title={t.notes}>
                              {t.notes || <span className="text-neutral-300 text-[10px]">—</span>}
                            </td>
                          </tr>
                        );
                      })}
                      {/* Subtotal row */}
                      <tr className="bg-teal-50/40 font-bold border-t border-neutral-300 print:bg-none">
                        <td colSpan={employeeFilter === "all" ? 5 : 4} className="p-3 text-right text-teal-900">
                          Total Geral de Horas:
                        </td>
                        <td className="p-3 font-mono text-right text-lg text-teal-800 font-extrabold">
                          {stats.totalHoursStr}
                        </td>
                        <td className="p-3 text-xs text-neutral-400 font-normal">
                          {stats.totalCompleted} tarefas finalizadas
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Footer containing signature for physical printing */}
          <div className="hidden print:flex items-center justify-between mt-12 border-t border-dashed border-neutral-300 pt-6 text-neutral-600 text-[10px]">
            <div>
              <p>Gerado em: {new Date().toLocaleDateString("pt-BR")}</p>
              <p>Sistema: Planilha de Acompanhamento de Tarefas Digital</p>
            </div>
            <div className="text-right border-t border-neutral-400 pt-1 min-w-[200px]">
              <p className="font-bold">{activeEmployee.name}</p>
              <p>Assinatura do Colaborador</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
