# SaveTimeForME

SaveTimeForME é uma calculadora inicial para pessoas empreendedoras estimarem quanto tempo uma tarefa recorrente pode recuperar com apoio de IA. Ela organiza um primeiro teste seguro: mostra a estimativa, classifica a oportunidade e propõe um piloto de 7 dias com revisão humana.

## Como funciona

1. Informe seu nome, e-mail e confirme a autorização para registrar o contato e a estimativa.
2. Informe uma tarefa repetitiva, quantas vezes ela ocorre por semana, os minutos por ocorrência e o apoio de IA esperado.
3. Veja uma estimativa de horas atuais e recuperáveis por mês.
4. Use o plano de 7 dias para testar 10 casos reais, comparar tempo, qualidade e retrabalho, e decidir entre parar, ajustar ou repetir.

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

Para salvar contatos e estimativas localmente, defina `DATABASE_URL` com uma conexão PostgreSQL. O arquivo [.env.example](/Users/rodrigoterron/.codex/.chatgpt-projects/g-p-6a8388e2bc8481919e0e630d3e272e69/.env.example) mostra o formato. Como este projeto já está vinculado ao Railway, também é possível usar as variáveis remotas durante o desenvolvimento:

```bash
railway run npm run dev
```

## Comandos de validação

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

O endpoint `GET /api/health` responde `{ "ok": true }` e pode ser usado como verificação de saúde no deploy.

## Privacidade

A aplicação não cria conta nem chama serviços de IA. Ao marcar a autorização e calcular, ela envia e grava no PostgreSQL do projeto o nome, e-mail, tarefa, valores usados, resultado e data de consentimento. Esses dados servem para contato e acompanhamento das estimativas.

Não inclua dados confidenciais no campo de tarefa. O rascunho da rotina e o resultado também ficam no `localStorage` deste navegador para facilitar a retomada; nome e e-mail não ficam nesse armazenamento local. O botão **Apagar rascunho local** remove apenas o rascunho deste navegador. O botão **Copiar resumo** só coloca o texto na área de transferência do seu dispositivo, após a sua ação.

## Deploy no Railway

O deploy usa `railway.json`, com `npm run start` e healthcheck em `/api/health`. O PostgreSQL é conectado ao app por uma variável de referência `DATABASE_URL=${{Postgres.DATABASE_URL}}`; a credencial não fica no repositório.

1. No Railway, crie um projeto e conecte o serviço ao repositório GitHub na branch `main`.
2. Adicione PostgreSQL ao projeto.
3. No serviço da aplicação, adicione a referência `DATABASE_URL=${{Postgres.DATABASE_URL}}`.
4. Após o deploy, confirme o endereço `https://seu-dominio/api/health`; ele deve retornar `{ "ok": true }`.

O Railway fornece a porta da aplicação automaticamente. A tabela `estimates` é criada de forma segura no primeiro envio bem-sucedido.
