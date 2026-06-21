/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { X, Clock, HelpCircle, Save, Calendar, FileText, ChevronRight } from "lucide-react";
import { Task, Employee, PresetActivity, TaskAttachment } from "../types";
import { PRESET_ACTIVITIES, computeDuration } from "../data";
import VoiceInput from "./VoiceInput";
import MediaCapture from "./MediaCapture";

interface TaskFormModalProps {
  task?: Task | null; // If null/undefined, we are creating a new task
  employees: Employee[];
  selectedEmployeeId: string;
  onSave: (taskData: Omit<Task, "id" | "totalHours"> & { id?: string }) => void;
  onClose: () => void;
}

export default function TaskFormModal({
  task,
  employees,
  selectedEmployeeId,
  onSave,
  onClose
}: TaskFormModalProps) {
  const [employeeId, setEmployeeId] = useState(selectedEmployeeId);
  const [activity, setActivity] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [notes, setNotes] = useState("");
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);

  // Populate form if we are editing an existing task
  useEffect(() => {
    if (task) {
      setEmployeeId(task.employeeId);
      setActivity(task.activity);
      setDate(task.date);
      setStartTime(task.startTime);
      if (task.endTime === null) {
        setIsActive(true);
        setEndTime("");
      } else {
        setIsActive(false);
        setEndTime(task.endTime);
      }
      setNotes(task.notes || "");
      setAttachments(task.attachments || []);
    } else {
      // Set default values for new manual task
      setEmployeeId(selectedEmployeeId);
      setActivity("");
      
      // Default to current date in timezone local format
      const today = new Date();
      const localDate = today.getFullYear() + "-" + 
        String(today.getMonth() + 1).padStart(2, "0") + "-" + 
        String(today.getDate()).padStart(2, "0");
      setDate(localDate);

      // Default start time to current HH:MM
      const currentHours = String(today.getHours()).padStart(2, "0");
      const currentMinutes = String(today.getMinutes()).padStart(2, "0");
      setStartTime(`${currentHours}:${currentMinutes}`);
      
      setIsActive(true);
      setEndTime("");
      setNotes("");
      setAttachments([]);
    }
  }, [task, selectedEmployeeId]);

  // Adjust active vs end-time
  useEffect(() => {
    if (isActive) {
      setEndTime("");
    } else if (!isActive && !endTime) {
      // set some default end time slightly after start time
      if (startTime) {
        const [h, m] = startTime.split(":").map(Number);
        let endH = h + 1;
        if (endH >= 24) endH = 0;
        setEndTime(`${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      }
    }
  }, [isActive]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activity.trim()) {
      alert("Por favor, digite ou fale o nome da atividade.");
      return;
    }
    if (!startTime) {
      alert("Por favor, selecione o horário de início.");
      return;
    }
    if (!isActive && !endTime) {
      alert("Por favor, selecione o horário de término ou marque como 'Atividade Ativa'.");
      return;
    }

    onSave({
      id: task?.id,
      employeeId,
      activity: activity.trim(),
      date,
      startTime,
      endTime: isActive ? null : endTime,
      notes: notes.trim(),
      attachments
    });
  };

  // Get preset activities for selected employee to show suggestions
  const employeePresets = PRESET_ACTIVITIES.find(p => p.employeeId === employeeId)?.activities || [];

  const handleVoiceTranscript = (text: string) => {
    // clean text, capitalizing first letter
    const cleanText = text.trim();
    if (cleanText) {
      const formatted = cleanText.charAt(0).toUpperCase() + cleanText.slice(1);
      setActivity(formatted);
    }
  };

  // Compute live duration
  const liveDuration = isActive ? "Ativa (Contando)" : computeDuration(startTime, endTime);

  return (
    <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all animate-fadeIn" id="task-form-modal">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-teal-600 text-white flex items-center justify-between border-b border-teal-500">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {task ? "Editar Atividade" : "Lançar Atividade Manual"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-teal-700 rounded-full transition-colors cursor-pointer"
            id="close-modal-btn"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
          {/* Employee dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Colaborador</label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} {emp.role ? `(${emp.role})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Activity with Voice Input merged */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nome da Atividade</label>
              <span className="text-[10px] text-teal-600 font-medium">Use a voz para preencher!</span>
            </div>
            
            <input
              type="text"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              placeholder="Ex: Reunião, Impressão de etiqueta, Almoço..."
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              required
            />

            {/* Microphone assistant */}
            <div className="bg-neutral-50/50 p-2 border border-neutral-100 rounded-xl">
              <VoiceInput onTranscript={handleVoiceTranscript} id="modal-mic-btn" />
            </div>

            {/* Suggestion presets tags */}
            {employeePresets.length > 0 && (
              <div className="mt-1">
                <span className="text-[11px] text-gray-400 block mb-1">Atividades comuns para esse colaborador:</span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-neutral-50/30 rounded-lg">
                  {employeePresets.slice(0, 10).map((preset, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setActivity(preset)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                        activity.toLowerCase() === preset.toLowerCase()
                          ? "bg-teal-600 text-white border-teal-600"
                          : "bg-white text-gray-600 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Grid for date and active status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Data</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-9 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</label>
              <div className="flex items-center h-full">
                <label className="relative flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                  <span className="text-xs font-medium text-gray-700">Atividade Ativa</span>
                </label>
              </div>
            </div>
          </div>

          {/* Timer layout */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Hora Inicial</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={`text-xs font-semibold uppercase tracking-wider ${isActive ? "text-gray-300" : "text-gray-500"}`}>
                Hora Final
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${
                  isActive ? "bg-neutral-100 text-neutral-400 border-neutral-200 pointer-events-none" : "bg-neutral-50 border-neutral-200"
                }`}
                disabled={isActive}
                required={!isActive}
              />
            </div>
          </div>

          {/* Computed duration preview badge */}
          <div className="p-3 bg-teal-50 border border-teal-100 rounded-xl flex items-center justify-between text-teal-800 text-xs">
            <span className="font-semibold flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-teal-600" />
              Duração Estimada:
            </span>
            <span className="font-mono text-sm font-bold bg-white px-2.5 py-1 rounded-md shadow-xs border border-teal-200">
              {liveDuration}
            </span>
          </div>

          {/* Media Capture (Photo / Video Evidence) */}
          <MediaCapture attachments={attachments} onChange={setAttachments} />

          {/* Observations / Link box */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Observação (Opcional)</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Fim do turno, link do Sharepoint, reuniões adicionais..."
                rows={2}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-sm font-semibold text-gray-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors cursor-pointer text-center"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-all shadow-md shadow-teal-500/20 flex items-center justify-center gap-2 cursor-pointer"
              id="submit-task-btn"
            >
              <Save className="h-4 w-4" />
              {task ? "Salvar Alterações" : "Adicionar Tarefa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
