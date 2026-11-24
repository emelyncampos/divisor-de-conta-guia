# Divisor de Conta

Exemplo do **Guia para o Primeiro App**: um aplicativo que divide a conta do restaurante entre várias pessoas, com taxa de serviço opcional e os centavos distribuídos sem diferença no total.

Tudo fica em um único arquivo, `index.html`: HTML (a estrutura), CSS (a aparência) e JavaScript (o cálculo). Não tem servidor, banco de dados, login nem nada salvo.

## Como abrir

- **No navegador:** dê dois cliques no `index.html`. Ele abre e funciona sem internet.
- **Publicado:** https://emelyncampos.com.br/divisor-de-conta-guia/

## Como usar

1. **Valor da conta:** aceita `1234,56`, `1.234,56` ou `1234.56`. `1.234` (ponto seguido de 3 números) vale mil duzentos e trinta e quatro.
2. **Número de pessoas:** inteiro de 1 a 99.
3. **Taxa de serviço (%):** começa em 0. O botão **10%** coloca 10. Aceita decimais, como `10,5`.

O resultado aparece sozinho. No celular, o botão **Ver a divisão** (ou o "Ir/OK" do teclado) leva até ele.

## Como o cálculo funciona

1. Tudo é feito em **centavos inteiros**, para não existir erro de arredondamento escondido.
2. **Total = valor + taxa**, arredondado aos centavos ("meio para cima": 50,545 vira 50,55).
3. Todos pagam o mesmo valor-base. Os centavos que sobram vão, 1 a 1, para algumas pessoas.
4. Por isso **a soma das partes é sempre igual ao total**. Exemplo: R$ 100,00 para 3 pessoas = R$ 33,33 + R$ 33,33 + R$ 33,34.

## Como o código está organizado (`index.html`)

- `<style>`: aparência, com comentários por seção.
- `<script>` **PARTE 1 — lógica**: lê os campos, valida e calcula. Não mexe na tela.
- `<script>` **PARTE 2 — tela**: mostra os erros embaixo de cada campo e o resultado.

## Como testar

Precisa só do [Node.js](https://nodejs.org) 20 ou mais novo. Não há nada para instalar.

```
node --test tests/logica.test.mjs
```

Os testes leem as funções da PARTE 1 direto do `index.html`. Conferem:

- os cálculos oficiais;
- o arredondamento;
- os formatos aceitos e recusados;
- todas as mensagens de erro;
- 20.000 combinações aleatórias comparadas com um cálculo feito de outro jeito.

**Teste manual rápido no celular:**

| Teste | Resultado esperado |
|---|---|
| Valor vazio | Aviso |
| Valor 0 | "O valor da conta deve ser maior que zero." |
| −50 | Aviso |
| abc | Aviso |
| 1.234,56 com 2 pessoas | R$ 617,28 cada |
| 0 pessoas | Aviso |
| 2,5 pessoas | Aviso |
| 100 pessoas | Aviso |
| R$ 100,00 com 3 pessoas | 2 × R$ 33,33 + 1 × R$ 33,34 |
