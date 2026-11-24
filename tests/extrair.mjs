// Carrega as funções de cálculo direto do index.html (PARTE 1 do script),
// sem mudar o app e sem expor nada no navegador. Não precisa instalar nada.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

export function carregarLogica(caminho = new URL('../index.html', import.meta.url)) {
  const html = readFileSync(caminho, 'utf8');
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const inicio = script.indexOf('PARTE 1');
  const fim = script.indexOf('PARTE 2');
  if (inicio < 0 || fim < 0) throw new Error('Não achei as marcações PARTE 1 / PARTE 2 no index.html');
  const trecho = script.slice(script.indexOf('\n', inicio), script.lastIndexOf('//', fim));
  const codigo = trecho + '\n;({ parseMoneyToCents, parsePeople, parsePercent, roundHalfUp, formatCents, calculateSplit })';
  return vm.runInNewContext(codigo, { Intl, BigInt, Number, String });
}
