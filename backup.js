const fs   = require('fs');
const path = require('path');

var pastaBackup = path.join(__dirname, 'backups');

if (!fs.existsSync(pastaBackup)) {
  fs.mkdirSync(pastaBackup);
}

function fazerBackup() {
  var agora   = new Date();
  var nome    = 'banco-'
    + agora.getFullYear() + '-'
    + String(agora.getMonth() + 1).padStart(2, '0') + '-'
    + String(agora.getDate()).padStart(2, '0') + '-'
    + String(agora.getHours()).padStart(2, '0') + 'h'
    + String(agora.getMinutes()).padStart(2, '0')
    + '.db';

  var origem  = path.join(__dirname, 'banco.db');
  var destino = path.join(pastaBackup, nome);

  fs.copyFileSync(origem, destino);
  console.log('✅ Backup feito:', nome);

  var arquivos = fs.readdirSync(pastaBackup);
  arquivos.forEach(function(arquivo) {
    var caminho = path.join(pastaBackup, arquivo);
    var stats   = fs.statSync(caminho);
    var dias    = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24);
    if (dias > 7) {
      fs.unlinkSync(caminho);
      console.log('🗑️ Backup antigo deletado:', arquivo);
    }
  });
}

fazerBackup();
setInterval(fazerBackup, 60 * 60 * 1000);
console.log('🔄 Backup automático iniciado! (a cada 1 hora)');