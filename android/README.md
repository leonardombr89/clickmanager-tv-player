# ClickTV Player Android

Contêiner Android TV do player Web ClickTV. A Fase 1 mantém a ativação,
sincronização e reprodução no projeto Angular e acrescenta recursos nativos:

- WebView configurada e isolada da `MainActivity`;
- tela cheia imersiva e tela permanentemente ligada;
- URL persistida com DataStore;
- estados de loading, falta de conexão e erro;
- configurações protegidas por cinco toques no canto do logo;
- diagnóstico do dispositivo;
- ponte JavaScript `window.ClickTV`;
- variantes para desenvolvimento, homologação e produção.

## Requisitos

- JDK 17 ou superior;
- Android SDK Platform 35;
- Android SDK Build Tools 35;
- dispositivo Android 6 (API 23) ou superior.

O BTV B13 com Android 11 e ABI `armeabi-v7a` é compatível. O APK universal
inclui as bibliotecas AndroidX para `armeabi-v7a`, além das variantes usadas
em emuladores e aparelhos de 64 bits.

## Variantes

| Variante | URL inicial | HTTP |
|---|---|---|
| `developmentDebug` | configurada no primeiro uso | permitido |
| `homologationDebug` | `https://tv-hml.clickmanager.com.br` | bloqueado |
| `productionRelease` | `https://tv.clickmanager.com.br` | bloqueado |

A URL salva no aparelho sempre prevalece sobre o valor da variante.

Para testar o Angular pela rede local:

```bash
cd ..
npm run start:lan
```

No APK de desenvolvimento, configure:

```text
http://IP_DO_MAC:4300
```

## Build

```bash
./gradlew testDevelopmentDebugUnitTest
./gradlew lintDevelopmentDebug
./gradlew assembleDevelopmentDebug
```

APK gerado:

```text
app/build/outputs/apk/development/debug/app-development-debug.apk
```

O APK oficial de produção é gerado e assinado pelo GitHub Actions. Após o
deploy, ele fica disponível em:

```text
https://tv.clickmanager.com.br/downloads/clicktv-player.apk
```

## Instalação no BTV B13

Copie o APK para um pendrive ou cartão SD, abra o gerenciador de arquivos do
aparelho e autorize a instalação por fonte desconhecida quando solicitado.

Se o BTV estiver conectado por ADB USB:

```bash
adb install -r app/build/outputs/apk/development/debug/app-development-debug.apk
```

## Configuração protegida

Com o Player aberto, pressione cinco vezes rapidamente a região do logo
ClickTV no canto superior esquerdo. No controle remoto, pressione cinco vezes
o botão central/OK. A tela permite:

- alterar a URL;
- limpar o cache;
- recarregar;
- consultar o diagnóstico.

## Native Bridge

A WebView registra a estrutura:

```javascript
window.ClickTV.getDeviceInfo()
window.ClickTV.getVersion()
window.ClickTV.restart()
window.ClickTV.clearCache()
```

A API deve ser tratada como opcional pelo Angular, pois o mesmo player também
continua funcionando em navegadores comuns.

## Fora da Fase 1

`BOOT_COMPLETED`, ExoPlayer/Media3, cache offline, download de mídias, playlist
nativa, OTA, heartbeat nativo, provisionamento, launcher dedicado e watchdog
não são implementados neste MVP.
