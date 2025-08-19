let fechamentoSelecionado = null;
let dadosFechamento = null;
let dezenasSelecionadas = [];
let jogosGerados = [];
let jogosFiltrados = [];

const primos = [2, 3, 5, 7, 11, 13, 17, 19, 23];
const fibonacci = [1, 2, 3, 5, 8, 13, 21];
const magicas = [3, 5, 7, 9, 12, 15, 18, 21, 24];
const moldura = [1, 2, 3, 4, 5, 6, 10, 11, 15, 16, 20, 21, 22, 23, 24, 25];

function selecionarFechamento(nomeArquivo) {
  fechamentoSelecionado = nomeArquivo;
  fetch(`./fechamentos/${nomeArquivo}.json`)
    .then(res => res.json())
    .then(json => {
      dadosFechamento = json;
      exibirGradeDezenas();
    });
}

function exibirGradeDezenas() {
  document.getElementById("selecao-dezenas").style.display = "block";
  const grid = document.getElementById("dezenas-grid");
  grid.innerHTML = "";
  dezenasSelecionadas = [];
  jogosFiltrados = [];

  for (let i = 1; i <= 25; i++) {
    const dezena = i.toString().padStart(2, "0");
    const botao = document.createElement("button");
    botao.textContent = dezena;
    botao.onclick = () => toggleDezena(botao, dezena);
    grid.appendChild(botao);
  }
}

function toggleDezena(botao, dezena) {
  if (dezenasSelecionadas.includes(dezena)) {
    dezenasSelecionadas = dezenasSelecionadas.filter(d => d !== dezena);
    botao.classList.remove("selected");
  } else {
    if (dezenasSelecionadas.length < dadosFechamento.dezenas) {
      dezenasSelecionadas.push(dezena);
      botao.classList.add("selected");
    } else {
      alert(`Você deve selecionar exatamente ${dadosFechamento.dezenas} dezenas.`);
    }
  }
}

function limparSelecao() {
  dezenasSelecionadas = [];
  jogosFiltrados = [];
  document.querySelectorAll("#dezenas-grid button").forEach(btn => btn.classList.remove("selected"));
}

function gerarJogos() {
  if (dezenasSelecionadas.length !== dadosFechamento.dezenas) {
    alert(`Selecione ${dadosFechamento.dezenas} dezenas antes de gerar os jogos.`);
    return;
  }

  jogosGerados = dadosFechamento.jogos.map(jogo => {
    return jogo.map(pos => {
      const index = parseInt(pos.replace("D", "")) - 1;
      return dezenasSelecionadas[index];
    });
  });

  jogosFiltrados = []; // Resetar filtrados
  exibirJogos(jogosGerados);
}

function exibirJogos(lista) {
  const container = document.getElementById("lista-jogos");
  container.innerHTML = "";
  lista.forEach((jogo, i) => {
    const ordenado = [...jogo]
      .map(n => parseInt(n))
      .sort((a, b) => a - b)
      .map(n => n.toString().padStart(2, "0"));
    const div = document.createElement("div");
    div.textContent = `${i + 1}) ${ordenado.join(", ")}`;
    container.appendChild(div);
  });

  document.getElementById("jogos-gerados").style.display = "block";
  document.getElementById("salvar").style.display = "block";
}

function mostrarFiltros() {
  document.getElementById("filtros").style.display = "block";
}

function aplicarFiltros() {
  let filtrados = [...jogosGerados];

  const filtros = document.querySelectorAll("#form-filtros input[type='checkbox']:checked");

  filtros.forEach(filtro => {
    const nome = filtro.name;
    switch (nome) {
      case "soma":
        filtrados = filtrados.filter(j => {
          const soma = j.reduce((acc, val) => acc + parseInt(val), 0);
          return soma >= 180 && soma <= 220;
        });
        break;

      case "pares_impares":
        filtrados = filtrados.filter(j => {
          const pares = j.filter(n => parseInt(n) % 2 === 0).length;
          return pares >= 5 && pares <= 9;
        });
        break;

      case "primos":
        filtrados = filtrados.filter(j => {
          const qtd = j.filter(n => primos.includes(parseInt(n))).length;
          return qtd >= 4 && qtd <= 6;
        });
        break;

      case "moldura":
        filtrados = filtrados.filter(j => {
          const qtd = j.filter(n => moldura.includes(parseInt(n))).length;
          return qtd >= 9 && qtd <= 11;
        });
        break;

      case "magicas":
        filtrados = filtrados.filter(j => {
          const qtd = j.filter(n => magicas.includes(parseInt(n))).length;
          return qtd >= 5 && qtd <= 8;
        });
        break;

      case "multiplos3":
        filtrados = filtrados.filter(j => {
          const qtd = j.filter(n => parseInt(n) % 3 === 0).length;
          return qtd >= 4 && qtd <= 6;
        });
        break;

      case "fibonacci":
        filtrados = filtrados.filter(j => {
          const qtd = j.filter(n => fibonacci.includes(parseInt(n))).length;
          return qtd >= 2 && qtd <= 6;
        });
        break;

      case "posicoes":
        filtrados = filtrados.filter(j => {
          const ordenado = [...j].map(n => parseInt(n)).sort((a, b) => a - b);

          // Lista das condições para cada posição do jogo ordenado
          const condicoes = [
            ordenado[0] <= 3,                      // 1ª dezena até 03
            ordenado[1] <= 6,                      // 2ª até 06
            ordenado[2] <= 8,                      // 3ª até 08
            ordenado[3] <= 10,                     // 4ª até 10
            ordenado[4] <= 11,                     // 5ª até 11
            ordenado[5] <= 13,                     // 6ª até 13
            ordenado[6] >= 8 && ordenado[6] <= 15, // 7ª entre 08 e 15
            ordenado[7] >= 9 && ordenado[7] <= 16, // 8ª entre 09 e 16
            ordenado[8] >= 11 && ordenado[8] <= 18,// 9ª entre 11 e 18
            ordenado[9] >= 12 && ordenado[9] <= 19,// 10ª entre 12 e 19
            ordenado[10] >= 15,                    // 11ª no mínimo 15
            ordenado[11] >= 17,                    // 12ª no mínimo 17
            ordenado[12] >= 19,                    // 13ª no mínimo 19
            ordenado[13] >= 21,                    // 14ª no mínimo 21
            ordenado[14] >= 23                     // 15ª no mínimo 23
          ];

          return condicoes.every(c => c);
        });
        break;
    }
  });

  jogosFiltrados = filtrados;
  exibirJogos(jogosFiltrados);
}

function salvarJogos() {
  const jogosParaSalvar = jogosFiltrados.length > 0 ? jogosFiltrados : jogosGerados;

  const conteudo = jogosParaSalvar
    .map(j => [...j].map(n => parseInt(n)).sort((a, b) => a - b).map(n => n.toString().padStart(2, "0")).join(","))
    .join("\n");

  const blob = new Blob([conteudo], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "jogos-lotofacil.txt";
  a.click();

  URL.revokeObjectURL(url);
}