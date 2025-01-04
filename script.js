// --- Cookie 工具函数 ---
function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

function getCookie(name) {
    const cookies = document.cookie.split('; ').find(cookie => cookie.startsWith(name + '='));
    return cookies ? decodeURIComponent(cookies.split('=')[1]) : null;
}

function deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

// --- 声音提醒 ---
const notificationSound = document.getElementById('notification-sound');
function playNotificationSound() {
    notificationSound.play();
}

// --- 时间轴部分 ---
const timelineBar = document.querySelector('.timeline-bar');
const currentTimeIndicator = document.querySelector('.current-time-indicator');
const timeLabels = document.querySelector('.time-labels');

function updateTimeline() {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const elapsedMilliseconds = now - startOfDay;
    const totalMillisecondsInDay = 24 * 60 * 60 * 1000;
    const position = (elapsedMilliseconds / totalMillisecondsInDay) * 100;
    currentTimeIndicator.style.left = `${position}%`;

    updateTimeLabels();
    renderTimeBlocks();
}

function updateTimeLabels() {
    timeLabels.innerHTML = '';
    for (let i = 0; i <= 24; i += 3) {
        const label = document.createElement('span');
        label.textContent = `${i < 10 ? '0' : ''}${i}:00`;
        const labelPosition = (i / 24) * 100;
        label.style.left = `calc(${labelPosition}% - ${label.offsetWidth / 2}px)`;
        timeLabels.appendChild(label);
    }
}

function calculateTimeBlockPercentages(startTimeStr, endTimeStr) {
    const [startHour, startMinute] = startTimeStr.split(':').map(Number);
    const [endHour, endMinute] = endTimeStr.split(':').map(Number);

    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;

    let startPercentage = (startTotalMinutes / (24 * 60)) * 100;
    let endPercentage = (endTotalMinutes / (24 * 60)) * 100;

    if (endTotalMinutes <= startTotalMinutes) {
        endPercentage += 100; // 处理跨午夜的情况
    }

    return [startPercentage, endPercentage];
}

function renderTimeBlocks() {
    timelineBar.querySelectorAll('.time-block').forEach(block => block.remove());

    // 渲染睡眠时间块
    const wakeUpTime = getCookie('wakeUpTime');
    const sleepTime = getCookie('sleepTime');
    if (wakeUpTime && sleepTime) {
        renderSleepTimeBlock(wakeUpTime, sleepTime);
    }

    // 渲染自定义时间段
    const customTimeBlocks = JSON.parse(getCookie('customTimeBlocks') || '[]');
    customTimeBlocks.forEach(blockData => {
        renderCustomTimeBlock(blockData);
    });
}

function renderSleepTimeBlock(wakeUpTime, sleepTime) {
    const sleepBlock = document.createElement('div');
    sleepBlock.classList.add('time-block', 'sleep-time');
    const [startPercentage, endPercentage] = calculateTimeBlockPercentages(wakeUpTime, sleepTime);
    if (startPercentage !== null && endPercentage !== null) {
        sleepBlock.style.left = `${startPercentage}%`;
        sleepBlock.style.width = `${endPercentage - startPercentage}%`;
        timelineBar.appendChild(sleepBlock);
    }
}

function renderCustomTimeBlock(blockData) {
    const block = document.createElement('div');
    block.classList.add('time-block');
    block.style.backgroundColor = blockData.color;
    const [startPercentage, endPercentage] = calculateTimeBlockPercentages(blockData.startTime, blockData.endTime);
    if (startPercentage !== null && endPercentage !== null) {
        block.style.left = `${startPercentage}%`;
        block.style.width = `${endPercentage - startPercentage}%`;
        block.draggable = true;
        block.dataset.id = blockData.id;
        timelineBar.appendChild(block);

        // 添加拖拽事件监听器
        block.addEventListener('dragstart', handleDragStart);
        block.addEventListener('dragend', handleDragEnd);
    }
}

// --- 拖拽调整时间段 ---
let draggedBlock = null;
let dragStartOffset = 0;

function handleDragStart(event) {
    draggedBlock = event.target;
    dragStartOffset = event.clientX - draggedBlock.offsetLeft;
}

function handleDragEnd(event) {
    draggedBlock = null;
}

timelineBar.addEventListener('dragover', (event) => {
    event.preventDefault();
});

timelineBar.addEventListener('drop', (event) => {
    event.preventDefault();
    if (draggedBlock) {
        const timelineWidth = timelineBar.offsetWidth;
        const newLeft = event.clientX - timelineBar.offsetLeft - dragStartOffset;
        const startPercentage = Math.max(0, Math.min(100, (newLeft / timelineWidth) * 100));

        const blockId = parseInt(draggedBlock.dataset.id);
        const customTimeBlocks = JSON.parse(getCookie('customTimeBlocks') || '[]');
        const blockData = customTimeBlocks.find(b => b.id === blockId);
        if (blockData) {
            const durationPercentage = parseFloat(draggedBlock.style.width);
            const endPercentage = startPercentage + durationPercentage;

            const startTimeMinutes = Math.floor((startPercentage / 100) * 24 * 60);
            const endTimeMinutes = Math.floor((endPercentage / 100) * 24 * 60);

            const newStartHour = String(Math.floor(startTimeMinutes / 60)).padStart(2, '0');
            const newStartMinute = String(startTimeMinutes % 60).padStart(2, '0');
            const newEndHour = String(Math.floor(endTimeMinutes / 60) % 24).padStart(2, '0');
            const newEndMinute = String(endTimeMinutes % 60).padStart(2, '0');

            blockData.startTime = `${newStartHour}:${newStartMinute}`;
            blockData.endTime = `${newEndHour}:${newEndMinute}`;
            setCookie('customTimeBlocks', JSON.stringify(customTimeBlocks), 30);
            renderTimeBlocks();
        }
        draggedBlock = null;
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // 初始化时间轴
    if (timelineBar) {
        updateTimeline();
        setInterval(updateTimeline, 60000);
    }
});
