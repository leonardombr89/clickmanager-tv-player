(function (window, document) {
  'use strict';

  function shouldUseLegacy(userAgent, moduleSupport) {
    var ua = userAgent || '';
    var tizen = /Tizen[\/ ]([0-9]+(?:\.[0-9]+)?)/i.exec(ua);
    var chromium = /(?:Chrome|Chromium)\/([0-9]+)/i.exec(ua);

    if (!moduleSupport) {
      return true;
    }
    if (tizen) {
      return parseFloat(tizen[1]) < 8;
    }
    if (/SamsungBrowser/i.test(ua) && /(?:SMART-TV|TV)/i.test(ua)) {
      return true;
    }
    if (chromium && parseInt(chromium[1], 10) < 107) {
      return true;
    }
    return false;
  }

  var compatibility = {
    shouldUseLegacy: shouldUseLegacy
  };
  window.__CLICKTV_LEGACY_COMPAT__ = compatibility;

  var moduleSupport = 'noModule' in document.createElement('script');
  var forceLegacy = /(?:^|[?&])legacy=1(?:&|$)/.test(
    window.location.search || ''
  );
  if (!forceLegacy && !shouldUseLegacy(window.navigator.userAgent, moduleSupport)) {
    return;
  }

  window.__CLICKTV_LEGACY__ = true;

  function onReady(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, false);
    } else {
      callback();
    }
  }

  function numberOr(value, fallback) {
    var parsed = Number(value);
    return isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  function normalizeUrl(value) {
    var normalized = String(value || '').replace(/^\s+|\s+$/g, '');
    if (!normalized || normalized.indexOf('${') !== -1) {
      return window.location.protocol + '//' + window.location.hostname + ':8080';
    }
    return normalized.replace(/\/+$/, '');
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function sortItems(items) {
    return (items || []).slice().sort(function (first, second) {
      return Number(first.ordem || 0) - Number(second.ordem || 0);
    });
  }

  function storageRead(storage, key) {
    try {
      return storage.getItem(key);
    } catch (ignored) {
      return null;
    }
  }

  function storageWrite(storage, key, value) {
    try {
      storage.setItem(key, value);
      return true;
    } catch (ignored) {
      return false;
    }
  }

  function storageRemove(storage, key) {
    try {
      storage.removeItem(key);
    } catch (ignored) {
      return;
    }
  }

  function parseJson(value) {
    try {
      return JSON.parse(value);
    } catch (ignored) {
      return null;
    }
  }

  function LegacyPlayer(root, runtime) {
    this.root = root;
    this.apiBaseUrl =
      normalizeUrl(runtime.apiBaseUrl) + '/api/public/clicktv/player';
    this.syncIntervalMs =
      numberOr(runtime.syncIntervalSeconds, 60) * 1000;
    this.heartbeatIntervalMs =
      numberOr(runtime.heartbeatIntervalSeconds, 30) * 1000;
    this.activationPollIntervalMs =
      numberOr(runtime.activationPollIntervalSeconds, 3) * 1000;

    this.credentialKey = 'clicktv.device.credential';
    this.activationKey = 'clicktv.device.activation';
    this.orientationKey = 'clicktv.screen.orientation';
    this.landscapeLocked =
      storageRead(window.localStorage, this.orientationKey) === 'landscape';
    this.credential = null;
    this.activation = null;
    this.configuration = null;
    this.activeItems = [];
    this.pendingItems = null;
    this.currentIndex = 0;
    this.currentMediaId = null;
    this.lastSynchronization = null;
    this.connectionUnavailable = false;
    this.interactionStarted = false;
    this.invalidating = false;
    this.activationRequestActive = false;
    this.syncRequestActive = false;
    this.heartbeatRequestActive = false;
    this.activationTimer = null;
    this.syncTimer = null;
    this.heartbeatTimer = null;
    this.mediaTimer = null;
    this.transitionTimer = null;
  }

  LegacyPlayer.prototype.start = function () {
    var credential = storageRead(window.localStorage, this.credentialKey);
    var pendingRaw;
    var pending;

    if (this.landscapeLocked) {
      this.applyOrientation('landscape');
    }

    if (credential) {
      this.startAuthenticated(credential);
      return;
    }

    pendingRaw = storageRead(window.sessionStorage, this.activationKey);
    pending = pendingRaw ? parseJson(pendingRaw) : null;
    if (
      pending &&
      pending.identificador &&
      Date.parse(pending.expiraEm) > new Date().getTime()
    ) {
      this.activation = pending;
      this.renderActivation(pending);
      this.scheduleActivationPoll(pending.identificador, 0);
      return;
    }

    this.createActivation();
  };

  LegacyPlayer.prototype.createActivation = function () {
    var self = this;
    this.stopAllTimers();
    storageRemove(window.sessionStorage, this.activationKey);
    this.activation = null;
    this.renderLoading('Iniciando sua tela', 'Preparando o código de ativação.');
    this.request('POST', this.apiBaseUrl + '/ativacoes', {}, null, function (error, created) {
      if (error || !created || !created.identificador) {
        self.connectionUnavailable = true;
        self.renderConnectionError();
        return;
      }
      self.connectionUnavailable = false;
      self.activation = created;
      storageWrite(
        window.sessionStorage,
        self.activationKey,
        JSON.stringify(created)
      );
      self.renderActivation(created);
      self.scheduleActivationPoll(created.identificador, 0);
    });
  };

  LegacyPlayer.prototype.scheduleActivationPoll = function (identifier, delay) {
    var self = this;
    if (this.activationTimer !== null) {
      window.clearTimeout(this.activationTimer);
    }
    this.activationTimer = window.setTimeout(function () {
      self.pollActivation(identifier);
    }, delay);
  };

  LegacyPlayer.prototype.pollActivation = function (identifier) {
    var self = this;
    if (
      this.activationRequestActive ||
      !this.activation ||
      this.activation.identificador !== identifier
    ) {
      return;
    }
    this.activationRequestActive = true;
    this.request(
      'GET',
      this.apiBaseUrl + '/ativacoes/' + encodeURIComponent(identifier) + '/status',
      null,
      null,
      function (error, status) {
        self.activationRequestActive = false;
        if (!self.activation || self.activation.identificador !== identifier) {
          return;
        }
        if (error) {
          self.connectionUnavailable = true;
          self.updateConnectionDisplay();
          self.scheduleActivationPoll(identifier, self.activationPollIntervalMs);
          return;
        }
        self.connectionUnavailable = false;
        self.updateConnectionDisplay();
        if (status && status.status === 'AGUARDANDO_VINCULO') {
          self.scheduleActivationPoll(identifier, self.activationPollIntervalMs);
          return;
        }
        if (
          status &&
          status.status === 'ATIVACAO_CONCLUIDA' &&
          status.credencial
        ) {
          storageWrite(
            window.localStorage,
            self.credentialKey,
            status.credencial
          );
          storageRemove(window.sessionStorage, self.activationKey);
          self.activation = null;
          self.startAuthenticated(status.credencial);
          return;
        }
        storageRemove(window.sessionStorage, self.activationKey);
        self.activation = null;
        self.renderExpired();
      }
    );
  };

  LegacyPlayer.prototype.startAuthenticated = function (credential) {
    var self = this;
    this.stopAllTimers();
    this.credential = credential;
    this.invalidating = false;
    this.renderLoading('Sincronizando conteúdo', 'Buscando a programação desta tela.');
    this.synchronize();
    this.sendHeartbeat();
    this.syncTimer = window.setInterval(function () {
      self.synchronize();
    }, this.syncIntervalMs);
    this.heartbeatTimer = window.setInterval(function () {
      self.sendHeartbeat();
    }, this.heartbeatIntervalMs);
  };

  LegacyPlayer.prototype.synchronize = function () {
    var self = this;
    var url;
    var versions;
    if (!this.credential || this.syncRequestActive) {
      return;
    }
    this.syncRequestActive = true;
    url = this.apiBaseUrl + '/configuracao';
    versions = this.versionsForNextSync();
    if (versions.length) {
      url += '?' + versions.join('&');
    }
    this.request('GET', url, null, this.credential, function (error, response) {
      self.syncRequestActive = false;
      if (error) {
        self.handleAuthenticatedError(error);
        return;
      }
      self.connectionUnavailable = false;
      self.lastSynchronization = new Date().toISOString();
      self.updateConnectionDisplay();
      if (!response || (response.alterada === false && self.configuration)) {
        return;
      }
      self.handleConfiguration(response);
    });
  };

  LegacyPlayer.prototype.versionsForNextSync = function () {
    var result = [];
    var configuration = this.configuration;
    if (!configuration || this.urlsNeedRenewal(configuration)) {
      return result;
    }
    if (
      configuration.tela &&
      configuration.tela.versaoConfiguracao != null
    ) {
      result.push(
        'versaoConfiguracao=' +
          encodeURIComponent(configuration.tela.versaoConfiguracao)
      );
    }
    if (
      configuration.playlist &&
      configuration.playlist.versao != null
    ) {
      result.push(
        'playlistVersao=' +
          encodeURIComponent(configuration.playlist.versao)
      );
    }
    return result;
  };

  LegacyPlayer.prototype.urlsNeedRenewal = function (configuration) {
    var threshold =
      new Date().getTime() + Math.max(120000, this.syncIntervalMs * 2);
    var items = configuration.itens || [];
    var index;
    var expiration;
    for (index = 0; index < items.length; index += 1) {
      expiration = items[index].midia
        ? items[index].midia.urlExpiraEm
        : null;
      if (expiration && Date.parse(expiration) <= threshold) {
        return true;
      }
    }
    return false;
  };

  LegacyPlayer.prototype.handleConfiguration = function (response) {
    var items = sortItems(response && response.itens);
    this.configuration = response;
    if (this.activeItems.length && this.currentMediaId !== null) {
      this.pendingItems = items;
      return;
    }
    this.applyItems(items);
  };

  LegacyPlayer.prototype.applyItems = function (items) {
    this.activeItems = items;
    this.pendingItems = null;
    this.currentIndex = 0;
    if (!items.length) {
      this.currentMediaId = null;
      this.renderNoContent();
      return;
    }
    this.renderPlaybackShell();
    this.playCurrent();
  };

  LegacyPlayer.prototype.playCurrent = function () {
    var self = this;
    var stage = document.getElementById('clicktv-legacy-stage');
    var item;
    var media;
    var duration;
    var playResult;

    this.clearMediaTimer();
    if (!stage || !this.activeItems.length) {
      this.currentMediaId = null;
      this.renderNoContent();
      return;
    }

    stage.innerHTML = '';
    item = this.activeItems[this.currentIndex];
    this.currentMediaId = item.midia.id;
    duration = Number(item.duracaoSegundos || 0);

    if (item.midia.tipo === 'VIDEO') {
      media = document.createElement('video');
      media.autoplay = true;
      media.muted = true;
      media.setAttribute('playsinline', 'playsinline');
      media.setAttribute('webkit-playsinline', 'webkit-playsinline');
      media.preload = 'auto';
      media.oncanplay = function () {
        self.showMedia(media);
        playResult = media.play();
        if (playResult && typeof playResult['catch'] === 'function') {
          playResult['catch'](function () {
            return;
          });
        }
        if (duration > 0) {
          self.mediaTimer = window.setTimeout(function () {
            self.advance();
          }, duration * 1000);
        }
      };
      media.onended = function () {
        self.advance();
      };
    } else {
      media = document.createElement('img');
      media.alt = item.midia.nome || '';
      media.onload = function () {
        self.showMedia(media);
        self.mediaTimer = window.setTimeout(function () {
          self.advance();
        }, Math.max(1, duration || 5) * 1000);
      };
    }

    media.className = 'clicktv-legacy__media';
    media.onerror = function () {
      self.advance();
    };
    media.src = item.midia.url;
    stage.appendChild(media);
    this.updateConnectionDisplay();
  };

  LegacyPlayer.prototype.advance = function () {
    var self = this;
    var stage;
    var media;

    if (this.transitionTimer !== null) {
      return;
    }
    this.clearMediaTimer();
    stage = document.getElementById('clicktv-legacy-stage');
    media = stage && stage.children ? stage.children[0] : null;
    if (media) {
      media.className = media.className.replace(
        /(?:^|\s)clicktv-legacy__media--visible(?:\s|$)/,
        ' '
      );
    }
    this.transitionTimer = window.setTimeout(function () {
      self.transitionTimer = null;
      self.advanceImmediately();
    }, 500);
  };

  LegacyPlayer.prototype.advanceImmediately = function () {
    if (this.pendingItems !== null) {
      this.applyItems(this.pendingItems);
      return;
    }
    if (!this.activeItems.length) {
      this.currentMediaId = null;
      this.renderNoContent();
      return;
    }
    this.currentIndex = (this.currentIndex + 1) % this.activeItems.length;
    this.playCurrent();
  };

  LegacyPlayer.prototype.showMedia = function (media) {
    if (
      media.className.indexOf('clicktv-legacy__media--visible') === -1
    ) {
      media.className += ' clicktv-legacy__media--visible';
    }
  };

  LegacyPlayer.prototype.sendHeartbeat = function () {
    var self = this;
    var current = this.configuration;
    var payload;
    if (!this.credential || this.heartbeatRequestActive) {
      return;
    }
    this.heartbeatRequestActive = true;
    payload = {
      versaoPlayer: '1.0.2-legacy',
      versaoConfiguracao:
        current && current.tela
          ? current.tela.versaoConfiguracao
          : null,
      playlistId:
        current && current.playlist
          ? current.playlist.id
          : null,
      playlistVersao:
        current && current.playlist
          ? current.playlist.versao
          : null,
      midiaAtualId: this.currentMediaId,
      resolucaoTela: window.screen.width + 'x' + window.screen.height,
      userAgent: String(window.navigator.userAgent || '').substring(0, 500),
      ultimaSincronizacaoEm: this.lastSynchronization
    };
    this.request(
      'POST',
      this.apiBaseUrl + '/heartbeat',
      payload,
      this.credential,
      function (error) {
        self.heartbeatRequestActive = false;
        if (error) {
          self.handleAuthenticatedError(error);
          return;
        }
        self.connectionUnavailable = false;
        self.updateConnectionDisplay();
      }
    );
  };

  LegacyPlayer.prototype.handleAuthenticatedError = function (error) {
    if (error && error.status === 401) {
      this.invalidateCredential();
      return;
    }
    this.connectionUnavailable = true;
    if (!this.configuration) {
      this.renderConnectionError();
    } else {
      this.updateConnectionDisplay();
    }
  };

  LegacyPlayer.prototype.invalidateCredential = function () {
    var self = this;
    if (this.invalidating) {
      return;
    }
    this.invalidating = true;
    this.stopAllTimers();
    storageRemove(window.localStorage, this.credentialKey);
    storageRemove(window.sessionStorage, this.activationKey);
    this.credential = null;
    this.configuration = null;
    this.activeItems = [];
    this.pendingItems = null;
    this.currentMediaId = null;
    this.renderStatus(
      '○',
      'Dispositivo desvinculado',
      'Preparando um novo código de ativação.',
      null
    );
    window.setTimeout(function () {
      self.invalidating = false;
      self.createActivation();
    }, 1500);
  };

  LegacyPlayer.prototype.resetDevice = function () {
    if (
      !window.confirm(
        'Redefinir este dispositivo? Será necessário vinculá-lo novamente.'
      )
    ) {
      return;
    }
    this.stopAllTimers();
    storageRemove(window.localStorage, this.credentialKey);
    storageRemove(window.sessionStorage, this.activationKey);
    this.credential = null;
    this.activation = null;
    this.configuration = null;
    this.activeItems = [];
    this.pendingItems = null;
    this.currentMediaId = null;
    this.interactionStarted = false;
    this.createActivation();
  };

  LegacyPlayer.prototype.startExperience = function () {
    var interaction = document.getElementById('clicktv-legacy-interaction');
    var video = document.getElementById('clicktv-legacy-stage');
    var media;
    var requestFullscreen;
    this.interactionStarted = true;
    if (interaction && interaction.parentNode) {
      interaction.parentNode.removeChild(interaction);
    }
    if (video) {
      media = video.getElementsByTagName('video')[0];
      if (media) {
        try {
          media.play();
        } catch (ignored) {
          return;
        }
      }
    }
    requestFullscreen =
      document.documentElement.requestFullscreen ||
      document.documentElement.webkitRequestFullscreen;
    if (requestFullscreen) {
      try {
        requestFullscreen.call(document.documentElement);
      } catch (ignoredFullscreen) {
        return;
      }
    }
  };

  LegacyPlayer.prototype.applyOrientation = function (mode) {
    if (window.ClickTV && typeof window.ClickTV.setOrientation === 'function') {
      try {
        window.ClickTV.setOrientation(mode);
      } catch (ignored) {
        return;
      }
    }
  };

  LegacyPlayer.prototype.toggleOrientation = function () {
    var mode = this.landscapeLocked ? 'automatic' : 'landscape';
    var button;
    this.landscapeLocked = mode === 'landscape';
    storageWrite(window.localStorage, this.orientationKey, mode);
    this.applyOrientation(mode);
    button = document.getElementById('clicktv-legacy-orientation');
    if (button) {
      button.title = this.landscapeLocked
        ? 'Rotação automática'
        : 'Orientação paisagem';
      button.innerHTML =
        '<span class="clicktv-legacy__orientation-icon"></span>' +
        (this.landscapeLocked ? 'Automática' : 'Paisagem');
    }
  };

  LegacyPlayer.prototype.orientationControlHtml = function () {
    if (!window.ClickTV || typeof window.ClickTV.setOrientation !== 'function') {
      return '';
    }
    return (
      '<button id="clicktv-legacy-orientation" ' +
      'class="clicktv-legacy__orientation" type="button" title="' +
      (this.landscapeLocked ? 'Rotação automática' : 'Orientação paisagem') +
      '"><span class="clicktv-legacy__orientation-icon"></span>' +
      (this.landscapeLocked ? 'Automática' : 'Paisagem') +
      '</button>'
    );
  };

  LegacyPlayer.prototype.bindOrientationControl = function () {
    var self = this;
    this.bindClick('clicktv-legacy-orientation', function () {
      self.toggleOrientation();
    });
  };

  LegacyPlayer.prototype.renderPlaybackShell = function () {
    var self = this;
    var interaction = this.interactionStarted
      ? ''
      : '<div id="clicktv-legacy-interaction" class="clicktv-legacy__interaction">' +
        '<div class="clicktv-legacy__interaction-center">' +
        '<button id="clicktv-legacy-start" class="clicktv-legacy__button" type="button">' +
        '▶ Iniciar reprodução</button>' +
        '<p class="clicktv-legacy__message">Pressione uma vez para iniciar.</p>' +
        '</div></div>';
    this.root.className = 'clicktv-legacy';
    this.root.innerHTML =
      '<div class="clicktv-legacy__stage" id="clicktv-legacy-stage"></div>' +
      interaction +
      '<div id="clicktv-legacy-offline"></div>' +
      this.orientationControlHtml();
    this.bindClick('clicktv-legacy-start', function () {
      self.startExperience();
    });
    this.focusElement('clicktv-legacy-start');
    this.bindOrientationControl();
    this.updateConnectionDisplay();
  };

  LegacyPlayer.prototype.renderLoading = function (title, message) {
    this.renderStatus(null, title, message, null, true);
  };

  LegacyPlayer.prototype.renderActivation = function (activation) {
    var code = String(activation.codigo || '');
    var formatted =
      code.length === 6 ? code.substring(0, 3) + ' ' + code.substring(3) : code;
    this.renderStatus(
      null,
      'Vincule esta tela',
      'No ClickManager, acesse ClickTV → Telas e informe o código acima.',
      null,
      false,
      formatted
    );
  };

  LegacyPlayer.prototype.renderExpired = function () {
    var self = this;
    this.renderStatus(
      '⌛',
      'O código expirou',
      'Gere um novo código para continuar a vinculação.',
      'Gerar novo código'
    );
    this.bindClick('clicktv-legacy-action', function () {
      self.createActivation();
    });
  };

  LegacyPlayer.prototype.renderNoContent = function () {
    this.renderStatus(
      '▣',
      'Tela pronta',
      'Associe uma playlist padrão no ClickManager para começar.',
      null
    );
  };

  LegacyPlayer.prototype.renderConnectionError = function () {
    var self = this;
    this.renderStatus(
      '↻',
      'Sem conexão',
      'Verifique a rede. Tentaremos novamente em seguida.',
      'Tentar novamente'
    );
    this.bindClick('clicktv-legacy-action', function () {
      if (self.credential) {
        self.startAuthenticated(self.credential);
      } else {
        self.createActivation();
      }
    });
  };

  LegacyPlayer.prototype.renderStatus = function (
    icon,
    title,
    message,
    action,
    loading,
    activationCode
  ) {
    var self = this;
    var content = '';
    if (loading) {
      content += '<span class="clicktv-legacy__spinner"></span>';
    } else if (activationCode) {
      content += '<div class="clicktv-legacy__eyebrow">Código de ativação</div>';
      content +=
        '<div class="clicktv-legacy__code">' +
        escapeHtml(activationCode) +
        '</div>';
    } else if (icon) {
      content +=
        '<div class="clicktv-legacy__icon">' + escapeHtml(icon) + '</div>';
    }
    content +=
      '<h1 class="clicktv-legacy__title">' + escapeHtml(title) + '</h1>';
    content +=
      '<p class="clicktv-legacy__message">' + escapeHtml(message) + '</p>';
    if (activationCode) {
      content +=
        '<div class="clicktv-legacy__waiting">' +
        '<span class="clicktv-legacy__dot"></span>Aguardando vinculação</div>';
    }
    if (action) {
      content +=
        '<button id="clicktv-legacy-action" class="clicktv-legacy__button" ' +
        'type="button">' + escapeHtml(action) + '</button>';
    }
    this.root.className = 'clicktv-legacy';
    this.root.innerHTML =
      '<div class="clicktv-legacy__status">' +
      '<div class="clicktv-legacy__brand">' +
      '<span class="clicktv-legacy__brand-mark">C</span>' +
      '<span>Click<span class="clicktv-legacy__brand-tv">TV</span></span>' +
      '</div>' +
      '<div class="clicktv-legacy__center">' +
      '<div class="clicktv-legacy__card">' + content + '</div>' +
      '</div></div>' +
      '<div id="clicktv-legacy-offline"></div>' +
      this.orientationControlHtml() +
      '<a class="clicktv-legacy__privacy" href="/privacidade">' +
      'Política de Privacidade</a>' +
      '<button id="clicktv-legacy-reset" class="clicktv-legacy__reset" ' +
      'type="button" title="Redefinir dispositivo">↻</button>';
    this.bindClick('clicktv-legacy-reset', function () {
      self.resetDevice();
    });
    this.bindOrientationControl();
    this.updateConnectionDisplay();
  };

  LegacyPlayer.prototype.updateConnectionDisplay = function () {
    var badge = document.getElementById('clicktv-legacy-offline');
    if (!badge) {
      return;
    }
    if (this.connectionUnavailable) {
      badge.className = 'clicktv-legacy__offline';
      badge.innerHTML = '● Reconectando';
    } else {
      badge.className = '';
      badge.innerHTML = '';
    }
  };

  LegacyPlayer.prototype.bindClick = function (id, handler) {
    var element = document.getElementById(id);
    if (element) {
      element.onclick = handler;
    }
  };

  LegacyPlayer.prototype.focusElement = function (id) {
    var element = document.getElementById(id);
    if (element && element.focus) {
      try {
        element.focus();
      } catch (ignored) {
        return;
      }
    }
  };

  LegacyPlayer.prototype.request = function (
    method,
    url,
    body,
    credential,
    callback
  ) {
    var xhr = new XMLHttpRequest();
    var completed = false;
    xhr.open(method, url, true);
    xhr.timeout = 20000;
    xhr.setRequestHeader('Accept', 'application/json');
    if (body !== null) {
      xhr.setRequestHeader('Content-Type', 'application/json');
    }
    if (credential) {
      xhr.setRequestHeader('Authorization', 'Bearer ' + credential);
    }
    xhr.onreadystatechange = function () {
      var response;
      if (xhr.readyState !== 4 || completed) {
        return;
      }
      completed = true;
      response = xhr.responseText ? parseJson(xhr.responseText) : null;
      if (xhr.status >= 200 && xhr.status < 300) {
        callback(null, response);
      } else {
        callback({ status: xhr.status, response: response }, null);
      }
    };
    xhr.onerror = function () {
      if (!completed) {
        completed = true;
        callback({ status: 0 }, null);
      }
    };
    xhr.ontimeout = xhr.onerror;
    try {
      xhr.send(body === null ? null : JSON.stringify(body));
    } catch (error) {
      if (!completed) {
        completed = true;
        callback({ status: 0, cause: error }, null);
      }
    }
  };

  LegacyPlayer.prototype.clearMediaTimer = function () {
    if (this.mediaTimer !== null) {
      window.clearTimeout(this.mediaTimer);
      this.mediaTimer = null;
    }
  };

  LegacyPlayer.prototype.clearTransitionTimer = function () {
    if (this.transitionTimer !== null) {
      window.clearTimeout(this.transitionTimer);
      this.transitionTimer = null;
    }
  };

  LegacyPlayer.prototype.stopAllTimers = function () {
    if (this.activationTimer !== null) {
      window.clearTimeout(this.activationTimer);
      this.activationTimer = null;
    }
    if (this.syncTimer !== null) {
      window.clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    if (this.heartbeatTimer !== null) {
      window.clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    this.clearMediaTimer();
    this.clearTransitionTimer();
    this.activationRequestActive = false;
    this.syncRequestActive = false;
    this.heartbeatRequestActive = false;
  };

  onReady(function () {
    var root = document.getElementsByTagName('app-root')[0];
    var runtime = window.__CLICKTV_CONFIG__ || {};
    if (!root) {
      return;
    }
    new LegacyPlayer(root, runtime).start();
  });
})(window, document);
