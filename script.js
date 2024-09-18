// Evento de clique no botão de processar arquivo
document.getElementById('processBtn').addEventListener('click', processFile);

// Função que processa o arquivo XLSX carregado
function processFile() {
    const fileInput = document.getElementById('fileInput');  // Obtém o elemento de input de arquivo
    const file = fileInput.files[0];  // Obtém o primeiro arquivo carregado pelo usuário

    // Verifica se algum arquivo foi selecionado
    if (!file) {
        alert('Por favor, carregue um arquivo XLSX.');
        return;
    }

    // Lê o arquivo XLSX usando FileReader
    const reader = new FileReader();
    reader.onload = function(event) {
        // Converte o arquivo para um array de bytes
        const data = new Uint8Array(event.target.result);
        // Lê o arquivo XLSX como uma planilha
        const workbook = XLSX.read(data, { type: 'array' });
        const samples = ['Amostra1', 'Amostra2', 'Amostra3', 'Amostra4'];  // Lista de amostras esperadas
        let results = [];  // Armazena os resultados da análise de cada amostra
        let totalR2 = 0;  // Soma dos valores de R² para calcular a média

        // Itera por cada amostra
        samples.forEach(sample => {
            const worksheet = workbook.Sheets[sample];  // Obtém a planilha da amostra
            if (worksheet) {
                // Converte a planilha da amostra para JSON (tabela de valores)
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                // Extrai os valores de x e y da amostra
                const [xValues, yValues] = extractXY(jsonData);
                // Aplica a regressão linear sobre os valores de x e y
                const { slope, intercept, rSquared } = linearRegression(xValues, yValues);
                // Acumula o valor de R² para a média final
                totalR2 += rSquared;
                // Armazena o resultado para essa amostra
                results.push({ sample, equation: `y = ${slope.toFixed(2)}x + ${intercept.toFixed(2)}`, rSquared: rSquared.toFixed(4) });
            } else {
                // Caso a amostra não exista no arquivo, adiciona 'N/A' como resultado
                results.push({ sample, equation: 'N/A', rSquared: 'N/A' });
            }
        });

        // Exibe os resultados e a média de R²
        displayResults(results, totalR2 / samples.length);
    };

    // Lê o arquivo como um ArrayBuffer
    reader.readAsArrayBuffer(file);
}

// Função que extrai os valores de x e y de uma planilha JSON
function extractXY(data) {
    const x = [];
    const y = [];

    // Itera por cada linha da planilha
    data.forEach(row => {
        if (row.length === 2) {  // Verifica se a linha contém exatamente 2 colunas (x e y)
            x.push(parseFloat(row[0]));  // Adiciona o valor de x à lista
            y.push(parseFloat(row[1]));  // Adiciona o valor de y à lista
        }
    });

    return [x, y];  // Retorna os arrays de x e y
}

// Função que realiza a regressão linear sobre os valores de x e y
function linearRegression(x, y) {
    const n = x.length;  // Número de pontos
    const sumX = x.reduce((a, b) => a + b, 0);  // Soma de todos os valores de x
    const sumY = y.reduce((a, b) => a + b, 0);  // Soma de todos os valores de y
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);  // Soma dos produtos de x e y
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);  // Soma dos quadrados de x

    // Calcula a inclinação (slope) e o intercepto da equação da reta (y = mx + b)
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calcula o valor de R² (coeficiente de determinação)
    const rSquared = calculateRSquared(x, y, slope, intercept);

    // Retorna a inclinação, o intercepto e o valor de R²
    return { slope, intercept, rSquared };
}

// Função que calcula o valor de R²
function calculateRSquared(x, y, slope, intercept) {
    const meanY = y.reduce((a, b) => a + b, 0) / y.length;  // Calcula a média de y
    const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0);  // Soma dos quadrados totais
    const ssRes = y.reduce((sum, yi, i) => sum + Math.pow(yi - (slope * x[i] + intercept), 2), 0);  // Soma dos quadrados residuais
    return 1 - ssRes / ssTotal;  // Retorna o coeficiente de determinação (R²)
}

// Função que exibe os resultados na tabela HTML
function displayResults(results, meanR2) {
    const tbody = document.getElementById('resultsBody');  // Obtém o corpo da tabela de resultados
    tbody.innerHTML = '';  // Limpa qualquer resultado anterior

    // Itera pelos resultados e adiciona cada um como uma nova linha na tabela
    results.forEach(result => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${result.sample}</td><td>${result.equation}</td><td>${result.rSquared}</td>`;
        tbody.appendChild(row);  // Adiciona a linha à tabela
    });

    // Exibe a média de R² calculada
    document.getElementById('meanR2').textContent = meanR2.toFixed(4);
}
