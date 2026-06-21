/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  Clock,
  User,
  Plus,
  BarChart3,
  Play,
  Square,
  Edit2,
  Trash2,
  RotateCcw,
  Sparkles,
  Info,
  Calendar,
  Layers,
  CheckCircle2,
  X,
  FileText,
  Printer,
  Paperclip,
  Wifi,
  WifiOff,
  Database,
  Check,
  Sliders,
  Shield,
  Users,
  RefreshCw,
  AlertTriangle,
  Share2,
  Cloud
} from "lucide-react";
import { Task, Employee } from "./types";
import {
  INITIAL_EMPLOYEES,
  INITIAL_TASKS,
  PRESET_ACTIVITIES,
  computeDuration,
  computeTotalMinutes,
  formatMinutesToHM
} from "./data";
import TaskFormModal from "./components/TaskFormModal";
import ReportModal from "./components/ReportModal";
import VoiceInput from "./components/VoiceInput";
import SingleTaskReportModal from "./components/SingleTaskReportModal";
import AIBottleneckAnalyzer from "./components/AIBottleneckAnalyzer";

export default function App() {
  // Database states with LocalStorage persistence helper
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem("tasks_db_employees");
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("tasks_db_tasks");
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(() => {
    return INITIAL_EMPLOYEES[0].id;
  });

  // Tracking field state
  const [viewMode, setViewMode] = useState<"user" | "admin">("user");
  const [activityText, setActivityText] = useState("");
  const [currentTimeManual, setCurrentTimeManual] = useState("");
  const [useCustomTime, setUseCustomTime] = useState(false);

  // Modal open states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [reportingTask, setReportingTask] = useState<Task | null>(null);

  // New Employee state
  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [newEmployeeRole, setNewEmployeeRole] = useState("");
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Delete confirmation states (custom modals to avoid iframe blockages)
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Share link copy state
  const [copiedShare, setCopiedShare] = useState(false);
  // Shared Server Database synchronization state
  const [serverSyncStatus, setServerSyncStatus] = useState<"synced" | "syncing" | "error">("synced");
  const [hasLoadedFromServer, setHasLoadedFromServer] = useState(false);

  // Live ticking state for active trackings
  const [secondsTicker, setSecondsTicker] = useState(0);

  // Ambient Local Clock time for UI header
  const [localTime, setLocalTime] = useState("");

  // Connection and device storage sync states
  const [isOnline, setIsOnline] = useState(typeof window !== "undefined" ? navigator.onLine : true);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // 1. Initial Load: Fetch shared database from Express, fall back to local storage
  useEffect(() => {
    const fetchSharedDatabase = async () => {
      try {
        setServerSyncStatus("syncing");
        const resp = await fetch("/api/database");
        if (resp.ok) {
          const result = await resp.json();
          if (result.employees && result.tasks) {
            setEmployees(result.employees);
            setTasks(result.tasks);
            localStorage.setItem("tasks_db_employees", JSON.stringify(result.employees));
            localStorage.setItem("tasks_db_tasks", JSON.stringify(result.tasks));
            setServerSyncStatus("synced");
          }
        } else {
          setServerSyncStatus("error");
        }
      } catch (err) {
        console.error("Shared Database Fetch Error: ", err);
        setServerSyncStatus("error");
      } finally {
        setHasLoadedFromServer(true);
      }
    };

    fetchSharedDatabase();

    // Poll the shared Express server memory every 6 seconds to enable real-time multi-user synchronization!
    const pollInterval = setInterval(() => {
      if (typeof navigator !== "undefined" && navigator.onLine) {
        fetchSharedDatabase();
      }
    }, 6000);

    return () => clearInterval(pollInterval);
  }, []);

  // 2. Automatically sync state back to shared Express server on modifications
  useEffect(() => {
    if (!hasLoadedFromServer) return;

    const syncToSharedServer = async () => {
      try {
        setSaveStatus("saving");
        setServerSyncStatus("syncing");
        
        // Write to local storage for offline preservation
        localStorage.setItem("tasks_db_employees", JSON.stringify(employees));
        localStorage.setItem("tasks_db_tasks", JSON.stringify(tasks));

        const resp = await fetch("/api/database/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employees, tasks })
        });
        if (resp.ok) {
          setServerSyncStatus("synced");
        } else {
          setServerSyncStatus("error");
        }
      } catch (err) {
        console.error("Shared Database Push Error: ", err);
        setServerSyncStatus("error");
      } finally {
        setSaveStatus("saved");
      }
    };

    const timer = setTimeout(syncToSharedServer, 600);
    return () => clearTimeout(timer);
  }, [employees, tasks, hasLoadedFromServer]);

  // Live ticker updates every second to display duration of running task and header clock
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsTicker((prev) => prev + 1);
      
      const now = new Date();
      const ptTime = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const ptDate = now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
      setLocalTime(`${ptDate} — ${ptTime}`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Preset activities for employee based on the 15 most recent recorded activities (dynamic shortcuts)
  const currentPresets = useMemo(() => {
    const userTasks = tasks.filter((t) => t.employeeId === selectedEmployeeId);
    
    // Sort tasks descending by date and then by startTime
    const sortedUserTasks = [...userTasks].sort((a, b) => {
      const dateA = a.date || "";
      const dateB = b.date || "";
      if (dateA !== dateB) {
        return dateB.localeCompare(dateA);
      }
      const timeA = a.startTime || "";
      const timeB = b.startTime || "";
      return timeB.localeCompare(timeA);
    });

    // Extract unique activity texts while preserving descending chronological order
    const uniqueActivities = new Set<string>();
    sortedUserTasks.forEach((t) => {
      if (t.activity) {
        const trimmed = t.activity.trim();
        if (trimmed) {
          uniqueActivities.add(trimmed);
        }
      }
    });

    const resultList = Array.from(uniqueActivities);

    // If there are less than 15 activities in the history, populate rest with default factory presets
    if (resultList.length < 15) {
      const found = PRESET_ACTIVITIES.find((p) => p.employeeId === selectedEmployeeId);
      const defaultPresets = found ? found.activities : ["reunião", "Almoço", "Parada Técnica", "Organização"];
      
      for (const preset of defaultPresets) {
        const trimmedPreset = preset.trim();
        const alreadyHas = resultList.some(
          (existing) => existing.toLowerCase() === trimmedPreset.toLowerCase()
        );
        if (!alreadyHas && trimmedPreset) {
          resultList.push(trimmedPreset);
          if (resultList.length >= 15) break;
        }
      }
    }

    // Return exactly up to the 15 most recent/relevant ones
    return resultList.slice(0, 15);
  }, [tasks, selectedEmployeeId]);

  // Active running task for selected employee (if any)
  const activeTask = useMemo(() => {
    return tasks.find((t) => t.employeeId === selectedEmployeeId && t.endTime === null);
  }, [tasks, selectedEmployeeId]);

  // Calculate live ticker display for active task
  const liveActiveDuration = useMemo(() => {
    if (!activeTask) return "";
    
    // Calculate difference between activeTask.startTime (HH:MM) on activeTask.date and current time
    const today = new Date();
    const [sh, sm] = activeTask.startTime.split(":").map(Number);
    
    // Create start Date object
    const startObj = new Date(today.getFullYear(), today.getMonth(), today.getDate(), sh, sm, 0);
    
    // If the logged task was for a past day, adjust the start date
    if (activeTask.date) {
      const [ty, tm, td] = activeTask.date.split("-").map(Number);
      startObj.setFullYear(ty);
      startObj.setMonth(tm - 1);
      startObj.setDate(td);
    }

    let diffMs = today.getTime() - startObj.getTime();
    if (diffMs < 0) diffMs = 0; // Negative guard

    const diffSecs = Math.floor(diffMs / 1000);
    const hrs = Math.floor(diffSecs / 3600);
    const mins = Math.floor((diffSecs % 3600) / 60);
    const secs = diffSecs % 60;

    return `${hrs}h ${String(mins).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s`;
  }, [activeTask, secondsTicker]);

  // Active worker details
  const currentEmployee = useMemo(() => {
    return employees.find((e) => e.id === selectedEmployeeId) || employees[0];
  }, [employees, selectedEmployeeId]);

  // Timeline list for selected employee (sorted chronologically by date descending, then start times descending)
  const employeeTimelineGrouped = useMemo(() => {
    const list = tasks.filter((t) => t.employeeId === selectedEmployeeId);
    
    // Group by date
    const groups: Record<string, Task[]> = {};
    list.forEach((task) => {
      const dateKey = task.date || "Sem Data";
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(task);
    });

    // Sort dates descending
    const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    
    // Sort tasks in each date group by start time descending
    sortedDates.forEach((d) => {
      groups[d].sort((a, b) => b.startTime.localeCompare(a.startTime));
    });

    return {
      dates: sortedDates,
      groups
    };
  }, [tasks, selectedEmployeeId]);

  // Start new activity (handles automatic finalization of previous task!)
  const handleStartActivity = (title: string) => {
    const taskName = title.trim();
    if (!taskName) {
      alert("Por favor, fale ou digite o que está fazendo.");
      return;
    }

    const today = new Date();
    const currentHHMM = `${String(today.getHours()).padStart(2, "0")}:${String(today.getMinutes()).padStart(2, "0")}`;
    const dateStr = today.getFullYear() + "-" + 
      String(today.getMonth() + 1).padStart(2, "0") + "-" + 
      String(today.getDate()).padStart(2, "0");

    const newStart = useCustomTime && currentTimeManual ? currentTimeManual : currentHHMM;

    // A. Automatic closure: Look for currently running task of this employee and set itsEndTime to our new startTime!
    let updatedTasks = [...tasks];
    const prevActiveIdx = updatedTasks.findIndex((t) => t.employeeId === selectedEmployeeId && t.endTime === null);

    if (prevActiveIdx !== -1) {
      const prevActive = updatedTasks[prevActiveIdx];
      // Finalise previous task at the new task's start time!
      const totalHrs = computeDuration(prevActive.startTime, newStart);
      updatedTasks[prevActiveIdx] = {
        ...prevActive,
        endTime: newStart,
        totalHours: totalHrs
      };
    }

    // B. Instantiate new active task with endTime = null
    const newTask: Task = {
      id: `task_${Date.now()}`,
      employeeId: selectedEmployeeId,
      activity: taskName,
      date: dateStr,
      startTime: newStart,
      endTime: null, // Set as active
      totalHours: "--:--",
      notes: ""
    };

    updatedTasks.unshift(newTask);
    setTasks(updatedTasks);
    setActivityText(""); // Clear typing box
    setUseCustomTime(false); // Reset manual time check
  };

  // Turn current activity off manually
  const handleStopActiveActivity = () => {
    if (!activeTask) return;

    const today = new Date();
    const endTimeStr = `${String(today.getHours()).padStart(2, "0")}:${String(today.getMinutes()).padStart(2, "0")}`;

    const updated = tasks.map((t) => {
      if (t.id === activeTask.id) {
        return {
          ...t,
          endTime: endTimeStr,
          totalHours: computeDuration(t.startTime, endTimeStr)
        };
      }
      return t;
    });

    setTasks(updated);
  };

  // Add notes/observacoes block to active task
  const handleSaveActiveNotes = (notesText: string) => {
    if (!activeTask) return;
    const updated = tasks.map((t) => {
      if (t.id === activeTask.id) {
        return { ...t, notes: notesText };
      }
      return t;
    });
    setTasks(updated);
  };

  // Edit / Add Task modal callback
  const handleSaveTaskModal = (taskData: Omit<Task, "id" | "totalHours"> & { id?: string }) => {
    const calculatedDuration = taskData.endTime ? computeDuration(taskData.startTime, taskData.endTime) : "--:--";

    if (taskData.id) {
      // Edit existing
      const updated = tasks.map((t) => {
        if (t.id === taskData.id) {
          return {
            ...t,
            employeeId: taskData.employeeId,
            activity: taskData.activity,
            date: taskData.date,
            startTime: taskData.startTime,
            endTime: taskData.endTime,
            totalHours: calculatedDuration,
            notes: taskData.notes,
            attachments: taskData.attachments
          };
        }
        return t;
      });
      setTasks(updated);
    } else {
      // Manual creation of new task
      const newTask: Task = {
        id: `task_${Date.now()}`,
        employeeId: taskData.employeeId,
        activity: taskData.activity,
        date: taskData.date,
        startTime: taskData.startTime,
        endTime: taskData.endTime,
        totalHours: calculatedDuration,
        notes: taskData.notes,
        attachments: taskData.attachments
      };
      setTasks([newTask, ...tasks]);
    }
    setIsFormOpen(false);
    setEditingTask(null);
  };

  // Delete Task
  const handleDeleteTask = (id: string) => {
    setTaskToDelete(id);
  };

  const confirmDeleteTask = () => {
    if (!taskToDelete) return;
    const filtered = tasks.filter((t) => t.id !== taskToDelete);
    setTasks(filtered);
    setTaskToDelete(null);
  };

  // Reset to original factory templates (so users can clear testing logs easily)
  const handleResetToSeeds = () => {
    setShowResetConfirm(true);
  };

  const confirmResetToSeeds = () => {
    // Clear the specific keys and cache keys so we don't accidentally clear system/platform keys
    localStorage.removeItem("tasks_db_employees");
    localStorage.removeItem("tasks_db_tasks");
    
    // Clear all AI Analysis cache keys and tracking states
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("ai_analysis_") || key.startsWith("tasks_db_") || key === "active_tracking_state")) {
        localStorage.removeItem(key);
      }
    }

    // Reset state with clean, deep-cloned arrays to guarantee reference changes
    const clonedEmployees = JSON.parse(JSON.stringify(INITIAL_EMPLOYEES));
    const clonedTasks = JSON.parse(JSON.stringify(INITIAL_TASKS));

    setEmployees(clonedEmployees);
    setTasks(clonedTasks);
    setSelectedEmployeeId(clonedEmployees[0].id);

    // Force instant write to avoid race conditions with asynchronous effects
    localStorage.setItem("tasks_db_employees", JSON.stringify(clonedEmployees));
    localStorage.setItem("tasks_db_tasks", JSON.stringify(clonedTasks));

    // Reset database on the server
    fetch("/api/database/reset", { method: "POST" }).catch((err) => {
      console.error("Erro ao resetar banco do servidor:", err);
    });

    setShowResetConfirm(false);

    // Reload window to cleanly reset all components and discard any cached or volatile internal states
    window.location.reload();
  };

  // Add custom employee
  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployeeName.trim()) {
      alert("Por favor, digite o nome do colaborador.");
      return;
    }
    const newEmpId = `emp_${Date.now()}`;
    const newEmp: Employee = {
      id: newEmpId,
      name: newEmployeeName.trim(),
      role: newEmployeeRole.trim() || "Colaborador"
    };
    
    setEmployees([...employees, newEmp]);
    setSelectedEmployeeId(newEmpId); // Auto switch
    setIsAddEmployeeOpen(false);
    setNewEmployeeName("");
    setNewEmployeeRole("");
  };

  // Copy shared link of the same server instance to clipboard
  const handleShareLink = () => {
    const url = window.location.href;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 2500);
      }).catch((err) => {
        console.error("Erro ao copiar link de compartilhamento:", err);
        alert(`Link de acesso ao mesmo servidor:\n\n${url}`);
      });
    } else {
      alert(`Link de acesso ao mesmo servidor:\n\n${url}`);
    }
  };

  // Edit existing employee
  const handleEditEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;
    if (!editingEmployee.name.trim()) {
      alert("Por favor, digite o nome do colaborador.");
      return;
    }
    
    setEmployees(prev => prev.map(emp => emp.id === editingEmployee.id ? { ...emp, name: editingEmployee.name.trim(), role: editingEmployee.role.trim() || "Colaborador" } : emp));
    setEditingEmployee(null);
  };

  // Delete existing employee
  const handleDeleteEmployee = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    if (!emp) return;
    setEmployeeToDelete(empId);
  };

  const confirmDeleteEmployee = () => {
    if (!employeeToDelete) return;
    const empId = employeeToDelete;
    setEmployees(prev => prev.filter(e => e.id !== empId));
    setTasks(prev => prev.filter(t => t.employeeId !== empId));
    if (selectedEmployeeId === empId) {
      const remaining = employees.filter(e => e.id !== empId);
      if (remaining.length > 0) {
        setSelectedEmployeeId(remaining[0].id);
      } else {
        setSelectedEmployeeId("");
      }
    }
    setEmployeeToDelete(null);
  };

  // Helper formatting for headers
  const totalHoursWorkedToday = useMemo(() => {
    const today = new Date();
    const localDateStr = today.getFullYear() + "-" + 
      String(today.getMonth() + 1).padStart(2, "0") + "-" + 
      String(today.getDate()).padStart(2, "0");

    let totalMinutes = 0;
    tasks.forEach((t) => {
      if (t.employeeId === selectedEmployeeId && t.date === localDateStr && t.endTime) {
        totalMinutes += computeTotalMinutes(t.startTime, t.endTime);
      }
    });
    return formatMinutesToHM(totalMinutes);
  }, [tasks, selectedEmployeeId]);

  // Administrator statistics dashboard
  const adminStats = useMemo(() => {
    let totalAllMinutes = 0;
    let totalCompletedTasks = 0;
    let activeNowCount = 0;

    tasks.forEach((t) => {
      if (t.endTime) {
        totalAllMinutes += computeTotalMinutes(t.startTime, t.endTime);
        totalCompletedTasks++;
      } else {
        activeNowCount++;
      }
    });

    // Stats compiled per employee
    const employeeStats = employees.map((emp) => {
      let empMinutes = 0;
      let empCompleted = 0;
      const empActiveTask = tasks.find((t) => t.employeeId === emp.id && t.endTime === null);

      tasks.forEach((t) => {
        if (t.employeeId === emp.id && t.endTime) {
          empMinutes += computeTotalMinutes(t.startTime, t.endTime);
          empCompleted++;
        }
      });

      return {
        employee: emp,
        totalHoursStr: formatMinutesToHM(empMinutes),
        totalCompleted: empCompleted,
        isActive: !!empActiveTask,
        activeTaskTitle: empActiveTask ? empActiveTask.activity : ""
      };
    });

    return {
      totalAllHoursStr: formatMinutesToHM(totalAllMinutes),
      totalCompletedTasks,
      activeNowCount,
      employeeStats
    };
  }, [tasks, employees]);

  return (
    <div className="min-h-screen bg-gray-50/70 p-0 sm:p-4 md:p-6 lg:p-8 flex flex-col font-sans tracking-normal select-none relative pb-16 print:bg-white print:p-0">
      
      {/* Top Header Panel - Screen only */}
      <header className="bg-teal-900 text-white rounded-none sm:rounded-3xl shadow-lg p-5 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-5xl w-full mx-auto shrink-0 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-800 rounded-2xl border border-teal-700 shadow-inner flex items-center justify-center">
            <Clock className="h-6 w-6 text-teal-300 animate-pulse" />
          </div>
          <div>
            <h1 className="text-md sm:text-lg font-extrabold tracking-tight">Planilha de Acompanhamento de Tarefas</h1>
            <div className="flex flex-wrap items-center gap-2.5 mt-1">
              <span className="text-[10px] text-teal-200 uppercase tracking-widest font-mono font-medium">Controle de Horas Digital</span>
              <span className="hidden xs:inline text-teal-500 font-bold text-[9px]">•</span>

              <div 
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all duration-300 ${
                  saveStatus === "saving" 
                    ? "bg-amber-500 text-neutral-950 animate-pulse shadow-md"
                    : "bg-teal-800 text-teal-100 border border-teal-700/60"
                }`}
                title="Status do banco de dados local do dispositivo"
              >
                <Database className={`w-2.5 h-2.5 ${saveStatus === "saving" ? "animate-spin" : "text-teal-300"}`} />
                <span>{saveStatus === "saving" ? "Salvando..." : "Salvo no Dispositivo"}</span>
              </div>

              <div 
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all duration-300 ${
                  isOnline 
                    ? "bg-teal-950/60 text-teal-300 border border-teal-800" 
                    : "bg-orange-600 text-white animate-pulse shadow-md"
                }`}
                title="Status instantâneo de conexão de rede"
              >
                {isOnline ? (
                  <>
                    <Wifi className="w-2.5 h-2.5 text-teal-400" />
                    <span>Conectado</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-2.5 h-2.5 text-white" />
                    <span>Trabalhando Offline</span>
                  </>
                )}
              </div>

              {/* Server Synchronized Database Indicator Pill */}
              <div 
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all duration-300 ${
                  serverSyncStatus === "synced" 
                    ? "bg-emerald-950/70 text-emerald-300 border border-emerald-800" 
                    : serverSyncStatus === "syncing"
                    ? "bg-amber-500 text-neutral-950 animate-pulse shadow-md"
                    : "bg-red-600 text-white animate-pulse"
                }`}
                title="Status do banco de dados compartilhado em nuvem no servidor"
              >
                <Cloud className={`w-2.5 h-2.5 ${serverSyncStatus === "syncing" ? "animate-bounce" : "text-emerald-400"}`} />
                <span>
                  {serverSyncStatus === "synced" && "Nuvem Sincronizada"}
                  {serverSyncStatus === "syncing" && "Sincronizando..."}
                  {serverSyncStatus === "error" && "Erro Sincronia"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Ambient indicator metadata & Sharing elements */}
        <div className="flex flex-col xs:flex-row items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0 justify-end">
          <div className="hidden md:block text-center px-4 py-1.5 bg-teal-800/40 rounded-xl border border-teal-700/50">
            <p className="text-[11px] font-mono font-bold text-teal-200">{localTime || "Carregando..."}</p>
          </div>

          <button
            onClick={handleShareLink}
            className={`w-full xs:w-auto justify-center py-2 px-3.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 ${
              copiedShare 
                ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-md shadow-emerald-500/10" 
                : "bg-teal-800 hover:bg-teal-700 text-teal-100 hover:text-white border-teal-700"
            }`}
            id="share-server-app-btn"
            title="Compartilhar link de acesso ao mesmo servidor"
          >
            <Share2 className={`h-3.5 w-3.5 ${copiedShare ? "animate-bounce text-white" : "text-teal-300"}`} />
            <span>{copiedShare ? "Link Copiado!" : "Compartilhar Link"}</span>
          </button>
        </div>

        {viewMode === "admin" && (
          <div className="flex gap-2 w-full sm:w-auto animate-fadeIn">
            <button
              onClick={() => setIsReportOpen(true)}
              className="flex-1 sm:flex-none justify-center py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-teal-500/10 active:scale-95"
              id="reports-top-btn"
            >
              <BarChart3 className="h-4 w-4 text-teal-200" />
              <span>Ver Relatório Mensal</span>
            </button>

            <button
              onClick={handleResetToSeeds}
              title="Resetar Banco"
              className="p-2.5 rounded-xl bg-teal-800/50 hover:bg-teal-800 text-teal-200 hover:text-white transition-all border border-teal-700 cursor-pointer active:scale-95"
              id="factory-reset-btn"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        )}
      </header>

      {/* Perspective Access Control Switcher */}
      <div 
        className="flex bg-white/80 backdrop-blur-xs p-1 rounded-2xl border border-neutral-200/80 shadow-xs max-w-5xl w-full mx-auto shrink-0 print:hidden mt-4 gap-1" 
        id="perspective-mode-switcher"
      >
        <button
          type="button"
          onClick={() => setViewMode("user")}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
            viewMode === "user"
              ? "bg-teal-600 text-white shadow-md shadow-teal-600/15"
              : "text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50"
          }`}
          id="btn-switch-user"
        >
          <User className="w-4.5 h-4.5" />
          <span>👷 Painel do Colaborador</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode("admin")}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
            viewMode === "admin"
              ? "bg-teal-900 text-white shadow-md shadow-teal-900/15"
              : "text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50"
          }`}
          id="btn-switch-admin"
        >
          <Shield className="w-4.5 h-4.5" />
          <span>📊 Painel do Administrador</span>
        </button>
      </div>

      {/* Main Board Container */}
      <main className="max-w-5xl w-full mx-auto mt-0 sm:mt-6 flex flex-col gap-5 flex-1 p-4 sm:p-0 print:p-0 print:mt-0">
        
        {viewMode === "user" ? (
          <>
            {/* Collaborative Column Tabs (Employees Selector) - Screen only */}
            <section className="flex flex-col gap-2 shrink-0 print:hidden" id="employee-selection-section">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-teal-600" />
                  Selecione o seu Nome (Filas de Planilha)
                </span>
                <span className="text-[10px] text-teal-600 font-bold bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-100 font-mono">MODO OPERADOR</span>
              </div>

              {/* Swipeable Employee Tabs row */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
                {employees.map((emp) => {
                  const isActive = emp.id === selectedEmployeeId;
                  const isTracking = tasks.some((t) => t.employeeId === emp.id && t.endTime === null);

                  return (
                    <button
                      key={emp.id}
                      onClick={() => {
                        setSelectedEmployeeId(emp.id);
                        setActivityText("");
                      }}
                      className={`flex-none snap-start px-4.5 py-3 rounded-2xl border text-sm transition-all flex items-center gap-2 cursor-pointer ${
                        isActive
                          ? "bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-600/15 scale-102"
                          : "bg-white border-neutral-200 text-gray-700 hover:border-neutral-300 hover:bg-neutral-50"
                      }`}
                      id={`employee-pill-${emp.id}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${isTracking ? "bg-amber-500 animate-ping" : (isActive ? "bg-white" : "bg-neutral-300")}`} />
                      <span className="font-bold">{emp.name}</span>
                      {emp.role && <span className={`text-[10px] font-normal ${isActive ? "text-teal-100" : "text-neutral-400"}`}>• {emp.role}</span>}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Current Active Activity Widget (Live Floating Card) - Screen only */}
            {activeTask && (
              <section className="bg-gradient-to-r from-teal-700 to-teal-900 text-white p-5 rounded-3xl border border-teal-700 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-slideIn shrink-0 print:hidden" id="active-task-container">
                <div className="flex items-start gap-3.5">
                  <div className="p-3 bg-teal-800 rounded-2xl border border-teal-700/80 animate-pulse mt-0.5 shrink-0">
                    <Clock className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-teal-300 uppercase tracking-widest font-mono">EM EXECUÇÃO AGORA 🚀</span>
                    <h3 className="text-md sm:text-lg font-bold text-white truncate my-0.5">{activeTask.activity}</h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-teal-200 font-medium">
                      <span>Iniciado às: <strong>{activeTask.startTime}</strong></span>
                      <span className="hidden sm:inline">•</span>
                      <span>Data: <strong>{activeTask.date ? activeTask.date.split("-").reverse().join("/") : ""}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row items-center md:justify-end gap-3 w-full md:w-auto bg-teal-950/40 p-3 rounded-2xl border border-teal-800 md:bg-transparent md:p-0 md:border-none">
                  <div className="flex-1 md:flex-none text-left md:text-right shrink-0">
                    <span className="text-[9px] font-medium text-teal-300 block font-mono">TEMPO DECORRIDO</span>
                    <span className="text-md sm:text-lg font-mono font-black text-amber-300 tracking-wider">
                      {liveActiveDuration}
                    </span>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleStopActiveActivity}
                    className="px-4.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-neutral-900 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-amber-500/10 shrink-0 active:scale-95"
                    id="stop-active-activity-btn"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Terminar</span>
                  </button>
                </div>
              </section>
            )}

            {/* Primary Activity Start Controller (With Voice input) - Screen only */}
            <section className="bg-white rounded-3xl border border-neutral-200/80 p-5 sm:p-6 shadow-xs flex flex-col gap-4 shrink-0 print:hidden" id="start-activity-section">
              <div className="flex flex-col gap-1">
                <h2 className="text-sm font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  Iniciar Nova Atividade ({currentEmployee?.name})
                </h2>
                <p className="text-xs text-neutral-400">Ao iniciar uma nova atividade, a anterior encerra-se automaticamente calculando o total de horas!</p>
              </div>

              <div className="flex flex-col md:flex-row gap-3">
                {/* Input field */}
                <div className="flex-1 flex flex-col gap-1.5">
                  <input
                    type="text"
                    value={activityText}
                    onChange={(e) => setActivityText(e.target.value)}
                    placeholder="Exemplo: Organização das tintas no FIFO..."
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl px-4.5 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    id="activity-text-input"
                  />
                  
                  {/* Voice recognition helper button integrated inside controller */}
                  <VoiceInput
                    onTranscript={(text) => {
                      let formattedTrans = text.trim();
                      if (formattedTrans) {
                        formattedTrans = formattedTrans.charAt(0).toUpperCase() + formattedTrans.slice(1);
                        setActivityText(formattedTrans);
                      }
                    }}
                    id="board-speech-btn"
                  />
                </div>

                {/* Iniciar Button triggers workflow */}
                <div className="flex flex-col justify-between shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => handleStartActivity(activityText)}
                    className="w-full md:w-44 h-12 md:h-full bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md shadow-teal-500/15 cursor-pointer active:scale-95"
                    id="start-activity-btn"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Iniciar Atividade</span>
                  </button>
                </div>
              </div>

              {/* Preset Activities Pills (Quick Launcher) */}
              <div className="mt-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Seus Atalhos Rápidos (1 Toque para Iniciar):</span>
                <div className="flex flex-wrap gap-1.5" id="presets-container">
                  {currentPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        // Start directly with this preset
                        handleStartActivity(preset);
                      }}
                      className="text-xs font-semibold px-3 py-1.5 bg-neutral-100 hover:bg-teal-50 hover:text-teal-700 rounded-xl text-neutral-700 border border-neutral-200/50 hover:border-teal-200 transition-all cursor-pointer active:scale-95 shrink-0"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggle manual past start times */}
              <div className="border-t border-dashed border-neutral-100 pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="use-custom-time"
                    checked={useCustomTime}
                    onChange={(e) => setUseCustomTime(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <label htmlFor="use-custom-time" className="text-xs font-bold text-gray-400 cursor-pointer">
                    Lançar com horário retroativo (se esqueceu de marcar antes)
                  </label>
                </div>

                {useCustomTime && (
                  <div className="flex items-center gap-1.5 animate-fadeIn">
                    <span className="text-xs font-medium text-gray-400">Horário inicial:</span>
                    <input
                      type="time"
                      value={currentTimeManual}
                      onChange={(e) => setCurrentTimeManual(e.target.value)}
                      className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-xl text-xs font-mono font-bold focus:outline-none"
                      required
                    />
                  </div>
                )}
              </div>
            </section>

            {/* Selected Employee Work History & Core Statistics */}
            <section className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-5 sm:p-6 flex flex-col gap-4 flex-1" id="timeline-section">
              
              {/* Section banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-3">
                <div>
                  <h2 className="text-sm font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-teal-600" />
                    Histórico de Lançamentos ({currentEmployee?.name})
                  </h2>
                  <p className="text-xs text-neutral-400">Lista completa organizada em ordem cronológica de tarefas deste operador.</p>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setEditingTask(null);
                      setIsFormOpen(true);
                    }}
                    className="px-3.5 py-2 font-bold bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:text-neutral-800 text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    id="add-task-manual-btn"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Lançar Manual Retroativo</span>
                  </button>
                </div>
              </div>

              {/* Current Day quick stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-teal-50/50 rounded-2xl p-3 border border-teal-100/50 flex flex-col justify-between">
                  <span className="text-[9px] font-bold text-teal-700 uppercase tracking-widest block font-mono">Horas Hoje</span>
                  <span className="text-lg font-bold font-mono text-teal-900 mt-1">{totalHoursWorkedToday}</span>
                </div>
                
                <div className="bg-neutral-50 rounded-2xl p-3 border border-neutral-200/60 flex flex-col justify-between">
                  <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block font-mono">Total Registros</span>
                  <span className="text-lg font-bold font-mono text-neutral-700 mt-1">
                    {tasks.filter((t) => t.employeeId === selectedEmployeeId).length}
                  </span>
                </div>

                <div className="bg-neutral-50 rounded-2xl p-3 border border-neutral-200/60 flex flex-col justify-between col-span-2 md:col-span-1">
                  <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block font-mono">Status Turno</span>
                  <span className="text-xs font-semibold text-neutral-600 mt-1.5 flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${activeTask ? "bg-amber-500 animate-pulse" : "bg-neutral-300"}`} />
                    {activeTask ? "Turno Ativo" : "Nenhuma tarefa ativa"}
                  </span>
                </div>
              </div>

              {/* Timeline View list */}
              <div className="flex-1 overflow-y-auto max-h-[500px] flex flex-col gap-5 mt-2" id="timeline-scroll">
                {employeeTimelineGrouped.dates.length === 0 ? (
                  <div className="py-16 text-center text-neutral-400 flex flex-col items-center justify-center gap-1.5 border border-dashed border-neutral-200 rounded-2xl">
                    <p className="font-semibold text-neutral-600">Nenhum lançamento no histórico</p>
                    <p className="text-xs max-w-xs">Grave sua voz ou selecione um atalho acima para iniciar seu controle de tarefas agora!</p>
                  </div>
                ) : (
                  employeeTimelineGrouped.dates.map((dateStr) => {
                    const dayTasks = employeeTimelineGrouped.groups[dateStr];
                    // Format Date label: Ex: 17 de Junho de 2026
                    const [y, m, d] = dateStr.split("-").map(Number);
                    const isToday = new Date().toDateString() === new Date(y, m - 1, d).toDateString();
                    
                    const formattedDateLabel = new Date(y, m - 1, d).toLocaleDateString("pt-BR", {
                      weekday: "short",
                      day: "numeric",
                      month: "long"
                    });

                    return (
                      <div key={dateStr} className="flex flex-col gap-2" id={`timeline-group-${dateStr}`}>
                        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5 sticky top-0 bg-white py-1 transition-all">
                          <Calendar className="w-3.5 h-3.5 text-teal-600" />
                          {formattedDateLabel} {isToday && <span className="text-[10px] font-mono bg-teal-100 text-teal-700 px-1 py-0.2 rounded-md font-bold uppercase ml-1">HOJE</span>}
                        </h3>

                        <div className="flex flex-col gap-2 p-1 bg-neutral-50/50 rounded-2xl border border-neutral-100">
                          {dayTasks.map((t) => {
                            const isRunning = t.endTime === null;
                            return (
                              <div
                                key={t.id}
                                className={`p-3.5 rounded-xl border transition-all hover:shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 relative overflow-hidden bg-white ${
                                  isRunning
                                    ? "border-amber-400/80 bg-gradient-to-r from-amber-50/20 to-transparent"
                                    : "border-neutral-200/70"
                                }`}
                                id={`timeline-card-${t.id}`}
                              >
                                {isRunning && (
                                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 animate-pulse" />
                                )}

                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                    <span className="font-bold text-sm text-neutral-800">{t.activity}</span>
                                    {isRunning && (
                                      <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md animate-pulse">
                                        CORRENDO...
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-1">
                                    <span className="text-xs text-neutral-500 font-medium font-mono">
                                      {t.startTime} às {t.endTime || "..."}
                                    </span>
                                    {t.notes && (
                                      <>
                                        <span className="text-neutral-300 hidden sm:inline">•</span>
                                        <span className="text-xs text-neutral-400 italic font-medium truncate max-w-xs" title={t.notes}>
                                          Obs: "{t.notes}"
                                        </span>
                                      </>
                                    )}
                                  </div>

                                  {t.attachments && t.attachments.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => setReportingTask(t)}
                                      className="flex items-center gap-1 mt-1.5 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg text-[10px] font-bold text-teal-800 transition-all cursor-pointer"
                                    >
                                      <Paperclip className="w-3.5 h-3.5 text-teal-600" />
                                      <span>{t.attachments.length} {t.attachments.length === 1 ? "Evidência" : "Evidências"}</span>
                                    </button>
                                  )}
                                </div>

                                {/* Duration & actions controls grid */}
                                <div className="flex flex-row items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0 pt-2.5 sm:pt-0 border-t border-gray-100 sm:border-0 shrink-0">
                                  <div className="text-left sm:text-right">
                                    <span className="text-[9px] block text-neutral-400 font-mono uppercase">TEMPO TOTAL</span>
                                    <span className="text-sm font-bold font-mono text-teal-800">
                                      {isRunning ? "Calculando..." : t.totalHours}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1 bg-neutral-50 rounded-lg p-0.5 border border-neutral-100">
                                    <button
                                      type="button"
                                      onClick={() => setReportingTask(t)}
                                      className="p-1.5 text-teal-700 hover:text-teal-800 hover:bg-white rounded-md transition-colors cursor-pointer"
                                      title="Gerar PDF do Lançamento"
                                      id={`btn-pdf-task-${t.id}`}
                                    >
                                      <Printer className="w-4.5 h-4.5 text-teal-600" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingTask(t);
                                        setIsFormOpen(true);
                                      }}
                                      className="p-1.5 text-neutral-600 hover:text-teal-600 hover:bg-white rounded-md transition-colors cursor-pointer"
                                      title="Editar"
                                    >
                                      <Edit2 className="w-4.5 h-4.5" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteTask(t.id)}
                                      className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-white rounded-md transition-colors cursor-pointer"
                                      title="Excluir"
                                    >
                                      <Trash2 className="w-4.5 h-4.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </>
        ) : (
          <>
            {/* ADMINISTRATOR DASHBOARD VIEW */}
            {/* Stats Row */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="admin-overall-stats">
              <div className="bg-gradient-to-br from-teal-850 to-teal-950 bg-teal-900 text-white p-5 rounded-3xl border border-teal-800 shadow-md flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold tracking-widest text-teal-300 font-mono">Horas Totais Produzidas</span>
                <span className="text-3xl font-black font-mono my-2.5 tracking-tight">{adminStats.totalAllHoursStr}h</span>
                <p className="text-[10.5px] text-teal-200">Tempo líquido faturado somando todas as frentes</p>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-neutral-200 shadow-xs flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 font-mono font-bold">Colaboradores Cadastrados</span>
                <span className="text-3xl font-black font-mono text-neutral-800 my-2.5">{employees.length}</span>
                <p className="text-[10.5px] text-neutral-500">Membros da equipe com planilhas de lançamentos</p>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-neutral-200 shadow-xs flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 font-mono font-bold">Turnos Ativos no Momento</span>
                <div className="flex items-center gap-2 my-2.5">
                  <span className={`w-3 h-3 rounded-full bg-amber-500 ${adminStats.activeNowCount > 0 ? "animate-pulse" : ""}`} />
                  <span className="text-3xl font-black font-mono text-neutral-800">{adminStats.activeNowCount}</span>
                </div>
                <p className="text-[10.5px] text-neutral-500">Colaboradores executando tarefas agora</p>
              </div>
            </section>

            {/* Administrative actions shortcuts panel */}
            <section className="bg-white rounded-3xl border border-neutral-200 shadow-xs p-5 flex flex-col gap-3" id="admin-quick-actions">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <Sliders className="w-4 h-4 text-teal-700" />
                  Operações Administrativas
                </h3>
                <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-100">Controle Master</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  onClick={() => setIsAddEmployeeOpen(true)}
                  className="py-3 px-4 rounded-2xl bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200/50 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4 text-teal-700" />
                  <span>Cadastrar Novo Colaborador</span>
                </button>

                <button
                  onClick={() => setIsReportOpen(true)}
                  className="py-3 px-4 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-teal-500/15 active:scale-95"
                >
                  <BarChart3 className="w-4 h-4 text-teal-200" />
                  <span>Gerar Relatórios Mensais & Excel</span>
                </button>

                <button
                  onClick={handleResetToSeeds}
                  className="py-3 px-4 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  <RotateCcw className="w-4 h-4 text-neutral-500" />
                  <span>Resetar Valores Geração Seeds</span>
                </button>
              </div>
            </section>

            {/* Team Members Status Overview Checklist */}
            <section className="bg-white rounded-3xl border border-neutral-200 shadow-xs p-5 sm:p-6" id="admin-team-check">
              <h3 className="text-sm font-bold text-neutral-850 uppercase tracking-wider flex items-center gap-1.5 border-b border-neutral-100 pb-3 mb-4">
                <Users className="w-4.5 h-4.5 text-teal-600" />
                Quadro de Acompanhamento do Setor
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {adminStats.employeeStats.map(({ employee, totalHoursStr, totalCompleted, isActive, activeTaskTitle }) => {
                  return (
                    <div 
                      key={employee.id} 
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 bg-white ${
                        isActive 
                          ? "border-amber-400 bg-amber-50/10" 
                          : "border-neutral-200/80 bg-neutral-50/20"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-neutral-800">{employee.name}</h4>
                            <div className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setEditingEmployee(employee)}
                                className="p-1 hover:bg-neutral-100 rounded text-neutral-500 hover:text-teal-700 cursor-pointer transition-colors"
                                title="Editar Colaborador"
                                type="button"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteEmployee(employee.id)}
                                className="p-1 hover:bg-red-50 text-neutral-500 hover:text-red-600 rounded cursor-pointer transition-colors"
                                title="Excluir Colaborador"
                                type="button"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <span className="text-[10px] text-neutral-400 font-mono tracking-wider">{employee.role || "Operador"}</span>
                        </div>
                        <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                          isActive 
                            ? "bg-amber-100 text-amber-850 animate-pulse border border-amber-200" 
                            : "bg-neutral-100 text-neutral-500"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-amber-500" : "bg-neutral-400"}`} />
                          <span>{isActive ? "Em Atividade" : "Indisponível"}</span>
                        </div>
                      </div>

                      <div className="bg-white/80 rounded-xl p-2.5 border border-neutral-100 text-xs">
                        {isActive ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] font-mono font-bold text-amber-700 uppercase tracking-widest leading-none">FAZENDO AGORA:</span>
                            <span className="font-bold text-neutral-800 truncate block mt-0.5">{activeTaskTitle}</span>
                          </div>
                        ) : (
                          <span className="text-neutral-400 italic block py-0.5 text-center">Nenhuma atividade ativa no dispositivo</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 mt-0.5">
                        <div>
                          <span className="text-[9px] font-mono text-neutral-400 uppercase block leading-none">Horas Totais:</span>
                          <span className="font-extrabold font-mono text-teal-900 text-sm">{totalHoursStr}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedEmployeeId(employee.id);
                            setViewMode("user");
                          }}
                          className="bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 rounded-xl font-bold text-[10px] text-teal-800 transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <span>Ver Planilha</span>
                          <span>&rarr;</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* AI Performance & Bottleneck Analysis Section */}
            <AIBottleneckAnalyzer tasks={tasks} employees={employees} />

            {/* Master chronological history table with filter options, full manual creations & administrative deletes */}
            <section className="bg-white rounded-3xl border border-neutral-200 shadow-xs p-5 sm:p-6 flex flex-col gap-4 flex-1" id="admin-timeline">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-3">
                <div>
                  <h2 className="text-sm font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-teal-600" />
                    Livro Eletrônico Geral de Lançamentos
                  </h2>
                  <p className="text-xs text-neutral-400">Verifique, altere e controle todos os lançamentos digitados ou falados por colaborador.</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold text-neutral-500">Filtrar por:</span>
                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5 text-xs font-bold text-neutral-700 focus:outline-none focus:ring-1 focus:ring-teal-500 animate-fadeIn"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Master Ledger List Render */}
              <div className="flex-1 overflow-y-auto max-h-[500px] flex flex-col gap-5 mt-2" id="admin-timeline-scroll">
                {employeeTimelineGrouped.dates.length === 0 ? (
                  <div className="py-16 text-center text-neutral-400 flex flex-col items-center justify-center gap-1.5 border border-dashed border-neutral-200 rounded-2xl">
                    <p className="font-semibold text-neutral-600">Nenhum lançamento no histórico de {currentEmployee?.name}</p>
                    <p className="text-xs font-medium">Este operador ainda não possui lançamentos nesta rodada local de armazenamento.</p>
                  </div>
                ) : (
                  employeeTimelineGrouped.dates.map((dateStr) => {
                    const dayTasks = employeeTimelineGrouped.groups[dateStr];
                    const [y, m, d] = dateStr.split("-").map(Number);
                    const isToday = new Date().toDateString() === new Date(y, m - 1, d).toDateString();
                    const formattedDateLabel = new Date(y, m - 1, d).toLocaleDateString("pt-BR", {
                      weekday: "short",
                      day: "numeric",
                      month: "long"
                    });

                    return (
                      <div key={dateStr} className="flex flex-col gap-2">
                        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5 sticky top-0 bg-white py-1 transition-all">
                          <Calendar className="w-3.5 h-3.5 text-teal-600" />
                          {formattedDateLabel} {isToday && <span className="text-[10px] font-mono bg-teal-100 text-teal-700 px-1 py-0.2 rounded-md font-bold uppercase ml-1">HOJE</span>}
                        </h3>

                        <div className="flex flex-col gap-2 p-1 bg-neutral-50/50 rounded-2xl border border-neutral-100">
                          {dayTasks.map((t) => {
                            const isRunning = t.endTime === null;
                            const empName = employees.find((e) => e.id === t.employeeId)?.name || "Colaborador";
                            return (
                              <div
                                key={t.id}
                                className={`p-3.5 rounded-xl border transition-all hover:shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 relative overflow-hidden bg-white ${
                                  isRunning
                                    ? "border-amber-400/80 bg-gradient-to-r from-amber-50/20 to-transparent"
                                    : "border-neutral-200/70"
                                }`}
                              >
                                {isRunning && (
                                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 animate-pulse" />
                                )}

                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                    <span className="font-extrabold text-[9px] bg-teal-50 text-teal-800 px-2 py-0.5 rounded-lg border border-teal-150 font-mono tracking-wide uppercase mr-1.5">{empName}</span>
                                    <span className="font-bold text-sm text-neutral-800">{t.activity}</span>
                                    {isRunning && (
                                      <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md animate-pulse">
                                        EM ANDAMENTO
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-1.5">
                                    <span className="text-xs text-neutral-500 font-medium font-mono">
                                      {t.startTime} às {t.endTime || "..."}
                                    </span>
                                    {t.notes && (
                                      <>
                                        <span className="text-neutral-300 hidden sm:inline">•</span>
                                        <span className="text-xs text-neutral-400 italic font-medium truncate max-w-xs" title={t.notes}>
                                          Obs: "{t.notes}"
                                        </span>
                                      </>
                                    )}
                                  </div>

                                  {t.attachments && t.attachments.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => setReportingTask(t)}
                                      className="flex items-center gap-1 mt-1.5 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg text-[10px] font-bold text-teal-800 transition-all cursor-pointer"
                                    >
                                      <Paperclip className="w-3.5 h-3.5 text-teal-600" />
                                      <span>{t.attachments.length} {t.attachments.length === 1 ? "Evidência" : "Evidências"}</span>
                                    </button>
                                  )}
                                </div>

                                {/* Duration & actions controls grid */}
                                <div className="flex flex-row items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0 pt-2.5 sm:pt-0 border-t border-gray-100 sm:border-0 shrink-0">
                                  <div className="text-left sm:text-right">
                                    <span className="text-[9px] block text-neutral-400 font-mono uppercase">TEMPO TOTAL</span>
                                    <span className="text-sm font-bold font-mono text-teal-800">
                                      {isRunning ? "Calculando..." : t.totalHours}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1 bg-neutral-50 rounded-lg p-0.5 border border-neutral-100">
                                    <button
                                      type="button"
                                      onClick={() => setReportingTask(t)}
                                      className="p-1.5 text-teal-700 hover:text-teal-800 hover:bg-white rounded-md transition-colors cursor-pointer"
                                      title="Gerar PDF do Lançamento"
                                    >
                                      <Printer className="w-4.5 h-4.5 text-teal-600" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingTask(t);
                                        setIsFormOpen(true);
                                      }}
                                      className="p-1.5 text-neutral-600 hover:text-teal-600 hover:bg-white rounded-md transition-colors cursor-pointer"
                                      title="Editar"
                                    >
                                      <Edit2 className="w-4.5 h-4.5" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteTask(t.id)}
                                      className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-white rounded-md transition-colors cursor-pointer"
                                      title="Excluir"
                                    >
                                      <Trash2 className="w-4.5 h-4.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </>
        )}
      </main>

      {/* FOOTER credit line */}
      <footer className="h-6 shrink-0 text-center text-[10px] text-gray-400 mt-12 mb-4 print:hidden" id="applet-footer">
        Fidelidade Visual • Planilha de Acompanhamento de Tarefas do Setor
      </footer>

      {/* Task form Modal for creating / editing logs */}
      {isFormOpen && (
        <TaskFormModal
          task={editingTask}
          employees={employees}
          selectedEmployeeId={selectedEmployeeId}
          onSave={handleSaveTaskModal}
          onClose={() => {
            setIsFormOpen(false);
            setEditingTask(null);
          }}
        />
      )}

      {/* Analytics, Excel CSV and printable multi-page PDF generator Modal */}
      {isReportOpen && (
        <ReportModal
          tasks={tasks}
          employees={employees}
          selectedEmployeeId={selectedEmployeeId}
          onClose={() => setIsReportOpen(false)}
        />
      )}

      {/* Add Custom Employee Modal */}
      {isAddEmployeeOpen && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all animate-fadeIn" id="add-employee-modal">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-md font-bold text-neutral-800 flex items-center gap-1.5">
                <Plus className="w-5 h-5 text-teal-600" />
                Cadastrar Colaborador
              </h3>
              <button
                onClick={() => setIsAddEmployeeOpen(false)}
                className="p-1 hover:bg-neutral-100 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nome Completo</label>
                <input
                  type="text"
                  value={newEmployeeName}
                  onChange={(e) => setNewEmployeeName(e.target.value)}
                  placeholder="Ex: Pedro Silva"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cargo / Setor</label>
                <input
                  type="text"
                  value={newEmployeeRole}
                  onChange={(e) => setNewEmployeeRole(e.target.value)}
                  placeholder="Ex: Operador"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm rounded-xl py-2 flex items-center justify-center gap-2 transition-all shadow-md shadow-teal-500/10 cursor-pointer active:scale-95"
              >
                <span>Salvar Cadastro</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {editingEmployee && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all animate-fadeIn" id="edit-employee-modal">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-md font-bold text-neutral-800 flex items-center gap-1.5">
                <Edit2 className="w-5 h-5 text-teal-600" />
                Editar Colaborador
              </h3>
              <button
                onClick={() => setEditingEmployee(null)}
                className="p-1 hover:bg-neutral-100 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleEditEmployee} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nome Completo</label>
                <input
                  type="text"
                  value={editingEmployee.name}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, name: e.target.value })}
                  placeholder="Ex: Pedro Silva"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cargo / Setor</label>
                <input
                  type="text"
                  value={editingEmployee.role || ""}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, role: e.target.value })}
                  placeholder="Ex: Operador"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm rounded-xl py-2 flex items-center justify-center gap-2 transition-all shadow-md shadow-teal-500/10 cursor-pointer active:scale-95"
              >
                <span>Salvar Alterações</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Report of each activity/task in PDF */}
      {reportingTask && (
        <SingleTaskReportModal
          task={reportingTask}
          employee={employees.find((e) => e.id === reportingTask.employeeId) || currentEmployee}
          onClose={() => setReportingTask(null)}
        />
      )}

      {/* CUSTOM CONFIRMATION MODALS (Bypasses iframe alert/confirm limitations) */}

      {/* 1. Delete Task Confirmation */}
      {taskToDelete && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 flex flex-col gap-4 border border-neutral-100">
            <div className="flex items-center gap-3 text-red-650">
              <div className="p-2.5 bg-red-50 rounded-2xl">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-md font-extrabold text-neutral-850">Confirmar Exclusão</h3>
                <p className="text-xs text-neutral-400">Esta ação é permanente</p>
              </div>
            </div>
            
            <p className="text-sm text-neutral-600 leading-relaxed font-medium">
              Tem certeza que deseja excluir este lançamento de tarefa do histórico?
            </p>

            <div className="grid grid-cols-2 gap-3.5 pt-2">
              <button
                type="button"
                onClick={() => setTaskToDelete(null)}
                className="w-full h-11 bg-neutral-100 hover:bg-neutral-150 text-neutral-700 font-bold text-xs rounded-xl cursor-pointer transition-colors active:scale-98"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteTask}
                className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl cursor-pointer transition-colors shadow-md shadow-red-500/10 active:scale-98"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Delete Employee Confirmation */}
      {employeeToDelete && (() => {
        const emp = employees.find((e) => e.id === employeeToDelete);
        return (
          <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 flex flex-col gap-4 border border-neutral-100">
              <div className="flex items-center gap-3 text-red-650">
                <div className="p-2.5 bg-red-50 rounded-2xl">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-md font-extrabold text-neutral-850">Excluir Colaborador</h3>
                  <p className="text-xs text-neutral-400">Remoção em lote e irreversível</p>
                </div>
              </div>
              
              <div className="text-sm text-neutral-600 leading-relaxed space-y-2 font-medium">
                <p>
                  Aviso: Tem certeza que deseja excluir permanentemente o colaborador <strong className="text-neutral-800">"{emp?.name}"</strong>?
                </p>
                <p className="text-red-600 font-semibold bg-red-50 p-3 rounded-2xl text-xs border border-red-100">
                  ⚠️ Atenção: Isso também excluirá definitivamente todos os lançamentos de atividades e dados de auditoria associados a este usuário.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEmployeeToDelete(null)}
                  className="w-full h-11 bg-neutral-100 hover:bg-neutral-150 text-neutral-700 font-bold text-xs rounded-xl cursor-pointer transition-colors active:scale-98"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteEmployee}
                  className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl cursor-pointer transition-colors shadow-md shadow-red-500/15 active:scale-98"
                >
                  Excluir Tudo
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 3. Reset To Seed Templates Confirmation */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 flex flex-col gap-4 border border-neutral-100">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-2.5 bg-amber-50 rounded-2xl">
                <RefreshCw className="w-6 h-6 text-amber-500 animate-spin-slow" />
              </div>
              <div>
                <h3 className="text-md font-extrabold text-neutral-850">Resetar Banco de Dados</h3>
                <p className="text-xs text-neutral-400">Recarregar planilhas originais</p>
              </div>
            </div>
            
            <p className="text-sm text-neutral-600 leading-relaxed font-medium">
              Deseja redefinir o banco de dados temporário local para as informações das planilhas de testes originais (Jediael, Moises, Mario, Agnes e Anderson)? Todos os dados inseridos manualmente até o momento serão eliminados.
            </p>

            <div className="grid grid-cols-2 gap-3.5 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="w-full h-11 bg-neutral-100 hover:bg-neutral-150 text-neutral-700 font-bold text-xs rounded-xl cursor-pointer transition-colors active:scale-98"
              >
                Manter Dados Atuais
              </button>
              <button
                type="button"
                onClick={confirmResetToSeeds}
                className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl cursor-pointer transition-colors shadow-md shadow-amber-500/10 active:scale-98"
              >
                Resetar Agora
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
