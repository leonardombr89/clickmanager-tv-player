const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const acorn = require('acorn');

const sourcePath = path.join(
  __dirname,
  '..',
  'src',
  'assets',
  'legacy-player.js'
);
const source = fs.readFileSync(sourcePath, 'utf8');

acorn.parse(source, {
  ecmaVersion: 5,
  sourceType: 'script',
  allowReserved: true
});

assert.equal(/\bfetch\s*\(/.test(source), false, 'não deve usar fetch');
assert.equal(/=>/.test(source), false, 'não deve usar arrow functions');
assert.equal(/\b(?:const|let)\b/.test(source), false, 'não deve usar const ou let');
assert.equal(/`/.test(source), false, 'não deve usar template literals');

const windowMock = {
  navigator: {
    userAgent:
      'Mozilla/5.0 Chrome/150.0.0.0 Safari/537.36'
  },
  location: { search: '' }
};
const documentMock = {
  createElement() {
    return { noModule: true };
  }
};

vm.runInNewContext(source, {
  window: windowMock,
  document: documentMock,
  Number,
  String,
  Date,
  JSON,
  Math,
  parseFloat,
  parseInt,
  isFinite,
  encodeURIComponent,
  XMLHttpRequest: function XMLHttpRequest() {}
});

const shouldUseLegacy =
  windowMock.__CLICKTV_LEGACY_COMPAT__.shouldUseLegacy;

assert.equal(
  shouldUseLegacy(
    'Mozilla/5.0 (SMART-TV; Linux; Tizen 2.3) AppleWebkit/538.1 ' +
      'SamsungBrowser/1.0 TV Safari/538.1',
    false
  ),
  true,
  'Samsung 2015 deve usar o player legado'
);
assert.equal(
  shouldUseLegacy(
    'Mozilla/5.0 (SMART-TV; LINUX; Tizen 7.0) AppleWebKit/537.36 ' +
      'Chrome/94.0 TV Safari/537.36',
    true
  ),
  true,
  'Tizen anterior ao 8 deve usar o player legado'
);
assert.equal(
  shouldUseLegacy(
    'Mozilla/5.0 (SMART-TV; LINUX; Tizen 8.0) AppleWebKit/537.36 ' +
      'Chrome/108.0 TV Safari/537.36',
    true
  ),
  false,
  'Tizen 8 pode continuar no player moderno'
);
assert.equal(
  shouldUseLegacy(
    'Mozilla/5.0 Chrome/150.0.0.0 Safari/537.36',
    true
  ),
  false,
  'Chrome moderno deve continuar no Angular'
);
assert.equal(
  shouldUseLegacy(
    'Mozilla/5.0 Chrome/90.0.0.0 Safari/537.36',
    true
  ),
  true,
  'Chromium antigo deve usar o player legado'
);

function createStorage() {
  const values = Object.create(null);
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(values, key)
        ? values[key]
        : null;
    },
    setItem(key, value) {
      values[key] = String(value);
    },
    removeItem(key) {
      delete values[key];
    }
  };
}

function legacyFlowContext() {
  const timeouts = [];
  const intervals = [];
  const elements = Object.create(null);
  const root = { className: '' };
  const stage = {
    children: [],
    innerHTML: '',
    appendChild(child) {
      this.children.push(child);
    },
    getElementsByTagName(tagName) {
      return this.children.filter(
        (child) => child.tagName === String(tagName).toUpperCase()
      );
    }
  };

  Object.defineProperty(root, 'innerHTML', {
    get() {
      return this.value || '';
    },
    set(value) {
      this.value = value;
      elements['clicktv-legacy-stage'] =
        value.indexOf('clicktv-legacy-stage') >= 0 ? stage : null;
      elements['clicktv-legacy-start'] =
        value.indexOf('clicktv-legacy-start') >= 0 ? {} : null;
      elements['clicktv-legacy-action'] =
        value.indexOf('clicktv-legacy-action') >= 0 ? {} : null;
      elements['clicktv-legacy-reset'] = {};
      elements['clicktv-legacy-offline'] = {
        className: '',
        innerHTML: ''
      };
    }
  });

  const responses = {
    activation: {
      identificador: 'identificador-legado',
      codigo: '482913',
      expiraEm: '2099-08-01T12:00:00'
    },
    status: {
      status: 'ATIVACAO_CONCLUIDA',
      expiraEm: null,
      credencial: 'credencial-legada'
    },
    configuration: {
      alterada: true,
      estado: 'CONTEUDO_DISPONIVEL',
      tela: {
        id: 2,
        nome: 'Samsung',
        orientacao: 'HORIZONTAL',
        versaoConfiguracao: 3
      },
      playlist: {
        id: 4,
        nome: 'Principal',
        orientacao: 'HORIZONTAL',
        versao: 5
      },
      itens: [
        {
          id: 9,
          ordem: 0,
          duracaoSegundos: 10,
          midia: {
            id: 8,
            nome: 'Logo',
            tipo: 'IMAGEM',
            url: 'https://example.com/logo.png',
            urlExpiraEm: '2099-08-01T12:00:00'
          }
        }
      ]
    }
  };

  function FakeXMLHttpRequest() {
    this.readyState = 0;
    this.status = 0;
    this.responseText = '';
  }
  FakeXMLHttpRequest.prototype.open = function (method, url) {
    this.method = method;
    this.url = url;
  };
  FakeXMLHttpRequest.prototype.setRequestHeader = function () {};
  FakeXMLHttpRequest.prototype.send = function () {
    let response;
    if (this.method === 'POST' && /\/ativacoes$/.test(this.url)) {
      response = responses.activation;
    } else if (/\/ativacoes\/.+\/status$/.test(this.url)) {
      response = responses.status;
    } else if (/\/configuracao/.test(this.url)) {
      response = responses.configuration;
    } else {
      response = { recebidoEm: '2026-07-30T10:00:00' };
    }
    this.readyState = 4;
    this.status = 200;
    this.responseText = JSON.stringify(response);
    this.onreadystatechange();
  };

  const documentLegacy = {
    readyState: 'complete',
    documentElement: {},
    createElement(tagName) {
      if (tagName === 'script') {
        return {};
      }
      return {
        tagName: String(tagName).toUpperCase(),
        className: '',
        setAttribute() {}
      };
    },
    getElementsByTagName(tagName) {
      return tagName === 'app-root' ? [root] : [];
    },
    getElementById(id) {
      return elements[id] || null;
    }
  };
  const localStorage = createStorage();
  const sessionStorage = createStorage();
  const windowLegacy = {
    navigator: {
      userAgent:
        'Mozilla/5.0 (SMART-TV; Linux; Tizen 2.3) ' +
        'AppleWebkit/538.1 SamsungBrowser/1.0 TV Safari/538.1'
    },
    location: {
      protocol: 'http:',
      hostname: '192.168.2.182',
      search: ''
    },
    screen: { width: 1920, height: 1080 },
    localStorage,
    sessionStorage,
    setTimeout(callback, delay) {
      timeouts.push({ callback, delay });
      return timeouts.length;
    },
    clearTimeout() {},
    setInterval(callback, delay) {
      intervals.push({ callback, delay });
      return intervals.length;
    },
    clearInterval() {},
    confirm() {
      return true;
    },
    __CLICKTV_CONFIG__: {
      apiBaseUrl: 'http://192.168.2.182:8080',
      syncIntervalSeconds: 60,
      heartbeatIntervalSeconds: 30,
      activationPollIntervalSeconds: 3
    }
  };

  vm.runInNewContext(source, {
    window: windowLegacy,
    document: documentLegacy,
    Number,
    String,
    Date,
    JSON,
    Math,
    parseFloat,
    parseInt,
    isFinite,
    encodeURIComponent,
    XMLHttpRequest: FakeXMLHttpRequest
  });

  return {
    root,
    stage,
    localStorage,
    sessionStorage,
    timeouts,
    intervals,
    windowLegacy
  };
}

const flow = legacyFlowContext();
assert.equal(flow.windowLegacy.__CLICKTV_LEGACY__, true);
assert.match(flow.root.innerHTML, /482 913/);
assert.match(
  flow.sessionStorage.getItem('clicktv.device.activation'),
  /identificador-legado/
);

const activationPoll = flow.timeouts.shift();
assert.equal(activationPoll.delay, 0);
activationPoll.callback();

assert.equal(
  flow.localStorage.getItem('clicktv.device.credential'),
  'credencial-legada'
);
assert.equal(
  flow.sessionStorage.getItem('clicktv.device.activation'),
  null
);
assert.equal(flow.stage.children.length, 1);
assert.equal(flow.stage.children[0].tagName, 'IMG');
assert.equal(flow.stage.children[0].src, 'https://example.com/logo.png');
assert.equal(
  /clicktv-legacy__media--visible/.test(flow.stage.children[0].className),
  false
);
flow.stage.children[0].onload();
assert.equal(
  /clicktv-legacy__media--visible/.test(flow.stage.children[0].className),
  true
);
assert.equal(flow.intervals.length, 2);

console.log('Compatibilidade do player legado validada.');
