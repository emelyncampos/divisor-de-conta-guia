// Testes da lógica do Divisor de Conta. Rodar com:  node --test tests/logica.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { carregarLogica } from './extrair.mjs';

const L = carregarLogica(process.env.APP);
const fmt = (c) => L.formatCents(c).replace(/\u00a0/g, ' ');   // troca o espaço que não quebra por espaço comum
const partes = (r) => [...Array(r.regularCount).fill(r.baseCents), ...Array(r.extraCount).fill(r.extraCents)];
const soma = (r) => partes(r).reduce((a, b) => a + b, 0n);

function caso(valor, pessoas, taxa, totalEsperado, distribuicao) {
  const r = L.calculateSplit(valor, pessoas, taxa);
  assert.equal(r.ok, true, r.error);
  assert.equal(fmt(r.totalCents), totalEsperado);
  assert.equal(soma(r), r.totalCents, 'a soma das partes tem que ser igual ao total');
  const d = {};
  for (const p of partes(r)) d[fmt(p)] = (d[fmt(p)] || 0) + 1;
  assert.deepEqual(d, distribuicao);
}
const erro = (r) => (assert.equal(r.ok, false), r.error);

// ---- Casos da auditoria ----
test('100,00 ÷ 3', () => caso('100,00', '3', '0', 'R$ 100,00', { 'R$ 33,33': 2, 'R$ 33,34': 1 }));
test('100,00 ÷ 4', () => caso('100,00', '4', '0', 'R$ 100,00', { 'R$ 25,00': 4 }));
test('1.234,56 ÷ 2', () => caso('1.234,56', '2', '0', 'R$ 1.234,56', { 'R$ 617,28': 2 }));
test('10,00 ÷ 3', () => caso('10,00', '3', '0', 'R$ 10,00', { 'R$ 3,33': 2, 'R$ 3,34': 1 }));
test('0,01 ÷ 3', () => caso('0,01', '3', '0', 'R$ 0,01', { 'R$ 0,00': 2, 'R$ 0,01': 1 }));
test('100,00 ÷ 3 + 10%', () => caso('100,00', '3', '10', 'R$ 110,00', { 'R$ 36,66': 1, 'R$ 36,67': 2 }));
test('100,00 ÷ 3 + 10,5%', () => caso('100,00', '3', '10,5', 'R$ 110,50', { 'R$ 36,83': 2, 'R$ 36,84': 1 }));

// ---- Casos oficiais T1–T10 (validação de 22/11/2026) ----
test('T1–T10 (valores oficiais)', () => {
  caso('100,00', '4', '0', 'R$ 100,00', { 'R$ 25,00': 4 });
  caso('100,00', '4', '10', 'R$ 110,00', { 'R$ 27,50': 4 });
  caso('50,00', '1', '10', 'R$ 55,00', { 'R$ 55,00': 1 });
  caso('45,90', '2', '0', 'R$ 45,90', { 'R$ 22,95': 2 });
  caso('1.234,56', '2', '0', 'R$ 1.234,56', { 'R$ 617,28': 2 });
  caso('200,00', '3', '0', 'R$ 200,00', { 'R$ 66,66': 1, 'R$ 66,67': 2 });
  caso('87,50', '2', '10', 'R$ 96,25', { 'R$ 48,12': 1, 'R$ 48,13': 1 });
  caso('59,90', '3', '10', 'R$ 65,89', { 'R$ 21,96': 2, 'R$ 21,97': 1 });
  caso('1.000,00', '7', '10', 'R$ 1.100,00', { 'R$ 157,14': 5, 'R$ 157,15': 2 });
});

test('arredondamento meio para cima do total com taxa', () => {
  caso('45,95', '1', '10', 'R$ 50,55', { 'R$ 50,55': 1 });   // 50,545 → 50,55
  caso('0,05', '1', '10', 'R$ 0,06', { 'R$ 0,06': 1 });     // 0,055 → 0,06
  caso('0,04', '1', '10', 'R$ 0,04', { 'R$ 0,04': 1 });     // 0,044 → 0,04
  caso('100,00', '1', '12,34', 'R$ 112,34', { 'R$ 112,34': 1 });
  caso('33,33', '1', '0,5', 'R$ 33,50', { 'R$ 33,50': 1 });   // 33,49665 → 33,50
});

// ---- Formatos do valor (etapa 2: aceita 1234,56 · 1.234,56 · 1234.56) ----
test('formatos aceitos', () => {
  const aceitos = [
    ['1234,56', 123456n], ['1.234,56', 123456n], ['1234.56', 123456n],
    ['45.9', 4590n], ['45,9', 4590n], ['0.5', 50n], ['0,01', 1n],
    ['100', 10000n], ['1.000', 100000n], ['1.234', 123400n], ['1.000.000,01', 100000001n],
    ['  12,30  ', 1230n], ['007', 700n],
  ];
  for (const [v, c] of aceitos) assert.equal(L.parseMoneyToCents(v).cents, c, v);
});
test('formatos ambíguos ou inválidos continuam recusados', () => {
  for (const v of ['abc', '12a', '1,234', '1.234.56', '1234.567', '1,234.56', '1.234.567.89', '12.34.56', 'R$ 10', '1 000', ',50', '.50', '1,', '1.', '1e3', '+5', '−50', '10%'])
    assert.equal(L.calculateSplit(v, '2', '0').ok, false, v);
});

// ---- Validação ----
test('validação do valor', () => {
  assert.match(erro(L.calculateSplit('', '2', '0')), /Informe o valor/);
  assert.match(erro(L.calculateSplit('   ', '2', '0')), /Informe o valor/);
  assert.match(erro(L.calculateSplit('-50,00', '2', '0')), /negativo/);
  assert.match(erro(L.calculateSplit('abc', '2', '0')), /Valor inválido/);
});
test('valor zero é recusado (etapa 2)', () => {
  for (const v of ['0', '0,00', '0.00', '0,0', '000'])
    assert.equal(erro(L.calculateSplit(v, '2', '0')), 'O valor da conta deve ser maior que zero.', v);
});
test('validação de pessoas', () => {
  assert.match(erro(L.calculateSplit('100', '', '0')), /Informe o número/);
  assert.match(erro(L.calculateSplit('100', '0', '0')), /não pode ser 0/);
  assert.match(erro(L.calculateSplit('100', '2,5', '0')), /sem decimais/);
  assert.match(erro(L.calculateSplit('100', '2.5', '0')), /sem decimais/);
  assert.match(erro(L.calculateSplit('100', '100', '0')), /1 a 99/);
  assert.match(erro(L.calculateSplit('100', '-2', '0')), /1 a 99/);
  assert.match(erro(L.calculateSplit('100', 'dois', '0')), /1 a 99/);
  assert.equal(L.calculateSplit('100', '99', '0').ok, true);
  assert.equal(L.calculateSplit('100', '1', '0').ok, true);
});
test('validação da taxa', () => {
  assert.match(erro(L.calculateSplit('100', '2', '-10')), /negativa/);
  assert.match(erro(L.calculateSplit('100', '2', 'dez')), /Taxa inválida/);
  assert.match(erro(L.calculateSplit('100', '2', '10,555')), /Taxa inválida/);
  assert.match(erro(L.calculateSplit('100', '2', '10%')), /Taxa inválida/);   // decisão: sem símbolo %
  assert.equal(L.calculateSplit('100', '2', '').ok, true, 'taxa vazia = 0');
  assert.equal(L.calculateSplit('100', '2', '10.5').ok, true);
  assert.equal(fmt(L.calculateSplit('100', '1', '250').totalCents), 'R$ 350,00', 'sem limite de taxa (decisão)');
});
test('"R$" nunca separa do número', () => {
  assert.match(L.formatCents(123456n), /^R\$\u00a0/);
});

// ---- Propriedade: 20 mil combinações contra um cálculo independente ----
test('propriedade: 20.000 combinações (total, soma e diferença de no máximo 1 centavo)', () => {
  let seed = 42;
  const rnd = (n) => (seed = (seed * 1103515245 + 12345) % 2147483648) % n;
  for (let i = 0; i < 20000; i++) {
    const cents = 1n + BigInt(rnd(10_000_000));
    const pessoas = 1 + rnd(99);
    const taxaCentesimos = BigInt(rnd(3001));            // 0,00% a 30,00%
    const valor = `${cents / 100n},${String(cents % 100n).padStart(2, '0')}`;
    const taxa = `${taxaCentesimos / 100n},${String(taxaCentesimos % 100n).padStart(2, '0')}`;
    const r = L.calculateSplit(valor, String(pessoas), taxa);
    assert.equal(r.ok, true, `${valor} ${pessoas} ${taxa}`);
    const esperado = (cents * (10000n + taxaCentesimos) * 2n + 10000n) / 20000n;   // arredondamento meio para cima
    assert.equal(r.totalCents, esperado);
    assert.equal(soma(r), r.totalCents);
    assert.equal(r.regularCount + r.extraCount, pessoas);
    assert.ok(r.extraCount < pessoas);
    // o mesmo valor escrito com ponto decimal dá o mesmo resultado
    const comPonto = L.calculateSplit(valor.replace(',', '.'), String(pessoas), taxa);
    assert.equal(comPonto.totalCents, r.totalCents);
  }
});
