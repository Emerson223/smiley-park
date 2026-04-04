document.addEventListener('DOMContentLoaded', function() {

  var estado = {
    pessoas:      1,
    duracaoMin:   30,
    duracaoPreco: 30,
    extraMin:     0,
    meiaPreco:    0,
    meiaNome:     'Sem meia',
    pagamento:    ''
  };

  function fmt(v) { return 'R$ ' + v.toFixed(2).replace('.', ','); }

  function getGrupo() {
    if (estado.pessoas >= 10) return { preco: 40, label: '🏷️ Desconto 10+ pessoas!' };
    if (estado.pessoas >= 5)  return { preco: 45, label: '🏷️ Desconto 5+ pessoas!' };
    return null;
  }

  function atualizar() {
    var grupo    = getGrupo();
    var ticketPP = grupo ? grupo.preco : estado.duracaoPreco;
    var tickets  = ticketPP * estado.pessoas;
    var extras   = estado.extraMin * estado.pessoas;
    var meias    = estado.meiaPreco * estado.pessoas;
    var total    = tickets + extras + meias;

    document.getElementById('groupInfo').textContent = grupo ? grupo.label : '';

    var html = '<div class="linha-resumo ' + (grupo ? 'destaque' : '') + '">'
             + '<span>🎟️ Ingresso ' + estado.duracaoMin + 'min × ' + estado.pessoas + '</span>'
             + '<span class="val">' + fmt(tickets) + '</span></div>';
    if (extras > 0) html += '<div class="linha-resumo destaque"><span>⏱️ Extra ' + estado.extraMin + 'min × ' + estado.pessoas + '</span><span class="val">' + fmt(extras) + '</span></div>';
    if (meias  > 0) html += '<div class="linha-resumo"><span>🧦 ' + estado.meiaNome + ' × ' + estado.pessoas + '</span><span class="val">' + fmt(meias) + '</span></div>';
    if (estado.pagamento) html += '<div class="linha-resumo"><span>💳 ' + estado.pagamento + '</span><span class="val">✓</span></div>';

    document.getElementById('totalLinhas').innerHTML = html;
    document.getElementById('totalValor').textContent = fmt(total);
    document.getElementById('porPessoaValor').textContent = fmt(total / estado.pessoas);
    document.getElementById('porPessoaLabel').textContent = grupo ? 'Por pessoa (' + estado.pessoas + ' pessoas)' : 'Por pessoa';

    
    document.getElementById('btnConfirmar').disabled = estado.pagamento === '';
  }

 
  document.getElementById('btnMenos').onclick = function() {
    if (estado.pessoas > 1) { estado.pessoas--; document.getElementById('numPessoas').textContent = estado.pessoas; atualizar(); }
  };
  document.getElementById('btnMais').onclick = function() {
    if (estado.pessoas < 50) { estado.pessoas++; document.getElementById('numPessoas').textContent = estado.pessoas; atualizar(); }
  };


  document.getElementById('gridDuracao').onclick = function(e) {
    var btn = e.target.closest('.opcao-btn');
    if (!btn) return;
    document.querySelectorAll('#gridDuracao .opcao-btn').forEach(function(b) { b.classList.remove('ativo'); });
    btn.classList.add('ativo');
    estado.duracaoMin   = parseInt(btn.getAttribute('data-min'));
    estado.duracaoPreco = parseInt(btn.getAttribute('data-preco'));
    atualizar();
  };

 
  document.getElementById('gridMeias').onclick = function(e) {
    var btn = e.target.closest('.opcao-btn');
    if (!btn) return;
    document.querySelectorAll('#gridMeias .opcao-btn').forEach(function(b) { b.classList.remove('ativo'); });
    btn.classList.add('ativo');
    estado.meiaPreco = parseInt(btn.getAttribute('data-preco'));
    estado.meiaNome  = btn.querySelector('.opcao-tempo').textContent + ' ' + btn.querySelector('.opcao-sub').textContent;
    atualizar();
  };

  
  document.getElementById('gridPagamento').onclick = function(e) {
    var btn = e.target.closest('.pag-btn');
    if (!btn) return;
    document.querySelectorAll('#gridPagamento .pag-btn').forEach(function(b) { b.classList.remove('ativo'); });
    btn.classList.add('ativo');
    estado.pagamento = btn.getAttribute('data-pag');
    atualizar();
  };

  
  document.getElementById('extraMin').oninput = function() {
    estado.extraMin = Math.max(0, parseInt(this.value) || 0);
    atualizar();
  };

 
  document.getElementById('btnConfirmar').onclick = function() {
    var grupo    = getGrupo();
    var ticketPP = grupo ? grupo.preco : estado.duracaoPreco;
    var total    = (ticketPP * estado.pessoas) + (estado.extraMin * estado.pessoas) + (estado.meiaPreco * estado.pessoas);

    var contador = parseInt(localStorage.getItem('smileySenha') || '0') + 1;
    localStorage.setItem('smileySenha', contador);
    var senha = String(contador).padStart(3, '0');

    fetch('https://smiley-park.onrender.com/pedido', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senha:      senha,
        pessoas:    estado.pessoas,
        duracao:    estado.duracaoMin,
        extra_min:  estado.extraMin,
        meia_nome:  estado.meiaNome,
        meia_preco: estado.meiaPreco,
        pagamento:  estado.pagamento,
        total:      total
      })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      var itens = estado.duracaoMin + 'min x' + estado.pessoas + ' pessoa(s)';
      if (estado.extraMin > 0) itens += ' | Extra ' + estado.extraMin + 'min';
      if (estado.meiaPreco > 0) itens += ' | ' + estado.meiaNome;

      var url = 'obrigado.html'
        + '?senha='     + encodeURIComponent(data.senha)
        + '&pagamento=' + encodeURIComponent(estado.pagamento)
        + '&produtos='  + encodeURIComponent(itens)
        + '&total='     + total.toFixed(2);

      window.location.href = url;
    })
    .catch(function(err) {
      alert('❌ Erro ao salvar pedido! O servidor está rodando?');
      console.error(err);
    });
  };

  atualizar();
});