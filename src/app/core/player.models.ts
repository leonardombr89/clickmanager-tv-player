export type PlayerVisualState =
  | 'INICIANDO'
  | 'AGUARDANDO_ATIVACAO'
  | 'ATIVACAO_EXPIRADA'
  | 'SINCRONIZANDO'
  | 'SEM_CONTEUDO'
  | 'REPRODUZINDO'
  | 'CONEXAO_INDISPONIVEL'
  | 'DISPOSITIVO_INVALIDO'
  | 'ERRO';

export type ActivationPublicStatus =
  | 'AGUARDANDO_VINCULO'
  | 'ATIVACAO_CONCLUIDA'
  | 'EXPIRADA'
  | 'CONSUMIDA_OU_INVALIDA';

export interface ActivationCreated {
  identificador: string;
  codigo: string;
  expiraEm: string;
}

export interface ActivationStatus {
  status: ActivationPublicStatus;
  expiraEm: string | null;
  credencial: string | null;
}

export type PendingActivation = ActivationCreated;

export interface PlayerScreen {
  id: number;
  nome: string;
  orientacao: 'HORIZONTAL' | 'VERTICAL' | 'QUADRADA' | 'INDEFINIDA';
  versaoConfiguracao: number;
}

export interface PlayerPlaylist {
  id: number;
  nome: string;
  orientacao: PlayerScreen['orientacao'];
  versao: number;
}

export interface PlayerMedia {
  id: number;
  nome: string;
  tipo: 'IMAGEM' | 'VIDEO';
  orientacao: PlayerScreen['orientacao'];
  mimeType: string;
  largura: number | null;
  altura: number | null;
  url: string;
  urlExpiraEm: string | null;
}

export interface PlayerItem {
  id: number;
  ordem: number;
  duracaoSegundos: number | null;
  midia: PlayerMedia;
}

export interface PlayerConfiguration {
  alterada: boolean;
  estado: 'CONTEUDO_DISPONIVEL' | 'SEM_CONTEUDO';
  tela: PlayerScreen;
  playlist: PlayerPlaylist | null;
  itens: PlayerItem[];
}

export interface HeartbeatPayload {
  versaoPlayer?: string;
  versaoConfiguracao?: number;
  playlistId?: number;
  playlistVersao?: number;
  midiaAtualId?: number;
  resolucaoTela?: string;
  userAgent?: string;
  ultimaSincronizacaoEm?: string;
}

export interface HeartbeatResponse {
  recebidoEm: string;
}
