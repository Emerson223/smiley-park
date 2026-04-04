// Verifica se está logado
(function() {
  if (!sessionStorage.getItem('adminLogado')) {
    window.location.href = 'login.html';
  }
})();

document.addEventListener('DOMContentLoaded', function() {

  var filtroAtual  = 'todos';
  var todosPedidos = [];
  var timers = {};

  function fmt(v) { return 'R$ ' + parseFloat(v).toFixed(2).replace('.', ','); }

  function fmtHora(data) {
    var d = new Date(data);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  function calcularTempoRestante(pedido) {
    if (!pedido.brincando_em) return null;
    var duracaoTotal = (pedido.duracao + (pedido.extra_min || 0)) * 60;
    var brincandoEm  = new Date(pedido.brincando_em.replace(' ', 'T') + 'Z').getTime();
    var decorrido    = Math.floor((Date.now() - brincandoEm) / 1000);
    return duracaoTotal - decorrido;
  }

  function fmtTempo(segundos) {
    if (segundos <= 0) return '⏰ ESGOTADO';
    var m = Math.floor(segundos / 60);
    var s = segundos % 60;
    return m + ':' + String(s).padStart(2, '0');
  }

  function buscarPedidos() {
    fetch('http://localhost:3000/pedidos')
      .then(function(res) { return res.json(); })
      .then(function(pedidos) {
        todosPedidos = pedidos;
        atualizarResumo(pedidos);
        renderTabela(pedidos);
        var agora = new Date();
        document.getElementById('ultimaAtualizacao').textContent =
          'Atualizado às ' + agora.toLocaleTimeString('pt-BR');
      })
      .catch(function() {
        document.getElementById('tabelaBody').innerHTML =
          '<tr><td colspan="9"><div class="vazio"><span>❌</span>Servidor offline.</div></td></tr>';
      });
  }

  function atualizarResumo(pedidos) {
    var aguardando  = pedidos.filter(function(p) { return p.status === 'aguardando'; }).length;
    var finalizados = pedidos.filter(function(p) { return p.status === 'finalizado'; }).length;
    var pessoas     = pedidos.reduce(function(acc, p) { return acc + p.pessoas; }, 0);
    var arrecadado  = pedidos
      .filter(function(p) { return p.status !== 'cancelado'; })
      .reduce(function(acc, p) { return acc + p.total; }, 0);

    document.getElementById('totalPedidos').textContent     = pedidos.length;
    document.getElementById('totalAguardando').textContent  = aguardando;
    document.getElementById('totalFinalizados').textContent = finalizados;
    document.getElementById('totalPessoas').textContent     = pessoas;
    document.getElementById('totalArrecadado').textContent  = fmt(arrecadado);
  }

  function renderTabela(pedidos) {
    var lista = filtroAtual === 'todos'
      ? pedidos
      : pedidos.filter(function(p) { return p.status === filtroAtual; });

    if (lista.length === 0) {
      document.getElementById('tabelaBody').innerHTML =
        '<tr><td colspan="9"><div class="vazio"><span>📋</span>Nenhum pedido encontrado</div></td></tr>';
      return;
    }

    var html = '';
    lista.forEach(function(p) {
      var botoes = '';
      if (p.status === 'aguardando') {
        botoes += '<button class="btn-acao btn-chamar" onclick="chamar(' + p.id + ')">📢 Chamar</button>';
        botoes += '<button class="btn-acao btn-deletar" onclick="deletar(' + p.id + ')">🗑️</button>';
      }
      if (p.status === 'chamando') {
        botoes += '<button class="btn-acao btn-brincar" onclick="brincar(' + p.id + ')">🎮 Brincando</button>';
      }
      if (p.status === 'brincando') {
        botoes += '<button class="btn-acao btn-finalizar" onclick="finalizar(' + p.id + ')">✅ Finalizar</button>';
      }

      var timerHtml = '-';
      if (p.status === 'brincando') {
        var restante = calcularTempoRestante(p);
        var cor = restante <= 0 ? '#ff5555' : restante <= 60 ? '#ff5555' : restante <= 300 ? '#ff8c00' : '#4caf50';
        timerHtml = '<span id="timer-' + p.id + '" style="font-family:Poppins;font-weight:700;color:' + cor + '">' + fmtTempo(restante) + '</span>';
      }

      var statusLabel = {
        aguardando: '⏳ aguardando',
        chamando:   '📢 chamando',
        brincando:  '🎮 brincando',
        finalizado: '✅ finalizado'
      }[p.status] || p.status;

      html += '<tr>' +
        '<td><span class="senha-badge">#' + p.senha + '</span></td>' +
        '<td>' + p.pessoas + ' pessoa(s)</td>' +
        '<td>' + p.duracao + 'min' + (p.extra_min > 0 ? ' +' + p.extra_min + 'min' : '') + '</td>' +
        '<td>' + p.pagamento + '</td>' +
        '<td>' + fmt(p.total) + '</td>' +
        '<td><span class="status ' + p.status + '">' + statusLabel + '</span></td>' +
        '<td>' + timerHtml + '</td>' +
        '<td>' + fmtHora(p.criado_em) + '</td>' +
        '<td><div class="acoes">' + botoes + '</div></td>' +
      '</tr>';
    });

    document.getElementById('tabelaBody').innerHTML = html;

    lista.filter(function(p) { return p.status === 'brincando'; }).forEach(function(p) {
      iniciarTimer(p);
    });
  }

  function iniciarTimer(pedido) {
    if (timers[pedido.id]) clearInterval(timers[pedido.id]);

    timers[pedido.id] = setInterval(function() {
      var el = document.getElementById('timer-' + pedido.id);
      if (!el) { clearInterval(timers[pedido.id]); return; }

      var restante = calcularTempoRestante(pedido);
      el.textContent = fmtTempo(restante);

      if (restante <= 0) {
        el.style.color = '#ff5555';
        el.textContent = '⏰ ESGOTADO';
        clearInterval(timers[pedido.id]);
      } else if (restante <= 60) {
        el.style.color = '#ff5555';
      } else if (restante <= 300) {
        el.style.color = '#ff8c00';
      } else {
        el.style.color = '#4caf50';
      }
    }, 1000);
  }

  window.chamar = function(id) {
    fetch('http://localhost:3000/pedido/' + id + '/status', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'chamando' })
    }).then(function() { buscarPedidos(); });
  };

  window.brincar = function(id) {
    fetch('http://localhost:3000/pedido/' + id + '/status', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'brincando' })
    }).then(function() { buscarPedidos(); });
  };

  window.finalizar = function(id) {
    if (timers[id]) clearInterval(timers[id]);
    fetch('http://localhost:3000/pedido/' + id + '/status', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'finalizado' })
    }).then(function() { buscarPedidos(); });
  };

  window.deletar = function(id) {
    if (!confirm('Tem certeza que quer deletar?')) return;
    if (timers[id]) clearInterval(timers[id]);
    fetch('http://localhost:3000/pedido/' + id, { method: 'DELETE' })
      .then(function() { buscarPedidos(); });
  };

  document.querySelectorAll('.filtro-btn').forEach(function(btn) {
    btn.onclick = function() {
      document.querySelectorAll('.filtro-btn').forEach(function(b) { b.classList.remove('ativo'); });
      btn.classList.add('ativo');
      filtroAtual = btn.getAttribute('data-filtro');
      renderTabela(todosPedidos);
    };
  });

  document.getElementById('btnAtualizar').onclick = buscarPedidos;

  // ── MODAL TROCAR SENHA ──
  document.getElementById('btnConfig').onclick = function() {
    document.getElementById('modalOverlay').style.display = 'flex';
  };

  document.getElementById('btnFecharModal').onclick = function() {
    fecharModal();
  };

  function fecharModal() {
    document.getElementById('modalOverlay').style.display = 'none';
    document.getElementById('senhaAtual').value   = '';
    document.getElementById('senhaNova').value    = '';
    document.getElementById('senhaConfirm').value = '';
    document.getElementById('modalErro').style.display    = 'none';
    document.getElementById('modalSucesso').style.display = 'none';
  }

  document.getElementById('btnSalvarSenha').onclick = function() {
    var atual     = document.getElementById('senhaAtual').value.trim();
    var nova      = document.getElementById('senhaNova').value.trim();
    var confirm   = document.getElementById('senhaConfirm').value.trim();
    var erroEl    = document.getElementById('modalErro');
    var sucessoEl = document.getElementById('modalSucesso');

    erroEl.style.display    = 'none';
    sucessoEl.style.display = 'none';

    if (!atual || !nova || !confirm) {
      erroEl.textContent   = '❌ Preencha todos os campos!';
      erroEl.style.display = 'block';
      return;
    }

    if (nova !== confirm) {
      erroEl.textContent   = '❌ As senhas não coincidem!';
      erroEl.style.display = 'block';
      return;
    }

    if (nova.length < 4) {
      erroEl.textContent   = '❌ Senha muito curta! Mínimo 4 caracteres.';
      erroEl.style.display = 'block';
      return;
    }

    fetch('https://smiley-park.onrender.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senhaAtual: atual, senhaNova: nova })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (data.sucesso) {
        sucessoEl.style.display = 'block';
        setTimeout(function() {
          fecharModal();
          sessionStorage.removeItem('adminLogado');
          window.location.href = 'login.html';
        }, 2000);
      } else {
        erroEl.textContent   = '❌ ' + data.erro;
        erroEl.style.display = 'block';
      }
    })
    .catch(function() {
      erroEl.textContent   = '❌ Erro ao conectar!';
      erroEl.style.display = 'block';
    });
  };

  setInterval(buscarPedidos, 10000);
  buscarPedidos();

});