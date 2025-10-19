const calendar = document.getElementById("calendar");
const monthYear = document.getElementById("monthYear");
const prevMonth = document.getElementById("prevMonth");
const nextMonth = document.getElementById("nextMonth");
const noteModal = document.getElementById("noteModal");
const noteText = document.getElementById("noteText");
const saveNote = document.getElementById("saveNote");
const closeModal = document.getElementById("closeModal");
const metaInput = document.getElementById("metaInput");
const saveGoal = document.getElementById("saveGoal");
const goalItems = document.getElementById("goalItems");
const statusPanel = document.getElementById("statusPanel");
const btnDone = document.getElementById("btnDone");
const btnMissed = document.getElementById("btnMissed");
const btnCancel = document.getElementById("btnCancel");
const historyList = document.getElementById("historyList");

let currentDate = new Date();
let selectedDay = null;
let selectedKey = null;
let data = JSON.parse(localStorage.getItem("calendarioMetas")) || {};
let goals = JSON.parse(localStorage.getItem("metasMensuales")) || [];
const metaDaysInput = document.getElementById("metaDays");
const deadlinePanel = document.getElementById("deadlinePanel");
const deadlineText = document.getElementById("deadlineText");
const btnCompleteGoal = document.getElementById("btnCompleteGoal");
const btnExtendGoal = document.getElementById("btnExtendGoal");
const btnDismissDeadline = document.getElementById("btnDismissDeadline");

// Cada meta será: { id, text, createdAt (ms), estimateDays, extendedDays }

// === Renderizar calendario ===
function renderCalendar() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const lastDay = new Date(year, month + 1, 0).getDate();

  calendar.innerHTML = "";
  monthYear.textContent = currentDate.toLocaleString("es-ES", {
    month: "long",
    year: "numeric",
  });

  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement("div");
    calendar.appendChild(empty);
  }

  for (let day = 1; day <= lastDay; day++) {
    const dayEl = document.createElement("div");
    dayEl.classList.add("day");
    dayEl.textContent = day;
    const key = `${year}-${month}-${day}`;
    if (data[key]?.status === "done") dayEl.classList.add("done");
    else if (data[key]?.status === "missed") dayEl.classList.add("missed");

    dayEl.addEventListener("click", () => handleDayClick(key));
    calendar.appendChild(dayEl);
  }
}

// === Al hacer clic en un día ===
function handleDayClick(key) {
  if (data[key]) {
    // Día ya marcado → mostrar info
    const info = data[key];
    if (info.status === "done") {
      alert(`✅ Meta cumplida el ${key}`);
    } else if (info.status === "missed") {
      alert(
        `❌ No cumpliste la meta el ${key}.\nMotivo: ${
          info.note || "No especificado"
        }`
      );
    }
    return;
  }

  selectedKey = key;
  statusPanel.style.display = "block";
}

// === Acciones del panel ===
btnDone.addEventListener("click", () => {
  if (selectedKey) {
    data[selectedKey] = { status: "done" };
    addToHistory("✅ Meta cumplida", selectedKey);
    saveData();
    renderCalendar();
  }
  closeStatusPanel();
});

btnMissed.addEventListener("click", () => {
  if (selectedKey) {
    selectedDay = selectedKey;
    openModal();
  }
});

btnCancel.addEventListener("click", closeStatusPanel);

function closeStatusPanel() {
  statusPanel.style.display = "none";
  selectedKey = null;
}

// === Modal de notas ===
function openModal() {
  noteModal.style.display = "flex";
}

function closeModalWindow() {
  noteModal.style.display = "none";
  noteText.value = "";
}

saveNote.addEventListener("click", () => {
  if (selectedDay) {
    data[selectedDay] = { status: "missed", note: noteText.value };
    addToHistory(`❌ Meta no cumplida (${noteText.value})`, selectedDay);
    saveData();
    renderCalendar();
    closeModalWindow();
  }
});

closeModal.addEventListener("click", closeModalWindow);

// === Guardar en LocalStorage ===
function saveData() {
  localStorage.setItem("calendarioMetas", JSON.stringify(data));
}

// === Historial ===
function addToHistory(text, date) {
  const li = document.createElement("li");
  li.textContent = `${date}: ${text}`;
  historyList.prepend(li);

  const storedHistory =
    JSON.parse(localStorage.getItem("historialMetas")) || [];
  storedHistory.unshift({ date, text });
  localStorage.setItem("historialMetas", JSON.stringify(storedHistory));
}

function loadHistory() {
  const storedHistory =
    JSON.parse(localStorage.getItem("historialMetas")) || [];
  storedHistory.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = `${item.date}: ${item.text}`;
    historyList.appendChild(li);
  });
}

// === Guardar metas mensuales ===
saveGoal.addEventListener("click", () => {
  const goal = metaInput.value.trim();
  const days = parseInt(metaDaysInput.value, 10) || 0;
  if (goal) {
    const newGoal = {
      id: Date.now().toString(),
      text: goal,
      createdAt: Date.now(),
      estimateDays: days > 0 ? days : 7,
      extendedDays: 0,
    };
    goals.push(newGoal);
    localStorage.setItem("metasMensuales", JSON.stringify(goals));
    metaInput.value = "";
    metaDaysInput.value = "";
    renderGoals();
    checkGoalDeadlines();
  }
});

function renderGoals() {
  goalItems.innerHTML = "";
  goals.forEach((g) => {
    const li = document.createElement("li");
    li.textContent = `${g.text} (estimado: ${
      g.estimateDays + (g.extendedDays || 0)
    } días)`;
    goalItems.appendChild(li);
  });
}

// Comprueba si hay metas vencidas y muestra panel
function checkGoalDeadlines() {
  const now = Date.now();
  for (const g of goals) {
    const totalDays = g.estimateDays + (g.extendedDays || 0);
    const deadlineMs = g.createdAt + totalDays * 24 * 60 * 60 * 1000;
    if (now >= deadlineMs && !g.notified) {
      // mostrar panel de deadline para esta meta
      deadlinePanel.style.display = "block";
      deadlineText.textContent = `La meta "${g.text}" ha alcanzado el tiempo estimado (${totalDays} días). ¿La completaste o quieres agregar más tiempo?`;
      // guardar referencia en el panel
      deadlinePanel.currentGoalId = g.id;
      g.notified = true; // marcar como notificada para no repetir
      saveGoals();
      return; // mostrar solo una a la vez
    }
  }
  deadlinePanel.style.display = "none";
}

function saveGoals() {
  localStorage.setItem("metasMensuales", JSON.stringify(goals));
}

// Acciones del panel de deadline
btnCompleteGoal.addEventListener("click", () => {
  const id = deadlinePanel.currentGoalId;
  if (!id) return;
  const idx = goals.findIndex((x) => x.id === id);
  if (idx >= 0) {
    addToHistory(
      `✅ Meta completada: ${goals[idx].text}`,
      new Date().toLocaleDateString()
    );
    goals.splice(idx, 1);
    saveGoals();
    renderGoals();
  }
  deadlinePanel.style.display = "none";
});

btnExtendGoal.addEventListener("click", () => {
  const id = deadlinePanel.currentGoalId;
  if (!id) return;
  const extra = parseInt(prompt("¿Cuántos días quieres agregar?"), 10) || 0;
  const g = goals.find((x) => x.id === id);
  if (g && extra > 0) {
    g.extendedDays = (g.extendedDays || 0) + extra;
    g.notified = false; // permitir nueva notificación al nuevo vencimiento
    saveGoals();
    renderGoals();
  }
  deadlinePanel.style.display = "none";
});

btnDismissDeadline.addEventListener("click", () => {
  const id = deadlinePanel.currentGoalId;
  if (id) {
    const g = goals.find((x) => x.id === id);
    if (g) g.notified = true; // solo ignorar esta vez
    saveGoals();
  }
  deadlinePanel.style.display = "none";
});

// === Navegación entre meses ===
prevMonth.addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
});

nextMonth.addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
});

// === Inicializar ===
renderCalendar();
renderGoals();
loadHistory();
