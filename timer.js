document.addEventListener('DOMContentLoaded', () => {
    const startStopButton = document.getElementById('start-stop-button');
    const resetButton = document.getElementById('reset-button');
    const timerText = document.querySelector('.timer-text');
    const progressBar = document.querySelector('.progress');
    const overtimeProgress = document.querySelector('.overtime-progress');
    const progressBarContainer = document.querySelector('.progress-bar-container');
    const taskProgressDisplay = document.querySelector('.task-progress span');
    const selectedTimerSelect = document.getElementById('selected-timer');

    let timerInterval;
    let isRunning = false;
    let timeLeft = 0;
    let currentTimerConfig = null;

    // 加载专注模式配置
    function loadTimerConfigs() {
        const timerConfigs = JSON.parse(getCookie('timerConfigs') || '[]');
        selectedTimerSelect.innerHTML = '<option value="">-- 请选择 --</option>';
        timerConfigs.forEach(config => {
            const option = document.createElement('option');
            option.value = config.id;
            option.textContent = config.name;
            selectedTimerSelect.appendChild(option);
        });
    }

    // 加载任务列表
    function loadTasks() {
        const tasks = JSON.parse(getCookie('tasks') || '[]');
        const taskList = document.getElementById('task-list');
        const newTaskInput = document.getElementById('new-task');
        const addTaskButton = document.getElementById('add-task-button');

        if (taskList) {
            taskList.innerHTML = '';
            tasks.forEach(task => {
                const listItem = document.createElement('li');
                listItem.classList.add('task-item');
                listItem.innerHTML = `
                    <span>${task.name}</span>
                    <button onclick="deleteTask(${task.id})">删除</button>
                `;
                taskList.appendChild(listItem);
            });
        }

        if (addTaskButton) {
            addTaskButton.onclick = () => {
                const taskName = newTaskInput.value.trim();
                if (taskName) {
                    const newTask = { id: Date.now(), name: taskName };
                    tasks.push(newTask);
                    setCookie('tasks', JSON.stringify(tasks), 30);
                    loadTasks();
                    newTaskInput.value = '';
                }
            };
        }
    }

    window.deleteTask = function(taskId) {
        let tasks = JSON.parse(getCookie('tasks') || '[]');
        tasks = tasks.filter(task => task.id !== taskId);
        setCookie('tasks', JSON.stringify(tasks), 30);
        loadTasks();
    };

    function startTimer() {
        if (!currentTimerConfig) return;

        isRunning = true;
        startStopButton.textContent = '停止';
        const isPomodoro = currentTimerConfig.type === 'pomodoro';
        let focusTime = isPomodoro ? currentTimerConfig.focusDuration * 60 : currentTimerConfig.duration * 60;
        let breakTime = isPomodoro ? currentTimerConfig.breakDuration * 60 : 0;
        let isFocusing = true;
        timeLeft = focusTime;
        updateTimerDisplay();

        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            updateProgressBar(focusTime);

            if (timeLeft < 0) {
                clearInterval(timerInterval);
                playNotificationSound();
                isRunning = false;
                startStopButton.textContent = '开始';
            }
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
        isRunning = false;
        startStopButton.textContent = '开始';
    }

    function resetTimer() {
        stopTimer();
        timeLeft = currentTimerConfig ? (currentTimerConfig.type === 'pomodoro' ? currentTimerConfig.focusDuration * 60 : currentTimerConfig.duration * 60) : 0;
        updateTimerDisplay();
        updateProgressBar(currentTimerConfig ? (currentTimerConfig.type === 'pomodoro' ? currentTimerConfig.focusDuration * 60 : currentTimerConfig.duration * 60) : 1);
    }

    function updateTimerDisplay() {
        const minutes = Math.floor(Math.abs(timeLeft) / 60);
        const seconds = Math.abs(timeLeft) % 60;
        timerText.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    function updateProgressBar(totalTime) {
        const percentage = totalTime > 0 ? (1 - timeLeft / totalTime) * 100 : 0;
        progressBar.style.width = `${percentage}%`;
        overtimeProgress.style.width = timeLeft < 0 ? `${Math.abs(timeLeft) / totalTime * 100}%` : '0%';
    }

    startStopButton.addEventListener('click', () => {
        if (isRunning) {
            stopTimer();
        } else {
            startTimer();
        }
    });

    resetButton.addEventListener('click', resetTimer);

    selectedTimerSelect.addEventListener('change', () => {
        const selectedId = selectedTimerSelect.value;
        const timerConfigs = JSON.parse(getCookie('timerConfigs') || '[]');
        currentTimerConfig = timerConfigs.find(config => config.id === selectedId);
        resetTimer();
    });

    // 初始化
    loadTimerConfigs();
    loadTasks();
});
