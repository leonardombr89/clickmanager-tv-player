# ClickManager TV Player

Player web independente do ClickTV para navegadores de Smart TV, Android TV,
TV Box e computadores. O player usa somente a API pública do ClickTV.

## Executar localmente

```bash
npm install
npm start
```

Por padrão, o frontend fica em `http://localhost:4200` e usa a API em
`http://localhost:8080`. Para alterar a API local, edite `src/assets/env.js`.

Para testar em uma TV na mesma rede, mantenha o backend na porta `8080` e use:

```bash
npm run start:lan
```

O player ficará disponível na porta `4300` de todos os endereços locais da
máquina. O endereço da API é calculado automaticamente com o mesmo host usado
para abrir o player.

## Smart TVs legadas

O mesmo endereço detecta automaticamente navegadores antigos e carrega um
player ES5 independente do Angular. O modo legado suporta:

- Samsung Tizen anterior à versão 8, incluindo a UN40J5500 com Tizen 2.3;
- ativação por código e credencial permanente;
- sincronização periódica e heartbeat;
- imagens e vídeos;
- repetição contínua e avanço quando uma mídia falha;
- atualização da playlist ao finalizar a mídia atual.

Para validar o modo legado em um navegador moderno, acrescente `?legacy=1` à
URL. Esse parâmetro é apenas uma ferramenta de diagnóstico.

## Configuração Docker

```bash
docker build -t clickmanager-tv-player .
docker run --rm -p 8081:80 \
  -e CLICKTV_API_BASE_URL=https://api.clickmanager.com.br \
  -e CLICKTV_SYNC_INTERVAL_SECONDS=60 \
  -e CLICKTV_HEARTBEAT_INTERVAL_SECONDS=30 \
  clickmanager-tv-player
```

Variáveis:

- `CLICKTV_API_BASE_URL`: endereço público do backend, sem barra final.
- `CLICKTV_SYNC_INTERVAL_SECONDS`: intervalo de sincronização; padrão `60`.
- `CLICKTV_HEARTBEAT_INTERVAL_SECONDS`: intervalo do heartbeat; padrão `30`.
- `CLICKTV_ACTIVATION_POLL_INTERVAL_SECONDS`: consulta da ativação; padrão `3`.

## Fluxo de teste

1. Abra o player no navegador.
2. Copie o código de seis dígitos exibido.
3. No ClickManager, vincule uma tela usando esse código.
4. Associe uma playlist padrão à tela.
5. O player sincronizará e iniciará a reprodução automaticamente.

A credencial permanente fica somente no armazenamento local do navegador e é
enviada exclusivamente no header `Authorization`.

## Player Android

O contêiner Android TV em Kotlin e Jetpack Compose está em
[`android/`](android/README.md). Ele carrega este mesmo player Angular em uma
WebView, mantendo a URL configurável no aparelho para testes locais,
homologação e produção.

## CI/CD

O GitHub Actions valida o player web e Android a cada pull request. Ao publicar
na branch `main`, o pipeline:

1. executa testes, lint e build de produção do Angular;
2. valida o player legado;
3. executa testes e lint do Android;
4. gera o APK de desenvolvimento como artefato;
5. publica a imagem Docker no GHCR com as tags `latest` e SHA;
6. após sucesso, atualiza somente o serviço `tv-player` na VPS.

Imagem oficial:

```text
ghcr.io/leonardombr89/clickmanager-tv-player:latest
```

O deploy exige os secrets `SSH_HOST`, `SSH_USER` e `SSH_PRIVATE_KEY` no
repositório GitHub. Na VPS, o serviço deve se chamar `tv-player` no arquivo
`/opt/clickmanager/docker-compose.prod.yml`.
