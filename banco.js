const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./banco.db', (err) => {
  if (err) {
    console.log('❌ Erro ao abrir banco:', err.message);
  } else {
    console.log('✅ Banco de dados conectado!');
  }
});

db.serialize(() => {

  // ── TABELA DE PEDIDOS ──
  db.run(`
    CREATE TABLE IF NOT EXISTS pedidos (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      senha        TEXT NOT NULL,
      pessoas      INTEGER NOT NULL,
      duracao      INTEGER NOT NULL,
      extra_min    INTEGER DEFAULT 0,
      meia_nome    TEXT,
      meia_preco   REAL DEFAULT 0,
      pagamento    TEXT NOT NULL,
      total        REAL NOT NULL,
      status       TEXT DEFAULT 'aguardando',
      chamado_em   DATETIME,
      brincando_em DATETIME,
      criado_em    DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.log('❌ Erro ao criar tabela pedidos:', err.message);
    } else {
      console.log('✅ Tabela pedidos pronta!');
    }
  });

  // ── TABELA DE CONFIGURAÇÕES ──
  db.run(`
    CREATE TABLE IF NOT EXISTS config (
      chave TEXT PRIMARY KEY,
      valor TEXT NOT NULL
    )
  `, (err) => {
    if (err) {
      console.log('❌ Erro ao criar tabela config:', err.message);
    } else {
      console.log('✅ Tabela config pronta!');
    }
  });

  // ── SENHA PADRÃO ──
  db.run(`
    INSERT OR IGNORE INTO config (chave, valor) VALUES ('senha_admin', '1234')
  `, (err) => {
    if (err) {
      console.log('❌ Erro ao criar senha padrão:', err.message);
    } else {
      console.log('✅ Senha padrão configurada!');
    }
  });

});

module.exports = db;