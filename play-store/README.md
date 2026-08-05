# Publicação do ClickTV no Google Play

## Identidade da aplicação

- nome: `ClickTV`;
- pacote: `com.clickmanager.tvplayer`;
- idioma padrão: Português (Brasil);
- categoria: app gratuito;
- fatores de forma: Android TV, smartphones e tablets;
- primeira versão Play: `1.0.0` (`versionCode 2`);
- versão compatível com TV e celular: `1.0.1` (`versionCode 3`).
- versão responsiva para celular: `1.0.2` (`versionCode 4`).

O `versionCode 2` é intencional. A versão `1` foi distribuída diretamente como
APK e precisa ser atualizável pela instalação da Play Store.

## Assinatura

O primeiro release deve cadastrar a chave existente como **chave de assinatura
do app** no Play App Signing. O certificado esperado possui SHA-256:

```text
A1:62:A0:14:9F:C8:69:DD:C9:A0:72:00:3E:7D:9E:F6:
DE:5E:66:59:1B:0F:8A:11:47:9D:08:C1:78:A8:F2:35
```

Depois do cadastro, comparar esse valor com o certificado de assinatura exibido
em **Configuração > Integridade do app** no Play Console. A chave nunca deve ser
adicionada ao Git; o diretório `android/.signing` permanece ignorado.

## Ordem recomendada no Play Console

1. concluir conteúdo do app, política de privacidade e segurança de dados;
2. informar em Acesso ao app como a equipe de revisão ativa uma tela de teste;
3. adicionar ícone, banner de TV e ao menos uma captura real em alta resolução;
4. cadastrar a chave existente no Play App Signing;
5. enviar `clicktv-player.aab` primeiro para Teste interno;
6. instalar pela Play Store em uma Android TV e validar ativação/reprodução;
7. promover o mesmo release para Produção após a validação.

## Texto inicial da página

Descrição curta:

> Transforme sua Android TV em uma tela de comunicação digital.

Descrição completa:

> O ClickTV transforma sua Android TV em uma tela de comunicação digital
> integrada ao ClickManager. Ative o dispositivo com o código exibido na TV,
> associe uma playlist e mantenha imagens e vídeos sincronizados para exibição
> contínua. O player monitora a conexão, atualiza o conteúdo automaticamente e
> oferece diagnóstico protegido para facilitar a instalação e o suporte.

## Pendências externas ao código

- URL pública da política de privacidade;
- respostas do formulário Segurança de dados;
- conta/tela de demonstração que permaneça disponível durante a revisão;
- captura real do fluxo de ativação e do player em Android TV;
- aceite das declarações legais pelo titular da conta.
