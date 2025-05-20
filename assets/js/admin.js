
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getDatabase, ref, get, child, push, update, remove, set
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import {
  getAuth, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const config = {
  apiKey: "AIzaSyCFhS0aAgq0RQdgncI1lD1adbyVHGDgmcI",
  authDomain: "videowand-43140.firebaseapp.com",
  databaseURL: "https://videowand-43140-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "videowand-43140",
  storageBucket: "videowand-43140.appspot.com",
  messagingSenderId: "777250256351",
  appId: "1:777250256351:web:f0700b48c645037c82006a"
};

const app = initializeApp(config);
const db = getDatabase(app);
const auth = getAuth(app);

// Elemente
const logoutBtn = document.getElementById("logout-btn");
const filterInput = document.getElementById("filter");
const gameList = document.getElementById("game-list");
const gameForm = document.getElementById("modal-form");
const gameModal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const openModalBtn = document.getElementById("create-btn");
const cancelBtn = document.getElementById("cancelBtn");

const homeSelect = document.getElementById("homeSelect");
const awaySelect = document.getElementById("awaySelect");

const playerList = document.getElementById("player-list");
const playerFilterInput = document.getElementById("player-filter");
const playerForm = document.getElementById("player-form");
const playerModal = document.getElementById("playerModal");
const playerModalTitle = document.getElementById("playerModalTitle");
const createPlayerBtn = document.getElementById("create-player-btn");
const cancelPlayerBtn = document.getElementById("cancelPlayerBtn");

// Daten
let teams = {};
let allGames = {};
let allPlayers = {};
let editId = null;
let editPlayerId = null;

onAuthStateChanged(auth, async user => {
  if (!user) return location.href = "login.html";
  await loadTeams();
  await loadGames();
  await loadPlayers();
});

const tabs = document.querySelectorAll("[data-tab]");
const tabContents = document.querySelectorAll("[data-tab-content]");

function activateTab(tabId) {
  tabs.forEach(tab => {
    const isActive = tab.dataset.tab === tabId;
    tab.classList.toggle("text-blue-600", isActive);
    tab.classList.toggle("border-b-2", isActive);
    tab.classList.toggle("border-blue-600", isActive);
    tab.classList.toggle("text-gray-600", !isActive);
  });

  tabContents.forEach(content => {
    content.classList.toggle("hidden", content.dataset.tabContent !== tabId);
  });
}

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    activateTab(tab.dataset.tab);
  });
});

async function loadTeams() {
  const snap = await get(child(ref(db), "teams"));
  if (snap.exists()) {
    teams = snap.val();
    homeSelect.innerHTML = `<option value="">Heimteam wählen</option>`;
    awaySelect.innerHTML = `<option value="">Auswärtsteam wählen</option>`;
    Object.entries(teams).forEach(([id, t]) => {
      const option = `<option value="${id}">${t.name}</option>`;
      homeSelect.innerHTML += option;
      awaySelect.innerHTML += option;
    });
  }
}

async function loadGames() {
  const snap = await get(child(ref(db), "stadiums"));
  if (snap.exists()) {
    allGames = snap.val();
    renderGames(allGames);
  }
}

function renderGames(games) {
  gameList.innerHTML = "";
  const sorted = Object.entries(games).sort(([, a], [, b]) => {
    return a.date === b.date ? b.time.localeCompare(a.time) : b.date.localeCompare(a.date);
  });

  const today = new Date().toISOString().split("T")[0];

  for (const [id, g] of sorted) {
    const home = teams[g.home_team_id] || { name: "?", logo: "" };
    const away = teams[g.away_team_id] || { name: "?", logo: "" };
    const isToday = g.date === today;

    const card = document.createElement("div");
    card.innerHTML = `
      <div class="bg-white p-4 rounded-xl border ${isToday
        ? "border-blue-500 shadow-blue-200 ring-2 ring-blue-100"
        : "border-gray-200 shadow-md"
      } hover:shadow-lg transition">
        <div class="flex justify-between items-center mb-4">
          <div class="flex flex-col items-center">
            <img src="${home.logo}" class="w-14 h-14 object-contain mb-1 rounded-full" />
            <span class="text-sm text-gray-700 font-medium text-center">${home.name}</span>
          </div>
          <span class="text-lg font-semibold text-gray-500">vs</span>
          <div class="flex flex-col items-center">
            <img src="${away.logo}" class="w-14 h-14 object-contain mb-1 rounded-full" />
            <span class="text-sm text-gray-700 font-medium text-center">${away.name}</span>
          </div>
        </div>
        <div class="text-sm text-center text-gray-600 mb-3">
          <div>${formatDate(g.date)} – ${g.time}</div>
          <div class="text-xs mt-1 text-gray-400">${g.venue} · Spieltag ${g.gameday}</div>
        </div>
        <div class="flex justify-end gap-3 pt-2 border-t border-gray-100 mt-2">
          <button class="text-blue-600 hover:text-blue-800" onclick="editGame('${id}')">Bearbeiten</button>
          <button class="text-red-500 hover:text-red-700" onclick="confirmDelete('${id}')">Löschen</button>
        </div>
      </div>
    `;
    gameList.appendChild(card);
  }
}

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split("-");
  return `${day}.${month}.${year}`;
}

function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

function applyFilter() {
  const q = filterInput.value.toLowerCase().trim();

  const filtered = Object.fromEntries(
    Object.entries(allGames).filter(([, g]) => {
      const home = teams[g.home_team_id]?.name?.toLowerCase() || "";
      const away = teams[g.away_team_id]?.name?.toLowerCase() || "";
      const venue = g.venue?.toLowerCase() || "";
      const date = g.date || "";
      const gameday = g.gameday?.toString() || "";

      return (
        home.includes(q) || away.includes(q) || venue.includes(q) || date.includes(q) || gameday.includes(q)
      );
    })
  );

  renderGames(filtered);
}

const debouncedFilter = debounce(applyFilter, 300);
filterInput.addEventListener("input", debouncedFilter);

openModalBtn.addEventListener("click", () => {
  editId = null;
  modalTitle.textContent = "Neues Spiel erstellen";
  gameForm.reset();
  gameModal.classList.add("active");
});

cancelBtn.addEventListener("click", () => {
  gameModal.classList.remove("active");
});

gameForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(gameForm));
  data.gameday = parseInt(data.gameday);
  if (editId) {
    await update(ref(db, "stadiums/" + editId), data);
  } else {
    // Hole alle bestehenden Spiel-IDs und finde die höchste numerische
    const snap = await get(child(ref(db), "stadiums"));
    let nextId = 1;

    if (snap.exists()) {
      const all = snap.val();
      const numericIds = Object.keys(all)
        .map(id => parseInt(id))
        .filter(n => !isNaN(n))
        .sort((a, b) => b - a);
      if (numericIds.length > 0) {
        nextId = numericIds[0] + 1;
      }
    }

    await set(ref(db, "stadiums/" + nextId), data);
  }

  gameModal.classList.remove("active");
  await loadGames();
});

window.editGame = (id) => {
  const g = allGames[id];
  modalTitle.textContent = "Spiel bearbeiten";
  gameForm.date.value = g.date;
  gameForm.time.value = g.time;
  gameForm.home_team_id.value = g.home_team_id;
  gameForm.away_team_id.value = g.away_team_id;
  gameForm.venue.value = g.venue;
  gameForm.gameday.value = g.gameday;
  editId = id;
  gameModal.classList.add("active");
};

window.confirmDelete = async (id) => {
  if (confirm("Spiel wirklich löschen?")) {
    await remove(ref(db, "stadiums/" + id));
    await loadGames();
  }
};

// Spielerverwaltung
async function loadPlayers() {
  const snap = await get(child(ref(db), "players"));
  if (snap.exists()) {
    allPlayers = snap.val();
    renderPlayers(allPlayers);
  }
}

function renderPlayers(players) {
  playerList.innerHTML = "";
  Object.entries(players).forEach(([id, p]) => {
    const card = document.createElement("div");
    card.className = "bg-white p-4 rounded-xl border shadow hover:shadow-lg transition";
    card.innerHTML = `
      <h3 class="text-lg font-bold mb-2">${p.firstName} ${p.lastName}</h3>
      <p class="text-sm text-gray-500">Nummer: ${p.number == 99 ? "Trainer" : p.number ?? "-"}</p>
      <div class="flex justify-end gap-3 mt-4 border-t pt-2">
        <button class="text-blue-600 hover:text-blue-800" onclick="editPlayer('${id}')">Bearbeiten</button>
        <button class="text-red-500 hover:text-red-700" onclick="deletePlayer('${id}')">Löschen</button>
      </div>
    `;
    playerList.appendChild(card);
  });
}

createPlayerBtn?.addEventListener("click", () => {
  editPlayerId = null;
  playerModalTitle.textContent = "Spieler erstellen";
  playerForm.reset();
  playerModal.classList.add("active");
});

cancelPlayerBtn?.addEventListener("click", () => {
  playerModal.classList.remove("active");
});

playerForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(playerForm);
  const data = Object.fromEntries(formData.entries());
  data.number = parseInt(data.number) || null;

  if (editPlayerId) {
    await update(ref(db, "players/" + editPlayerId), data);
  } else {
    await push(ref(db, "players"), data);
  }

  playerModal.classList.remove("active");
  await loadPlayers();
});

window.editPlayer = (id) => {
  const p = allPlayers[id];
  playerModalTitle.textContent = "Spieler bearbeiten";
  playerForm.firstName.value = p.firstName;
  playerForm.lastName.value = p.lastName;
  playerForm.number.value = p.number ?? "";
  editPlayerId = id;
  playerModal.classList.add("active");
};

window.deletePlayer = async (id) => {
  if (confirm("Spieler wirklich löschen?")) {
    await remove(ref(db, "players/" + id));
    await loadPlayers();
  }
};

playerFilterInput?.addEventListener("input", debounce(() => {
  const q = playerFilterInput.value.toLowerCase().trim();
  const filtered = Object.fromEntries(
    Object.entries(allPlayers).filter(([, p]) => {
      return (
        p.firstName?.toLowerCase().includes(q) ||
        p.lastName?.toLowerCase().includes(q) ||
        p.number?.toString().includes(q)
      );
    })
  );
  renderPlayers(filtered);
}, 300));

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  location.href = "login.html";
});
















const lineupSections = document.getElementById("lineup-sections");
const lineupModal = document.getElementById("lineup-modal");
const lineupModalForm = document.getElementById("lineup-modal-form");
const lineupPlayerSelect = document.getElementById("lineup-player-select");
const lineupRoleHidden = document.getElementById("lineup-role-hidden");
const cancelLineupModalBtn = document.getElementById("cancel-lineup-modal");


const lineupRoles = ["Torhüter", "Verteidiger", "Stürmer", "Trainer"];
let currentLineup = []; // wird aus Firebase geladen

async function loadLineup() {
  const snap = await get(child(ref(db), `aufstellungHeim`));
  if (snap.exists()) {
    currentLineup = snap.val();
  } else {
    currentLineup = [];
  }

  loadPlayAufstellung();
}

async function loadPlayAufstellung() {
  const snap = await get(child(ref(db), "players"));
  if (snap.exists()) {
    allPlayers = snap.val();
    renderLineup(allPlayers)
  }
}

function renderLineup(allPlayers) {
  lineupSections.innerHTML = "";

  lineupRoles.forEach(role => {
    const container = document.createElement("div");
    container.className = "bg-white rounded-xl shadow p-4 border";

    const assigned = currentLineup.filter(p => p.role === role);

    container.innerHTML = `
      <div class="flex justify-between items-center mb-3">
        <h3 class="text-lg font-semibold text-gray-800">${role}</h3>
        <button class="text-blue-600 hover:underline" data-role="${role}" onclick="openLineupModal('${role}')">+ Spieler</button>
      </div>
      <ul class="space-y-1" id="list-${role}">
        ${assigned.map(p => {
      const player = allPlayers?.[p.playerId] || {};

      const fullName = `${player.firstName || "?"} ${player.lastName || ""}`.trim();

      return `
            <li class="flex justify-between items-center bg-gray-50 px-3 py-2 rounded">
              <span>${player.number} - ${fullName}</span>
              <button onclick="removeFromLineup('${p.playerId}')" class="text-red-500 hover:text-red-700">✕</button>
            </li>
          `;
    }).join("")}
      </ul>
    `;

    lineupSections.appendChild(container);
  });
}


window.openLineupModal = (role) => {
  lineupRoleHidden.value = role;

  // bereits vergebene Spieler entfernen
  const usedIds = currentLineup.map(p => p.playerId);
  lineupPlayerSelect.innerHTML = `<option value="">Spieler wählen</option>` +
    Object.entries(allPlayers)
      .filter(([id]) => !usedIds.includes(id))
      .map(([id, p]) => `<option value="${id}">${p.firstName} ${p.lastName}</option>`)
      .join("");

  lineupModal.classList.add("active");
};


lineupModalForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const playerId = lineupPlayerSelect.value;
  const role = lineupRoleHidden.value;

  if (!playerId || !role) return;

  currentLineup.push({ playerId, role });
  lineupModal.classList.remove("active");
  loadPlayAufstellung();
});


window.removeFromLineup = (playerId) => {
  currentLineup = currentLineup.filter(p => p.playerId !== playerId);
  loadPlayAufstellung();
};


cancelLineupModalBtn.addEventListener("click", () => {
  lineupModal.classList.remove("active");
});


document.getElementById("save-lineup").addEventListener("click", async () => {
  await update(ref(db, `/`), {
    aufstellungHeim: currentLineup
  });
  alert("Aufstellung gespeichert!");
});

loadLineup();