# Prompt de Desenvolvimento - Sistema de Comunicacao via WhatsApp (Evolution API)

> Documentacao completa do modulo de comunicacao implementado no projeto CaixaJunto (Juntix).
> Use este documento como referencia para replicar o sistema em outro projeto.

---

## 1. Visao Geral

Sistema completo de comunicacao automatica via WhatsApp usando **Evolution API v2**.
O modulo gerencia envio de mensagens automaticas (texto, imagem, documento), filas com BullMQ/Redis, cron jobs diarios, historico de mensagens em MongoDB, e painel administrativo no frontend.

### Stack Tecnologica

| Camada | Tecnologia |
|--------|-----------|
| Backend | NestJS (TypeScript) |
| Banco de Dados | MongoDB (Mongoose) |
| Fila de Mensagens | BullMQ + Redis |
| API WhatsApp | Evolution API v2 |
| Frontend | React + TypeScript + Vite |
| HTTP Client | Axios |
| Cron/Scheduler | @nestjs/schedule |
| Dashboard de Filas | @bull-board/nestjs |

### Dependencias NPM (Backend)

```json
{
  "@nestjs/bullmq": "^11.0.4",
  "bullmq": "^5.67.2",
  "@bull-board/nestjs": "^6.16.4",
  "@bull-board/api": "^6.16.4",
  "@nestjs/schedule": "^6.1.0",
  "ioredis": "^5.8.2",
  "axios": "^1.13.4",
  "mongoose": "^8.20.2",
  "@nestjs/mongoose": "^11.0.3",
  "@nestjs/config": "^4.0.2"
}
```

---

## 2. Variaveis de Ambiente

```env
# Evolution API
EVOLUTION_BASE_URL=https://evo2.wastezero.com.br
EVOLUTION_INSTANCE_NAME=JUNTIX
EVOLUTION_API_KEY=80177F674F92-4A40-A533-F26BC35BAB1C

# Documentos (URLs publicas para PDFs)
DOCUMENT_CONTRACT_URL=https://exemplo.com/contrato.pdf
DOCUMENT_TERMS_URL=https://exemplo.com/termos.pdf

# Redis (para BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379

# MongoDB
MONGODB_URI=mongodb://localhost:27017/caixajunto
```

---

## 3. Estrutura de Arquivos (Backend)

```
src/modules/comunicacao/
├── comunicacao.module.ts            # Modulo NestJS - registra providers, imports, exports
├── comunicacao.controller.ts        # Endpoints REST da API
├── comunicacao.service.ts           # Logica principal de envio + templates de mensagens
├── constants/
│   └── queue.constants.ts           # Nome da fila e eventos
├── interfaces/
│   └── whatsapp-job.interface.ts    # Tipagem dos jobs da fila
├── schemas/
│   ├── mensagem-historico.schema.ts # Schema MongoDB - historico de mensagens
│   └── log-comunicacao.schema.ts    # Schema MongoDB - logs detalhados
├── services/
│   ├── evolution-api.service.ts     # Integracao direta com Evolution API
│   └── comunicacao-logger.service.ts# Logger estruturado de comunicacao
├── workers/
│   └── whatsapp.worker.ts           # Worker BullMQ que processa a fila
└── cron/
    └── comunicacao.cron.ts          # Job agendado diario (09:00)
```

---

## 4. Configuracao do Modulo NestJS

```typescript
// comunicacao.module.ts
@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: MensagemHistorico.name, schema: MensagemHistoricoSchema },
      { name: LogComunicacao.name, schema: LogComunicacaoSchema },
      // ... outros schemas do dominio (Pagamento, Caixa, Participante, etc)
    ]),
    BullModule.registerQueue({
      name: 'whatsapp',  // WHATSAPP_QUEUE
    }),
    BullBoardModule.forFeature({
      name: 'whatsapp',
      adapter: BullMQAdapter,  // Dashboard visual da fila
    }),
  ],
  providers: [
    ComunicacaoService,
    EvolutionApiService,
    WhatsappWorker,
    ComunicacaoCron,
    ComunicacaoLoggerService,
  ],
  controllers: [ComunicacaoController],
  exports: [ComunicacaoService, EvolutionApiService],
})
export class ComunicacaoModule {}
```

**No AppModule, registrar BullMQ e ScheduleModule globalmente:**

```typescript
// app.module.ts
@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    ScheduleModule.forRoot(),
    // Bull Board (dashboard de filas)
    BullBoardModule.forRoot({
      route: '/admin/queues',
      adapter: ExpressAdapter,
    }),
    ComunicacaoModule,
    // ... outros modulos
  ],
})
export class AppModule {}
```

---

## 5. Schemas MongoDB

### 5.1 MensagemHistorico (Historico de Mensagens)

Collection: `mensagem_historicos`

```typescript
// schemas/mensagem-historico.schema.ts

export enum TipoMensagem {
  BOAS_VINDAS = 'boas_vindas',
  LEMBRETE_PAGAMENTO = 'lembrete_pagamento',
  CONFIRMACAO_PAGAMENTO = 'confirmacao_pagamento',
  ALERTA_ATRASO = 'alerta_atraso',
  MANUAL = 'manual',
  COBRANCA = 'cobranca',
  RECUPERACAO_SENHA = 'recuperacao_senha',
  CAIXA_INICIADO = 'caixa_iniciado',
  LEMBRETE = 'lembrete',
  CONTEMPLACAO = 'contemplacao',
  ORIENTACAO = 'orientacao',
  CAIXA_CONCLUIDO = 'caixa_concluido',
  CADASTRO = 'cadastro',
  ONBOARDING = 'onboarding',
}

export enum StatusMensagem {
  PENDENTE = 'pendente',
  ENVIADO = 'enviado',
  FALHA = 'falha',
}

@Schema({ timestamps: true })
export class MensagemHistorico {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Caixa', required: true })
  caixaId: Types.ObjectId;

  @Prop({ required: true })
  caixaNome: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Usuario', required: true })
  participanteId: Types.ObjectId;

  @Prop({ required: true })
  participanteNome: string;

  @Prop({ required: true })
  participanteTelefone: string;

  @Prop({ type: String, enum: TipoMensagem, required: true })
  tipo: TipoMensagem;

  @Prop({ required: true })
  conteudo: string;

  @Prop({ type: String, enum: StatusMensagem, default: StatusMensagem.PENDENTE })
  status: StatusMensagem;

  @Prop()
  dataEnvio?: Date;

  @Prop()
  errorMessage?: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}
```

### 5.2 LogComunicacao (Logs Detalhados)

Collection: `logs_comunicacao`

```typescript
// schemas/log-comunicacao.schema.ts

@Schema({
  timestamps: { createdAt: 'timestamp', updatedAt: false },
  collection: 'logs_comunicacao',
})
export class LogComunicacao {
  @Prop({ required: true })
  tipo_operacao: string; // "tentativa" | "envio_sucesso" | "envio_falha" | "agendamento"

  @Prop({ type: Object })
  mensagem: {
    conteudo: string;
    tipo: string;           // "texto" | "imagem" | "documento"
    template_usado?: string;
    variaveis?: Record<string, any>;
  };

  @Prop({ type: Object })
  destinatario: {
    id_participante?: Types.ObjectId;
    nome?: string;
    telefone?: string;
    tipo_contato?: string;
  };

  @Prop({ type: Object })
  contexto?: {
    tipo_comunicacao?: string;
    id_parcela?: Types.ObjectId;
    data_vencimento?: Date;
    dias_antes_vencimento?: number;
    horario_agendado?: string;
    horario_efetivo_envio?: Date;
    origem?: string;         // "cron" | "manual" | "sistema"
  };

  @Prop({ type: Object })
  evolution_api?: {
    instancia?: string;
    message_id?: string;
    status_resposta?: number;
    resposta_completa?: any;
    tempo_resposta_ms?: number;
  };

  @Prop()
  status: string;   // "enviado" | "falhou" | "agendado" | "processando"

  @Prop()
  sucesso: boolean;

  @Prop({ type: Object })
  erro?: {
    codigo?: string;
    mensagem?: string;
    stack_trace?: string;
    tentativa_numero?: number;
    max_tentativas?: number;
  };

  @Prop({ type: Object })
  metadata?: {
    versao_sistema?: string;
    ambiente?: string;
    servidor?: string;
    job_id?: string;
    historico_id?: string;
  };
}

// Indices para performance
LogComunicacaoSchema.index({ timestamp: -1 });
LogComunicacaoSchema.index({ 'destinatario.id_participante': 1, timestamp: -1 });
LogComunicacaoSchema.index({ status: 1, timestamp: -1 });
LogComunicacaoSchema.index({ 'contexto.tipo_comunicacao': 1 });
LogComunicacaoSchema.index({ sucesso: 1, timestamp: -1 });
LogComunicacaoSchema.index({ 'evolution_api.message_id': 1 });
```

---

## 6. Evolution API Service (Integracao WhatsApp)

Servico responsavel por comunicar diretamente com a Evolution API v2.

### 6.1 Endpoints da Evolution API Utilizados

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| POST | `/message/sendText/{instanceName}` | Enviar mensagem de texto |
| POST | `/message/sendMedia/{instanceName}` | Enviar imagem ou documento |

### 6.2 Codigo Completo

```typescript
// services/evolution-api.service.ts

@Injectable()
export class EvolutionApiService {
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly instanceName: string;

  // Circuit Breaker
  private circuitState: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly FAILURE_THRESHOLD = 5;
  private readonly RESET_TIMEOUT = 60000; // 1 minuto

  constructor(
    private readonly configService: ConfigService,
    private readonly comunicacaoLogger: ComunicacaoLoggerService,
  ) {
    this.apiUrl = this.configService.get<string>('EVOLUTION_BASE_URL') ||
                  this.configService.get<string>('EVOLUTION_API_URL') ||
                  'http://localhost:8080';
    this.apiKey = this.configService.get<string>('EVOLUTION_API_KEY') || '';
    this.instanceName = this.configService.get<string>('EVOLUTION_INSTANCE_NAME') || 'default';
  }

  // ---- ENVIAR TEXTO ----
  async sendTextMessage(phoneNumber: string, message: string, contextData?: any): Promise<SendMessageResult> {
    const start = Date.now();
    const formattedPhone = this.formatPhoneNumber(phoneNumber);

    // Log tentativa
    await this.comunicacaoLogger.logTentativa(
      { nome: contextData?.nome || 'Desconhecido', telefone: formattedPhone, id_participante: contextData?.participanteId },
      { conteudo: message, tipo: 'texto' },
      { ...contextData, origem: 'EvolutionApiService' },
      1,
    );

    try {
      const request = async () => {
        const payload = { number: formattedPhone, text: message };
        const url = `${this.apiUrl}/message/sendText/${this.instanceName}`;
        return axios.post(url, payload, {
          headers: { 'Content-Type': 'application/json', apikey: this.apiKey },
          timeout: 30000,
          httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        });
      };

      const response = await this.executeWithCircuitBreaker(request);
      const result = {
        success: true,
        messageId: response.data?.key?.id || response.data?.messageId || response.data?.id || 'unknown',
      };

      // Log sucesso
      await this.comunicacaoLogger.logSucesso(
        { nome: contextData?.nome, telefone: formattedPhone, id_participante: contextData?.participanteId },
        { conteudo: message, tipo: 'texto' },
        contextData,
        { message_id: result.messageId, instancia: this.instanceName, tempo_ms: Date.now() - start, response: response.data },
        contextData?.historicoId,
      );

      return result;
    } catch (error: any) {
      // Log falha
      await this.comunicacaoLogger.logFalha(/* ... */);
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  // ---- ENVIAR DOCUMENTO (PDF) ----
  async sendDocument(phoneNumber: string, documentUrl: string, caption?: string, fileName?: string, contextData?: any): Promise<SendMessageResult> {
    const formattedPhone = this.formatPhoneNumber(phoneNumber);

    const request = async () => {
      return axios.post(
        `${this.apiUrl}/message/sendMedia/${this.instanceName}`,
        {
          number: formattedPhone,
          mediatype: 'document',
          media: documentUrl,        // URL publica do arquivo
          caption: caption || '',
          fileName: fileName || 'documento.pdf',
        },
        {
          headers: { 'Content-Type': 'application/json', apikey: this.apiKey },
          timeout: 60000,
          httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        },
      );
    };

    const response = await this.executeWithCircuitBreaker(request);
    return { success: true, messageId: response.data?.key?.id || 'unknown' };
  }

  // ---- ENVIAR IMAGEM (Base64 - QR Code) ----
  async sendImage(phoneNumber: string, imageBase64: string, caption?: string, contextData?: any): Promise<SendMessageResult> {
    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const request = async () => {
      return axios.post(
        `${this.apiUrl}/message/sendMedia/${this.instanceName}`,
        {
          number: formattedPhone,
          mediatype: 'image',
          media: base64Data,          // Base64 puro (sem prefixo data:image)
          caption: caption || '',
        },
        {
          headers: { 'Content-Type': 'application/json', apikey: this.apiKey },
          timeout: 30000,
          httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        },
      );
    };

    const response = await this.executeWithCircuitBreaker(request);
    return { success: true, messageId: response.data?.key?.id || 'unknown' };
  }

  // ---- FORMATAR TELEFONE ----
  private formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');
    // Adiciona DDI 55 (Brasil) se necessario
    if (cleaned.length === 10 || cleaned.length === 11) {
      cleaned = '55' + cleaned;
    }
    return cleaned;
  }

  // ---- CIRCUIT BREAKER ----
  private async executeWithCircuitBreaker<T>(requestFn: () => Promise<T>): Promise<T> {
    if (this.circuitState === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.RESET_TIMEOUT) {
        this.circuitState = 'HALF_OPEN';
      } else {
        throw new Error('Circuit Breaker OPEN. API indisponivel.');
      }
    }

    try {
      const result = await requestFn();
      if (this.circuitState === 'HALF_OPEN') {
        this.circuitState = 'CLOSED';
        this.failureCount = 0;
      }
      return result;
    } catch (error: any) {
      this.handleCircuitError(error);
      throw error;
    }
  }

  private handleCircuitError(error: any) {
    const status = error.response?.status;
    // Erros 4xx (exceto 429) nao abrem circuito
    if (status && status >= 400 && status < 500 && status !== 429) return;

    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.circuitState === 'HALF_OPEN') {
      this.circuitState = 'OPEN';
    } else if (this.circuitState === 'CLOSED' && this.failureCount >= this.FAILURE_THRESHOLD) {
      this.circuitState = 'OPEN';
    }
  }
}
```

### 6.3 Interface de Retorno

```typescript
interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
```

---

## 7. Sistema de Filas (BullMQ)

### 7.1 Constantes da Fila

```typescript
// constants/queue.constants.ts
export const WHATSAPP_QUEUE = 'whatsapp';
export const WHATSAPP_FLOW_EVENTS = {
  SEND_TEXT: 'send_text',
  SEND_DOCUMENT: 'send_document',
  SEND_IMAGE: 'send_image',
  SEND_TEMPLATE: 'send_template',
};
```

### 7.2 Interfaces dos Jobs

```typescript
// interfaces/whatsapp-job.interface.ts
export interface MensagemJob {
  historicoId: string;
  phoneNumber: string;
  message: string;
  contextData?: any;
}

export interface DocumentoJob {
  historicoId: string;
  phoneNumber: string;
  documentUrl: string;
  caption?: string;
  fileName?: string;
  contextData?: any;
}

export interface ImageQRCodeJob {
  historicoId?: string;
  phoneNumber: string;
  imageBase64: string;
  caption?: string;
  contextData?: any;
}
```

### 7.3 Worker (Processador da Fila)

```typescript
// workers/whatsapp.worker.ts

@Processor(WHATSAPP_QUEUE, {
  limiter: {
    max: 5,             // 5 mensagens
    duration: 1000,     // por segundo
    groupKey: 'instancia',
  } as any,
})
export class WhatsappWorker extends WorkerHost {
  constructor(
    private readonly evolutionApiService: EvolutionApiService,
    @InjectModel(MensagemHistorico.name)
    private readonly mensagemModel: Model<MensagemHistorico>,
  ) { super(); }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case WHATSAPP_FLOW_EVENTS.SEND_TEXT:
        return this.handleSendText(job);
      case WHATSAPP_FLOW_EVENTS.SEND_DOCUMENT:
        return this.handleSendDocument(job);
      case WHATSAPP_FLOW_EVENTS.SEND_IMAGE:
        return this.handleSendImage(job);
      default:
        throw new Error(`Handler nao implementado para ${job.name}`);
    }
  }

  private async handleSendText(job: Job) {
    let { historicoId, phoneNumber, message, contextData } = job.data;

    // Busca contexto do DB se nao fornecido
    if (!contextData && historicoId) {
      contextData = await this.getContextFromDb(historicoId);
    }

    try {
      const result = await this.evolutionApiService.sendTextMessage(
        phoneNumber, message, { ...contextData, jobId: job.id },
      );
      if (!result.success) throw new Error(result.error || 'Falha desconhecida');

      await this.updateStatus(historicoId, StatusMensagem.ENVIADO, result.messageId);
      return result;
    } catch (error: any) {
      await this.updateStatus(historicoId, StatusMensagem.FALHA, undefined, error.message);
      throw error; // BullMQ faz retry automatico
    }
  }

  // handleSendDocument e handleSendImage seguem o mesmo padrao

  private async updateStatus(id: string, status: StatusMensagem, messageId?: string, error?: string) {
    if (!id) return;
    const update: any = { status };
    if (status === StatusMensagem.ENVIADO) {
      update.dataEnvio = new Date();
      if (messageId) update['metadata.messageId'] = messageId;
    }
    if (error) update.errorMessage = error;
    await this.mensagemModel.findByIdAndUpdate(id, update);
  }
}
```

### 7.4 Como Adicionar Jobs na Fila (Padrao)

```typescript
// Dentro do ComunicacaoService:

// Exemplo: enviar texto com delay e retry
await this.mensagensQueue.add(
  WHATSAPP_FLOW_EVENTS.SEND_TEXT,       // Nome do evento
  {
    historicoId: historico._id.toString(),
    phoneNumber: participante.telefone,
    message: mensagemTexto,
  },
  {
    priority: 5,         // 1=alta, 10=baixa
    attempts: 3,         // Tentativas
    backoff: {
      type: 'exponential',  // ou 'fixed'
      delay: 2000,          // ms entre retries
    },
    delay: 6000,         // Delay antes de processar (ms)
  },
);

// Exemplo: enviar imagem QR Code com delay de 5s apos texto
await this.mensagensQueue.add(
  WHATSAPP_FLOW_EVENTS.SEND_IMAGE,
  {
    phoneNumber: participante.telefone,
    imageBase64: qrCodeBase64,
    caption: 'QR Code PIX - Caixa XYZ',
  },
  {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    delay: 5000,
  },
);

// Exemplo: enviar documento PDF
await this.mensagensQueue.add(
  WHATSAPP_FLOW_EVENTS.SEND_DOCUMENT,
  {
    historicoId: historico._id.toString(),
    phoneNumber: participante.telefone,
    documentUrl: 'https://exemplo.com/contrato.pdf',
    caption: 'Contrato Juntix',
    fileName: 'contrato_juntix.pdf',
  },
  {
    priority: 10,
    delay: delayMs,
    attempts: 2,
    backoff: { type: 'fixed', delay: 5000 },
  },
);
```

---

## 8. Fluxo Padrao de Envio de Mensagem

Todo envio segue este fluxo:

```
1. Criar registro em MensagemHistorico (status: PENDENTE)
         │
         ▼
2. Adicionar Job na fila BullMQ (com delay, priority, attempts)
         │
         ▼
3. Worker processa o job (rate limit: 5/segundo)
         │
         ▼
4. EvolutionApiService faz POST na Evolution API
         │  ├─ Circuit Breaker verifica estado
         │  ├─ Formata telefone (adiciona 55 se necessario)
         │  └─ Timeout: 30s (texto/imagem) ou 60s (documento)
         │
    ┌────┴────┐
    │         │
 Sucesso    Falha
    │         │
    ▼         ▼
5a. Atualiza  5b. Atualiza
    status:       status:
    ENVIADO       FALHA
    +dataEnvio    +errorMessage
    │             │
    ▼             ▼
6a. Logger    6b. Logger
    logSucesso    logFalha
                  │
                  ▼
              7. BullMQ faz
                 retry (backoff)
```

---

## 9. Cron Job - Lembretes Automaticos

```typescript
// cron/comunicacao.cron.ts

@Cron('0 9 * * *', {
  name: 'payment-reminders',
  timeZone: 'America/Sao_Paulo',
})
async verificarPagamentosEEnviarLembretes() {
  // Executa diariamente as 09:00 (Sao Paulo)
}
```

### Logica de Cenarios (Timeline de Pagamento)

| Cenario | Dias | Destinatario | Tipo de Mensagem |
|---------|------|-------------|-----------------|
| Pre-Vencimento | 0 a 5 dias ANTES | Participante | Lembrete + PIX Copia e Cola |
| Atraso Leve | 1 a 5 dias APOS | Admin somente | Alerta ao administrador |
| Atraso Critico | 6 a 30 dias APOS | Admin + Todos participantes | Alerta geral ao grupo |

### Filtros Aplicados

- Somente pagamentos com status PENDENTE ou ATRASADO
- Somente caixas com status "ativo"
- Ignora pagamentos com mais de 30 dias de atraso
- Verifica se ja enviou lembrete hoje (evita duplicatas)
- Para atraso critico: so envia se ultimo alerta foi ha mais de 3 dias

### Delay Escalonado

Mensagens sao agendadas com intervalos de 1 minuto entre cada pagamento processado:
```
delayMs = globalDelayIndex * 60000  // 1 minuto entre mensagens
```

### Orientacoes Automaticas

Alem dos lembretes de pagamento, o cron verifica caixas ativos e envia orientacoes:

| Dia (apos inicio) | Mensagem |
|---|---|
| Dia 1 | Orientacao Basica Parte 1 (como gerar boleto/PIX) |
| Dia 2 | Orientacao Basica Parte 2 (manter dados atualizados) |
| Dia 3 | Orientacao Basica Parte 3 (transparencia da plataforma) |
| Meio do ciclo (dia 15 mensal / dia 4 semanal) | Orientacao sobre contemplacao |

---

## 10. API REST - Endpoints

### Controller: `/comunicacao`

```typescript
@Controller('comunicacao')
@UseGuards(OptionalAuthGuard)
export class ComunicacaoController { }
```

### GET /comunicacao/historico

Retorna historico paginado de mensagens.

```typescript
// Query Params:
{
  caixaId?: string;     // Filtrar por caixa
  tipo?: TipoMensagem;  // Filtrar por tipo
  status?: StatusMensagem; // Filtrar por status
  page?: number;        // Pagina (default: 1)
  limit?: number;       // Itens por pagina (default: 20)
}

// Resposta:
{
  mensagens: MensagemHistorico[];
  total: number;
  page: number;
  pages: number;
}
```

### POST /comunicacao/enviar-manual

Envia mensagem manual para participantes.

```typescript
// Body:
{
  caixaId: string;
  mensagem: string;
  escopo: 'todos' | 'participante_especifico' | 'apenas_admins';
  participanteId?: string;  // Obrigatorio quando escopo = 'participante_especifico'
}

// Resposta:
{
  success: boolean;
  message: string;
  enviados: number;
  participantes: string[];
}
```

### POST /comunicacao/resend/:id

Reenvia uma mensagem especifica.

```typescript
// Resposta:
{
  success: boolean;
  mensagemId: string;
  participante: string;
  tipo: string;
  status: 'PENDENTE';
}
```

### POST /comunicacao/reprocess-pending

Reprocessa mensagens pendentes das ultimas 24h.

```typescript
// Resposta:
{
  success: boolean;
  total: number;
  reprocessados: number;
  erros: number;
}
```

### POST /comunicacao/trigger-cron

Forca execucao manual do cron job. Util para testes.

### GET /comunicacao/status

Estatisticas do sistema.

```typescript
// Resposta:
{
  timestamp: string;
  pagamentos: { pendentes: number; atrasados: number; vencendoEm5Dias: number; };
  caixas: { ativas: number; };
  mensagens: { enviadasHoje: number; };
}
```

### GET /comunicacao/debug

Informacoes detalhadas de debug (proximos pagamentos, ultimos lembretes).

---

## 11. Templates de Mensagens

Todos os templates sao metodos privados no `ComunicacaoService`. Usam `*texto*` para negrito no WhatsApp.

### 11.1 Boas-vindas

```
Ola *{nome}*! 👋

Seja bem-vindo ao *Juntix* - Junte seus amigos e realize seus sonhos! 🎉

Voce foi convidado por *{nomeAdmin}* para participar de um caixa compartilhado.

*Por que o Juntix e diferente?* 💡
✅ *Pagamentos organizados* - Sem mais planilhas confusas
✅ *Notificacoes automaticas* - Nunca perca um prazo
✅ *Acompanhamento em tempo real* - Veja o progresso do grupo
✅ *Total transparencia* - Todos acompanham cada movimentacao
✅ *Seguranca e confianca* - Sistema automatizado e confiavel

📲 *Proximos passos:*
Em breve voce recebera todas as informacoes sobre valores e datas de pagamento.

🔗 Saiba mais: http://juntix.com.br/

💬 Duvidas? Fale com *{nomeAdmin}*, o administrador do seu grupo!

_Mensagem automatica - Juntix_
```

### 11.2 Cobranca (Boleto/PIX Gerado)

```
Ola *{nome}*,

O BOLETO E PIX NO VALOR: *R$ {valor}*, REFERENTE AO CAIXA *{nomeCaixa}*, FOI GERADO, com Data de vencimento *{dataVencimento}*.

📋 *Codigo Copia e Cola (PIX):*
```{codigoPix}```

_Copie o codigo acima para pagar via PIX_

📄 *Link do Boleto/Fatura:*
{linkBoleto}

_Mensagem automatica - Juntix_
```

### 11.3 Lembrete de Pagamento (Pre-Vencimento)

```
Ola *{nome}*, O BOLETO/PIX no valor de *R$ {valor}*, com vencimento em *{data}*,
do caixa *{nomeCaixa}* vence em *{diasRestantes} dia(s)*.
Lembre-se que o pagamento em dia e primordial para o sucesso do caixa.
Mensagem automatica - Juntix
```
+ Segunda mensagem (6s depois): Codigo PIX Copia e Cola

### 11.4 Confirmacao de Pagamento

```
Atencao participantes do caixa *{nomeCaixa}*!

O participante *{nomePagador}* acabou de *PAGAR* o boleto no valor de *R$ {valor}*, referente ao mes *{mesAtual}/{duracaoMeses}*.

O contemplado do mes e *{nomeContemplado}* (posicao *{posicao}*).

_Mensagem automatica - Juntix_
```

### 11.5 Alerta de Atraso (Leve - para Admin)

```
PARTICIPANTE *{nome}* esta em atraso. Entre em contato para realizar a cobranca.
Caixa: *{nomeCaixa}* | Vencimento: *{data}* | Valor: *R$ {valor}* | Posicao: *{posicao}o*.
A adimplencia e muito importante para o correto funcionamento do caixa.
```

### 11.6 Alerta de Atraso (Grave - para Participante)

```
🚨 *URGENTE - {nome}*

Seu pagamento do caixa *{nomeCaixa}* esta com *{diasAtraso} dias de atraso*.

💰 *Valor:* R$ {valor}

⚠️ Esta situacao compromete o funcionamento do caixa e afeta todos os participantes.
E fundamental que voce regularize IMEDIATAMENTE.

_Mensagem automatica - Juntix_
```

### 11.7 Alerta de Atraso (Grupo)

```
📢 *Aviso Importante - {nomeCaixa}*

O participante *{nomeDevedor}* esta com *{diasAtraso} dias de atraso* no pagamento.

O Juntix e um caixa entre amigos e conhecidos. A cooperacao de todos e fundamental
para o sucesso do grupo.

_Mensagem automatica - Juntix_
```

### 11.8 Caixa Iniciado (Ordem de Contemplacao)

```
🎉 Ola *{nome}*, o caixa *{nomeCaixa}* ja foi inicializado!

📋 *Informacoes do Caixa:*
• Nome: {nomeCaixa}
• Valor total: R$ {valorTotal}
• Tipo: {tipo}
• Valor medio por parcela: R$ {valorParcela}

📊 *Lista de Contemplacao:*
1. Participante A
2. Participante B
3. Participante C
...

Boa sorte! 🍀

_Mensagem automatica - Juntix_
```

### 11.9 Contemplacao

```
Atencao Participantes do caixa: {nomeCaixa}.

O participante *{nomeContemplado}*, acabou de receber o valor de *R$ {valor}*,
referente ao ponto numero: {numeroPonto}.

Parabens a todos pela adimplencia e pagamento em dia. 👏

Proximo contemplado sera: *{proximoContemplado}* ({dataProximo}).
```

### 11.10 Onboarding - Passo 1 (Como se habilitar)

```
📋 *COMO SE HABILITAR PARA ENTRAR NO CAIXA*

*1️⃣ PASSO 1 - Acessar o Contrato*
👇 No menu inferior, clique na opcao *"Contrato"*

*2️⃣ PASSO 2 - Preencher seus Dados*
📄 Leia o contrato com atencao
✍️ Na parte "Contratante", informe: CPF e Chave PIX

*3️⃣ PASSO 3 - Aceitar os Termos*
📜 Role a pagina para baixo
✅ Clique no botao *"Li e aceitos os termos de uso"*

✔️ *Pronto! Voce esta habilitado!*
```

### 11.11 Onboarding - Passo 2 (Verificacao e Carteira)

```
💰 *ACESSANDO SUA CARTEIRA*

1️⃣ *VERIFICACAO DE IDENTIDADE* ⚠️ IMPORTANTE
• Faca upload do seu documento (RG ou CNH)
• Realize a verificacao de autenticidade facial

2️⃣ *ACESSAR A CARTEIRA*
👇 Apos a verificacao, clique na opcao *"Carteira"*
Acompanhe em tempo real o saldo disponivel no seu mes de contemplacao.
```

### 11.12 Fundo de Reserva (para Master)

```
🎉 O caixa {nomeCaixa} chegou ao fim. Parabens!

Agora e necessario realizar o saque do valor do fundo de reserva no valor de
*R$ {valorFundo}* e dividir entre os participantes.

📋 INFORMACOES DO CAIXA
Nome: {nomeCaixa} | Inicio: {dataInicio} | Fim: {dataFim}

💰 VALORES
Valor do Caixa: R$ {valorCaixa}
Fundo de Reserva: *R$ {valorFundo}*

👥 PARTICIPANTES (ORDEM DE CONTEMPLACAO)
1. Nome A
2. Nome B
...

⚠️ ATENCAO: Realizar a divisao e transferencia do fundo de reserva manualmente.
```

---

## 12. Regras de Disparo Automatico

| # | Evento | Gatilho | Delay | Destinatario |
|---|--------|---------|-------|-------------|
| 1 | Boas-vindas | Caixa iniciado (status -> ativo) | 6s escalonado | Todos participantes |
| 2 | Caixa Iniciado | Apos boas-vindas | +2 min | Todos participantes |
| 3 | Envio Contrato PDF | Apos boas-vindas | +30s + 10s | Todos participantes |
| 4 | Envio Termos PDF | Apos boas-vindas | +30s + 20s | Todos participantes |
| 5 | Cadastro | Registro via convite | +5s | Novo participante |
| 6 | Onboarding Passo 1 | Apos cadastro | +5 min | Novo participante |
| 7 | Onboarding Passo 2 | Apos cadastro | +7 min | Novo participante |
| 8 | Cobranca | Boleto/PIX gerado | Imediato | Participante |
| 9 | QR Code (imagem) | Apos cobranca | +5s | Participante |
| 10 | Lembrete Pre-Vencimento | Cron diario 09:00 (1-5d antes) | 1 min escalonado | Participante + PIX |
| 11 | Alerta Atraso Leve | Cron diario 09:00 (1-5d apos) | 1 min escalonado | Admin |
| 12 | Alerta Atraso Critico | Cron diario 09:00 (6-30d apos) | 1 min escalonado | Admin + Grupo |
| 13 | Confirmacao Pagamento | Pagamento confirmado | 1s escalonado | Todos participantes |
| 14 | Contemplacao | Saque liberado | 2 min escalonado | Todos participantes |
| 15 | Orientacao Inicio | Cron diario (dias 1-3) | 6s escalonado | Todos participantes |
| 16 | Orientacao Meio | Cron diario (dia 15 mensal / dia 4 semanal) | 6s escalonado | Todos participantes |
| 17 | Fundo Reserva | Caixa concluido | Imediato | Master |
| 18 | Alerta Atraso Saque | Saque impossivel (inadimplencia) | Imediato | Master + Admin |

---

## 13. Frontend - Pagina de Gerenciamento

### 13.1 Estrutura

Arquivo principal: `src/pages/GerenciarComunicacao.tsx`
Rota: `/painel-master/comunicacao`

### 13.2 Componentes e Funcionalidades

#### Filtros
- **Caixa**: Dropdown com todas as caixas
- **Tipo de Mensagem**: Dropdown com todos os TipoMensagem
- **Status**: Dropdown (Todos / Enviado / Pendente / Falha)
- Botao "Limpar Filtros"
- Botao "Enviar Mensagem Manual"

#### Tabela de Historico
Colunas: Data/Hora | Caixa | Participante (nome + telefone) | Tipo (badge colorido) | Status (icone) | Acoes (Ver + Reenviar)

#### Codificacao de Cores por Tipo
```typescript
const tipoMensagemColors = {
  boas_vindas: 'bg-purple-100 text-purple-700',
  lembrete_pagamento: 'bg-blue-100 text-blue-700',
  confirmacao_pagamento: 'bg-green-100 text-green-700',
  alerta_atraso: 'bg-red-100 text-red-700',
  manual: 'bg-gray-100 text-gray-700',
  cobranca: 'bg-orange-100 text-orange-700',
  caixa_iniciado: 'bg-emerald-100 text-emerald-700',
  contemplacao: 'bg-yellow-100 text-yellow-700',
  cadastro: 'bg-teal-100 text-teal-700',
  onboarding: 'bg-indigo-100 text-indigo-700',
};
```

#### Modal de Detalhes
Exibe: Caixa, Participante, Tipo, Escopo, Status, Data/Hora, Erro (se houver), Conteudo completo

#### Modal Mensagem Manual
- Selecionar Caixa (somente ativas)
- Selecionar Escopo: Todos | Participante Especifico | Apenas Admins
- Se "Participante Especifico": dropdown com participantes da caixa
- Textarea para mensagem
- Botao "Enviar"

#### Botao "Monitorar Filas"
Abre dashboard Bull Board em nova aba:
```typescript
const queueUrl = apiUrl.replace(/\/api\/?$/, '') + '/admin/queues';
window.open(queueUrl, '_blank');
```

#### Modal "Regras de Disparo"
Tabela read-only mostrando as 12 regras automaticas com nome, gatilho e descricao.

### 13.3 Service Frontend

```typescript
// src/lib/api/comunicacao.service.ts

class ComunicacaoService {
  private getAuthHeader() {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  }

  async getHistorico(filtros?: {
    caixaId?: string; tipo?: string; status?: string; page?: number; limit?: number;
  }): Promise<HistoricoResponse> {
    const params = new URLSearchParams();
    if (filtros?.caixaId) params.append('caixaId', filtros.caixaId);
    if (filtros?.tipo) params.append('tipo', filtros.tipo);
    if (filtros?.status) params.append('status', filtros.status);
    if (filtros?.page) params.append('page', filtros.page.toString());
    if (filtros?.limit) params.append('limit', filtros.limit.toString());

    const response = await axios.get(
      `${API_URL}/comunicacao/historico?${params.toString()}`,
      this.getAuthHeader(),
    );
    return response.data;
  }

  async resendMessage(mensagemId: string) {
    const response = await axios.post(
      `${API_URL}/comunicacao/resend/${mensagemId}`, {}, this.getAuthHeader(),
    );
    return response.data;
  }

  async enviarMensagemManual(data: {
    caixaId: string;
    mensagem: string;
    escopo: 'todos' | 'participante_especifico' | 'apenas_admins';
    participanteId?: string;
  }) {
    const response = await axios.post(
      `${API_URL}/comunicacao/enviar-manual`, data, this.getAuthHeader(),
    );
    return response.data;
  }
}

export const comunicacaoService = new ComunicacaoService();
```

---

## 14. Logger de Comunicacao

```typescript
// services/comunicacao-logger.service.ts

@Injectable()
export class ComunicacaoLoggerService {
  constructor(
    @InjectModel(LogComunicacao.name)
    private readonly logModel: Model<LogComunicacaoDocument>,
  ) {}

  async logTentativa(destinatario, mensagem, contexto, tentativa: number) {
    return this.log({
      tipo_operacao: 'tentativa',
      status: 'processando',
      sucesso: false,
      destinatario, mensagem, contexto,
      erro: { tentativa_numero: tentativa },
    });
  }

  async logSucesso(destinatario, mensagem, contexto, evolutionData, historicoId?) {
    return this.log({
      tipo_operacao: 'envio_sucesso',
      status: 'enviado',
      sucesso: true,
      destinatario, mensagem,
      contexto: { ...contexto, horario_efetivo_envio: new Date() },
      evolution_api: {
        instancia: evolutionData.instancia,
        message_id: evolutionData.message_id,
        status_resposta: 200,
        tempo_resposta_ms: evolutionData.tempo_ms,
        resposta_completa: evolutionData.response,
      },
      metadata: { historico_id: historicoId },
    });
  }

  async logFalha(destinatario, mensagem, contexto, erro, evolutionData?, tentativa?) {
    return this.log({
      tipo_operacao: 'envio_falha',
      status: 'falhou',
      sucesso: false,
      destinatario, mensagem, contexto,
      evolution_api: evolutionData ? { ... } : undefined,
      erro: { codigo: erro.codigo, mensagem: erro.mensagem, stack_trace: erro.stack },
    });
  }

  private async log(data: Partial<LogComunicacao>): Promise<void> {
    await this.logModel.create({
      ...data,
      timestamp: new Date(),
      metadata: {
        ...data.metadata,
        servidor: process.env.HOSTNAME || 'server-1',
        ambiente: process.env.NODE_ENV || 'development',
      },
    });
  }
}
```

---

## 15. Resumo da Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                      │
│  GerenciarComunicacao.tsx                                    │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ Filtros │ │ Historico│ │ Manual   │ │ Regras Disparo   │ │
│  │ (caixa, │ │ (tabela  │ │ (modal   │ │ (modal read-only)│ │
│  │ tipo,   │ │ paginada)│ │ envio)   │ │                  │ │
│  │ status) │ │          │ │          │ │                  │ │
│  └────┬────┘ └────┬─────┘ └────┬─────┘ └──────────────────┘ │
│       │           │            │                             │
│       └───────────┴────────────┘                             │
│                    │  API REST (axios)                        │
└────────────────────┼─────────────────────────────────────────┘
                     │
┌────────────────────┼─────────────────────────────────────────┐
│               BACKEND (NestJS)                                │
│                    │                                          │
│  ┌─────────────────▼──────────────────┐                      │
│  │     ComunicacaoController          │                      │
│  │  GET  /historico                   │                      │
│  │  POST /enviar-manual               │                      │
│  │  POST /resend/:id                  │                      │
│  │  POST /trigger-cron                │                      │
│  │  POST /reprocess-pending           │                      │
│  │  GET  /status                      │                      │
│  └─────────────────┬──────────────────┘                      │
│                    │                                          │
│  ┌─────────────────▼──────────────────┐                      │
│  │      ComunicacaoService            │                      │
│  │  - Templates de mensagens          │                      │
│  │  - Logica de envio                 │                      │
│  │  - Historico (MongoDB)             │                      │
│  │  - Adiciona jobs na fila           │                      │
│  └─────────┬──────────────────────────┘                      │
│            │                                                  │
│  ┌─────────▼──────────┐  ┌──────────────────────┐           │
│  │  BullMQ Queue      │  │  ComunicacaoCron     │           │
│  │  (Redis)           │  │  @Cron('0 9 * * *')  │           │
│  │  - send_text       │  │  - Lembretes diarios │           │
│  │  - send_document   │  │  - Alertas de atraso │           │
│  │  - send_image      │  │  - Orientacoes       │           │
│  └─────────┬──────────┘  └──────────────────────┘           │
│            │                                                  │
│  ┌─────────▼──────────┐                                      │
│  │  WhatsappWorker    │  Rate Limit: 5 msg/s                │
│  │  (BullMQ Processor)│                                      │
│  └─────────┬──────────┘                                      │
│            │                                                  │
│  ┌─────────▼──────────────────────────┐                      │
│  │    EvolutionApiService             │                      │
│  │  - sendTextMessage()               │                      │
│  │  - sendDocument()                  │                      │
│  │  - sendImage()                     │                      │
│  │  - Circuit Breaker (5 falhas/60s)  │                      │
│  │  - Formatacao de telefone (+55)    │                      │
│  └─────────┬──────────────────────────┘                      │
│            │                                                  │
│  ┌─────────▼──────────────────────────┐                      │
│  │  ComunicacaoLoggerService          │                      │
│  │  - logTentativa()                  │                      │
│  │  - logSucesso()                    │                      │
│  │  - logFalha()                      │                      │
│  └────────────────────────────────────┘                      │
│                                                               │
│  MongoDB Collections:                                         │
│  - mensagem_historicos                                        │
│  - logs_comunicacao                                           │
└───────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌───────────────────────────────────────────────────────────────┐
│              EVOLUTION API v2                                  │
│  POST /message/sendText/{instance}     → Texto                │
│  POST /message/sendMedia/{instance}    → Imagem/Documento     │
│  Headers: { apikey: EVOLUTION_API_KEY }                        │
│  URL: EVOLUTION_BASE_URL                                       │
│  Instance: EVOLUTION_INSTANCE_NAME                             │
└───────────────────────────────────────────────────────────────┘
                     │
                     ▼
               ┌───────────┐
               │ WhatsApp  │
               └───────────┘
```

---

## 16. Checklist para Replicar em Outro Projeto

1. **Infraestrutura**
   - [ ] MongoDB rodando
   - [ ] Redis rodando
   - [ ] Evolution API v2 configurada com instancia ativa

2. **Backend**
   - [ ] Instalar dependencias (BullMQ, Mongoose, Schedule, Axios, Bull Board)
   - [ ] Configurar BullModule.forRoot com Redis no AppModule
   - [ ] Configurar ScheduleModule.forRoot no AppModule
   - [ ] Configurar BullBoardModule.forRoot no AppModule
   - [ ] Criar modulo de comunicacao com a estrutura de arquivos
   - [ ] Adaptar schemas para o dominio do novo projeto
   - [ ] Adaptar templates de mensagens para o novo contexto
   - [ ] Adaptar cron jobs para a logica de negocios do novo projeto
   - [ ] Configurar variaveis de ambiente

3. **Frontend**
   - [ ] Criar service de comunicacao (axios)
   - [ ] Criar pagina de gerenciamento com filtros, tabela, modais
   - [ ] Adicionar rota no router

4. **Testes**
   - [ ] Testar envio de texto via POST /comunicacao/trigger-cron
   - [ ] Verificar mensagem recebida no WhatsApp
   - [ ] Verificar registros no MongoDB (historico + logs)
   - [ ] Verificar dashboard de filas (/admin/queues)
