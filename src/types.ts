/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TaskAttachment {
  id: string;
  type: "photo" | "video";
  url: string; // Base64 ou blob-url
  timestamp: string;
}

export interface Task {
  id: string;
  employeeId: string;
  activity: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string | null; // HH:MM, null if currently running
  totalHours: string; // Calculated HH:MM or decimal hours, e.g. "0:44"
  notes: string;
  attachments?: TaskAttachment[];
}

export interface Employee {
  id: string;
  name: string;
  role?: string;
}

export interface PresetActivity {
  employeeId: string;
  activities: string[];
}
