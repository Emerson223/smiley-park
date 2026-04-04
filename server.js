const express = require('express');
const cors    = require('cors');
const path    = require('path');
const db      = require('./banco');
console.log('DATABASE_URL existe?', process.env.DATABASE_URL ? 'SIM' : 'NÃO');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/pedido', (req, res) => {
  const { senha, pessoas, duracao, extra_min, meia_nome, meia_preco, pagamento, total } = req.body;

  const sql = `
    INSERT INTO pedidos (senha, pessoas, duracao, extra_min, meia_nome, meia_preco, pagamento, total)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(sql, [senha, pessoas, duracao, extra_min, meia_nome, meia_preco, pagamento, total], function(err) {
    if (err) {
      console.log('❌ Erro ao salvar pedido:', err.message);
      return res.status(500).json({ erro: 'Erro ao salvar pedido' });
    }
    console.log(`✅ Pedido #${senha} salvo!`);
    res.json({ sucesso: true, id: this.lastID, senha: senha });
  });
});

app.get('/pedidos', (req, res) => {
  db.all(`SELECT * FROM pedidos ORDER BY criado_em DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ erro: 'Erro ao buscar pedidos' });
    res.json(rows);
  });
});

app.put('/pedido/:id/status', (req, res) => {
  const { id }     = req.params;
  const { status } = req.body;

  var sql;
  if (status === 'chamando') {
    sql = `UPDATE pedidos SET status = ?, chamado_em = CURRENT_TIMESTAMP WHERE id = ?`;
  } else if (status === 'brincando') {
    sql = `UPDATE pedidos SET status = ?, brincando_em = CURRENT_TIMESTAMP WHERE id = ?`;
  } else {
    sql = `UPDATE pedidos SET status = ? WHERE id = ?`;
  }

  db.run(sql, [status, id], function(err) {
    if (err) return res.status(500).json({ erro: 'Erro ao atualizar status' });
    res.json({ sucesso: true });
  });
});

app.get('/senha-atual', (req, res) => {
  db.all(`SELECT * FROM pedidos WHERE status = 'chamando' OR status = 'brincando' ORDER BY criado_em ASC`, [], (err, rows) => {
    if (err) return res.status(500).json({ erro: 'Erro ao buscar senhas' });
    res.json(rows || []);
  });
});

app.delete('/pedido/:id', (req, res) => {
  db.run(`DELETE FROM pedidos WHERE id = ?`, [req.params.id], function(err) {
    if (err) return res.status(500).json({ erro: 'Erro ao deletar' });
    res.json({ sucesso: true });
  });
});

// ── VERIFICAR SENHA ──
app.post('/admin/login', (req, res) => {
  const { senha } = req.body;
  db.get(`SELECT valor FROM config WHERE chave = 'senha_admin'`, [], (err, row) => {
    if (err || !row) return res.status(500).json({ erro: 'Erro ao verificar senha' });
    if (row.valor === senha) {
      res.json({ sucesso: true });
    } else {
      res.status(401).json({ erro: 'Senha incorreta' });
    }
  });
});

// ── TROCAR SENHA ──
app.post('/admin/trocar-senha', (req, res) => {
  const { senhaAtual, senhaNova } = req.body;
  db.get(`SELECT valor FROM config WHERE chave = 'senha_admin'`, [], (err, row) => {
    if (err || !row) return res.status(500).json({ erro: 'Erro ao verificar senha' });
    if (row.valor !== senhaAtual) return res.status(401).json({ erro: 'Senha atual incorreta' });
    db.run(`UPDATE config SET valor = ? WHERE chave = 'senha_admin'`, [senhaNova], function(err) {
      if (err) return res.status(500).json({ erro: 'Erro ao trocar senha' });
      res.json({ sucesso: true });
    });
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ================================
  🎉 Smiley Park servidor rodando!
  ================================
  🌐 Local:  http://localhost:${PORT}
  🌐 Rede:   http://192.168.1.32:${PORT}
  ================================
  `);
});