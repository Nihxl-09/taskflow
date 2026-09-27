const TASKS_KEY = "taskflow_tasks";
const PROJECTS_KEY = "taskflow_projects";

let projects = JSON.parse(localStorage.getItem(PROJECTS_KEY)) || [];

// Make sure Personal project exists
let personalProject = projects.find(
    project => project.name.toLowerCase() === "personal"
);

if (!personalProject) {
    personalProject = {
        id: "personal",
        name: "Personal",
        description: "General tasks and personal goals."
    };

    projects.unshift(personalProject);

    localStorage.setItem(
        PROJECTS_KEY,
        JSON.stringify(projects)
    );
}

let tasks = JSON.parse(localStorage.getItem(TASKS_KEY)) || [];

// Connect old tasks without a project to the actual Personal project
tasks = tasks.map(task => ({
    ...task,
    projectId: projects.some(project => project.id === task.projectId)
        ? task.projectId
        : personalProject.id
}));

localStorage.setItem(
    TASKS_KEY,
    JSON.stringify(tasks)
);

let selectedTaskId = null;


/* =========================
   HELPERS
========================= */

function generateId() {
    return Date.now().toString() + Math.random().toString(36).substring(2, 8);
}

function saveTasks() {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

function saveProjects() {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

function escapeHTML(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function getProject(projectId) {
    return projects.find(project => project.id === projectId);
}

function formatDate(date) {
    if (!date) return "No due date";

    const value = new Date(date + "T00:00:00");

    return value.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}

function statusLabel(status) {
    if (status === "progress") return "In progress";
    if (status === "completed") return "Completed";
    return "To do";
}

function priorityLabel(priority) {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
}


/* =========================
   NAVIGATION
========================= */

const navItems = document.querySelectorAll(".nav-item");

navItems.forEach(button => {
    button.addEventListener("click", () => {

        navItems.forEach(item => item.classList.remove("active"));
        button.classList.add("active");

        const section = button.dataset.section;

        document.querySelectorAll(".page-section")
            .forEach(sectionElement => {
                sectionElement.classList.remove("active");
            });

        document
            .getElementById(`${section}Section`)
            .classList.add("active");

        const titles = {
            overview: [
                "Overview",
                "Manage your work and stay organized."
            ],
            projects: [
                "Projects",
                "Organize your work by project."
            ],
            tasks: [
                "My Tasks",
                "View and manage everything you're working on."
            ]
        };

        document.getElementById("pageTitle").textContent = titles[section][0];
        document.getElementById("pageSubtitle").textContent = titles[section][1];

        if (section === "projects") {
            renderProjects();
        }

        if (section === "tasks") {
            renderTasks();
        }
    });
});


/* =========================
   MODALS
========================= */

function openModal(id) {
    document.getElementById(id).classList.add("open");
}

function closeModal(id) {
    document.getElementById(id).classList.remove("open");
}

document.querySelectorAll("[data-close]").forEach(button => {
    button.addEventListener("click", () => {
        closeModal(button.dataset.close);
    });
});

document.querySelectorAll(".modal").forEach(modal => {

    modal.addEventListener("click", event => {

        if (event.target === modal) {
            modal.classList.remove("open");
        }

    });

});


/* =========================
   NEW TASK
========================= */

document.getElementById("newTaskBtn").addEventListener("click", () => {
    populateProjectSelect();
    openModal("taskModal");
});

document.getElementById("welcomeTaskBtn").addEventListener("click", () => {
    populateProjectSelect();
    openModal("taskModal");
});


function populateProjectSelect() {

    const select = document.getElementById("taskProject");

    select.innerHTML = projects.map(project => `
        <option value="${project.id}">
            ${escapeHTML(project.name)}
        </option>
    `).join("");
}


/* =========================
   CREATE TASK
========================= */

document.getElementById("taskForm").addEventListener("submit", event => {

    event.preventDefault();

    const task = {
        id: generateId(),

        title: document
            .getElementById("taskTitle")
            .value
            .trim(),

        description: document
            .getElementById("taskDescription")
            .value
            .trim(),

        projectId: document
            .getElementById("taskProject")
            .value,

        priority: document
            .getElementById("taskPriority")
            .value,

        dueDate: document
            .getElementById("taskDueDate")
            .value,

        status: "todo",

        createdAt: new Date().toISOString()
    };

    tasks.unshift(task);

    saveTasks();

    event.target.reset();

    closeModal("taskModal");

    renderEverything();

    showToast("Task created successfully");
});


/* =========================
   RENDER EVERYTHING
========================= */

function renderEverything() {

    renderStats();
    renderRecentTasks();
    renderTasks();
    renderProjects();
    populateProjectFilter();
    renderProgress();

}


/* =========================
   STATS
========================= */

function renderStats() {

    const total = tasks.length;

    const progress = tasks.filter(
        task => task.status === "progress"
    ).length;

    const completed = tasks.filter(
        task => task.status === "completed"
    ).length;

    const high = tasks.filter(
        task => task.priority === "high"
    ).length;

    document.getElementById("totalTasks").textContent = total;
    document.getElementById("inProgressTasks").textContent = progress;
    document.getElementById("completedTasks").textContent = completed;
    document.getElementById("highPriorityTasks").textContent = high;
}


/* =========================
   PROGRESS
========================= */

function renderProgress() {

    const total = tasks.length;

    const completed = tasks.filter(
        task => task.status === "completed"
    ).length;

    const percentage = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    document.getElementById("progressPercentage")
        .textContent = `${percentage}%`;

    document.getElementById("progressSummary")
        .textContent = `${completed} of ${total} tasks completed`;
}


/* =========================
   TASK CARD
========================= */

function createTaskHTML(task) {

    const project = getProject(task.projectId);

    return `
        <div class="task-item" data-task-id="${task.id}">

            <div class="task-main">

                <button
                    class="task-check ${task.status === "completed" ? "completed" : ""}"
                    data-action="status"
                    data-id="${task.id}"
                    title="Change status"
                >
                    ${task.status === "completed" ? "✓" : ""}
                </button>

                <div class="task-info">

                    <h4 class="${task.status === "completed" ? "task-done" : ""}">
                        ${escapeHTML(task.title)}
                    </h4>

                    <div class="task-meta">
                        <span>
                            ${escapeHTML(project ? project.name : "Personal")}
                        </span>

                        <span>•</span>

                        <span>
                            ${formatDate(task.dueDate)}
                        </span>
                    </div>

                </div>

            </div>

            <div class="task-actions">

                <span class="priority-badge ${task.priority}">
                    ${priorityLabel(task.priority)}
                </span>

                <span class="status-badge ${task.status}">
                    ${statusLabel(task.status)}
                </span>

                <button
                    class="more-btn"
                    data-action="details"
                    data-id="${task.id}"
                    title="Task details"
                >
                    →
                </button>

            </div>

        </div>
    `;
}


/* =========================
   RECENT TASKS
========================= */

function renderRecentTasks() {

    const container = document.getElementById("recentTasks");

    if (tasks.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                <strong>No tasks yet</strong>
                <p>Create your first task to get started.</p>
            </div>
        `;

        return;
    }

    container.innerHTML = tasks
        .slice(0, 5)
        .map(createTaskHTML)
        .join("");

    attachTaskEvents(container);
}


/* =========================
   ALL TASKS
========================= */

function renderTasks() {

    const container = document.getElementById("allTasks");

    const search = document
        .getElementById("searchInput")
        .value
        .toLowerCase()
        .trim();

    const projectFilter =
        document.getElementById("projectFilter").value;

    const status = document
        .getElementById("statusFilter")
        .value;

    const priority = document
        .getElementById("priorityFilter")
        .value;

    const filtered = tasks.filter(task => {

        const matchesSearch =
            task.title.toLowerCase().includes(search) ||
            task.description.toLowerCase().includes(search);

        const matchesProject =
            projectFilter === "all" ||
            task.projectId === projectFilter ||
            (
                projectFilter === "personal" &&
                !task.projectId
            );

        const matchesStatus =
            status === "all" ||
            task.status === status;

        const matchesPriority =
            priority === "all" ||
            task.priority === priority;

        return matchesSearch &&
         matchesProject &&
               matchesStatus &&
               matchesPriority;
    });

    if (filtered.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                <strong>No matching tasks</strong>
                <p>Try changing your search or filters.</p>
            </div>
        `;

        return;
    }

    container.innerHTML = filtered
        .map(createTaskHTML)
        .join("");

    attachTaskEvents(container);
}


/* =========================
   TASK EVENTS
========================= */

function attachTaskEvents(container) {

    container.querySelectorAll("[data-action]").forEach(button => {

        button.addEventListener("click", event => {

            event.stopPropagation();

            const id = button.dataset.id;
            const action = button.dataset.action;

            if (action === "status") {
                cycleTaskStatus(id);
            }

            if (action === "details") {
                openTaskDetails(id);
            }

        });

    });

    container.querySelectorAll(".task-item").forEach(item => {

        item.addEventListener("click", () => {

            openTaskDetails(item.dataset.taskId);

        });

    });

}


/* =========================
   CHANGE STATUS
========================= */

function cycleTaskStatus(id) {

    const task = tasks.find(task => task.id === id);

    if (!task) return;

    if (task.status === "todo") {
        task.status = "progress";
    } else if (task.status === "progress") {
        task.status = "completed";
    } else {
        task.status = "todo";
    }

    saveTasks();
    renderEverything();

    showToast("Task status updated");
}


/* =========================
   TASK DETAILS
========================= */

function openTaskDetails(id) {

    const task = tasks.find(task => task.id === id);

    if (!task) return;

    selectedTaskId = id;

    const project = getProject(task.projectId);

    document.getElementById("detailsTitle").textContent =
        task.title;

    document.getElementById("detailsDescription").textContent =
        task.description || "No description added.";

    document.getElementById("detailsProject").textContent =
        project ? project.name : "Personal";

    document.getElementById("detailsDueDate").textContent =
        formatDate(task.dueDate);

    const statusElement =
        document.getElementById("detailsStatus");

    statusElement.textContent =
        statusLabel(task.status);

    statusElement.className =
        `status-badge ${task.status}`;

    const priorityElement =
        document.getElementById("detailsPriority");

    priorityElement.textContent =
        priorityLabel(task.priority);

    priorityElement.className =
        `priority-badge ${task.priority}`;

    document.getElementById("editTaskTitle").value =
        task.title;

    document.getElementById("editTaskDescription").value =
        task.description || "";

    document.getElementById("editTaskStatus").value =
        task.status;

    document.getElementById("editTaskPriority").value =
        task.priority;

    document.getElementById("editTaskDueDate").value =
        task.dueDate || "";

    openModal("detailsModal");
}


/* =========================
   EDIT TASK
========================= */

document.getElementById("editTaskForm")
    .addEventListener("submit", event => {

        event.preventDefault();

        const task = tasks.find(
            task => task.id === selectedTaskId
        );

        if (!task) return;

        task.title =
            document.getElementById("editTaskTitle")
                .value
                .trim();

        task.description =
            document.getElementById("editTaskDescription")
                .value
                .trim();

        task.status =
            document.getElementById("editTaskStatus")
                .value;

        task.priority =
            document.getElementById("editTaskPriority")
                .value;

        task.dueDate =
            document.getElementById("editTaskDueDate")
                .value;

        saveTasks();

        closeModal("detailsModal");

        renderEverything();

        showToast("Task updated successfully");
    });


/* =========================
   DELETE TASK
========================= */

document.getElementById("deleteTaskBtn")
    .addEventListener("click", () => {

        if (!selectedTaskId) return;

        const task = tasks.find(
            task => task.id === selectedTaskId
        );

        if (!task) return;

        const confirmed =
            confirm(`Delete "${task.title}"?`);

        if (!confirmed) return;

        tasks = tasks.filter(
            task => task.id !== selectedTaskId
        );

        saveTasks();

        closeModal("detailsModal");

        renderEverything();

        showToast("Task deleted");
    });


/* =========================
   PROJECTS
========================= */

function renderProjects() {

    const container = document.getElementById("projectsGrid");

    if (projects.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                <strong>No projects yet</strong>
                <p>Create a project to organize your tasks.</p>
            </div>
        `;

        return;
    }

    container.innerHTML = projects.map(project => {

        const projectTasks = tasks.filter(task => {

            if (task.projectId === project.id) {
                return true;
            }

            if (
                project.name.toLowerCase() === "personal" &&
                !task.projectId
            ) {
                return true;
            }

            return false;
        });

        const completed = projectTasks.filter(
            task => task.status === "completed"
        ).length;

        const percentage = projectTasks.length === 0
            ? 0
            : Math.round(
                (completed / projectTasks.length) * 100
            );

        return `
            <div
                class="project-card project-clickable"
                data-project-id="${project.id}"
            >

                <div class="project-icon">
                    ${escapeHTML(project.name.charAt(0).toUpperCase())}
                </div>

                <div class="project-content">

                    <h3>
                        ${escapeHTML(project.name)}
                    </h3>

                    <p>
                        ${escapeHTML(
                            project.description ||
                            "No description added."
                        )}
                    </p>

                    <div class="project-progress">
                        <div class="project-progress-top">
                            <span>Progress</span>
                            <strong>${percentage}%</strong>
                        </div>

                        <div class="project-progress-bar">
                            <div
                                style="width: ${percentage}%"
                            ></div>
                        </div>
                    </div>

                    <div class="project-footer">

                        <span>
                            ${projectTasks.length}
                            ${projectTasks.length === 1 ? "task" : "tasks"}
                        </span>

                        <span>
                            ${completed} completed
                        </span>

                    </div>

                    <div class="project-open">
                        View tasks →
                    </div>

                </div>

            </div>
        `;

    }).join("");

    attachProjectEvents();
}


function populateProjectFilter() {

    const select = document.getElementById("projectFilter");

    if (!select) return;

    const currentValue = select.value;

    select.innerHTML = `
        <option value="all">All projects</option>

        ${projects.map(project => `
            <option value="${project.id}">
                ${escapeHTML(project.name)}
            </option>
        `).join("")}
    `;

    if (
        currentValue === "all" ||
        projects.some(project => project.id === currentValue)
    ) {
        select.value = currentValue;
    }
}


function attachProjectEvents() {

    document
        .querySelectorAll(".project-clickable")
        .forEach(card => {

            card.addEventListener("click", () => {

                const projectId =
                    card.dataset.projectId;

                openProjectTasks(projectId);

            });

        });
}


function openProjectTasks(projectId) {

    const project = projects.find(
        p => p.id === projectId
    );

    if (!project) return;

    const projectFilter =
        document.getElementById("projectFilter");

    if (projectFilter) {
        projectFilter.value = projectId;
    }

    const myTasksNav =
        [...document.querySelectorAll("[data-section]")]
            .find(element =>
                element.dataset.section === "tasks" ||
                element.dataset.section === "my-tasks" ||
                element.dataset.section === "myTasks"
            );

    if (myTasksNav) {
        myTasksNav.click();
    } else {
        document
            .querySelectorAll(".page-section")
            .forEach(section => {
                section.classList.remove("active");
            });

        const tasksSection =
            document.querySelector("#tasksSection");

        if (tasksSection) {
            tasksSection.classList.add("active");
        }
    }

    renderTasks();
}


/* =========================
   CREATE PROJECT
========================= */

document.getElementById("newProjectBtn")
    .addEventListener("click", () => {

        openModal("projectModal");

    });


document.getElementById("projectForm")
    .addEventListener("submit", event => {

        event.preventDefault();

        const project = {

            id: generateId(),

            name:
                document.getElementById("projectName")
                    .value
                    .trim(),

            description:
                document.getElementById("projectDescription")
                    .value
                    .trim(),

            createdAt:
                new Date().toISOString()
        };

        projects.push(project);

        saveProjects();

        event.target.reset();

        closeModal("projectModal");

        renderEverything();

        showToast("Project created successfully");
    });


/* =========================
   FILTERS
========================= */

document.getElementById("searchInput")
    .addEventListener("input", renderTasks);

document.getElementById("projectFilter")
    .addEventListener("change", renderTasks);

document.getElementById("statusFilter")
    .addEventListener("change", renderTasks);

document.getElementById("priorityFilter")
    .addEventListener("change", renderTasks);


/* =========================
   VIEW ALL TASKS
========================= */

document.getElementById("viewAllTasksBtn")
    .addEventListener("click", () => {

        document
            .querySelector('[data-section="tasks"]')
            .click();

    });


/* =========================
   TOAST
========================= */

let toastTimer;

function showToast(message) {

    const toast =
        document.getElementById("toast");

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {

        toast.classList.remove("show");

    }, 2500);
}


/* =========================
   KEYBOARD
========================= */

document.addEventListener("keydown", event => {

    if (event.key === "Escape") {

        document
            .querySelectorAll(".modal.open")
            .forEach(modal => {
                modal.classList.remove("open");
            });

    }

});


/* =========================
   INITIAL RENDER
========================= */

renderEverything();