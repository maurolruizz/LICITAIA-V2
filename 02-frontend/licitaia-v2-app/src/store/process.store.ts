import { create } from "zustand";
import { getApiErrorMessage } from "@/lib/api-envelope";
import * as processService from "@/services/process.service";

type ProcessStore = {
  items: processService.ProcessExecutionSummary[];
  listLoading: boolean;
  listError: string | null;

  createLoading: boolean;
  createError: string | null;

  current: processService.GetProcessResult | null;
  detailLoading: boolean;
  detailError: string | null;

  loadProcesses: () => Promise<void>;
  createProcess: () => Promise<string>;
  loadProcess: (processId: string) => Promise<void>;
  clearDetail: () => void;
};

export const useProcessStore = create<ProcessStore>((set) => ({
  items: [],
  listLoading: false,
  listError: null,

  createLoading: false,
  createError: null,

  current: null,
  detailLoading: false,
  detailError: null,

  loadProcesses: async () => {
    set({ listLoading: true, listError: null });
    try {
      const { items } = await processService.listProcessExecutions(50);
      set({ items, listLoading: false });
    } catch (e) {
      set({
        listError: getApiErrorMessage(e, "Não foi possível carregar as execuções."),
        listLoading: false,
      });
    }
  },

  createProcess: async () => {
    set({ createLoading: true, createError: null });
    try {
      const { process } = await processService.createAdministrativeProcess({});
      set({ createLoading: false });
      return process.id;
    } catch (e) {
      const msg = getApiErrorMessage(e, "Não foi possível criar o processo.");
      set({ createError: msg, createLoading: false });
      throw new Error(msg);
    }
  },

  loadProcess: async (processId: string) => {
    set({ detailLoading: true, detailError: null, current: null });
    try {
      const current = await processService.getAdministrativeProcess(processId);
      set({ current, detailLoading: false });
    } catch (e) {
      set({
        detailError: getApiErrorMessage(e, "Não foi possível carregar o processo."),
        detailLoading: false,
      });
    }
  },

  clearDetail: () => {
    set({ current: null, detailError: null, detailLoading: false });
  },
}));
