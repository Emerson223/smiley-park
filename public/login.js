document.addEventListener('DOMContentLoaded', function() {

  var inputSenha = document.getElementById('senha');
  var btnEntrar  = document.getElementById('btnEntrar');
  var btnMostrar = document.getElementById('btnMostrar');
  var erroEl     = document.getElementById('erro');

  // Mostrar/esconder senha
  btnMostrar.onclick = function() {
    if (inputSenha.type === 'password') {
      inputSenha.type = 'text';
      btnMostrar.textContent = '🙈';
    } else {
      inputSenha.type = 'password';
      btnMostrar.textContent = '👁️';
    }
  };

  // Entrar com Enter
  inputSenha.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') btnEntrar.click();
  });

  // Verificar senha no servidor
  btnEntrar.onclick = function() {
    var digitado = inputSenha.value.trim();
    if (!digitado) return;

    btnEntrar.textContent = 'Verificando...';
    btnEntrar.disabled = true;

    fetch('http://localhost:3000/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senha: digitado })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (data.sucesso) {
        // Salva só enquanto a aba estiver aberta
        sessionStorage.setItem('adminLogado', 'true');
        window.location.href = 'paineladm.html';
      } else {
        erroEl.style.display = 'block';
        inputSenha.value = '';
        inputSenha.focus();
        btnEntrar.textContent = 'ENTRAR';
        btnEntrar.disabled = false;
        setTimeout(function() { erroEl.style.display = 'none'; }, 3000);
      }
    })
    .catch(function() {
      erroEl.textContent = '❌ Servidor offline!';
      erroEl.style.display = 'block';
      btnEntrar.textContent = 'ENTRAR';
      btnEntrar.disabled = false;
    });
  };

});