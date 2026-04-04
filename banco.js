const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');

// Verifica se está na nuvem (PostgreSQL) ou local (SQLite)
var isPostgres = process.env.DATABASE_URL ? true : false;

var db;

if (isPostgres) {
  // ── POSTGRESQL (nuvem) ──
  console.log('✅ Usando PostgreSQL (nuvem)');

  db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  // Cria as tabelas no PostgreSQL
  db.query(`
    CREATE TABLE IF NOT EXISTS pedidos (
      id           SERIAL PRIMARY KEY,
      senha        TEXT NOT NULL,
      pessoas      INTEGER NOT NULL,
      duracao      INTEGER NOT NULL,
      extra_min    INTEGER DEFAULT 0,
      meia_nome    TEXT,
      meia_preco   REAL DEFAULT 0,
      pagamento    TEXT NOT NULL,
      total        REAL NOT NULL,
      status       TEXT DEFAULT 'aguardando',
      chamado_em   TIMESTAMP,
      brincando_em TIMESTAMP,
      criado_em    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `).then(() => console.log('✅ Tabela pedidos pronta!'))
    .catch(err => console.log('❌ Erro tabela pedidos:', err.message));

  db.query(`
    CREATE TABLE IF NOT EXISTS config (
      chave TEXT PRIMARY KEY,
      valor TEXT NOT NULL
    )
  `).then(() => {
    db.query(`INSERT INTO config (chave, valor) VALUES ('senha_admin', '1234') ON CONFLICT DO NOTHING`)
      .then(() => console.log('✅ Tabela config pronta!'))
      .catch(err => console.log('❌ Erro config:', err.message));
  }).catch(err => console.log('❌ Erro tabela config:', err.message));

  // Adapta os métodos para funcionar igual ao SQLite
  db.run = function(sql, params, callback) {
    // Troca ? por $1, $2, $3... que é como o PostgreSQL entende
    var idx = 0;
    sql = sql.replace(/\?/g, function() { return '$' + (++idx); });
    // Troca sintaxe SQLite por PostgreSQL
    sql = sql.replace(/INTEGER PRIMARY KEY AUTOINCREMENT/g, 'SERIAL PRIMARY KEY');
    sql = sql.replace(/INSERT OR IGNORE/g, 'INSERT');
    sql = sql.replace(/ON CONFLICT.*$/g, 'ON CONFLICT DO NOTHING');

    db.query(sql, params)
      .then(function() { if (callback) callback(null); })
      .catch(function(err) { if (callback) callback(err); });
  };

  db.get = function(sql, params, callback) {
    var idx = 0;
    sql = sql.replace(/\?/g, function() { return '$' + (++idx); });
    db.query(sql, params)
      .then(function(res) { if (callback) callback(null, res.rows[0]); })
      .catch(function(err) { if (callback) callback(err); });
  };

  db.all = function(sql, params, callback) {
    var idx = 0;
    sql = sql.replace(/\?/g, function() { return '$' + (++idx); });
    db.query(sql, params)
      .then(function(res) { if (callback) callback(null, res.rows); })
      .catch(function(err) { if (callback) callback(err); });
  };

} else {
  // ── SQLITE (local) ──
  console.log('✅ Usando SQLite (local)');

  db = new sqlite3.Database('./banco.db', (err) => {
    if (err) {
      console.log('❌ Erro ao abrir banco:', err.message);
    } else {
      console.log('✅ Banco de dados conectado!');
    }
  });

  db.serialize(() => {
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
      if (err) console.log('❌ Erro tabela pedidos:', err.message);
      else console.log('✅ Tabela pedidos pronta!');
    });

    db.run(`
      CREATE TABLE IF NOT EXISTS config (
        chave TEXT PRIMARY KEY,
        valor TEXT NOT NULL
      )
    `, (err) => {
      if (err) console.log('❌ Erro tabela config:', err.message);
      else console.log('✅ Tabela config pronta!');
    });

    db.run(`
      INSERT OR IGNORE INTO config (chave, valor) VALUES ('senha_admin', '1234')
    `, (err) => {
      if (err) console.log('❌ Erro senha padrão:', err.message);
      else console.log('✅ Senha padrão configurada!');
    });
  });
}

module.exports = db;