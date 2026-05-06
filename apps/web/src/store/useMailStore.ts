import { create } from 'zustand';

export interface Email {
  id: string;
  messageId: string;
  from: string;
  subject: string;
  snippet: string;
  date: string;
  formattedDate: string;
  isUnread: boolean;
  labelIds: string[];
}

export interface Label {
  id: string;
  gmailId: string;
  name: string;
  type: string;
  color?: string | null;
}

interface MailStore {
  // Emails
  emails: Email[];
  setEmails: (emails: Email[]) => void;
  selectedEmail: Email | null;
  setSelectedEmail: (email: Email | null) => void;

  // Labels
  labels: Label[];
  setLabels: (labels: Label[]) => void;

  // Loading & Sync States
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isSyncing: boolean;
  setIsSyncing: (syncing: boolean) => void;
}

export const useMailStore = create<MailStore>((set) => ({
  emails: [],
  setEmails: (emails) => set({ emails }),

  selectedEmail: null,
  setSelectedEmail: (email) => set({ selectedEmail: email }),

  labels: [],
  setLabels: (labels) => set({ labels }),

  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),

  isSyncing: false,
  setIsSyncing: (isSyncing) => set({ isSyncing }),
}));
