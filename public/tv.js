var timers = {};

function fmtTempo(segundos) {
  if (segundos <= 0) return '00:00';
  var m = Math.floor(segundos / 60);
  var s = segundos % 60;
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

function calcularRestante(pedido) {
  if (!pedido.brincando_em) return null;
  var duracaoTotal = (pedido.duracao + (pedido.extra_min || 0)) * 60;
  var brincandoEm  = new Date(pedido.brincando_em.replace(' ', 'T') + 'Z').getTime();
  var decorrido    = Math.floor((Date.now() - brincandoEm) / 1000);
  return duracaoTotal - decorrido;
}

function renderSenhas(pedidos) {
  Object.keys(timers).forEach(function(id) {
    clearInterval(timers[id]);
    delete timers[id];
  });

  if (!pedidos || pedidos.length === 0) {
    document.getElementById('telaEspera').style.display = 'flex';
    document.getElementById('telaAtiva').style.display  = 'none';
    return;
  }

  document.getElementById('telaEspera').style.display = 'none';
  document.getElementById('telaAtiva').style.display  = 'flex';

  var grid = document.getElementById('senhasGrid');
  grid.innerHTML = '';

  var tamanho = pedidos.length <= 2 ? '8rem' : pedidos.length <= 4 ? '6rem' : '4rem';

  pedidos.forEach(function(pedido) {
    var card = document.createElement('div');
    card.className  = 'senha-card ' + pedido.status;
    card.id         = 'card-' + pedido.id;

    var statusLabel = pedido.status === 'chamando' ? '📢 CHAMANDO' : '🎮 BRINCANDO';
    var msgLabel    = pedido.status === 'chamando' ? 'Dirija-se à entrada!' : pedido.duracao + 'min' + (pedido.extra_min > 0 ? ' +' + pedido.extra_min + 'min' : '');
    var timerHtml   = pedido.status === 'brincando'
      ? '<div class="card-timer" id="timer-' + pedido.id + '">' + fmtTempo(calcularRestante(pedido)) + '</div>'
      : '';

    card.innerHTML =
      '<div class="card-status">' + statusLabel + '</div>' +
      '<div class="card-senha" style="font-size:' + tamanho + '">#' + pedido.senha + '</div>' +
      timerHtml +
      '<div class="card-msg">' + msgLabel + '</div>';

    grid.appendChild(card);


    if (pedido.status === 'brincando') {
      timers[pedido.id] = setInterval(function() {
        var el = document.getElementById('timer-' + pedido.id);
        if (!el) { clearInterval(timers[pedido.id]); return; }

        var restante = calcularRestante(pedido);
        el.textContent = fmtTempo(restante);

        if (restante <= 0) {
          el.className = 'card-timer critico';
          el.textContent = '⏰ ESGOTADO';
          clearInterval(timers[pedido.id]);
        } else if (restante <= 60) {
          el.className = 'card-timer critico';
        } else if (restante <= 300) {
          el.className = 'card-timer aviso';
        } else {
          el.className = 'card-timer';
        }
      }, 1000);
    }
  });
}

function verificarSenhas() {
  fetch('https://smiley-park.onrender.com')
    .then(function(res) { return res.json(); })
    .then(function(pedidos) {
      renderSenhas(pedidos);
    })
    .catch(function() {
      renderSenhas([]);
    });
}

setInterval(verificarSenhas, 2000);
verificarSenhas();