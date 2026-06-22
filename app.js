// ╔══════════════════════════════════════════════════════════════╗
// ║                PASO 1 — CLASE CovidData                     ║
// ║  Esta clase es la "mensajera". Su única responsabilidad     ║
// ║  es hablar con la API y traernos los datos en JSON.         ║
// ║  No sabe nada de HTML ni de la pantalla.                    ║
// ╚══════════════════════════════════════════════════════════════╝

class CovidData {

    constructor() {
        // El constructor se ejecuta automáticamente cuando haces new CovidData()
        // Aquí guardamos la URL base para no repetirla en cada método
        this.baseURL = 'https://disease.sh/v3/covid-19';
    }

    // ── Método 1: trae los datos GLOBALES (endpoint /all) ──────────────
    // async significa que esta función es asíncrona: va a esperar una respuesta
    async getGlobalStats() {
        // fetch() hace el pedido HTTP GET a la URL
        // await le dice a JS: "espera aquí hasta que llegue la respuesta"
        const response = await fetch(`${this.baseURL}/all`);

        // .json() convierte el texto que llegó en un objeto JavaScript usable
        const data = await response.json();

        // Devolvemos el objeto con todos los datos globales
        return data;
    }

    // ── Método 2: trae los datos de UN país específico ─────────────────
    async getCountryStats(country) {
        // El nombre del país se inserta dinámicamente en la URL
        // Ej: si country = "chile" → fetch a /countries/chile
        const response = await fetch(`${this.baseURL}/countries/${country}`);
        const data = await response.json();
        return data;
    }

    // ── Método 3: trae TODOS los países y devuelve el Top 5 ───────────
    async getTopCountries() {
        // Pedimos todos los países (~230 objetos en un array)
        const response = await fetch(`${this.baseURL}/countries`);
        const data = await response.json();

        // sort() ordena el array.
        // (a, b) => b.cases - a.cases significa: compara dos países,
        // pon primero el que tiene MÁS casos (orden descendente)
        // slice(0, 5) corta el array y se queda solo con los primeros 5
        const top5 = data
            .sort((a, b) => b.cases - a.cases)
            .slice(0, 5);

        return top5;
    }
}


// ╔══════════════════════════════════════════════════════════════╗
// ║                PASO 2 — CLASE CovidUI                       ║
// ║  Esta clase es la "pintora". Su única responsabilidad       ║
// ║  es tomar datos y mostrarlos en pantalla (manipular el DOM) ║
// ║  No sabe nada de fetch ni de APIs.                          ║
// ╚══════════════════════════════════════════════════════════════╝

class CovidUI {

    // ── Método 1: muestra el spinner de carga ─────────────────────────
    // classList es la lista de clases CSS del elemento
    // .remove('hidden') elimina la clase hidden → el elemento se hace visible
    showLoading() {
        document.getElementById('loading-overlay').classList.remove('hidden');
    }

    // ── Método 2: oculta el spinner de carga ──────────────────────────
    // .add('hidden') agrega la clase hidden → el elemento desaparece
    hideLoading() {
        document.getElementById('loading-overlay').classList.add('hidden');
    }

    // ── Método 3: pinta las 4 cards de estadísticas globales ──────────
    renderGlobalCards(data) {
        // Buscamos el contenedor en el HTML por su id
        const container = document.getElementById('cards-container');

        // Creamos un array con las 4 métricas que queremos mostrar
        // Cada objeto tiene: el texto del label, el valor, y el color Tailwind
        const metrics = [
            { label: 'Casos Totales', value: data.cases,     color: 'text-yellow-400' },
            { label: 'Fallecidos',    value: data.deaths,    color: 'text-red-400'    },
            { label: 'Recuperados',   value: data.recovered, color: 'text-green-400'  },
            { label: 'Casos Activos', value: data.active,    color: 'text-blue-400'   },
        ];

        // map() recorre el array y convierte cada objeto en HTML
        // toLocaleString() formatea el número: 704753890 → 704.753.890
        // join('') une todos los strings HTML en uno solo sin separadores
        container.innerHTML = metrics.map(metric => `
            <article class="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <p class="text-gray-400 text-sm">${metric.label}</p>
                <p class="text-2xl font-bold mt-1 ${metric.color}">
                    ${metric.value.toLocaleString()}
                </p>
            </article>
        `).join('');
    }

    // ── Método 4: muestra la fecha de última actualización ────────────
    renderLastUpdated(timestamp) {
        const container = document.getElementById('last-updated');

        // timestamp es un número gigante (ej: 1781914644447)
        // Representa los milisegundos transcurridos desde el 1 enero 1970
        // new Date() lo convierte en un objeto fecha entendible
        const date = new Date(timestamp);

        // toLocaleString('es-CL') lo formatea al estilo chileno: dd-mm-aaaa hh:mm
        const fechaLegible = date.toLocaleString('es-CL');

        container.innerHTML = `
            <p class="text-gray-500 text-sm text-center">
                🕐 Última actualización:
                <span class="text-gray-400">${fechaLegible}</span>
            </p>
        `;
    }

    // ── Método 5: pinta la card de resultado al buscar un país ────────
    renderCountryResult(data) {
        const container = document.getElementById('country-result');

        // Calculamos el porcentaje de cada métrica respecto al total de casos
        // toFixed(1) redondea a 1 decimal: 1.8743... → 1.8
        const deathRate     = ((data.deaths    / data.cases) * 100).toFixed(1);
        const recoveredRate = ((data.recovered / data.cases) * 100).toFixed(1);
        const activeRate    = ((data.active    / data.cases) * 100).toFixed(1);

        // Pintamos la card con los datos del país y las barras de progreso
        // El ancho de cada barra (style="width: X%") se calcula con JavaScript
        container.innerHTML = `
            <article class="bg-gray-800 rounded-xl p-6 border border-gray-700 max-w-xl">

                <h3 class="text-xl font-bold text-white mb-4">
                    <img src="${data.countryInfo.flag}" class="inline w-8 mr-2 rounded" />
                    ${data.country}
                </h3>

                <p class="text-gray-400 text-sm mb-6">
                    Total de casos:
                    <span class="text-yellow-400 font-bold">${data.cases.toLocaleString()}</span>
                </p>

                <!-- Barra de fallecidos -->
                <div class="mb-4">
                    <div class="flex justify-between text-sm mb-1">
                        <span class="text-gray-400">Fallecidos</span>
                        <span class="text-red-400">${data.deaths.toLocaleString()} (${deathRate}%)</span>
                    </div>
                    <div class="w-full bg-gray-700 rounded-full h-3">
                        <div class="bg-red-500 h-3 rounded-full" style="width: ${deathRate}%"></div>
                    </div>
                </div>

                <!-- Barra de recuperados -->
                <div class="mb-4">
                    <div class="flex justify-between text-sm mb-1">
                        <span class="text-gray-400">Recuperados</span>
                        <span class="text-green-400">${data.recovered.toLocaleString()} (${recoveredRate}%)</span>
                    </div>
                    <div class="w-full bg-gray-700 rounded-full h-3">
                        <div class="bg-green-500 h-3 rounded-full" style="width: ${recoveredRate}%"></div>
                    </div>
                </div>

                <!-- Barra de activos -->
                <div class="mb-4">
                    <div class="flex justify-between text-sm mb-1">
                        <span class="text-gray-400">Activos</span>
                        <span class="text-blue-400">${data.active.toLocaleString()} (${activeRate}%)</span>
                    </div>
                    <div class="w-full bg-gray-700 rounded-full h-3">
                        <div class="bg-blue-500 h-3 rounded-full" style="width: ${activeRate}%"></div>
                    </div>
                </div>

            </article>
        `;
    }

    // ── Método 6: pinta el ranking Top 5 países ───────────────────────
    renderTopCountries(countries) {
        const container = document.getElementById('top-countries');

        // El primer país (index 0) tiene más casos después del sort()
        // Lo usamos como referencia del 100% para las barras comparativas
        const maxCases = countries[0].cases;

        // map() recorre los 5 países y genera el HTML de cada uno
        // index es la posición en el array (0, 1, 2, 3, 4)
        container.innerHTML = countries.map((country, index) => {
            // Calculamos qué % representa este país vs el #1
            const barWidth = ((country.cases / maxCases) * 100).toFixed(1);

            return `
                <article class="bg-gray-800 rounded-xl p-4 border border-gray-700">
                    <div class="flex justify-between items-center mb-2">
                        <div class="flex items-center gap-2">
                            <span class="text-gray-500 text-sm">#${index + 1}</span>
                            <img src="${country.countryInfo.flag}" class="w-6 rounded" />
                            <span class="text-white font-medium">${country.country}</span>
                        </div>
                        <span class="text-yellow-400 font-bold text-sm">
                            ${country.cases.toLocaleString()}
                        </span>
                    </div>
                    <div class="w-full bg-gray-700 rounded-full h-2">
                        <div class="bg-yellow-500 h-2 rounded-full" style="width: ${barWidth}%"></div>
                    </div>
                </article>
            `;
        }).join('');
    }
    // ── Método 7: genera el patrón de virus decorativo en el fondo ────
// Llena el contenedor con emojis de virus repetidos
    renderVirusPattern() {
        const container = document.getElementById('virus-pattern');

        // Creamos 120 virus — suficientes para llenar cualquier pantalla
        // Array.from({ length: 120 }) crea un array de 120 posiciones vacías
        // El map convierte cada posición en un emoji de virus
        // Alternamos entre tres emojis para que no sea tan repetitivo
        const emojis = ['🦠', '🧫', '🔬'];

        container.innerHTML = Array.from({ length: 120 })
            .map((_, index) => {
                // index % 3 da 0, 1 o 2 cíclicamente
                // Así cada tercer virus es un emoji diferente
                const emoji = emojis[index % 3];

                // Rotación aleatoria entre -30 y +30 grados
                // Math.random() da un número entre 0 y 1
                // Multiplicar por 60 lo lleva a 0–60, restar 30 lo centra en -30 a +30
                const rotation = Math.floor(Math.random() * 60) - 30;

                // Tamaño aleatorio entre 1.5rem y 3rem para variedad visual
                const size = (Math.random() * 1.5 + 1.5).toFixed(1);

                return `<span style="
                transform: rotate(${rotation}deg);
                font-size: ${size}rem;
                display: block;
                text-align: center;
            ">${emoji}</span>`;
            })
            .join('');
    }
    // ── Método 8: dibuja el gráfico de barras con Chart.js ────────────
    renderChart(countries) {
        // Obtenemos el canvas del HTML donde se dibujará el gráfico
        const canvas = document.getElementById('countries-chart');

        // getContext('2d') le dice al canvas que trabajaremos en 2 dimensiones
        // Es un requisito de Chart.js para poder dibujar
        const ctx = canvas.getContext('2d');

        // Extraemos solo los nombres de los países para el eje X
        // map() recorre el array y devuelve solo la propiedad que pedimos
        const labels = countries.map(c => c.country);

        // Extraemos los valores de cada métrica para las barras
        const casos      = countries.map(c => c.cases);
        const muertes    = countries.map(c => c.deaths);
        const recuperados = countries.map(c => c.recovered);

        // new Chart() crea el gráfico
        // Recibe dos parámetros: el canvas y un objeto de configuración
        new Chart(ctx, {

            // 'bar' es el tipo de gráfico — también existe 'line', 'pie', 'doughnut'
            type: 'bar',

            data: {
                // labels son las etiquetas del eje X (nombres de países)
                labels: labels,

                // datasets son las "series" de datos — cada uno es un grupo de barras
                // Tenemos 3 series: casos, muertes y recuperados
                datasets: [
                    {
                        label: 'Casos Totales',
                        data: casos,
                        // Color de las barras con transparencia (rgba = rojo, verde, azul, opacidad)
                        backgroundColor: 'rgba(250, 204, 21, 0.7)',  // amarillo
                        borderColor: 'rgba(250, 204, 21, 1)',
                        borderWidth: 1,
                    },
                    {
                        label: 'Fallecidos',
                        data: muertes,
                        backgroundColor: 'rgba(239, 68, 68, 0.7)',   // rojo
                        borderColor: 'rgba(239, 68, 68, 1)',
                        borderWidth: 1,
                    },
                    {
                        label: 'Recuperados',
                        data: recuperados,
                        backgroundColor: 'rgba(34, 197, 94, 0.7)',   // verde
                        borderColor: 'rgba(34, 197, 94, 1)',
                        borderWidth: 1,
                    },
                ]
            },

            // options controla la apariencia y comportamiento del gráfico
            options: {
                responsive: true, // el gráfico se adapta al tamaño del contenedor

                plugins: {
                    legend: {
                        // Leyenda (los nombres de las series) en color blanco
                        labels: { color: 'white' }
                    }
                },

                scales: {
                    x: {
                        // Configuración del eje X (nombres de países)
                        ticks: { color: 'rgba(255,255,255,0.7)' },  // texto blanco
                        grid:  { color: 'rgba(255,255,255,0.1)' }   // líneas de grilla suaves
                    },
                    y: {
                        // Configuración del eje Y (números)
                        ticks: {
                            color: 'rgba(255,255,255,0.7)',
                            // Formateamos los números del eje Y para que sean legibles
                            // Intl.NumberFormat es más potente que toLocaleString
                            // 'compact' convierte 704000000 en "704M"
                            callback: (value) => {
                                return new Intl.NumberFormat('es', {
                                    notation: 'compact'
                                }).format(value);
                            }
                        },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    }
                }
            }
        });
    }
}


// ╔══════════════════════════════════════════════════════════════╗
// ║           PASO 3 — FUNCIÓN PRINCIPAL init()                 ║
// ║  Esta función arranca toda la aplicación.                   ║
// ║  Crea las instancias de las clases, llama a la API          ║
// ║  y conecta los eventos del usuario.                         ║
// ╚══════════════════════════════════════════════════════════════╝

async function init() {
    // Creamos una instancia de cada clase
    // "new CovidData()" ejecuta el constructor y nos devuelve el objeto listo
    const api = new CovidData();
    const ui  = new CovidUI();

    // Declaramos globalData aquí afuera del try para que sea accesible
    // en toda la función. Si la declaramos DENTRO del try, solo existiría ahí.
    // Esto se llama "scope" (alcance): las variables existen donde fueron declaradas.
    let globalData;

// ── PASO 3A: Generamos el fondo de virus al arrancar ──────────────
// Debe ir ANTES del spinner para que el fondo ya esté listo
    ui.renderVirusPattern();

// ── PASO 3B: Mostramos el spinner encima del fondo ────────────────
    ui.showLoading();

    // ── PASO 3B: Carga inicial al abrir la página ─────────────────────
    try {
        // Promise.all() lanza los dos fetch AL MISMO TIEMPO
        // En vez de esperar uno, luego el otro (2 segundos)
        // los lanza juntos y espera a que AMBOS terminen (~1 segundo)
        // La desestructuración [global, topCountries] asigna cada resultado
        // al nombre de variable correspondiente, en el mismo orden del array
        const [global, topCountries] = await Promise.all([
            api.getGlobalStats(),
            api.getTopCountries()
        ]);

        // Guardamos en la variable externa para usarla después
        globalData = global;

        // Le pasamos los datos a la UI para que los pinte en pantalla
        ui.renderGlobalCards(globalData);
        ui.renderTopCountries(topCountries);
        ui.renderChart(topCountries);
        ui.renderLastUpdated(globalData.updated);

    } catch (error) {
        // Si cualquier fetch falla (sin internet, API caída, etc.)
        // el catch atrapa el error y mostramos un mensaje amigable
        document.getElementById('cards-container').innerHTML = `
            <p class="text-red-400 col-span-4">⚠️ Error al cargar datos globales.</p>
        `;
    } finally {
        // finally se ejecuta SIEMPRE, haya error o no
        // Es el lugar perfecto para esconder el spinner
        // porque queremos ocultarlo tanto si todo salió bien
        // como si hubo un error
        ui.hideLoading();
    }

    // ── PASO 3C: Event listener del buscador de países ────────────────
    // Buscamos el input en el HTML
    const searchInput = document.getElementById('search-input');

    // addEventListener escucha eventos en ese elemento
    // 'keydown' se dispara cada vez que el usuario presiona una tecla
    // La función async que recibe es el "callback":
    // es la función que se ejecuta cuando ocurre el evento
    searchInput.addEventListener('keydown', async (event) => {

        // event.key nos dice qué tecla se presionó
        // Si no fue Enter, salimos de la función con return
        if (event.key !== 'Enter') return;

        // .value toma el texto del input
        // .trim() elimina espacios en blanco al inicio y al final
        const countryName = searchInput.value.trim();

        // Si el input estaba vacío, no buscamos nada
        if (!countryName) return;

        // Mostramos el spinner también al buscar un país
        ui.showLoading();

        try {
            // Pedimos los datos del país a la API
            const countryData = await api.getCountryStats(countryName);

            // Le pasamos los datos a la UI para pintarlos
            ui.renderCountryResult(countryData);

        } catch (error) {
            // Si el país no existe en la API o hay un error de red
            document.getElementById('country-result').innerHTML = `
                <p class="text-red-400">⚠️ País no encontrado. Intenta en inglés (ej: Chile, Brazil, USA).</p>
            `;
        } finally {
            // Ocultamos el spinner siempre, haya resultado o error
            ui.hideLoading();
        }
    });
}

// ╔══════════════════════════════════════════════════════════════╗
// ║  PASO 4 — Arrancar la aplicación                            ║
// ║  Sin esta línea, todo el código existe pero nunca se        ║
// ║  ejecuta. Es como escribir las reglas de un juego pero      ║
// ║  nunca empezar a jugar.                                     ║
// ╚══════════════════════════════════════════════════════════════╝
init();