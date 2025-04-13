let workouts = JSON.parse(localStorage.getItem("workouts")) || {};
let currentDay = null;
let editIndex = -1;

function createDay() {
    let newDay = document.getElementById("newDay").value.trim();
    if (!newDay) {
        showError("Введите название дня!");
        return;
    }
    
    if (workouts[newDay]) {
        showError("День с таким названием уже существует!");
        return;
    }
    
    workouts[newDay] = [];
    localStorage.setItem("workouts", JSON.stringify(workouts));
    document.getElementById("newDay").value = "";
    renderDays();
    showMessage(`День "${newDay}" создан!`);
}

function selectDay(day) {
    currentDay = day;
    document.getElementById("exerciseDayTitle").textContent = `Упражнения: ${day}`;
    showTab("exercises");
}

function deleteDay(day) {
    if (Telegram.WebApp) {
        Telegram.WebApp.showConfirm(`Вы уверены, что хотите удалить день "${day}"?`, (confirmed) => {
            if (confirmed) {
                delete workouts[day];
                if (currentDay === day) {
                    currentDay = null;
                }
                localStorage.setItem("workouts", JSON.stringify(workouts));
                renderDays();
                showMessage(`День "${day}" удалён.`);
            }
        });
    } else {
        if (confirm(`Вы уверены, что хотите удалить день "${day}"?`)) {
            delete workouts[day];
            if (currentDay === day) {
                currentDay = null;
            }
            localStorage.setItem("workouts", JSON.stringify(workouts));
            renderDays();
            showMessage(`День "${day}" удалён.`);
        }
    }
}

function renderDays() {
    let list = document.getElementById("dayList");
    list.innerHTML = "";
    
    let days = Object.keys(workouts).sort((a, b) => new Date(b) - new Date(a));
    if (days.length === 0) {
        list.innerHTML = "<p>Нет дней</p>";
        return;
    }
    
    days.forEach(day => {
        list.innerHTML += `
            <div class="day-item">
                <span>${day}</span>
                <div>
                    <button onclick="selectDay('${day}')">📋</button>
                    <button onclick="deleteDay('${day}')">❌</button>
                </div>
            </div>`;
    });
}

function addExercise() {
    if (!currentDay) {
        showError("Выберите день!");
        return;
    }
    
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
    
    workouts[currentDay].push({ exercise, sets, reps, weight });
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
    
    if (!currentDay || !workouts[currentDay] || workouts[currentDay].length === 0) {
        list.innerHTML = "<p>Нет упражнений</p>";
        return;
    }
    
    workouts[currentDay].forEach((ex, index) => {
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
    let ex = workouts[currentDay][index];
    
    document.getElementById("editExercise").value = ex.exercise;
    document.getElementById("editSets").value = ex.sets;
    document.getElementById("editReps").value = ex.reps;
    document.getElementById("editWeight").value = ex.weight;
    
    let modal = document.getElementById("editModal");
    document.querySelector(".main-content").classList.add("blurred");
    modal.style.display = "flex";
    setTimeout(() => modal.classList.add("active"), 10);
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
    
    workouts[currentDay][editIndex].exercise = newExercise;
    workouts[currentDay][editIndex].sets = newSets;
    workouts[currentDay][editIndex].reps = newReps;
    workouts[currentDay][editIndex].weight = newWeight;
    localStorage.setItem("workouts", JSON.stringify(workouts));
    
    closeModal();
    renderExercises();
}

function closeModal() {
    let modal = document.getElementById("editModal");
    modal.classList.remove("active");
    document.querySelector(".main-content").classList.remove("blurred");
    setTimeout(() => (modal.style.display = "none"), 500);
    editIndex = -1;
}

function deleteExercise(index) {
    workouts[currentDay].splice(index, 1);
    localStorage.setItem("workouts", JSON.stringify(workouts));
    renderExercises();
}

function clearDay() {
    if (!currentDay || !workouts[currentDay] || workouts[currentDay].length === 0) {
        showError("В этот день нет упражнений для очистки!");
        return;
    }
    
    if (Telegram.WebApp) {
        Telegram.WebApp.showConfirm("Вы уверены, что хотите удалить все упражнения за этот день?", (confirmed) => {
            if (confirmed) {
                workouts[currentDay] = [];
                localStorage.setItem("workouts", JSON.stringify(workouts));
                renderExercises();
                showMessage("Упражнения за этот день удалены.");
            }
        });
    } else {
        if (confirm("Вы уверены, что хотите удалить все упражнения за этот день?")) {
            workouts[currentDay] = [];
            localStorage.setItem("workouts", JSON.stringify(workouts));
            renderExercises();
            showMessage("Упражнения за этот день удалены.");
        }
    }
}

function sendData() {
    if (!currentDay) {
        showError("Выберите день!");
        return;
    }
    let data = workouts[currentDay] || [];
    Telegram.WebApp.sendData(JSON.stringify({ day: currentDay, exercises: data }));
    Telegram.WebApp.close();
}

function syncData() {
    let data = workouts;
    Telegram.WebApp.sendData(JSON.stringify({ action: "sync", workouts: data }));
}

function showTab(tabId) {
    const mainContent = document.querySelector(".main-content");
    mainContent.classList.add("blurred");
    
    setTimeout(() => {
        document.querySelectorAll(".tab-content").forEach(tab => tab.classList.remove("active"));
        document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
        document.getElementById(tabId).classList.add("active");
        document.querySelector(`.tab[onclick="showTab('${tabId}')"]`).classList.add("active");
        
        mainContent.classList.remove("blurred");
        
        if (tabId === "days") {
            renderDays();
        } else if (tabId === "exercises") {
            renderExercises();
        } else {
            renderHistory();
        }
    }, 400);
}

function renderHistory() {
    let list = document.getElementById("historyList");
    list.innerHTML = "";
    
    let days = Object.keys(workouts).sort((a, b) => new Date(b) - new Date(a));
    if (days.length === 0) {
        list.innerHTML = "<p>Нет данных</p>";
        return;
    }
    
    days.forEach(day => {
        if (workouts[day] && workouts[day].length > 0) {
            list.innerHTML += `<h4>${day}</h4>`;
            workouts[day].forEach(ex => {
                list.innerHTML += `
                    <div class="exercise-item">
                        <span>${ex.exercise} - ${ex.sets}x${ex.reps} (${ex.weight} кг)</span>
                    </div>`;
            });
        }
    });
    
    if (list.innerHTML === "") {
        list.innerHTML = "<p>Нет упражнений</p>";
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

showTab("days");
renderDays();