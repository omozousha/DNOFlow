'use client';
// Status Configuration Helper
import React from "react";
import { 
  FolderKanban, 
  CheckCircle2, 
  Clock, 
  XCircle,
  PlayCircle,
  Calendar
} from "lucide-react";

export interface StatusConfig {
  icon: React.ReactNode;
  bgColor: string;
  borderColor: string;
  textColor: string;
}

export function getStatusConfig(key: string): StatusConfig {
  const configs: Record<string, StatusConfig> = {
    total: {
      icon: <FolderKanban className="h-5 w-5 text-blue-600" />,
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      borderColor: 'border-blue-500',
      textColor: 'text-blue-600',
    },
    done: {
      icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
      bgColor: 'bg-green-50 dark:bg-green-950',
      borderColor: 'border-green-500',
      textColor: 'text-green-600',
    },
    construction: {
      icon: <PlayCircle className="h-5 w-5 text-blue-600" />,
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      borderColor: 'border-blue-500',
      textColor: 'text-blue-600',
    },
    ny_construction: {
      icon: <Clock className="h-5 w-5 text-purple-600" />,
      bgColor: 'bg-purple-50 dark:bg-purple-950',
      borderColor: 'border-purple-500',
      textColor: 'text-purple-600',
    },
    rescheduled: {
      icon: <Calendar className="h-5 w-5 text-amber-600" />,
      bgColor: 'bg-amber-50 dark:bg-amber-950',
      borderColor: 'border-amber-500',
      textColor: 'text-amber-600',
    },
    cancel: {
      icon: <XCircle className="h-5 w-5 text-red-600" />,
      bgColor: 'bg-red-50 dark:bg-red-950',
      borderColor: 'border-red-500',
      textColor: 'text-red-600',
    },
  };

  return configs[key] || configs.total;
}

// Status Key Mapping
export const statusKeyMap: Record<string, string> = {
  'total': 'total',
  'rescheduled': 'rescheduled',
  'cancel': 'cancel',
  'done': 'done',
  'construction': 'construction',
  'ny_construction': 'ny_construction',
  'pending 2026': 'rescheduled',
  'pending': 'rescheduled',
  'canceled': 'cancel',
  'archived': 'cancel',
  'finished': 'done',
  'completed': 'done',
  'in progress': 'construction',
  'not yet construction': 'ny_construction',
  'ny construction': 'ny_construction',
};
