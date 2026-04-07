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
  executeLoading: boolean;
  executeError: string | null;
  executeSuccess: string | null;

  loadProcesses: () => Promise<void>;
  createProcess: () => Promise<string>;
  loadProcess: (processId: string) => Promise<void>;
  executeProcessAction: (action: string) => Promise<void>;
  clearExecuteFeedback: () => void;
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
  executeLoading: false,
  executeError: null,
  executeSuccess: null,

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

  executeProcessAction: async (action: string) => {
    const current = useProcessStore.getState().current;
    if (!current) {
      const msg = "Processo ainda não carregado para execução de ação.";
      set({ executeError: msg, executeSuccess: null });
      throw new Error(msg);
    }

    const revisionRaw = current.state.revision;
    const renderTokenRaw = current.state.renderToken;
    const expectedRevision =
      typeof revisionRaw === "number"
        ? revisionRaw
        : typeof revisionRaw === "string"
          ? Number(revisionRaw)
          : NaN;
    const expectedRenderToken =
      typeof renderTokenRaw === "string" ? renderTokenRaw : "";

    if (!Number.isFinite(expectedRevision) || !expectedRenderToken) {
      const msg =
        "Snapshot sem guard válido (revision/renderToken). Recarregue o processo e tente novamente.";
      set({ executeError: msg, executeSuccess: null });
      throw new Error(msg);
    }

    set({ executeLoading: true, executeError: null, executeSuccess: null, detailError: null });
    try {
      await processService.executeAdministrativeProcessAction({
        processId: current.process.id,
        action,
        guard: {
          expectedRevision,
          expectedRenderToken,
        },
        updates: [],
      });

      const refreshed = await processService.getAdministrativeProcess(current.process.id);
      set({
        current: refreshed,
        executeLoading: false,
        executeSuccess: `Ação ${action} executada com sucesso.`,
      });
    } catch (e) {
      const msg = getApiErrorMessage(e, "Não foi possível executar a ação do fluxo.");
      set({
        executeError: msg,
        executeSuccess: null,
        executeLoading: false,
      });
      throw new Error(msg);
    }
  },

  clearExecuteFeedback: () => {
    set({ executeError: null, executeSuccess: null });
  },

  clearDetail: () => {
    set({
      current: null,
      detailError: null,
      detailLoading: false,
      executeLoading: false,
      executeError: null,
      executeSuccess: null,
    });
  },
}));
