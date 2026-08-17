# SaveTimeForME

SaveTimeForME é uma calculadora inicial para pessoas empreendedoras estimarem quanto tempo uma tarefa recorrente pode recuperar com apoio de IA. Ela organiza um primeiro teste seguro: mostra a estimativa, classifica a oportunidade e propõe um piloto de 7 dias com revisão humana.

## Como funciona

1. Informe uma tarefa repetitiva, quantas vezes ela ocorre por semana, os minutos por ocorrência e o apoio de IA esperado.
2. Veja uma estimativa de horas atuais e recuperáveis por mês.
3. Use o plano de 7 dias para testar 10 casos reais, comparar tempo, qualidade e retrabalho, e decidir entre parar, ajustar ou repetir.

Esta calculadora oferece uma estimativa inicial. Ela não promete economia garantida.

## Fórmula

- Horas atuais/mês: `(frequência semanal × minutos por ocorrência × 4,33) ÷ 60`
- Horas recuperáveis/mês: `horas atuais/mês × percentual de apoio esperado`

Os dois valores são arredondados para uma casa decimal. A faixa usa as horas recuperáveis: menos de 4 horas é ganho pequeno; de 4 a 12 horas é bom piloto; mais de 12 horas é prioridade forte.

Exemplo: 1 vez por semana, 60 minutos e 50% de apoio resulta em 4,3 horas atuais e 2,2 horas recuperáveis por mês.

## Executar localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Comandos de validação

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

O endpoint `GET /api/health` responde `{ "ok": true }` e pode ser usado como verificação de saúde no deploy.

## Privacidade

A aplicação não pede cadastro, não envia respostas para um servidor e não chama serviços de IA. Tarefa, valores preenchidos e estimativa ficam somente no `localStorage` deste navegador para que você possa retomar o cálculo depois. O botão **Apagar tudo** remove esse rascunho e a estimativa. O botão **Copiar resumo** só coloca o texto na área de transferência do seu dispositivo, após a sua ação.

## Deploy no Railway

Esta versão não requer variáveis de ambiente, portanto não é necessário criar um arquivo `.env.example`.

1. Envie o projeto a um repositório GitHub.
2. No Railway, crie um projeto e escolha **Deploy from GitHub Repo**.
3. Selecione o repositório e mantenha os comandos padrão: build `npm run build` e start `npm run start`.
4. Após o deploy, confirme o endereço `https://seu-dominio/api/health`; ele deve retornar `{ "ok": true }`.

O Railway fornece a porta da aplicação automaticamente. Não há banco de dados, credenciais ou serviços adicionais para configurar nesta versão.
