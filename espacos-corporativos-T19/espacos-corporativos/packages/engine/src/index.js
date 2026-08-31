// index.js — API pública do pacote @espacos/engine
export { gerarAlocacao, VERSAO_MOTOR } from './allocationEngine.js';
export { gerarBaseline } from './baseline.js';
export { calcularMetricas } from './metrics.js';
export { checarRestricoesRigidas } from './constraints.js';
export { pontuarSala, PESOS } from './scoring.js';
