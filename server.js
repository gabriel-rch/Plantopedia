// Importação das dependências
const bodyParser = require('body-parser');
const express = require('express');
const path = require('path');
const fs = require('fs');

// Leitura dos arquivos
const plantas = require('./plantas.json');
const clima = require('./clima.json');

// Criação da instância do aplicativo Express
const app = express();

// Middleware para analisar corpos de solicitação JSON
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));

const meses = {
  0: 'Janeiro',
  1: 'Fevereiro',
  2: 'Março',
  3: 'Abril',
  4: 'Maio',
  5: 'Junho',
  6: 'Julho',
  7: 'Agosto',
  8: 'Setembro',
  9: 'Outubro',
  10: 'Novembro',
  11: 'Dezembro'
};

// Rota raiz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Rota da lista de plantas
app.get('/plantas.json', (req, res) => {
  listaPlantas = [];
  
  plantas.forEach(planta => {
    listaPlantas.push({
      id: planta.id,
      nome: planta.nome,
    });
  });
  
  res.send(JSON.stringify(listaPlantas));
});

// Rota de calcular o mês ideal de plantio
app.get('/calcular/mes', (req, res) => {
  const id = req.query.id;
  const uf = req.query.uf;

  let plantaEscolhida = {};
  let temperaturaMensal = [];

  plantas.forEach(planta => {
    if (planta.id == id) 
      plantaEscolhida = planta;
  });

  clima.forEach(estado => {
    if (estado.UF == uf)
      temperaturaMensal = estado.temperatura;
  });
    
  const periodo = parseInt(plantaEscolhida.colheita_minimo);
  const colheitaMaximo = parseInt(plantaEscolhida.colheita_maximo);
  
  const plantaTempMax = parseFloat(plantaEscolhida.temperatura_maxima);
  const plantaTempMin = parseFloat(plantaEscolhida.temperatura_minima);

  // Calcular o desvio da temperatura da região para a planta
  var calcularDesvio = (temp, max, min) => {
    if (temp <= max && temp >= min)
      return 0;
    
    if (temp < min)
      return min - temp;
    
    if (temp > max)
      return temp - max;
  }

  let plantios = [];

  // Calcular o desvio da temperatura para os 12 períodos possíveis de plantio
  for (let mes = 0; mes < 12; mes++) {
    let desvio = 0;
    
    for (let offset = 0; offset < periodo; offset++) {
      let temperatura = parseFloat(temperaturaMensal[(mes + offset) % 12])
      desvio = desvio + calcularDesvio(temperatura, plantaTempMax, plantaTempMin);
    }
    
    plantios.push({
      nome: plantaEscolhida.nome,
      nome_cientifico: plantaEscolhida.nome_cientifico,
      plantio: meses[mes],
      colheita_minimo: meses[(mes + periodo) % 12],
      colheita_maximo: meses[(mes + colheitaMaximo) % 12],
      desvio_temperatura: desvio
    });
  }

  let resultado = [];

  // Encontrar os meses ideais de plantio
  plantios.forEach(plantio => {
    if (plantio.desvio_temperatura == 0)
      resultado.push(plantio);
  });
      
  // Encontrar o mês de plantio com o menor desvio de temperatura
  if (resultado.length == 0) {
    let menorDesvio = Infinity;
    let melhorPlantio = {};
    
    plantios.forEach(plantio => {
      if (plantio.desvio_temperatura < menorDesvio) {
        melhorPlantio = plantio;
        menorDesvio = plantio.desvio_temperatura;
      }
    });

    resultado.push(melhorPlantio);
  }

  // Enviar a resposta do cálculo realizado
  res.send(JSON.stringify(resultado));

  // Log da requisição
  console.log('\nRequisição recebida na rota calcular/mes\n' +
              '\nParâmetros recebidos:\n' +
              '\tID: ' + id + '\n' +
              '\tUF: ' + uf + '\n' +
              '\nResposta enviada:');
  console.log(resultado);
});

// Rota de calcular o vegetal ideal para a região
app.get('/calcular/vegetal', (req, res) => {
  console.log('Requisição recebida na rota /calcular/vegetal');

  const uf = req.query.uf;
  const mes = parseInt(req.query.mes);

  let vegetais = [];
  let temperaturaMensal = [];

  clima.forEach(estado => {
    if (estado.UF == uf)
      temperaturaMensal = estado.temperatura;
  });



  // Calcular o desvio da temperatura da região para a planta
  var calcularDesvio = (temp, max, min) => {
    if (temp <= max && temp >= min)
      return 0;
    
    if (temp < min)
      return min - temp;
    
    if (temp > max)
      return temp - max;
  }

  plantas.forEach(planta => {
    const plantaTempMax = parseFloat(planta.temperatura_maxima);
    const plantaTempMin = parseFloat(planta.temperatura_minima);
    const colheitaMaximo = parseInt(planta.colheita_maximo);
    const periodo = parseInt(planta.colheita_minimo);

    let desvio = 0;
    
    for (let offset = 0; offset < periodo; offset++) {
      let temperatura = parseFloat(temperaturaMensal[(mes + offset) % 12])
      desvio = desvio + calcularDesvio(temperatura, plantaTempMax, plantaTempMin);
    }
    
    vegetais.push({
      id: planta.id,
      nome: planta.nome,
      nome_cientifico: planta.nome_cientifico,
      plantio: meses[mes],
      colheita_minimo: meses[(mes + periodo) % 12],
      colheita_maximo: meses[(mes + colheitaMaximo) % 12],
      desvio_temperatura: desvio
    });
  });

  let resultado = [];

  // Encontrar os vegetais ideais para a região
  vegetais.forEach(vegetal => {
    if (vegetal.desvio_temperatura == 0)
      resultado.push(vegetal);
  });

  // Encontrar o vegetal com o menor desvio de temperatura
  if (resultado.length == 0) {
    let menorDesvio = Infinity;
    let melhorVegetal = {};

    vegetais.forEach(vegetal => {
      if (vegetal.desvio_temperatura < menorDesvio) {
        melhorVegetal = vegetal;
        menorDesvio = vegetal.desvio_temperatura;
      }
    });

    resultado.push(melhorVegetal);
  }

  // Enviar a resposta do cálculo realizado
  res.send(JSON.stringify(resultado));

  // Log da requisição
  console.log('\nRequisição recebida na rota calcular/vegetal\n' +
              '\nParâmetros recebidos:\n' +
              '\tUF: ' + uf + '\n' +
              '\tMês: ' + mes + '\n' +
              '\nResposta enviada:');
  console.log(resultado);
});


// Inicialização do servidor
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});