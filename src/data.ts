/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Task, Employee, PresetActivity } from "./types";

export const INITIAL_EMPLOYEES: Employee[] = [
  { id: "e1", name: "Jediael", role: "Auxiliar de Operações" },
  { id: "e2", name: "Moises", role: "Operador de Máquinas" },
  { id: "e3", name: "Mario", role: "Assistente de Almoxarifado" },
  { id: "e4", name: "Agnes", role: "Analista de PCP" },
  { id: "e5", name: "Anderson", role: "Supervisor" }
];

export const INITIAL_TASKS: Task[] = [
  // --- Jediael ---
  {
    id: "j1",
    employeeId: "e1",
    activity: "reunião",
    date: "2026-06-17",
    startTime: "07:00",
    endTime: "07:44",
    totalHours: "0:44",
    notes: ""
  },
  {
    id: "j2",
    employeeId: "e1",
    activity: "impressão de etiqueta",
    date: "2026-06-17",
    startTime: "07:44",
    endTime: "07:53",
    totalHours: "0:09",
    notes: ""
  },
  {
    id: "j3",
    employeeId: "e1",
    activity: "Atendimento reserva preparação químico",
    date: "2026-06-17",
    startTime: "07:53",
    endTime: "08:11",
    totalHours: "0:18",
    notes: "https://rendasa-my.sharepoint.com/personal"
  },
  {
    id: "j4",
    employeeId: "e1",
    activity: "Atendimento reserva rolhas",
    date: "2026-06-17",
    startTime: "08:11",
    endTime: "08:44",
    totalHours: "0:33",
    notes: ""
  },
  {
    id: "j5",
    employeeId: "e1",
    activity: "Atendimento reserva pré-impressão",
    date: "2026-06-17",
    startTime: "08:44",
    endTime: "09:43",
    totalHours: "0:59",
    notes: "https://rendasa-my.sharepoint.com/personal"
  },
  {
    id: "j6",
    employeeId: "e1",
    activity: "Iniciar contagem de folhas",
    date: "2026-06-17",
    startTime: "09:43",
    endTime: "10:00",
    totalHours: "0:17",
    notes: ""
  },
  {
    id: "j7",
    employeeId: "e1",
    activity: "Arrumação de tintas",
    date: "2026-06-17",
    startTime: "10:00",
    endTime: "10:20",
    totalHours: "0:20",
    notes: ""
  },
  {
    id: "j8",
    employeeId: "e1",
    activity: "tirar folhas virgem",
    date: "2026-06-17",
    startTime: "10:20",
    endTime: "10:46",
    totalHours: "0:26",
    notes: ""
  },
  {
    id: "j9",
    employeeId: "e1",
    activity: "Atendimento reservas EPIs",
    date: "2026-06-17",
    startTime: "10:46",
    endTime: "11:30",
    totalHours: "0:44",
    notes: ""
  },
  {
    id: "j10",
    employeeId: "e1",
    activity: "Almoço",
    date: "2026-06-17",
    startTime: "11:30",
    endTime: "12:30",
    totalHours: "1:00",
    notes: ""
  },
  {
    id: "j11",
    employeeId: "e1",
    activity: "Organização das tintas no FIFO",
    date: "2026-06-17",
    startTime: "12:30",
    endTime: "14:42",
    totalHours: "2:12",
    notes: ""
  },
  {
    id: "j12",
    employeeId: "e1",
    activity: "marcação de folhas",
    date: "2026-06-17",
    startTime: "14:42",
    endTime: "15:02",
    totalHours: "0:20",
    notes: ""
  },
  {
    id: "j13",
    employeeId: "e1",
    activity: "Organização das tintas no FIFO",
    date: "2026-06-17",
    startTime: "15:02",
    endTime: "17:00",
    totalHours: "1:58",
    notes: "Fim do turno"
  },
  {
    id: "j14",
    employeeId: "e1",
    activity: "Separando amostra dos PVC Twist para o CQ",
    date: "2026-06-18",
    startTime: "07:00",
    endTime: "07:11",
    totalHours: "0:11",
    notes: ""
  },
  {
    id: "j15",
    employeeId: "e1",
    activity: "Atendendo a reserva da Rolha",
    date: "2026-06-18",
    startTime: "07:11",
    endTime: "07:28",
    totalHours: "0:17",
    notes: ""
  },
  {
    id: "j16",
    employeeId: "e1",
    activity: "organizando o PVC e etiquetando",
    date: "2026-06-18",
    startTime: "07:28",
    endTime: "08:00",
    totalHours: "0:32",
    notes: ""
  },

  // --- Moises ---
  {
    id: "m1",
    employeeId: "e2",
    activity: "Atendimento de linha de montagem e troca de tc",
    date: "2026-06-17",
    startTime: "06:00",
    endTime: "07:00",
    totalHours: "1:00",
    notes: ""
  },
  {
    id: "m2",
    employeeId: "e2",
    activity: "reunião",
    date: "2026-06-17",
    startTime: "07:00",
    endTime: "07:49",
    totalHours: "0:49",
    notes: ""
  },
  {
    id: "m3",
    employeeId: "e2",
    activity: "Atendimento de reserva litografia Siri",
    date: "2026-06-17",
    startTime: "07:49",
    endTime: "07:52",
    totalHours: "0:03",
    notes: ""
  },
  {
    id: "m4",
    employeeId: "e2",
    activity: "Iniciando o recebimento de Cazan",
    date: "2026-06-17",
    startTime: "07:52",
    endTime: "08:28",
    totalHours: "0:36",
    notes: ""
  },
  {
    id: "m5",
    employeeId: "e2",
    activity: "Atendimento de reserva litografia Siri",
    date: "2026-06-17",
    startTime: "08:28",
    endTime: "09:17",
    totalHours: "0:49",
    notes: ""
  },
  {
    id: "m6",
    employeeId: "e2",
    activity: "atendimento de reserva litografia Siri",
    date: "2026-06-17",
    startTime: "09:17",
    endTime: "09:24",
    totalHours: "0:07",
    notes: ""
  },
  {
    id: "m7",
    employeeId: "e2",
    activity: "Saída para troca do vidro do carro (saída dentro do turno)",
    date: "2026-06-17",
    startTime: "09:24",
    endTime: "10:30",
    totalHours: "1:06",
    notes: "https://rendasa-my.sharepoint.com/personal"
  },
  {
    id: "m8",
    employeeId: "e2",
    activity: "saida para troca o vidro do Carro \"saida dentro do turno",
    date: "2026-06-17",
    startTime: "10:30",
    endTime: "11:51",
    totalHours: "1:21",
    notes: ""
  },
  {
    id: "m9",
    employeeId: "e2",
    activity: "Recebimento de folhas",
    date: "2026-06-17",
    startTime: "11:51",
    endTime: "12:30",
    totalHours: "0:39",
    notes: ""
  },
  {
    id: "m10",
    employeeId: "e2",
    activity: "Almoço",
    date: "2026-06-17",
    startTime: "12:30",
    endTime: "13:30",
    totalHours: "1:00",
    notes: ""
  },
  {
    id: "m11",
    employeeId: "e2",
    activity: "Acompanha a coleta de cilindro da litografia",
    date: "2026-06-17",
    startTime: "13:30",
    endTime: "15:15",
    totalHours: "1:45",
    notes: ""
  },
  {
    id: "m12",
    employeeId: "e2",
    activity: "Atendimento de reserva litografia",
    date: "2026-06-17",
    startTime: "15:15",
    endTime: "15:30",
    totalHours: "0:15",
    notes: ""
  },
  {
    id: "m13",
    employeeId: "e2",
    activity: "Atendimento de linha de montagem e troca de tc",
    date: "2026-06-17",
    startTime: "15:30",
    endTime: "16:00",
    totalHours: "0:30",
    notes: "Fim do turno"
  },
  {
    id: "m14",
    employeeId: "e2",
    activity: "Descarregando a primeira carreta",
    date: "2026-06-18",
    startTime: "06:00",
    endTime: "07:17",
    totalHours: "1:17",
    notes: ""
  },
  {
    id: "m15",
    employeeId: "e2",
    activity: "descarrendo a primeira carreta",
    date: "2026-06-18",
    startTime: "07:17",
    endTime: "07:44",
    totalHours: "0:27",
    notes: ""
  },

  // --- Mario ---
  {
    id: "mr1",
    employeeId: "e3",
    activity: "reunião",
    date: "2026-06-17",
    startTime: "07:00",
    endTime: "07:49",
    totalHours: "0:49",
    notes: ""
  },
  {
    id: "mr2",
    employeeId: "e3",
    activity: "Atendimento de reserva preparação",
    date: "2026-06-17",
    startTime: "07:49",
    endTime: "07:50",
    totalHours: "0:01",
    notes: ""
  },
  {
    id: "mr3",
    employeeId: "e3",
    activity: "Atendimento toalha",
    date: "2026-06-17",
    startTime: "07:50",
    endTime: "08:50",
    totalHours: "1:00",
    notes: ""
  },
  {
    id: "mr4",
    employeeId: "e3",
    activity: "Abrir tambores",
    date: "2026-06-17",
    startTime: "08:50",
    endTime: "10:46",
    totalHours: "1:56",
    notes: "Atendimento de reserva 5 vezes"
  },
  {
    id: "mr5",
    employeeId: "e3",
    activity: "Atendimento de reserva diversos",
    date: "2026-06-17",
    startTime: "10:46",
    endTime: "11:00",
    totalHours: "0:14",
    notes: ""
  },
  {
    id: "mr6",
    employeeId: "e3",
    activity: "Banheiro",
    date: "2026-06-17",
    startTime: "11:00",
    endTime: "11:30",
    totalHours: "0:30",
    notes: ""
  },
  {
    id: "mr7",
    employeeId: "e3",
    activity: "Almoço",
    date: "2026-06-17",
    startTime: "11:30",
    endTime: "12:30",
    totalHours: "1:00",
    notes: ""
  },
  {
    id: "mr8",
    employeeId: "e3",
    activity: "Atendimento de EPIs",
    date: "2026-06-17",
    startTime: "12:30",
    endTime: "13:15",
    totalHours: "0:45",
    notes: ""
  },
  {
    id: "mr9",
    employeeId: "e3",
    activity: "Atendimento de reservas",
    date: "2026-06-17",
    startTime: "13:15",
    endTime: "14:00",
    totalHours: "0:45",
    notes: ""
  },
  {
    id: "mr10",
    employeeId: "e3",
    activity: "Contagem de toalhas sujas",
    date: "2026-06-17",
    startTime: "14:00",
    endTime: "14:51",
    totalHours: "0:51",
    notes: ""
  },
  {
    id: "mr11",
    employeeId: "e3",
    activity: "Atendimento de reserva de EPIs",
    date: "2026-06-17",
    startTime: "14:51",
    endTime: "15:05",
    totalHours: "0:14",
    notes: ""
  },
  {
    id: "mr12",
    employeeId: "e3",
    activity: "Limpeza salão - varrer",
    date: "2026-06-17",
    startTime: "15:05",
    endTime: "15:35",
    totalHours: "0:30",
    notes: ""
  },
  {
    id: "mr13",
    employeeId: "e3",
    activity: "Atendimento de reserva de EPIs",
    date: "2026-06-17",
    startTime: "15:35",
    endTime: "15:50",
    totalHours: "0:15",
    notes: ""
  },
  {
    id: "mr14",
    employeeId: "e3",
    activity: "Atendimento de reserva de EPIs",
    date: "2026-06-17",
    startTime: "15:50",
    endTime: "16:10",
    totalHours: "0:20",
    notes: ""
  },
  {
    id: "mr15",
    employeeId: "e3",
    activity: "Limpeza salão - varrer",
    date: "2026-06-17",
    startTime: "16:10",
    endTime: "16:40",
    totalHours: "0:30",
    notes: ""
  },
  {
    id: "mr16",
    employeeId: "e3",
    activity: "Atendimento de reserva de EPIs",
    date: "2026-06-17",
    startTime: "16:40",
    endTime: "17:00",
    totalHours: "0:20",
    notes: "Fim do turno"
  },
  {
    id: "mr17",
    employeeId: "e3",
    activity: "Atendimento a reserva de alimentos",
    date: "2026-06-18",
    startTime: "07:00",
    endTime: "07:25",
    totalHours: "0:25",
    notes: ""
  },
  {
    id: "mr18",
    employeeId: "e3",
    activity: "Atendimento a troca de toalha",
    date: "2026-06-18",
    startTime: "07:25",
    endTime: "07:45",
    totalHours: "0:20",
    notes: ""
  },
  {
    id: "mr19",
    employeeId: "e3",
    activity: "Atendimento a reserva da 18L",
    date: "2026-06-18",
    startTime: "07:45",
    endTime: "08:00",
    totalHours: "0:15",
    notes: ""
  },
  {
    id: "mr20",
    employeeId: "e3",
    activity: "Atendimento a reserva preparação alíq.",
    date: "2026-06-18",
    startTime: "08:00",
    endTime: "08:19",
    totalHours: "0:19",
    notes: ""
  },

  // --- Agnes ---
  {
    id: "a1",
    employeeId: "e4",
    activity: "reunião",
    date: "2026-06-17",
    startTime: "07:00",
    endTime: "07:49",
    totalHours: "0:49",
    notes: ""
  },
  {
    id: "a2",
    employeeId: "e4",
    activity: "Atualização folhas virgem",
    date: "2026-06-17",
    startTime: "07:49",
    endTime: "08:45",
    totalHours: "0:56",
    notes: ""
  },
  {
    id: "a3",
    employeeId: "e4",
    activity: "Baixas reservas",
    date: "2026-06-17",
    startTime: "08:45",
    endTime: "09:48",
    totalHours: "1:03",
    notes: ""
  },
  {
    id: "a4",
    employeeId: "e4",
    activity: "Atualização planilhas de lote e inventário",
    date: "2026-06-17",
    startTime: "09:48",
    endTime: "10:00",
    totalHours: "0:12",
    notes: "https://rendasa-my.sharepoint.com/personal"
  },
  {
    id: "a5",
    employeeId: "e4",
    activity: "Renomeando arquivo de check list",
    date: "2026-06-17",
    startTime: "10:00",
    endTime: "11:00",
    totalHours: "1:00",
    notes: "interrompido para criar nota de moura"
  },
  {
    id: "a6",
    employeeId: "e4",
    activity: "Início de auxílio ao aprendiz",
    date: "2026-06-17",
    startTime: "11:00",
    endTime: "11:30",
    totalHours: "0:30",
    notes: ""
  },
  {
    id: "a7",
    employeeId: "e4",
    activity: "Almoço",
    date: "2026-06-17",
    startTime: "11:30",
    endTime: "12:30",
    totalHours: "1:00",
    notes: ""
  },
  {
    id: "a8",
    employeeId: "e4",
    activity: "Atualizando folhas virgem",
    date: "2026-06-17",
    startTime: "12:30",
    endTime: "13:09",
    totalHours: "0:39",
    notes: ""
  },
  {
    id: "a9",
    employeeId: "e4",
    activity: "Criando RC consignado",
    date: "2026-06-17",
    startTime: "13:09",
    endTime: "13:38",
    totalHours: "0:29",
    notes: ""
  },
  {
    id: "a10",
    employeeId: "e4",
    activity: "Baixando as reserva da manhã",
    date: "2026-06-17",
    startTime: "13:38",
    endTime: "14:30",
    totalHours: "0:52",
    notes: "Fim do turno"
  },
  {
    id: "a11",
    employeeId: "e4",
    activity: "Lançamento de vias cegas",
    date: "2026-06-18",
    startTime: "07:00",
    endTime: "08:11",
    totalHours: "1:11",
    notes: ""
  },
  {
    id: "a12",
    employeeId: "e4",
    activity: "lançamento interrompido para auxiliar aprendiz",
    date: "2026-06-18",
    startTime: "08:11",
    endTime: "08:25",
    totalHours: "0:14",
    notes: ""
  },
  {
    id: "a13",
    employeeId: "e4",
    activity: "Criando RC Delgo",
    date: "2026-06-18",
    startTime: "08:25",
    endTime: "08:36",
    totalHours: "0:11",
    notes: ""
  },

  // --- Anderson ---
  {
    id: "ad1",
    employeeId: "e5",
    activity: "reunião",
    date: "2026-06-17",
    startTime: "07:00",
    endTime: "07:49",
    totalHours: "0:49",
    notes: ""
  },
  {
    id: "ad2",
    employeeId: "e5",
    activity: "Análise da planilha de estoque",
    date: "2026-06-17",
    startTime: "07:49",
    endTime: "08:30",
    totalHours: "0:41",
    notes: ""
  },
  {
    id: "ad3",
    employeeId: "e5",
    activity: "Análise de pedidos em trânsito",
    date: "2026-06-17",
    startTime: "08:30",
    endTime: "09:15",
    totalHours: "0:45",
    notes: ""
  },
  {
    id: "ad4",
    employeeId: "e5",
    activity: "Ronda na fábrica",
    date: "2026-06-17",
    startTime: "09:15",
    endTime: "10:00",
    totalHours: "0:45",
    notes: ""
  },
  {
    id: "ad5",
    employeeId: "e5",
    activity: "Teste de novos processos SAP",
    date: "2026-06-17",
    startTime: "10:00",
    endTime: "10:45",
    totalHours: "0:45",
    notes: ""
  },
  {
    id: "ad6",
    employeeId: "e5",
    activity: "Conferência de materiais no almoxarifado",
    date: "2026-06-17",
    startTime: "10:45",
    endTime: "11:15",
    totalHours: "0:30",
    notes: ""
  },
  {
    id: "ad7",
    employeeId: "e5",
    activity: "Atualização de registros de entrada/saída (p",
    date: "2026-06-17",
    startTime: "12:15",
    endTime: "12:47",
    totalHours: "0:32",
    notes: ""
  },
  {
    id: "ad8",
    employeeId: "e5",
    activity: "Almoço",
    date: "2026-06-17",
    startTime: "12:47",
    endTime: "13:47",
    totalHours: "1:00",
    notes: ""
  },
  {
    id: "ad9",
    employeeId: "e5",
    activity: "Análise de pedido de rolhas",
    date: "2026-06-17",
    startTime: "13:47",
    endTime: "14:30",
    totalHours: "0:43",
    notes: ""
  },
  {
    id: "ad10",
    employeeId: "e5",
    activity: "Ronda na fábrica",
    date: "2026-06-17",
    startTime: "14:30",
    endTime: "15:30",
    totalHours: "1:00",
    notes: ""
  },
  {
    id: "ad11",
    employeeId: "e5",
    activity: "Análise de pedido de Geral",
    date: "2026-06-17",
    startTime: "15:30",
    endTime: "17:00",
    totalHours: "1:30",
    notes: ""
  },
  {
    id: "ad12",
    employeeId: "e5",
    activity: "lendo e respondendo e-mail",
    date: "2026-06-18",
    startTime: "07:00",
    endTime: "07:28",
    totalHours: "0:28",
    notes: ""
  },
  {
    id: "ad13",
    employeeId: "e5",
    activity: "Análise da planilha de estoque",
    date: "2026-06-18",
    startTime: "07:28",
    endTime: "07:50",
    totalHours: "0:22",
    notes: "Respondendo e-mail entre as tratativas"
  },
  {
    id: "ad14",
    employeeId: "e5",
    activity: "Rondas no Setor",
    date: "2026-06-18",
    startTime: "07:50",
    endTime: "08:05",
    totalHours: "0:15",
    notes: ""
  },
  {
    id: "ad15",
    employeeId: "e5",
    activity: "Analise bico 57 solicitção jarlison",
    date: "2026-06-18",
    startTime: "08:05",
    endTime: "08:20",
    totalHours: "0:15",
    notes: "Corrigido"
  },
  {
    id: "ad16",
    employeeId: "e5",
    activity: "Verificação de estoque físico folha 030",
    date: "2026-06-18",
    startTime: "08:20",
    endTime: "08:38",
    totalHours: "0:18",
    notes: "esque com diferença posistiva de uma farda"
  }
];

export const PRESET_ACTIVITIES: PresetActivity[] = [
  {
    employeeId: "e1",
    activities: [
      "reunião",
      "impressão de etiqueta",
      "Atendimento reserva preparação químico",
      "Atendimento reserva rolhas",
      "Atendimento reserva pré-impressão",
      "Iniciar contagem de folhas",
      "Arrumação de tintas",
      "tirar folhas virgem",
      "Atendimento reservas EPIs",
      "Almoço",
      "Organização das tintas no FIFO",
      "marcação de folhas",
      "Separando amostra dos PVC Twist para o CQ",
      "organizando o PVC e etiquetando"
    ]
  },
  {
    employeeId: "e2",
    activities: [
      "Atendimento de linha de montagem e troca de tc",
      "reunião",
      "Atendimento de reserva litografia Siri",
      "Iniciando o recebimento de Cazan",
      "Saída para troca do vidro do carro (saída dentro do turno)",
      "Recebimento de folhas",
      "Almoço",
      "Acompanha a coleta de cilindro da litografia",
      "Atendimento de reserva litografia",
      "Descarregando a primeira carreta",
      "Guarda dos tambores"
    ]
  },
  {
    employeeId: "e3",
    activities: [
      "reunião",
      "Atendimento de reserva preparação",
      "Atendimento toalha",
      "Abrir tambores",
      "Atendimento de reserva diversos",
      "Banheiro",
      "Almoço",
      "Atendimento de EPIs",
      "Atendimento de reservas",
      "Contagem de toalhas sujas",
      "Atendimento de reserva de EPIs",
      "Limpeza salão - varrer",
      "Atendimento a reserva de alimentos",
      "Atendimento a troca de toalha",
      "Atendimento a reserva da 18L",
      "Atendimento a reserva preparação alíq.",
      "organização do arquivo morto para arq..."
    ]
  },
  {
    employeeId: "e4",
    activities: [
      "reunião",
      "Atualização folhas virgem",
      "Baixas reservas",
      "Atualização planilhas de lote e inventário",
      "Renomeando arquivo de check list",
      "Início de auxílio ao aprendiz",
      "Almoço",
      "Criando RC consignado",
      "Baixando as reserva da manhã",
      "Lançamento de vias cegas",
      "lançamento interrompido para auxiliar aprendiz",
      "Criando RC Delgo",
      "lançamento de subcontratação"
    ]
  },
  {
    employeeId: "e5",
    activities: [
      "reunião",
      "Análise da planilha de estoque",
      "Análise de pedidos em trânsito",
      "Ronda na fábrica",
      "Teste de novos processos SAP",
      "Conferência de materiais no almoxarifado",
      "Atualização de registros de entrada/saída",
      "Almoço",
      "Análise de pedido de rolhas",
      "Análise de pedido de Geral",
      "lendo e respondendo e-mail",
      "Rondas no Setor",
      "Analise bico 57 solicitção jarlison",
      "Verificação de estoque físico folha 030"
    ]
  }
];

export function computeDuration(startTime: string, endTime: string | null): string {
  if (!endTime) return "--:--";
  try {
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    
    if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return "0:00";
    
    let diffMinutes = (eh * 60 + em) - (sh * 60 + sm);
    if (diffMinutes < 0) {
      // In case task went over midnight
      diffMinutes += 24 * 60;
    }
    const h = Math.floor(diffMinutes / 60);
    const m = diffMinutes % 60;
    return `${h}:${m.toString().padStart(2, "0")}`;
  } catch (err) {
    return "0:00";
  }
}

export function computeTotalMinutes(startTime: string, endTime: string | null): number {
  if (!endTime) return 0;
  try {
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    
    if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return 0;
    
    let diffMinutes = (eh * 60 + em) - (sh * 60 + sm);
    if (diffMinutes < 0) {
      diffMinutes += 24 * 60;
    }
    return diffMinutes;
  } catch (err) {
    return 0;
  }
}

export function formatMinutesToHM(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}:${m.toString().padStart(2, "0")}`;
}
