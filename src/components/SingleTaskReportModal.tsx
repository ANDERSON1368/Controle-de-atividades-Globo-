/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { X, Printer, Calendar, User, Clock, FileText, CheckCircle, HelpCircle, Film, Image as ImageIcon } from "lucide-react";
import { Task, Employee } from "../types";

interface SingleTaskReportModalProps {
  task: Task;
  employee: Employee;
  onClose: () => void;
}

export default function SingleTaskReportModal({
  task,
  employee,
  onClose
}: SingleTaskReportModalProps) {
  const handlePrint = () => {
    // Briefly suggest title for saved PDF
    const originalTitle = document.title;
    document.title = `Relatorio_Atividade_${employee.name.replace(/\s+/g, "_")}_${task.date}`;
    window.print();
    // restore
    setTimeout(() => {
      document.title = originalTitle;
    }, 100);
  };

  const isRunning = task.endTime === null;

  return (
    <div className="fixed inset-0 bg-neutral-900/65 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all animate-fadeIn" id="single-report-modal">
      {/* Printable replication element that media print CSS will isolate */}
      <div id="printable-report" className="hidden">
        <div style={{ fontFamily: "sans-serif", color: "black", padding: "20px" }}>
          {/* Header */}
          <div style={{ borderBottom: "2px solid #0d9488", paddingBottom: "15px", marginBottom: "25px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 style={{ fontSize: "20pt", fontWeight: "bold", margin: "0", color: "#111827" }}>RELATÓRIO DE EXECUÇÃO DE ATIVIDADE</h1>
              <p style={{ fontSize: "10pt", color: "#4b5563", margin: "4px 0 0 0" }}>Registro Digital de Acompanhamento Diário de Produtividade</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "9pt", fontWeight: "bold", padding: "4px 8px", backgroundColor: isRunning ? "#fef3c7" : "#ccfbf1", color: isRunning ? "#92400e" : "#115e59", borderRadius: "4px" }}>
                {isRunning ? "ATIVIDADE EM EXECUÇÃO" : "REGISTRO CONCLUÍDO"}
              </span>
              <p style={{ fontSize: "9pt", color: "#6b7280", margin: "6px 0 0 0" }}>ID: #{task.id}</p>
            </div>
          </div>

          {/* Metadata Grid Table */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "25px" }}>
            <tbody>
              <tr>
                <td style={{ border: "1px solid #cbd5e1", padding: "10px", backgroundColor: "#f8fafc", fontWeight: "bold", width: "25%" }}>Colaborador / Operador:</td>
                <td style={{ border: "1px solid #cbd5e1", padding: "10px", width: "35%" }}>{employee.name}</td>
                <td style={{ border: "1px solid #cbd5e1", padding: "10px", backgroundColor: "#f8fafc", fontWeight: "bold", width: "15%" }}>Data:</td>
                <td style={{ border: "1px solid #cbd5e1", padding: "10px", width: "25%" }}>
                  {task.date ? new Date(task.date + "T00:00:00").toLocaleDateString("pt-BR") : "---"}
                </td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #cbd5e1", padding: "10px", backgroundColor: "#f8fafc", fontWeight: "bold" }}>Cargo / Setor:</td>
                <td style={{ border: "1px solid #cbd5e1", padding: "10px" }}>{employee.role || "Operador / Técnico"}</td>
                <td style={{ border: "1px solid #cbd5e1", padding: "10px", backgroundColor: "#f8fafc", fontWeight: "bold" }}>Duração Total:</td>
                <td style={{ border: "1px solid #cbd5e1", padding: "10px", fontWeight: "bold", fontFamily: "monospace" }}>{isRunning ? "Ativa (Ticking)" : task.totalHours}</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #cbd5e1", padding: "10px", backgroundColor: "#f8fafc", fontWeight: "bold" }}>Hora Inicial:</td>
                <td style={{ border: "1px solid #cbd5e1", padding: "10px" }}>{task.startTime}</td>
                <td style={{ border: "1px solid #cbd5e1", padding: "10px", backgroundColor: "#f8fafc", fontWeight: "bold" }}>Hora Término:</td>
                <td style={{ border: "1px solid #cbd5e1", padding: "10px" }}>{task.endTime || "Atividade Ativa"}</td>
              </tr>
            </tbody>
          </table>

          {/* Activity description */}
          <div style={{ marginBottom: "25px", border: "1px solid #cbd5e1", borderRadius: "6px", overflow: "hidden" }}>
            <div style={{ backgroundColor: "#0d9488", color: "white", padding: "8px 12px", fontSize: "11px", fontWeight: "bold" }}>
              DESCRIÇÃO DA ATIVIDADE REALIZADA
            </div>
            <div style={{ padding: "15px", fontSize: "14px", lineHeight: "1.6", color: "#111827", minHeight: "60px", whiteSpace: "pre-wrap" }}>
              {task.activity}
            </div>
          </div>

          {/* Notes description */}
          {task.notes && (
            <div style={{ marginBottom: "25px", border: "1px solid #cbd5e1", borderRadius: "6px", overflow: "hidden" }}>
              <div style={{ backgroundColor: "#f1f5f9", color: "#334155", padding: "8px 12px", fontSize: "11px", fontWeight: "bold", borderBottom: "1px solid #cbd5e1" }}>
                OBSERVAÇÕES E COMENTÁRIOS DO OPERADOR
              </div>
              <div style={{ padding: "12px", fontSize: "12px", lineHeight: "1.5", color: "#475569", whiteSpace: "pre-wrap" }}>
                {task.notes}
              </div>
            </div>
          )}

          {/* Photo & media Evidence list rendering */}
          {task.attachments && task.attachments.length > 0 && (
            <div style={{ marginBottom: "35px" }}>
              <div style={{ fontSize: "11px", fontWeight: "bold", color: "#0d9488", borderBottom: "1px solid #0d9488", paddingBottom: "4px", marginBottom: "12px" }}>
                REGISTROS FOTOGRÁFICOS & EVIDÊNCIAS ANEXADAS ({task.attachments.length})
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "15px" }}>
                {task.attachments.map((attach) => (
                  <div key={attach.id} style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden", backgroundColor: "#000" }}>
                    {attach.type === "photo" ? (
                      <div style={{ aspectRatio: "4/3", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <img 
                          src={attach.url} 
                          alt="Evidência" 
                          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div style={{ padding: "20px 10px", textAlign: "center", color: "white", fontSize: "10px" }}>
                        <p style={{ margin: "0 0 5px 0", fontWeight: "bold" }}>[ANEXO DE ARQUIVO VÍDEO]</p>
                        <p style={{ margin: "0", color: "#8b949e", fontSize: "8px" }}>Capturado às {attach.timestamp}</p>
                      </div>
                    )}
                    <div style={{ backgroundColor: "#f8fafc", padding: "6px 10px", fontSize: "10px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", color: "#475569" }}>
                      <span>Anexo {attach.type === "photo" ? "Imagem" : "Vídeo"}</span>
                      <span>{attach.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signature approval space */}
          <div style={{ marginTop: "60px", display: "flex", justifyContent: "space-between", gap: "80px" }}>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ borderTop: "1px solid #4b5563", margin: "0 20px" }} />
              <p style={{ fontSize: "10px", fontWeight: "bold", color: "#111827", margin: "6px 0 2px 0" }}>{employee.name}</p>
              <p style={{ fontSize: "9px", color: "#6b7280", margin: "0" }}>Assinatura do Colaborador</p>
            </div>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ borderTop: "1px solid #4b5563", margin: "0 20px" }} />
              <p style={{ fontSize: "10px", fontWeight: "bold", color: "#111827", margin: "6px 0 2px 0" }}>Responsável do Setor</p>
              <p style={{ fontSize: "9px", color: "#6b7280", margin: "0" }}>Assinatura do Supervisor</p>
            </div>
          </div>
        </div>
      </div>

      {/* Screen view layout container */}
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-neutral-200 animate-slideIn print:hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-teal-300" />
            <h2 className="text-md font-bold uppercase tracking-wide">Relatório PDF Individual</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-teal-700/80 rounded-full transition-colors cursor-pointer"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Modal content body (Previewing live what is going to be printed) */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6 bg-neutral-50/50">
          
          {/* Main Worker Intro Card */}
          <div className="bg-white p-4.5 rounded-2xl border border-neutral-200/70 flex justify-between items-start">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-teal-50 text-teal-700 rounded-xl">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-neutral-800">{employee.name}</h3>
                <p className="text-xs text-neutral-400 mt-0.5">{employee.role || "Operador / Técnico"}</p>
              </div>
            </div>

            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isRunning ? "bg-amber-100 text-amber-800" : "bg-teal-100 text-teal-800"}`}>
              {isRunning ? "Ativo" : "Concluído"}
            </span>
          </div>

          {/* Operational hours stats and timeline details */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="bg-white p-3.5 rounded-2xl border border-neutral-200/70">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Data</span>
              <span className="text-sm font-bold font-mono text-neutral-800 mt-1 block flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-teal-600" />
                {task.date ? new Date(task.date + "T00:00:00").toLocaleDateString("pt-BR") : "---"}
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-neutral-200/70">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Duração Total</span>
              <span className="text-sm font-black font-mono text-teal-800 mt-1 block flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-teal-600" />
                {isRunning ? "Em Execução" : task.totalHours}
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-neutral-200/70">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Início</span>
              <span className="text-xs font-semibold text-neutral-700 mt-1.5 block">
                {task.startTime}hs
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-neutral-200/70">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Término</span>
              <span className="text-xs font-semibold text-neutral-700 mt-1.5 block">
                {task.endTime ? `${task.endTime}hs` : "Atividade Ativa"}
              </span>
            </div>
          </div>

          {/* Process step activity info card */}
          <div className="bg-white p-4.5 rounded-2xl border border-neutral-200/70">
            <span className="text-[10px] font-bold text-teal-700 uppercase tracking-widest block font-mono">Atividade Executada</span>
            <p className="text-sm font-bold text-neutral-800 mt-2 leading-relaxed">{task.activity}</p>
          </div>

          {/* Observations and links */}
          {task.notes && (
            <div className="bg-white p-4.5 rounded-2xl border border-neutral-200/70 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Observações / Comentários</span>
              <p className="text-xs text-neutral-600 leading-relaxed italic bg-neutral-50 p-2.5 rounded-xl mt-1.5">
                "{task.notes}"
              </p>
            </div>
          )}

          {/* File attachments visual panel */}
          <div className="bg-white p-4.5 rounded-2xl border border-neutral-200/70 flex flex-col gap-2.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-teal-600" />
              Evidências Anexadas ({task.attachments?.length || 0})
            </span>
            
            {!task.attachments || task.attachments.length === 0 ? (
              <p className="text-xs text-neutral-400 italic">Nenhum registro fotográfico ou de vídeo anexado a este lançamento.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 mt-1">
                {task.attachments.map((attach) => (
                  <div key={attach.id} className="relative rounded-xl overflow-hidden border border-neutral-200 bg-neutral-900 aspect-video flex items-center justify-center">
                    {attach.type === "photo" ? (
                      <img
                        src={attach.url}
                        alt="Evidência"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full relative flex items-center justify-center bg-black">
                        <Film className="w-7 h-7 text-neutral-500" />
                        <span className="absolute bottom-1 right-2 text-[8px] uppercase tracking-wider font-extrabold bg-black/60 text-white px-1.5 py-0.5 rounded">
                          VÍDEO
                        </span>
                        <video src={attach.url} className="absolute inset-0 w-full h-full object-contain cursor-pointer" controls />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Approval Signatures Indicator */}
          <div className="rounded-2xl p-3 bg-amber-50/60 border border-amber-100 flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-800 leading-relaxed">
              O PDF impresso incluirá áreas formais de rubrica e assinatura do colaborador e supervisor responsável pelo turno.
            </p>
          </div>

        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-white border-t border-neutral-200 flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-xs font-semibold text-gray-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-all cursor-pointer text-center"
          >
            Fechar Janela
          </button>
          
          <button
            onClick={handlePrint}
            className="flex-1 py-3 text-xs font-extrabold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-teal-600/10 cursor-pointer active:scale-95"
            id="print-single-pdf-btn"
          >
            <Printer className="w-4 h-4" />
            <span>Gerar PDF / Imprimir</span>
          </button>
        </div>
      </div>
    </div>
  );
}
