import type {
  AdministrativeProcessContext,
  AdministrativeProcessResult,
} from '../dto/administrative-process.types';
import fs from 'fs';
import path from 'path';

type FrontendCoreModule = {
  runAdministrativeProcess: (
    context: AdministrativeProcessContext
  ) => Promise<AdministrativeProcessResult>;
  executeAiAssistiveRefinement?: (request: Record<string, unknown>) => Record<string, unknown>;
  AI_ASSISTIVE_MODEL_VERSION?: string;
  AI_ASSISTIVE_PROMPT_VERSION?: string;
  AI_ASSISTIVE_TRANSFORM_PROFILE_VERSION?: string;
};

let cachedFrontendCore: FrontendCoreModule | null = null;
let cachedRuntimeInfo: FrontendCoreRuntimeInfo | null = null;

type RuntimeMode = 'source' | 'compiled' | 'auto';

export interface FrontendCoreRuntimeInfo {
  mode: 'source' | 'compiled';
  entry: string;
  usedTsNodeRegister: boolean;
}

function resolvePaths() {
  const backendRoot = path.resolve(__dirname, '..', '..');
  const monorepoRoot = path.resolve(backendRoot, '..', '..');
  const sourceEntry = path.resolve(monorepoRoot, '02-frontend', 'licitaia-v2-web', 'modules');
  const compiledEntry = path.resolve(backendRoot, 'runtime', 'frontend-core', 'index.js');

  return { sourceEntry, compiledEntry };
}

function loadFromCompiled(entry: string): FrontendCoreModule {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require(entry) as FrontendCoreModule;
  if (!mod || typeof mod.runAdministrativeProcess !== 'function') {
    throw new Error(`Runtime compilado invalido: ${entry}`);
  }
  cachedRuntimeInfo = {
    mode: 'compiled',
    entry,
    usedTsNodeRegister: false,
  };
  return mod;
}

function loadFromSource(entry: string): FrontendCoreModule {
  // Regra estrutural: src e a fonte de verdade do motor.
  // Em ambiente local/dev, registramos ts-node para executar o nucleo TS diretamente.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('ts-node/register/transpile-only');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require(entry) as FrontendCoreModule;

  if (!mod || typeof mod.runAdministrativeProcess !== 'function') {
    throw new Error(
      `Falha ao carregar nucleo frontend por src: runAdministrativeProcess indisponivel em ${entry}.`
    );
  }

  cachedRuntimeInfo = {
    mode: 'source',
    entry,
    usedTsNodeRegister: true,
  };
  return mod;
}

function loadFrontendCore(): FrontendCoreModule {
  if (cachedFrontendCore) {
    return cachedFrontendCore;
  }

  const { sourceEntry, compiledEntry } = resolvePaths();
  const rawMode = (process.env['FRONTEND_CORE_RUNTIME_MODE'] ?? 'auto').toLowerCase();
  const mode: RuntimeMode = rawMode === 'source' || rawMode === 'compiled' ? rawMode : 'auto';

  if (mode === 'compiled') {
    if (!fs.existsSync(compiledEntry)) {
      throw new Error(
        `FRONTEND_CORE_RUNTIME_MODE=compiled exige artefato em ${compiledEntry}. Execute: npm run build`
      );
    }
    cachedFrontendCore = loadFromCompiled(compiledEntry);
    return cachedFrontendCore;
  }

  if (mode === 'auto' && fs.existsSync(compiledEntry)) {
    cachedFrontendCore = loadFromCompiled(compiledEntry);
    return cachedFrontendCore;
  }

  cachedFrontendCore = loadFromSource(sourceEntry);
  return cachedFrontendCore;
}

export function getRunAdministrativeProcess() {
  return loadFrontendCore().runAdministrativeProcess;
}

export function getFrontendCoreAssistive() {
  return loadFrontendCore();
}

export function getFrontendCoreRuntimeInfo(): FrontendCoreRuntimeInfo {
  if (!cachedRuntimeInfo) {
    loadFrontendCore();
  }
  return cachedRuntimeInfo as FrontendCoreRuntimeInfo;
}

