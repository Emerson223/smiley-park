let numero = 0;
let senhaAtual = null;
let fim = null;

const gerarBtn = document.getElementById("gerarBtn");
const chamarBtn = document.getElementById("chamarBtn");
const senhaDiv = document.getElementById("senha");
const tempoDiv = document.getElementById("tempo");
const som = document.getElementById("somChamada");

tempoDiv.style.display = "none";

const fila = [];

gerarBtn.addEventListener("click", () => {
  numero++;
  const senha = `A${String(numero).padStart(3,"0")}`;
  fila.push(senha);
  alert(`Sua senha é: ${senha}`);
});

chamarBtn.addEventListener("click", () => {
  if (fila.length === 0) {
    alert("Não há senhas na fila!");
    return;
  }

  senhaAtual = fila.shift();
  senhaDiv.innerText = senhaAtual;

  fim = new Date(Date.now() + 30 * 60 * 1000); 

  falar(`Senha ${senhaAtual}`);

  tempoDiv.style.display = "block"; 

  atualizarTempo(); 
});

function atualizarTempo() {
  const intervalo = setInterval(() => {
    if (!fim) return;
    const restante = fim - new Date();
    if (restante <= 0) {
      tempoDiv.innerText = "TEMPO ENCERRADO";
      clearInterval(intervalo);
      return;
    }
    const min = Math.floor(restante / 60000);
    const seg = Math.floor((restante % 60000) / 1000);
    tempoDiv.innerText = `Tempo restante: ${min}:${seg.toString().padStart(2,"0")}`;
  }, 1000);
}

function falar(texto) {
  som.play();
  const msg = new SpeechSynthesisUtterance(texto);
  speechSynthesis.speak(msg);
}