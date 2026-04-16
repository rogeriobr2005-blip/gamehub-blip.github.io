// 1. Configurações Globais
const API_KEY = "024afecf82ca46fe8dc60e2c6c14ea29";
let paginaAtual = 1;
let jogosData = []; 
let favoritos = JSON.parse(localStorage.getItem("game_favs")) || [];

// 2. Elementos do DOM
const elementos = {
    get grid() { return document.getElementById("jogosGrid"); },
    get busca() { return document.getElementById("buscaInput"); },
    get modal() { return document.getElementById("modal"); },
    get favGrid() { return document.getElementById("favoritosGrid"); },
    get btnCarregar() { return document.getElementById("btnCarregarMais"); },
    get transition() { return document.getElementById("transition"); }
};

// 3. Função Principal de Carga (API)
async function carregarJogos(pagina = 1) {
    try {
        if (elementos.btnCarregar) elementos.btnCarregar.innerText = "Carregando...";

        const url = `https://api.rawg.io/api/games?key=${API_KEY}&page=${pagina}&page_size=12`;
        const res = await fetch(url);
        const data = await res.json();

        if (!data.results) throw new Error("Dados não encontrados");

        const novosJogos = data.results.map(j => ({
            id: j.id,
            nome: j.name,
            categoria: j.genres?.[0]?.name || "Outro",
            tag: j.genres?.slice(0, 2).map(g => g.name).join(" • ") || "N/A",
            nota: j.rating ? j.rating.toFixed(1) : "N/A",
            img: j.background_image || 'https://via.placeholder.com/400x600'
        }));

        jogosData = [...jogosData, ...novosJogos];

        renderizarGrid(jogosData, true);
        renderizarFavoritos();

        if (elementos.btnCarregar) elementos.btnCarregar.innerText = "Carregar Mais Jogos";
        document.body.classList.add("loaded");

    } catch (err) {
        console.error("Erro ao conectar na API:", err);
        if (elementos.grid) elementos.grid.innerHTML = `<p class="empty-state">Erro ao carregar jogos.</p>`;
    }
}

// 4. Renderização da Grid
function renderizarGrid(lista) {
    if (!elementos.grid) return;

    const html = lista.map((jogo, i) => `
        <div class="jogo-card fade-in" style="animation-delay:${(i % 12) * 0.05}s" onclick="abrirModal(${jogo.id})">
            <button class="fav-btn ${favoritos.includes(jogo.id) ? 'ativo' : ''}" 
                    onclick="toggleFav(event, ${jogo.id})">★</button>
            <img src="${jogo.img}" alt="${jogo.nome}" loading="lazy">
            <div class="card-info">
                <h3>${jogo.nome}</h3>
                <p>${jogo.tag}</p>
                <span>⭐ ${jogo.nota}</span>
            </div>
        </div>
    `).join('');

    elementos.grid.innerHTML = html;
    ativarEfeito3D();
}

// 5. Sistema de Favoritos
function renderizarFavoritos() {
    if (!elementos.favGrid) return;

    const listaFavs = jogosData.filter(j => favoritos.includes(j.id));

    if (listaFavs.length === 0) {
        elementos.favGrid.innerHTML = `<p class="empty-state">Nenhum favorito ainda 😢</p>`;
        return;
    }

    elementos.favGrid.innerHTML = listaFavs.map(j => `
        <div class="jogo-card" onclick="abrirModal(${j.id})">
            <img src="${j.img}">
            <div class="card-info"><h3>${j.nome}</h3></div>
        </div>
    `).join('');
}

window.toggleFav = (e, id) => {
    e.stopPropagation();

    favoritos = favoritos.includes(id)
        ? favoritos.filter(f => f !== id)
        : [...favoritos, id];

    localStorage.setItem("game_favs", JSON.stringify(favoritos));
    
    renderizarGrid(jogosData);
    renderizarFavoritos();

    toast(favoritos.includes(id) ? "Adicionado! ⭐" : "Removido! 🗑️");
};

// 6. Modal
window.abrirModal = (id) => {
    const jogo = jogosData.find(j => j.id === id);
    const body = document.getElementById("modal-body");

    if (!jogo || !body || !elementos.modal) return;

    body.innerHTML = `
        <img src="${jogo.img}" style="width:100%; border-radius:10px; margin-bottom:15px; height: 200px; object-fit: cover;">
        <h2>${jogo.nome}</h2>
        <p style="margin-bottom:15px; color:#94a3b8;">Gênero: ${jogo.categoria}</p>
        <a href="detalhes.html?id=${id}" class="btn-ver-mais" style="background:var(--primary); text-decoration:none; display:inline-block;">Ver Detalhes Completos</a>
    `;

    elementos.modal.style.display = "grid";
};

// 7. Inicialização
function inicializar() {
    elementos.busca?.addEventListener("input", (e) => {
        const termo = e.target.value.toLowerCase();
        const filtrados = jogosData.filter(j => j.nome.toLowerCase().includes(termo));
        renderizarGrid(filtrados);
    });

    document.querySelectorAll(".btn-filtro").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelector(".btn-filtro.active")?.classList.remove("active");
            btn.classList.add("active");

            const cat = btn.dataset.cat;
            const filtrados = cat === "all"
                ? jogosData
                : jogosData.filter(j => j.categoria.includes(cat));

            renderizarGrid(filtrados);
        });
    });

    elementos.btnCarregar?.addEventListener("click", () => {
        paginaAtual++;
        carregarJogos(paginaAtual);
    });

    document.querySelector(".fechar")?.addEventListener("click", () => {
        if (elementos.modal) elementos.modal.style.display = "none";
    });

    window.addEventListener("click", (e) => {
        if (e.target === elementos.modal) elementos.modal.style.display = "none";
    });

    carregarJogos(1);
}

// 8. Efeitos
function ativarEfeito3D() {
    document.querySelectorAll(".jogo-card").forEach(card => {
        card.onmousemove = (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const rX = ((y - rect.height / 2) / 10) * -1;
            const rY = (x - rect.width / 2) / 10;

            card.style.transform = `perspective(1000px) rotateX(${rX}deg) rotateY(${rY}deg) scale(1.02)`;
        };

        card.onmouseleave = () => {
            card.style.transform = "rotateX(0) rotateY(0) scale(1)";
        };
    });
}

// Toast
function toast(msg) {
    const el = document.createElement("div");
    el.innerText = msg;

    Object.assign(el.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: 'var(--primary)',
        padding: '12px 20px',
        borderRadius: '10px',
        zIndex: '9999',
        color: 'white'
    });

    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2000);
}

document.addEventListener("DOMContentLoaded", inicializar);