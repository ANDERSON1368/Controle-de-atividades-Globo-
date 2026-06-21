/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { 
  Brain, 
  AlertTriangle, 
  TrendingUp, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  AlertOctagon, 
  Filter, 
  ChevronRight, 
  Sliders, 
  Compass, 
  FileText,
  Activity,
  Zap,
  HelpCircle,
  Calendar
} from "lucide-react";
import { Task, Employee } from "../types";

interface AIBottleneckAnalyzerProps {
  tasks: Task[];
  employees: Employee[];
}

interface Bottleneck {
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
}

interface UnnecessaryTime {
  activity: string;
  wasteType: string;
  estimatedWastedMins: number;
  explanation: string;
}

interface Recommendation {
  methodology: string;
  action: string;
  expectedImpact: string;
}

interface AnalysisResult {
  summary: string;
  vaPercentage: number;
  nvaPercentage: number;
  bottlenecks: Bottleneck[];
  unnecessaryTimes: UnnecessaryTime[];
  recommendations: Recommendation[];
  isDemoMode?: boolean;
}

export default function AIBottleneckAnalyzer({ tasks, employees }: AIBottleneckAnalyzerProps) {
  const [selectedEmpId, setSelectedEmpId] = useState<string>(employees[0]?.id || "");
  const [methodology, setMethodology] = useState<"lean" | "ishikawa">("lean");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for analysis period
  const [period, setPeriod] = useState<"all" | "today" | "7days" | "15days" | "30days" | "custom">("all");
  const [customStartDate, setCustomStartDate] = useState<string>("2026-06-14");
  const [customEndDate, setCustomEndDate] = useState<string>("2026-06-21");

  // Dynamically filtered tasks for analysis based on Employee AND Period
  const filteredAnalysisTasks = useMemo(() => {
    const employeeTasks = tasks.filter((t) => t.employeeId === selectedEmpId);
    
    if (period === "all") return employeeTasks;

    const todayStr = "2026-06-21";
    const todayVal = new Date(todayStr + "T00:00:00");

    return employeeTasks.filter((t) => {
      if (!t.date) return false;

      if (period === "today") {
        return t.date === todayStr;
      }

      const taskVal = new Date(t.date + "T00:00:00");
      const diffTime = todayVal.getTime() - taskVal.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (period === "7days") {
        return diffDays >= 0 && diffDays < 7;
      } else if (period === "15days") {
        return diffDays >= 0 && diffDays < 15;
      } else if (period === "30days") {
        return diffDays >= 0 && diffDays < 30;
      } else if (period === "custom") {
        let match = true;
        if (customStartDate) {
          match = match && t.date >= customStartDate;
        }
        if (customEndDate) {
          match = match && t.date <= customEndDate;
        }
        return match;
      }
      return true;
    });
  }, [tasks, selectedEmpId, period, customStartDate, customEndDate]);

  // Keep cached analysis on localStorage per employee, method & period
  const [result, setResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    if (!selectedEmpId) return;
    const cacheKey = `ai_analysis_${selectedEmpId}_${methodology}_${period}${
      period === "custom" ? `_${customStartDate}_${customEndDate}` : ""
    }`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        setResult(JSON.parse(cached));
        setError(null);
      } catch (e) {
        setResult(null);
      }
    } else {
      setResult(null);
    }
  }, [selectedEmpId, methodology, period, customStartDate, customEndDate]);

  const handleRunAnalysis = async () => {
    if (!selectedEmpId) return;
    
    setLoading(true);
    setError(null);
    
    const empName = employees.find((e) => e.id === selectedEmpId)?.name || "Colaborador";
    
    if (filteredAnalysisTasks.length === 0) {
      let periodLabel = "este período";
      if (period === "today") periodLabel = "o dia de hoje";
      if (period === "7days") periodLabel = "os últimos 7 dias";
      if (period === "15days") periodLabel = "os últimos 15 dias";
      if (period === "30days") periodLabel = "os últimos 30 dias";
      if (period === "custom") periodLabel = `o período personalizado de ${customStartDate} a ${customEndDate}`;
      
      setError(`O colaborador ${empName} não possui atividades registradas para análise de processos em ${periodLabel}.`);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/analyze-productivity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          tasks: filteredAnalysisTasks,
          employeeName: empName,
          methodology
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Houve uma falha na requisição ao servidor.");
      }

      const data: AnalysisResult = await response.json();
      
      // Save cache
      const cacheKey = `ai_analysis_${selectedEmpId}_${methodology}_${period}${
        period === "custom" ? `_${customStartDate}_${customEndDate}` : ""
      }`;
      localStorage.setItem(cacheKey, JSON.stringify(data));
      
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Não foi possível realizar a análise. Certifique-se de preencher a chave GEMINI_API_KEY.");
    } finally {
      setLoading(false);
    }
  };

  const currentEmpName = employees.find((e) => e.id === selectedEmpId)?.name || "Colaborador Selecionado";

  return (
    <div className="bg-white rounded-3xl border border-neutral-200 shadow-xs p-5 sm:p-6 flex flex-col gap-6" id="ai-performance-analyzer">
      
      {/* Element Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-50 rounded-xl border border-teal-100">
            <Brain className="w-5 h-5 text-teal-700" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5 font-sans">
              Diagnóstico de Gargalos & Ociosidade por IA
            </h2>
            <p className="text-xs text-neutral-400">Auditoria inteligente do cronograma de processos e evidências de imagens enviadas.</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-start">
          <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100 uppercase tracking-wider font-mono">
            Analítica de Processos
          </span>
        </div>
      </div>

      {/* Inputs / Config Section */}
      <div className="flex flex-col gap-4 bg-neutral-50 p-4.5 rounded-2xl border border-neutral-100">
        
        {/* Top parameters row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Select Operator */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-mono">Seleção de Lançador</label>
            <div className="relative">
              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="w-full bg-white border border-neutral-200/90 rounded-xl px-3.5 py-2.5 text-xs font-bold text-neutral-700 focus:outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 transition-all cursor-pointer"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({tasks.filter(t => t.employeeId === emp.id).length} registros totais)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Methodology */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-mono">Abordagem Profissional de Análise</label>
            <div className="flex bg-neutral-200/50 p-1 rounded-xl border border-neutral-200" id="methodology-selector">
              <button
                onClick={() => setMethodology("lean")}
                className={`flex-1 py-2 text-[10.5px] font-extrabold uppercase rounded-lg tracking-wide transition-all ${
                  methodology === "lean"
                    ? "bg-white text-teal-900 shadow-xs"
                    : "text-neutral-500 hover:text-neutral-850"
                }`}
              >
                Lean & Muda (Resíduos)
              </button>
              <button
                onClick={() => setMethodology("ishikawa")}
                className={`flex-1 py-2 text-[10.5px] font-extrabold uppercase rounded-lg tracking-wide transition-all ${
                  methodology === "ishikawa"
                    ? "bg-white text-teal-900 shadow-xs"
                    : "text-neutral-500 hover:text-neutral-850"
                }`}
              >
                Causa Raiz & Ishikawa
              </button>
            </div>
          </div>
        </div>

        {/* Date Filter Period Selection Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2 border-t border-dashed border-neutral-200">
          {/* Period Selector Column */}
          <div className={`${period === "custom" ? "md:col-span-4" : "md:col-span-8"} flex flex-col gap-1.5`}>
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-neutral-400" />
              <span>Período de Análise</span>
            </label>
            <div className="relative">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as any)}
                className="w-full bg-white border border-neutral-200/90 rounded-xl px-3.5 py-2.5 text-xs font-bold text-neutral-700 focus:outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 transition-all cursor-pointer"
              >
                <option value="all">Todo o Histórico</option>
                <option value="today">Hoje (Último Dia de Lançamentos)</option>
                <option value="7days">Últimos 7 dias</option>
                <option value="15days">Últimos 15 dias</option>
                <option value="30days">Últimos 30 dias</option>
                <option value="custom">Personalizado...</option>
              </select>
            </div>
          </div>

          {/* Custom Date Inputs Range Panel */}
          {period === "custom" && (
            <div className="md:col-span-5 grid grid-cols-2 gap-2 animate-fadeIn">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-extrabold text-neutral-400 uppercase tracking-wider font-mono">Início</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full bg-white border border-neutral-200/90 rounded-xl px-2.5 py-1.5 text-xs font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 transition-all"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-extrabold text-neutral-400 uppercase tracking-wider font-mono">Fim</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full bg-white border border-neutral-200/90 rounded-xl px-2.5 py-1.5 text-xs font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 transition-all"
                />
              </div>
            </div>
          )}

          {/* Trigger Audit Button */}
          <div className={`${period === "custom" ? "md:col-span-3" : "md:col-span-4"} flex flex-col justify-end`}>
            <button
              onClick={handleRunAnalysis}
              disabled={loading}
              className="w-full h-10 bg-gradient-to-r from-teal-850 to-teal-950 bg-teal-900 hover:bg-neutral-850 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-gray-900/10 cursor-pointer active:scale-98"
              id="btn-trigger-ai-analysis"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>{loading ? "Processando..." : "Auditar com IA"}</span>
            </button>
          </div>
        </div>

        {/* Selected Counter Feedback Badge */}
        <div className="flex items-center gap-2 text-[11px] text-neutral-500 font-medium pl-1 bg-white/40 py-1 px-2.5 rounded-lg border border-neutral-150/40 w-fit">
          <Activity className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
          <span>
            {filteredAnalysisTasks.length === 0 ? (
              <span className="text-red-600 font-bold">Nenhum registro encontrado</span>
            ) : (
              <span>
                <strong>{filteredAnalysisTasks.length}</strong> {filteredAnalysisTasks.length === 1 ? "registro selecionado" : "registros selecionados"} para análise neste intervalo.
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Core Body Container */}
      <div className="min-h-[120px] relative">
        {loading && (
          <div className="py-14 flex flex-col items-center justify-center gap-4 text-center animate-fadeIn bg-neutral-50/50 border border-dashed border-neutral-200 rounded-3xl">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-3 border-teal-100 border-t-3 border-t-teal-700 animate-spin flex items-center justify-center" />
              <Brain className="w-5 h-5 text-teal-600 absolute inset-0 m-auto animate-pulse" />
            </div>
            <div className="flex flex-col gap-1 max-w-sm px-4">
              <p className="text-xs font-bold text-neutral-800">Cronoanalisando Atividades com Inteligência Artificial</p>
              <p className="text-[11px] text-neutral-400">
                Avaliando cronograma de lançamentos, picos de duração, evidências anexadas de {currentEmpName} e computando índices de VA/NVA...
              </p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 animate-fadeIn">
            <AlertOctagon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <span className="font-extrabold text-red-900 block uppercase tracking-wider mb-1">Inviabilidade de Diagnóstico</span>
              <p className="text-red-700 font-medium leading-relaxed">{error}</p>
              <p className="text-[10px] text-red-500 mt-2 font-mono">
                Dica: Certifique-se de que o colaborador selecionado tenha dados na tabela e que a chave de API esteja ativa nas configurações do robô.
              </p>
            </div>
          </div>
        )}

        {!loading && !error && !result && (
          <div className="py-12 border border-dashed border-neutral-200 rounded-3xl flex flex-col items-center justify-center text-center p-6 bg-neutral-50/20">
            <div className="p-3 bg-neutral-100 rounded-full mb-3">
              <Clock className="w-5 h-5 text-neutral-400" />
            </div>
            <h4 className="text-xs font-bold text-neutral-700">Selecione o Operador e Inicie a Auditoria</h4>
            <p className="text-[11px] text-neutral-400 max-w-sm mt-1">
              A IA aplicará metodologias Lean ou Ishikawa nas atas registradas e anexos fotográficos para mapear atividades desnecessárias.
            </p>
          </div>
        )}

        {/* Dashboard of Results */}
        {!loading && !error && result && (
          <div className="flex flex-col gap-6 animate-fadeIn" id="ai-analysis-results-panel">
            
            {result.isDemoMode && (
              <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-start gap-3.5" id="ai-demo-mode-banner">
                <Sparkles className="w-5 h-5 text-amber-600 animate-pulse shrink-0 mt-0.5" />
                <div className="flex-1 text-xs">
                  <span className="font-extrabold text-amber-900 block uppercase tracking-wider mb-0.5">💡 Modo de Demonstração Analítica</span>
                  <p className="text-amber-800 font-medium leading-relaxed">
                    Mostrando estimativas calculadas pelo motor heurístico local baseado em engenharia de processos Lean. 
                    Para habilitar o diagnóstico generativo completo por IA de linguagem natural e visão computacional de fotos do Gemini, adicione a chave <code className="bg-amber-100/60 px-1.5 py-0.5 rounded font-mono text-[10.5px] font-bold">GEMINI_API_KEY</code> nas Configurações da barra lateral do AI Studio (Secrets / Environment Variables) nas engrenagens de configurações.
                  </p>
                </div>
              </div>
            )}
            
            {/* Visual Graph: VA vs NVA Row */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
              
              {/* Pie/Gauge visual simulation */}
              <div className="md:col-span-5 bg-teal-50/40 border border-teal-100 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                <span className="text-[9px] font-black tracking-widest text-teal-800 uppercase font-mono block mb-3.5">
                  Análise VA (Agrega Valor) vs NVA (De Desperdício)
                </span>

                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="72"
                      cy="72"
                      r="58"
                      className="stroke-amber-400 fill-none"
                      strokeWidth="11"
                    />
                    <circle
                      cx="72"
                      cy="72"
                      r="58"
                      className="stroke-teal-600 fill-none transition-all duration-1000"
                      strokeWidth="11"
                      strokeDasharray={364.4}
                      strokeDashoffset={364.4 - (364.4 * result.vaPercentage) / 100}
                    />
                  </svg>
                  
                  {/* Absolute core content */}
                  <div className="absolute inset-x-0 inset-y-0 flex flex-col items-center justify-center pt-2">
                    <span className="text-2xl font-black font-mono text-teal-900 leading-none">{result.vaPercentage}%</span>
                    <span className="text-[9px] font-bold text-teal-700 font-mono mt-1 uppercase tracking-wider">Produtivo</span>
                  </div>
                </div>

                {/* Legend bar */}
                <div className="flex gap-4.5 justify-center w-full mt-4 text-[10.5px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                    <span className="font-bold text-gray-700">Valor Agregado (VA): {result.vaPercentage}%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="font-bold text-gray-700">Desperdiçado (NVA): {result.nvaPercentage}%</span>
                  </div>
                </div>
              </div>

              {/* Executive summary details text */}
              <div className="md:col-span-7 bg-white border border-neutral-200/80 rounded-2xl p-5 flex flex-col justify-between">
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-extrabold tracking-widest text-neutral-400 uppercase font-mono flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-teal-600" />
                    Diagnóstico Crítico do Cronograma
                  </span>
                  <div className="text-xs text-neutral-600 font-medium leading-relaxed whitespace-pre-line bg-neutral-50/50 p-3.5 rounded-xl border border-neutral-100 italic">
                    "{result.summary}"
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-dashed border-neutral-100 flex items-center gap-2 text-[10.5px] text-teal-700">
                  <TrendingUp className="w-4 h-4 text-amber-500 animate-bounce" />
                  <span className="font-bold">
                    Eficiência de {currentEmpName} classificada de nível {result.vaPercentage >= 70 ? "Satisfatório • Bom Aproveitamento" : "Sujeito à Otimizações Críticas"}.
                  </span>
                </div>
              </div>
            </div>

            {/* Bottlenecks Identificated */}
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-widest flex items-center gap-1.5 font-sans border-b border-gray-100 pb-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Gargalos Operacionais Identificados (Gargalos)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {result.bottlenecks.map((b, idx) => {
                  const isHigh = b.severity === "high";
                  const isMed = b.severity === "medium";
                  return (
                    <div 
                      key={idx} 
                      className={`p-4 rounded-2xl border flex flex-col gap-2 relative overflow-hidden bg-white ${
                        isHigh 
                          ? "border-red-200 bg-red-50/5" 
                          : isMed 
                            ? "border-amber-200 bg-amber-50/5" 
                            : "border-neutral-200 bg-neutral-50/10"
                      }`}
                    >
                      {/* Left color bar */}
                      <span className={`absolute left-0 top-0 bottom-0 w-1 ${
                        isHigh ? "bg-red-500" : isMed ? "bg-amber-500" : "bg-neutral-400"
                      }`} />

                      <div className="flex items-center justify-between pl-1">
                        <h4 className="font-extrabold text-xs text-neutral-800">{b.title}</h4>
                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${
                          isHigh 
                            ? "bg-red-100 text-red-800" 
                            : isMed 
                              ? "bg-amber-100 text-amber-800"
                              : "bg-neutral-100 text-neutral-500"
                        }`}>
                          {b.severity === "high" ? "Crítico" : b.severity === "medium" ? "Moderado" : "Leve"}
                        </span>
                      </div>
                      
                      <p className="text-[11px] text-neutral-500 leading-relaxed font-semibold pl-1">
                        {b.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Unnecessary times / Wastes List */}
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-widest flex items-center gap-1.5 font-sans border-b border-gray-100 pb-2">
                <Clock className="w-4 h-4 text-teal-600 animate-spin-slow" />
                Tempos Desnecessários & Desperdícios Mapeados
              </h3>

              <div className="flex flex-col gap-2.5">
                {result.unnecessaryTimes.map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl border border-neutral-100 bg-neutral-50/60 hover:bg-neutral-50 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex-1 flex gap-3.5 items-start">
                      <div className="p-2 bg-amber-100/50 rounded-xl border border-amber-200 flex items-center justify-center shrink-0 mt-0.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="font-extrabold text-xs text-neutral-800">{item.activity}</span>
                          <span className="text-[9px] font-bold bg-neutral-100 text-neutral-500 border border-neutral-200 px-2 py-0.2 rounded-md font-mono">
                            {item.wasteType}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-1 font-medium">{item.explanation}</p>
                      </div>
                    </div>

                    <div className="w-full sm:w-auto text-left sm:text-right shrink-0 pt-2.5 sm:pt-0 border-t border-gray-100 sm:border-0">
                      <span className="text-[9px] text-neutral-400 font-mono block uppercase">DESPERDÍCIO EST.</span>
                      <span className="font-bold font-mono text-red-600 text-xs">~ {item.estimatedWastedMins} minutos</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations Kaizen */}
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-widest flex items-center gap-1.5 font-sans border-b border-gray-100 pb-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Ações Kaizen de Melhoria Contínua Recomendadas
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {result.recommendations.map((rec, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border border-teal-100/60 bg-gradient-to-br from-teal-50/20 to-transparent flex flex-col justify-between gap-3 bg-white">
                    <div className="flex flex-col gap-2">
                      <span className="text-[9px] font-black tracking-widest text-teal-800 uppercase font-mono">
                        Metodologia: {rec.methodology}
                      </span>
                      <p className="font-extrabold text-xs text-neutral-800 pr-1 leading-normal">
                        {rec.action}
                      </p>
                    </div>
                    
                    <div className="border-t border-dashed border-teal-100 pt-2.5 text-[10px]">
                      <span className="text-neutral-400 block font-mono">IMPACTO PROJETADO:</span>
                      <span className="font-black text-teal-700 uppercase">{rec.expectedImpact}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
