let workouts = JSON.parse(localStorage.getItem("workouts")) || {};
let currentDay = document.getElementById("day").value;
let editIndex = -1;

function getCurrentDate() {
    const today = new Date();
    return today.toISOString().split("T")[0];
}

if (!workouts[getCurrentDate()]) {
    workouts[getCurrentDate()] = { day1: [], day2: [], day3: [] };
}

document.getElementById("day").addEventListener("change", function() {
    currentDay = this.value;
    renderExercises();
});

function showTab(tabId) {
    document.querySelectorAll(".tab-content").forEach(tab => tab.classList.remove("active"));
    document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
    document.getElementById(tabId).classList.add("active");
    document.querySelector(`.tab[onclick="showTab('${tabId}')"]`).classList.add("active");
    
    if (tabId === "history") {
        populateHistoryDates();
        renderHistory();
    } else {
        renderExercises();
    }
}

function addExercise() {
    let exercise = document.getElementById("exercise").value.trim();
    let sets = parseInt(document.getElementById("sets").value);
    let reps = parseInt(document.getElementById("reps").value);
    let weight = parseFloat(document.getElementById("weight").value);
    
    if (!exercise) {
        showError("Название упражнения не может быть пустым!");
        return;
    }
    if (isNaN(sets) || sets <= 0) {
        showError("Количество подходов должно быть больше 0!");
        return;
    }
    if (isNaN(reps) || reps <= 0) {
        showError("Количество повторений должно быть больше 0!");
        return;
    }
    if (isNaN(weight) || weight <= 0) {
        showError("Вес должен быть больше 0!");
        return;
    }
    
    let today = getCurrentDate();
    if (!workouts[today]) {
        workouts[today] = { day1: [], day2: [], day3: [] };
    }
    workouts[today][currentDay].push({ exercise, sets, reps, weight });
    localStorage.setItem("workouts", JSON.stringify(workouts));
    
    document.getElementById("exercise").value = "";
    document.getElementById("sets").value = "";
    document.getElementById("reps").value = "";
    document.getElementById("weight").value = "";
    
    renderExercises();
}

function renderExercises() {
    let list = document.getElementById("exerciseList");
    list.innerHTML = "";
    
    let today = getCurrentDate();
    if (!workouts[today] || !workouts[today][currentDay] || workouts[today][currentDay].length === 0) {
        list.innerHTML = "<p>Нет упражнений</p>";
        return;
    }
    
    workouts[today][currentDay].forEach((ex, index) => {
        list.innerHTML += `
            <div class="exercise-item">
                <span>${ex.exercise} - ${ex.sets}x${ex.reps} (${ex.weight} кг)</span>
                <div>
                    <button onclick="openEditModal(${index})">✏️</button>
                    <button onclick="deleteExercise(${index})">❌</button>
                </div>
            </div>`;
    });
}

function openEditModal(index) {
    editIndex = index;
    let today = getCurrentDate();
    let ex = workouts[today][currentDay][index];
    
    document.getElementById("editExercise").value = ex.exercise;
    document.getElementById("editSets").value = ex.sets;
    document.getElementById("editReps").value = ex.reps;
    document.getElementById("editWeight").value = ex.weight;
    
    let modal = document.getElementById("editModal");
    document.getElementById("mainContent").classList.add("blurred");
    modal.style.display = "flex";
    setTimeout(() => modal.classList.add("active"), 10); // Для анимации
}

function saveExercise() {
    let newExercise = document.getElementById("editExercise").value.trim();
    let newSets = parseInt(document.getElementById("editSets").value);
    let newReps = parseInt(document.getElementById("editReps").value);
    let newWeight = parseFloat(document.getElementById("editWeight").value);
    
    if (!newExercise) {
        showError("Название упражнения не может быть пустым!");
        return;
    }
    if (isNaN(newSets) || newSets <= 0) {
        showError("Количество подходов должно быть больше 0!");
        return;
    }
    if (isNaN(newReps) || newReps <= 0) {
        showError("Количество повторений должно быть больше 0!");
        return;
    }
    if (isNaN(newWeight) || newWeight <= 0) {
        showError("Вес должен быть больше 0!");
        return;
    }
    
    let today = getCurrentDate();
    workouts[today][currentDay][editIndex].exercise = newExercise;
    workouts[today][currentDay][editIndex].sets = newSets;
    workouts[today][currentDay][editIndex].reps = newReps;
    workouts[today][currentDay][editIndex].weight = newWeight;
    localStorage.setItem("workouts", JSON.stringify(workouts));
    
    closeModal();
    renderExercises();
}

function closeModal() {
    let modal = document.getElementById("editModal");
    modal.classList.remove("active");
    document.getElementById("mainContent").classList.remove("blurred");
    setTimeout(() => (modal.style.display = "none"), 400); // Синхронизация с анимацией
    editIndex = -1;
}

function deleteExercise(index) {
    let today = getCurrentDate();
    workouts[today][currentDay].splice(index, 1);
    localStorage.setItem("workouts", JSON.stringify(workouts));
    renderExercises();
}

function clearDay() {
    let today = getCurrentDate();
    if (!workouts[today] || !workouts[today][currentDay] || workouts[today][currentDay].length === 0) {
        showError("В этот день нет упражнений для очистки!");
        return;
    }
    
    if (Telegram.WebApp) {
        Telegram.WebApp.showConfirm("Вы уверены, что хотите удалить все упражнения за этот день?", (confirmed) => {
            if (confirmed) {
                workouts[today][currentDay] = [];
                localStorage.setItem("workouts", JSON.stringify(workouts));
                renderExercises();
                showMessage("Упражнения за этот день удалены.");
            }
        });
    } else {
        if (confirm("Вы уверены, что хотите удалить все упражнения за этот день?")) {
            workouts[today][currentDay] = [];
            localStorage.setItem("workouts", JSON.stringify(workouts));
            renderExercises();
            showMessage("Упражнения за этот день удалены.");
        }
    }
}

function sendData() {
    let today = getCurrentDate();
    let data = workouts[today][currentDay] || [];
    Telegram.WebApp.sendData(JSON.stringify({ day: currentDay, exercises: data }));
    Telegram.WebApp.close();
}

function syncData() {
    let data = workouts;
    Telegram.WebApp.sendData(JSON.stringify({ action: "sync", workouts: data }));
}

function populateHistoryDates() {
    let select = document.getElementById("historyDate");
    select.innerHTML = '<option value="">Выберите дату</option>';
    
    let dates = Object.keys(workouts).sort((a, b) => new Date(b) - new Date(a));
    dates.forEach(date => {
        let option = document.createElement("option");
        option.value = date;
        option.textContent = date;
        select.appendChild(option);
    });
}

function renderHistory() {
    let list = document.getElementById("historyList");
    list.innerHTML = "";
    
    let selectedDate = document.getElementById("historyDate").value;
    if (!selectedDate || !workouts[selectedDate]) {
        list.innerHTML = "<p>Нет данных за эту дату</p>";
        return;
    }
    
    let days = ["day1", "day2", "day3"];
    days.forEach(day => {
        if (workouts[selectedDate][day] && workouts[selectedDate][day].length > 0) {
            list.innerHTML += `<h4>День ${days.indexOf(day) + 1}</h4>`;
            workouts[selectedDate][day].forEach(ex => {
                list.innerHTML += `
                    <div class="exercise-item">
                        <span>${ex.exercise} - ${ex.sets}x${ex.reps} (${ex.weight} кг)</span>
                    </div>`;
            });
        }
    });
    
    if (list.innerHTML === "") {
        list.innerHTML = "<p>Нет упражнений за эту дату</p>";
    }
}

function showError(message) {
    if (Telegram.WebApp) {
        Telegram.WebApp.showAlert(message);
    } else {
        alert(message);
    }
}

function showMessage(message) {
    if (Telegram.WebApp) {
        Telegram.WebApp.showAlert(message);
    } else {
        alert(message);
    }
}

showTab("current");
renderExercises();