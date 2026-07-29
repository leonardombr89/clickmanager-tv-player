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
