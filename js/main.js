//===============================================
// Time model setup
//===============================================

var Time = function (min, sec) {

  var TimeObject = function (min, sec) {
    this.min = min || 0;
    this.sec = sec || 0;
  }

  TimeObject.prototype.toString = function () {
    var m = this.min < 10 ? "0" + this.min : this.min;
    var s = this.sec < 10 ? "0" + this.sec : this.sec;
    return m + " : " + s;
  };
  TimeObject.prototype.getMinuteString = function () {
    return this.min < 10 ? "0" + this.min : this.min;;
  };
  TimeObject.prototype.getSecondString = function () {
    return this.sec < 10 ? "0" + this.sec : this.sec;
  };

  return new TimeObject(min, sec);
};

//===============================================
// Tasks model setup
//===============================================

var Task = function (id, title, pomodori) {

  var TaskObject = function (id, title, pomodori) {
    return new TaskObject.init(id, title, pomodori)
  }

  TaskObject.init = function (id, title, pomodori) {
    this.id = id || 0;
    this.title = title || '';
    this.pomodori = pomodori || 0;
    this.completed = false;
  }

  TaskObject.prototype = {
    toggleCompleted: function () {
      this.completed = !this.completed;
    },

    addPomodoro: function () {
      this.pomodori++;
    },

    removePomodoro: function () {
      if (this.pomodori > 0)
        this.pomodori--;
    },

    getHTMLTemplate: function (completedClass = "completed") {

      var classToInsert = this.completed ? completedClass : "";

      return '' +
        '<li class="task ' + classToInsert + '" id="task-' + this.id + '">' +
        '<div class="task-pomodori ' + classToInsert + '">' + this.pomodori + '</div>' +
        '<div class="task-title ' + classToInsert + '">' +
        this.title +
        '</div>' +
        '<div class="task-buttons">' +
        '<button id="task-add-' + this.id + '" class="task-add-btn">+</button>' +
        '<button id="task-add-' + this.id + '" class="task-dec-btn">-</button>' +
        '<button id="task-add-' + this.id + '" class="task-remove-btn">x</button>' +
        '</div>' +
        '</li>';
    },

    getModalHTMLTemplate: function () {
      return '' +
        '<li class="modal-task" id="modal-task-' + this.id + '">' +
        '<div class="task-pomodori">' + this.pomodori + '</div>' +
        '<div class="task-title">' + this.title + '</div>' +
        '</li>';
    }
  };

  TaskObject.init.prototype = TaskObject.prototype;

  return new TaskObject(id, title, pomodori);
};


//=================================================
//  Task actions 
//=================================================

function addTask(title, pomodori) {
  if (!title) return;
  var newTask = Task(tasks.length + 1, title, pomodori || 0);
  tasks.unshift(newTask);
  refreshTasksList();
}

function refreshTasksList() {

  if (tasks.length === 0) {
    tasksElement.innerHTML = '' +
      '<div class="empty text-center">' +
      'You have no tasks'
    '</div>';
    return;
  }

  tasksElement.innerHTML = "";
  tasks.forEach(function (t) {
    tasksElement.innerHTML += t.getHTMLTemplate();
  });

  // toggle completed
  document.querySelectorAll(".task")
    .forEach(function (t) {
      var title = t.querySelector(".task-title");
      title.addEventListener("click", function (e) {
        t.classList.toggle("completed");
        t.querySelector(".task-pomodori").classList.toggle("completed");
        title.classList.toggle("completed");
        tasks.find(function (tk) {
          return tk.title == title.innerText
        }).toggleCompleted();
      });
    });
  // add pomodoro to task
  document.querySelectorAll(".task-add-btn")
    .forEach(function (b) {
      b.addEventListener("click", function (e) {
        if (pendingPomodori <= 0) {
          showSnackbar("No pending pomodori to assign", "#d00");
          return;
        };
        // add pomodori to this task
        tasks.find(function (t) {
          return t.id == e.target.id.split('-')[2];
        }).addPomodoro();
        removePendingPomodoro();
        refreshTasksList();
      })
    });
  document.querySelectorAll(`.task-dec-btn`)
    .forEach(function (b) {
      b.addEventListener("click", function (e) {
        var task = tasks.find(function (t) {
          return t.id == e.target.id.split('-')[2];
        });
        if (task.pomodori <= 0) return;
        task.removePomodoro();
        refreshTasksList();
        addPendingPomodoro();
      })
    });
  document.querySelectorAll(`.task-remove-btn`)
    .forEach(function (b) {
      b.addEventListener("click", function (e) {
        var task = tasks.find(function (t) {
          return t.id == e.target.id.split('-')[2];
        });
        tasks.splice(tasks.indexOf(task), 1);
        refreshTasksList();
        if (task.pomodori) addPendingPomodoro(task.pomodori);
      })
    });
}

// tasks input and button
document.getElementById("text-input").addEventListener("keydown", function(e) {
  if (e.keyCode != 13) return;

  if (e.target.value.indexOf("---hP:") != -1) {
    hackPomodori(e.target.value.split(":")[1]);
    e.target.value = "";
    return;
  }
  if (e.target.value.indexOf("---hT:") != -1) {
    var v = e.target.value.split(":")[1].split(".");
    hackTime(v[0], v[1]);
    e.target.value = "";
    return;
  }

  addTask(validateTitle(e.target.value));
  e.target.value = "";
});

function validateTitle(title) {
  title = title
    .split(' ')
    .map(function (w) {
      return w.length > 80 ? w.substring(0, 79) + "..." : w;
    })
    .join(' ');

  return title.length > 330 ? title.substring(0, 300) + "..." : title;
}

//===============================================
// Setup event bindings for modal
//===============================================

function openModal() {
  modal.style.display = "block";

  modalTasksElement.innerHTML = "";
  tasks.forEach(function(t) {
    modalTasksElement.innerHTML += t.completed ? "" : t.getModalHTMLTemplate()
  });
  modal.querySelectorAll("li[id^=modal-task]").forEach(function (b) {
    b.addEventListener("click", function (e) {
      var task = tasks.find(function (t) {
        return t.title === e.target.innerText;
      });
      if (pendingPomodori > 0) task.addPomodoro();
      modal.style.display = "none";
      removePendingPomodoro();
      refreshTasksList();
    })
  });
}

document.getElementsByClassName("close")[0]
  .addEventListener("click", function () {
    modal.style.display = "none";
  });

window.onclick = function (event) {
  if (event.target == modal) modal.style.display = "none";
}

//===============================================
// Setup event bindings for session handling
//===============================================

document.getElementById("pomodoro-button").addEventListener("click", function() {
  setTime(25, 0);
  currentSession = 25;
  startTimer();
});
document.getElementById("short-break-button").addEventListener("click", function() {
  setTime(5, 0);
  currentSession = 5;
  startTimer();
});
document.getElementById("long-break-button").addEventListener("click", function() {
  setTime(10, 0);
  currentSession = 10;
  startTimer();
});

document.getElementById("reset-pomodori").addEventListener("click", function() {
  tasks.forEach(function(t) {
    t.pomodori = 0;
  });
  resetAllPomodori();
  refreshTasksList();
});


//=======================================================
// Time and timer stuff
//=======================================================

// timer handler
function secondPassed() {
  // if minute is over
  if (time.sec === 0) {
    // if minutes finished
    if (time.min === 0) {
      playAudio();
      clearInterval(timer);
      if (currentSession == 25) {
        addPomodoro();
        if (tasks.length > 0)
          openModal();
      }
      currentSession = 0;
      return;
    }
    time.min--;
    time.sec = 59;
  }
  else
    time.sec--;

  updateTimeText();
  document.title = time.toString() + " - Pomodori Story";
}

function updateTimeText() {
  timeMinElement.textContent = time.getMinuteString();
  timeSecElement.textContent = time.getSecondString();
}

function setTime(min, sec) {
  time.min = min;
  time.sec = sec;
  updateTimeText();
}

//===============================================
// Setup event bindings for timer 
//===============================================

document.getElementById("time-container")
  .addEventListener("click", handleTimerToggle);
document.getElementById("start-button")
  .addEventListener("click", handleTimerToggle);

function handleTimerToggle() {
  if (isPlaying) pauseTimer();
  else startTimer();

  updateButtonIcon();
}

function pauseTimer() {
  isPlaying = false;
  clearInterval(timer);
  animateTimer();
}

function startTimer() {
  clearInterval(timer);
  timer = setInterval(secondPassed, 1000);
  isPlaying = true;

  animateTimer();
}

document.getElementById("reset-button").addEventListener("click", function() {
  pauseTimer();
  setTime(currentSession, 0);
});

function updateButtonIcon() {
  document.querySelector("#start-button img").setAttribute("src",
    isPlaying ? "assets/pause.png" : "assets/play.png");
}

function animateTimer() {
  const container = document.getElementById("time-container");
  if (isPlaying) container.classList.remove("blink");
  else container.classList.add("blink")
}

//=========================================
// pomodoro counter stuff
//=========================================

function addPomodoro() {
  totalPomodori++;
  updateTotalPomodoriText();
  addPendingPomodoro();
}

function addPendingPomodoro(amount) {
  pendingPomodori += amount || 1;
  updatePendingPomodoriText();
}

function removePendingPomodoro(amount) {
  if (pendingPomodori <= 0)
    console.log("Error trying to remove pomodoro when the pending is already 0");

  pendingPomodori -= amount || 1;
  updatePendingPomodoriText();
}

function resetAllPomodori() {
  totalPomodori = 0;
  pendingPomodori = 0;
  updatePendingPomodoriText();
}

function updatePendingPomodoriText() {
  document.getElementById("pending-pomodori").innerText = pendingPomodori;
}

function updateTotalPomodoriText() {
  document.getElementById("total-pomodori").innerText = totalPomodori;
}

//hax
function hackPomodori(n) {
  pendingPomodori = n;
  totalPomodori = n;
  updatePendingPomodoriText();
  updateTotalPomodoriText();
}
function hackTime(m, s) {
  setTime(m, s);
}

//====================================================
// Audio stuff
//====================================================
function playAudio() {
  var audio = document.querySelector("audio");
  if (!audio) return;

  // rewind to enable quick playing
  audio.currentTime = 0;
  audio.play();
}

//====================================================
// Storage stuff
//====================================================

document.getElementById("save-tasks").addEventListener("click", function () {
  if (!isStorageAvailable()) {
    showSnackbar("Sorry, cant save template. No Web Storage support.");
    return;
  }
  if (!tasks.length) {
    showSnackbar("Create some tasks first.");
    return;
  }

  localStorage.template = tasks.map(function(t) { return t.title; });
  showSnackbar("Saved template");
});

document.getElementById("load-tasks").addEventListener("click", function () {
  if (!isStorageAvailable()) {
    showSnackbar("Sorry, cant load template. No Web Storage support.", "#d00");
    return;
  }

  var list = localStorage.template;

  if (!list) {
    showSnackbar("No template to load", "#d00");
    return;
  }

  list.split(',')
    .forEach(function(t) {
      addTask(title, 0);
    });

  showSnackbar("Loaded template");
});

document.getElementById("clear-tasks").addEventListener("click", function () {
  if (!isStorageAvailable()) {
    showSnackbar("Sorry. No Web Storage support.", "#d00");
    return;
  }

  if (!localStorage.template) {
    showSnackbar("There is no saved template.", "#d00");
    return;
  }

  localStorage.removeItem("template");
  showSnackbar("Cleared stored template.");
});

function isStorageAvailable() {
  return typeof (Storage) !== "undefined";
}

//====================================================
// snackbar
//====================================================

function showSnackbar(text, color = "#ff00d0", msTime = 3000) {
  var snackbar = document.getElementById("snackbar");
  snackbar.innerText = text;
  snackbar.style.backgroundColor = color;
  snackbar.classList.add("show")
  setTimeout(function () { snackbar.classList.remove("show"); }, msTime);
}


//=============================================
// Starting Point
//=============================================

// Get references to DOM objects
const tasksElement = document.getElementById("tasks");
const modal = document.getElementById('myModal');
const modalTasksElement = document.getElementById("modal-tasks");
const timeMinElement = document.getElementById("time-min");
const timeSecElement = document.getElementById("time-sec");

// Main control variables
var time = new Time(25, 0);
var timer;
var tasks = [];
var totalPomodori = 0;
var pendingPomodori = 0;
var currentSession = 25;
var isPlaying = false;

// set initial time
setTime(time.min, time.sec);
