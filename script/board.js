let currentDraggedElement;
let assignedUser;
let taskPriority;
let subtaskHeadline;
let inProgress;
let finished;

/**
 * This function to initializes the active user on the board, the shown tasks for the user and the html for board 
 * 
 */
async function initBoard() {
    loadActivUser();
    await currentUserTaskLoad();
    updateBoardHTML();
}

/**
 * This eventlistener starts the rotation of a dragged card
 * 
 */
document.addEventListener('dragstart', function (e) {
    if (e.target.classList.contains('task')) {
        e.target.classList.add('rotating');
    }
});

/**
 * This eventlistener stops the rotation of a dragged card
 * 
 */
document.addEventListener('dragend', function (e) {
    if (e.target.classList.contains('task')) {
        e.target.classList.remove('rotating');
    }
});

/**
 * This function is used to clear all values of the tasks array
 * 
 */
async function clearArray() {
    tasks.splice(0, tasks.length);
    currentId = ""
    await currentUserTaskSave();
    await currentUserIdSave();
}

/**
 * This function filters the tasks array for title and description  
 * @returns new arrays for every element of the content who matches with the value of the searchInput 
 */
function searchTasks() {
    document.getElementById('contentposition').classList.add('d-none');
    const searchValue = document.getElementById('searchInput').value.toLowerCase();
    console.log("searching")
    return tasks.filter(task =>
        task.title.toLowerCase().includes(searchValue) ||
        task.description.toLowerCase().includes(searchValue)
    );
}

/**
 * This function displays the results of the search
 * 
 */
function renderSearchResults() {
    document.getElementById('searchLogo').classList.add('d-none');
    document.getElementById('searchClose').classList.remove('d-none')
    // x d-none weg lupe d-none hin x onclick = reset function to normal board view
    let results = searchTasks();
    console.log(results)
    let resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = '';

    results.forEach(task => {
        resultsContainer.innerHTML += generateTaskHTML(task)
    })
}

/**
 * This functions clears the searchinput and switchs the x symbol of it back to searchsymbol
 * 
 */
function clearInput() {
    document.getElementById('searchInput').value = '';
    document.getElementById('searchResults').innerHTML = '';
    document.getElementById('searchLogo').classList.remove('d-none');
    document.getElementById('searchClose').classList.add('d-none')
    document.getElementById('contentposition').classList.remove('d-none');
}

/** 
 * This eventlistener is fired when the textbox is focused
 *  
 */
document.getElementById('searchInput').addEventListener("focus", changeDivColor);

/**
 * This function changes the bordercolor of the searchbar
 * 
 */
function changeDivColor() {
    document.getElementById('fake-searchbar').style.borderColor = "#29ABE2";
}

/**
 * This eventlistener removes the focus of the searchbar
 * 
 */
document.getElementById('searchInput').addEventListener("blur", revertDivColor);

/**
 * This function changes the border color of the searchbar back to default
 * 
 */
function revertDivColor() {
    document.getElementById('fake-searchbar').style.borderColor = "#A8A8A8";
}

/**
 * It prevents the default behavior of the browser (which blocks dragging by default)
 * 
 * @param {DragEvent} ev - The drag event object
 */
function allowDrop(ev) {
    ev.preventDefault();
}

/**
 * This function sets the new status of the element when it's dropped and updates the BoardHtml
 * 
 * @param {string} status - The status of the selected element
 */
async function moveTo(status) {
    tasks[currentDraggedElement]['status'] = status;
    await currentUserTaskSave();
    updateBoardHTML();
    removeHighlight(status);
}

/**
 * This function highlights the area which the selected element is dragged at or over
 * 
 * @param {string} id - The id of the element to be highlighted
 */
function highlight(id) {
    document.getElementById(id).classList.add('drag-area-highlight');
}

/**
 * This function removes highlight from selected element
 * 
 * @param {string} id - The id of the element to be highlighted 
 */
function removeHighlight(id) {
    document.getElementById(id).classList.remove('drag-area-highlight');
}

function updateBoardHTML() {

    let todo = tasks.filter(t => t['status'] == 'toDo');
    document.getElementById('toDo').innerHTML = '';
    for (let index = 0; index < todo.length; index++) {
        const element = todo[index];
        document.getElementById('toDo').innerHTML += generateTaskHTML(element);
        // searchUsers(element);
    }

    let inProgress = tasks.filter(t => t['status'] == 'in-progress');
    document.getElementById('in-progress').innerHTML = '';
    for (let index = 0; index < inProgress.length; index++) {
        const element = inProgress[index];
        document.getElementById('in-progress').innerHTML += generateTaskHTML(element);
        // searchUsers(element);
    }

    let awaitingFeedback = tasks.filter(t => t['status'] == 'awaiting-feedback');
    document.getElementById('awaiting-feedback').innerHTML = '';
    for (let index = 0; index < awaitingFeedback.length; index++) {
        const element = awaitingFeedback[index];
        document.getElementById('awaiting-feedback').innerHTML += generateTaskHTML(element);
        // searchUsers(element);
    }

    let done = tasks.filter(t => t['status'] == 'done');
    document.getElementById('done').innerHTML = '';
    for (let index = 0; index < done.length; index++) {
        const element = done[index];
        document.getElementById('done').innerHTML += generateTaskHTML(element);
        // searchUsers(element);
    }
}

/**
 *This function updates the progress bar based on the finished subtasks 
 *  
 * @param {Object} - The task element 
 * @returns {string} The generated HTML string representing the progress bar
 */
function updateProgressbar(element) {
    let openSubasks = element['subtasksInProgress'].length
    let finishedSubasks = element['subtasksFinish'].length
    let allSubtasks = openSubasks + finishedSubasks
    let percent = finishedSubasks / allSubtasks;
    percent = Math.round(percent * 100);

    return /*html*/ `  
    <div class="task-progress">
        <div class="progress" role="progressbar" aria-label="Basic example" aria-valuenow="75" aria-valuemin="0" aria-valuemax="100" style="height: 8px; width: 50%; background-color: #F4F4F4">
            <div class="progress-bar" style="background-color: #4589FF; width:${percent}%">
            </div> 
        </div>
        <span class="fontSize12">${finishedSubasks}/${allSubtasks} Subtasks
        </span>
    </div> `
}

/**
 * This function generates a small task card based on the given element
 * 
 * @param {Object} - The task element 
 * @returns {string} - The generated HTML string representing the task
 */
function generateTaskHTML(element) {
    let i = element['id']
    let users = element['contactAbbreviation']
    let colors = element['contactColor']
    let assignedUser = '';

    for (let j = 0; j < users.length; j++) {
        let user = users[j];
        let color = colors[j]
        assignedUser += /*html*/ ` 
       <div class="profile-picture horicontal-and-vertical fontSize12" style="background-color:${color}">${user}</div>`;
    }

    return /*html*/ `<div draggable="true" ondragstart="startDragging(${element['id']})" onclick="openTask(${i})" class="task">
            <div class="task-top fontSize16">
                <div class="task-category" style="${element['categoryColor']}">${element['category']}</div>
                <span class="task-title fontSize16">${element['title']}</span>
                <div class="task-description show-scrollbar"> ${element['description']}</div>
            </div>
            ${updateProgressbar(element)}
            <div class="task-users-prio">
                <div class="task-users">
                   ${assignedUser}
                </div>
                <img src="${element['priority']}">
            </div>
        </div>
    `;
}

/**
 * This function sets the global variable 'currentDraggedElement' with the index of the task having the specified ID
 * 
 * @param {number} id - The id of the task to find
 */
function startDragging(id) {
    let index = tasks.findIndex(task => task.id === id);
    currentDraggedElement = index;
}

/**
 * This function finds the task by its ID and triggers rendering its detailed view
 * 
 * @param {number} i - The id of the task to open
 */
async function openTask(i) {
    let index = tasks.findIndex(task => task.id === i);
    renderTaskdetailHTML(index)
}

/**
 * This function renders the detail view of the task
 * 
 * @param {number} i - The id of the task to render
 */
function renderTaskdetailHTML(i) {
    findAssignedUnser(i);
    showSubtasksInProgress(i);
    showSubtasksFinished(i);
    renderPriorityText(i)
    createHTML(i)
}

/**
 * This function renders the subtask headline 
 * 
 * @returns - The generated HTML string representing the subtask headline
 */
function renderSubtaskHeadline() {
    return subtaskHeadline = /*html*/ `
    <div class="task-detail-font-color margin-bottom10">
     Subtasks
    </div>`
}

/**
 * This function shows the subtasks in progress, if available
 * 
 * @param {number} i - The id of the task
 */
function showSubtasksInProgress(i) {
    inProgress = '';
    let subtasksProgress = tasks[i]['subtasksInProgress'];

    subtaskHeadline = '';
    for (let k = 0; k < subtasksProgress.length; k++) {
        let subtaskProgress = subtasksProgress[k];
        renderSubtaskHeadline()
        inProgress += /*html*/ ` 
        <div class="task-detail-flex margin-bottom10">
            <img onclick="switchSubtaskStatusToFinished(${i}, ${k})" class="task-box" src="img/addTaskBox.svg" alt="">
            ${subtaskProgress}
        </div>
        `;
    }
    updateBoardHTML();
}

/**
 * This function shows the finished subtasks, if available
 * 
 * @param {number} i - The id of the task 
 */
function showSubtasksFinished(i) {
    finished = '';
    let subtasksDone = tasks[i]['subtasksFinish']
    for (let l = 0; l < subtasksDone.length; l++) {
        let subtaskDone = subtasksDone[l];
        renderSubtaskHeadline()
        finished += /*html*/ ` 
       <div class="task-detail-flex margin-bottom10 text-line-through">
           <img onclick="switchSubtaskStatusToUndone(${i},${l})" class="task-box" src="img/done.svg" alt="">
           ${subtaskDone}
       </div>`
    }
    updateBoardHTML();
}

/**
 * This function renders the priority
 * 
 * @param {number} i - The id of the task 
 */
function renderPriorityText(i) {
    let prioLow = "./img/prioLow.svg"
    let prioMedium = "./img/prioMedium.svg"
    let prioUrgent = "./img/prioUrgent.svg"
    taskPriority = "";
    if (prioLow === tasks[i]['priority']) {
        taskPriority = "Low"
    }
    if (prioMedium === tasks[i]['priority']) {
        taskPriority = "Medium"
    }
    if (prioUrgent === tasks[i]['priority']) {
        taskPriority = "Urgent"
    }
}

/**
 * This function renders the detailed task
 * 
 * @param {number} i - The id of the task
 */
function createHTML(i) {
    document.getElementById('popup-container').classList.remove('d-none');
    document.getElementById('popup-container').innerHTML = /*html*/ `
    <div class="task-detail">
            <div class="task-detail-content-container">
                <div class="task-detail-top">
                    <div class="task-detail-category" style="${tasks[i]['categoryColor']}"> ${tasks[i]['category']}</div>
                    <img onclick="closeTask()" src="img/crossAddTask.svg" alt="close" class="close-hover">
                </div>
                <div class="task-detail-content">
                    <div class="task-detail-title">
                        <h2>${tasks[i]['title']}</h2>
                    </div>
                    <div class="task-description show-scrollbar">
                        ${tasks[i]['description']}
                    </div>
                    <div class="task-detail-flex">
                        <div class="task-detail-font-color">Due date:</div>
                        <div> ${tasks[i]['dueDate']}</div>
                    </div>
                    <div class="task-detail-flex">
                        <div class="task-detail-font-color">Priority:</div>
                        <div class="priority-container">
                            <div>${taskPriority}</div>
                            <img src="${tasks[i]['priority']}">
                        </div>
                    </div>
                    <div>
                        <div class="margin-bottom10 task-detail-font-color">Assigned To:</div>
                        <div class="task-detail-users">                            
                        ${assignedUser}
                        </div>
                    </div>
                    <div class="task-detail-subtasks">                        
                        ${subtaskHeadline}
                        ${inProgress}
                        ${finished}
                    </div>
                </div>
            </div>
            <div class="task-detail-bottom">
                <div onclick="deleteTask(${i})" class="delete-edit-buttons">
                    <img  src="img/subTaskDelete.svg" alt="">Delete
                </div>
                <img src="img/vector_detail_card.svg" alt="">
                <div onclick="editTaskNew(${i})" class="delete-edit-buttons">
                    <img  src="img/PenAddTask 1=edit.svg" alt="">Edit
                </div>
            </div>
        </div>
    `;
}

/**
 * This function shows the assigned user on the detailed task
 * 
 * @param {number} i - The id of the task
 * @returns - The generated HTML string representing the assigned User
 */
function findAssignedUnser(i) {
    let userNames = tasks[i]['contactName'];
    let users = tasks[i]['contactAbbreviation'];
    let colors = tasks[i]['contactColor'];
    assignedUser = '';
    for (let j = 0; j < users.length; j++) {
        let user = users[j];
        let userName = userNames[j]
        let color = colors[j]
        return assignedUser += /*html*/ ` 
        <div class="user-details">
            <div class="profile-picture horicontal-and-vertical" style="background-color:${color}">
                ${user}
            </div>
            <div class="user-name">
                ${userName}
            </div>   
        </div>
        `;
    }
}

/**
 * This function switches the status ob a subtask to finished
 * @param {number} i - The id of the task
 * @param {number} k - The id of the undone subtask
 */
async function switchSubtaskStatusToFinished(i, k) {
    let splicedSubtask = tasks[i]['subtasksInProgress'].splice(k, 1)
    tasks[i]['subtasksFinish'].push(splicedSubtask)
    await currentUserTaskSave();
    renderTaskdetailHTML(i);
}

/**
 * This function switches the status ob a subtask to undone
 * @param {number} i - The id of the task 
 * @param {number} k - The id of the done subtask
 */
async function switchSubtaskStatusToUndone(i, l) {
    let splicedSubtask = tasks[i]['subtasksFinish'].splice(l, 1)
    tasks[i]['subtasksInProgress'].push(splicedSubtask)
    await currentUserTaskSave();
    renderTaskdetailHTML(i);
}

/**
 * This function closes the detail view of a task
 * 
 */
function closeTask() {
    document.getElementById('popup-container').classList.add('d-none');
}

/**
 * This function deletes a task
 * 
 * @param {number} i - The id of the task
 */
async function deleteTask(i) {
    tasks.splice(i, 1);
    await currentUserTaskSave();
    closeTask();
    updateBoardHTML();
}