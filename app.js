// ========== TOAST SYSTEM ==========
function toast(message, type = "info", duration = 4000) {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const icons = { success: "\u2705", error: "\u274C", warning: "\u26A0\uFE0F", info: "\u2139\uFE0F" };
  const titles = { success: "Listo", error: "Error", warning: "Atenci\u00F3n", info: "Info" };

  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.setAttribute("role", "alert");
  el.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <div class="toast-body">
      <div class="toast-title">${titles[type] || titles.info}</div>
      <div class="toast-msg">${escapeHtml(message)}</div>
    </div>
    <button class="toast-close" aria-label="Cerrar notificaci\u00F3n">&times;</button>
    <div class="toast-progress" style="width:100%;"></div>
  `;

  const close = () => {
    el.classList.add("removing");
    setTimeout(() => el.remove(), 250);
  };

  el.querySelector(".toast-close").addEventListener("click", close);
  el.addEventListener("click", close);

  container.appendChild(el);

  // Progress bar animation
  const progress = el.querySelector(".toast-progress");
  requestAnimationFrame(() => {
    progress.style.transitionDuration = duration + "ms";
    progress.style.width = "0%";
  });

  setTimeout(close, duration);
}

function toastConfirm(message, onConfirm) {
  const container = document.getElementById("toastContainer");
  if (!container) { if (confirm(message)) onConfirm(); return; }

  const el = document.createElement("div");
  el.className = "toast warning";
  el.setAttribute("role", "alertdialog");
  el.style.cursor = "default";
  el.innerHTML = `
    <span class="toast-icon">\u26A0\uFE0F</span>
    <div class="toast-body">
      <div class="toast-title">Confirmar</div>
      <div class="toast-msg">${escapeHtml(message)}</div>
      <div style="display:flex;gap:8px;margin-top:8px;">
        <button class="primary mini" data-act="yes" type="button" style="font-size:12px;padding:6px 14px;">S\u00ED</button>
        <button class="secondary mini" data-act="no" type="button" style="font-size:12px;padding:6px 14px;">No</button>
      </div>
    </div>
  `;

  const close = () => {
    el.classList.add("removing");
    setTimeout(() => el.remove(), 250);
  };

  el.querySelector('[data-act="yes"]').addEventListener("click", () => { close(); onConfirm(); });
  el.querySelector('[data-act="no"]').addEventListener("click", close);
  el.addEventListener("click", (e) => { if (e.target === el) return; }); // no auto-close on body click

  container.appendChild(el);
}

// ========== DARK MODE ==========
function initTheme() {
  const saved = localStorage.getItem("tares-theme");
  if (saved === "dark") {
    document.documentElement.classList.add("dark");
  }
  updateThemeIcon();
}

function toggleTheme() {
  document.documentElement.classList.toggle("dark");
  const isDark = document.documentElement.classList.contains("dark");
  localStorage.setItem("tares-theme", isDark ? "dark" : "light");
  updateThemeIcon();
}

function updateThemeIcon() {
  const btn = document.getElementById("btnTheme");
  if (!btn) return;
  const isDark = document.documentElement.classList.contains("dark");
  btn.innerHTML = isDark ? "&#9728;" : "&#9790;";
  btn.title = isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro";
}

// ========== SIDEBAR MOBILE ==========
function initSidebar() {
  const btn = document.getElementById("btnSidebarToggle");
  const overlay = document.getElementById("sidebarOverlay");
  const sidebar = document.querySelector(".sidebar");
  if (!btn || !sidebar) return;

  btn.addEventListener("click", () => {
    sidebar.classList.toggle("open");
    overlay.classList.toggle("show");
  });

  if (overlay) {
    overlay.addEventListener("click", () => {
      sidebar.classList.remove("open");
      overlay.classList.remove("show");
    });
  }
}

// ========== LOADING SKELETON ==========
function showSkeleton() {
  const skeleton = document.getElementById("loadingSkeleton");
  if (skeleton) skeleton.style.display = "";
}

function hideSkeleton() {
  const skeleton = document.getElementById("loadingSkeleton");
  if (skeleton) skeleton.style.display = "none";
}

// ========== CONSTANTES ==========
const STATUSES = ["Pendiente", "En Progreso", "Revisión", "Cerrada"];
const TZ_CL = "America/Santiago";
const PRIORITY_OPTIONS = ["Baja", "Media", "Alta", "Crítica"];
const FIELD_TYPES = [
  { value: "text", label: "Texto", icon: "📝" },
  { value: "number", label: "Número", icon: "🔢" },
  { value: "date", label: "Fecha", icon: "📅" },
  { value: "priority", label: "Prioridad", icon: "⚡" }
];

// ========== ESTADO GLOBAL ==========
let state = {
  workspaces: [],
  responsables: [],
  tasks: [],
  currentWorkspaceId: 0,
  currentView: "board",
  customFields: [],
  changelog: [],
  currentUser: null, // { email, role }
  isAdmin: false
};

// ========== VARIABLES DE UI ==========
let dialogMode = "create";
let editingId = null;
let createRequestId = null;
let savingTask = false;
let pendingFiles = [];
let editingWSName = null;
let wsToDelete = null;
let wsToDeleteId = null;
let fpDue = null;
let fieldDatePickers = {};

// ========== REFERENCIAS A ELEMENTOS DOM ==========
let dom = {};

function cacheDOM() {
  dom.searchEl = document.getElementById("search");
  dom.sortByEl = document.getElementById("sortBy");
  dom.viewTitle = document.getElementById("viewTitle");
  dom.boardEl = document.getElementById("boardEl");
  dom.tbody = document.getElementById("tbody");
  dom.statsEl = document.getElementById("stats");
  dom.wsList = document.getElementById("wsList");
  dom.sbCounts = document.getElementById("sbCounts");
  dom.wsBadge = document.getElementById("wsBadge");
  dom.btnViewBoard = document.getElementById("btnViewBoard");
  dom.btnViewTable = document.getElementById("btnViewTable");
  dom.btnViewAll = document.getElementById("btnViewAll");
  dom.viewBoard = document.getElementById("viewBoard");
  dom.viewTable = document.getElementById("viewTable");
  dom.viewAll = document.getElementById("viewAll");
  dom.overdueCount = document.getElementById("overdueCount");
  dom.overdueTbody = document.getElementById("overdueTbody");
  dom.overdueSummary = document.getElementById("overdueSummary");
  dom.overdueBackdrop = document.getElementById("overdueBackdrop");

  // Modal de tareas
  dom.modalBackdrop = document.getElementById("taskBackdrop");
  dom.dlgTitle = document.getElementById("dlgTitle");
  dom.dlgSub = document.getElementById("dlgSub");
  dom.f_name = document.getElementById("f_name");
  dom.f_desc = document.getElementById("f_desc");
  dom.f_resp = document.getElementById("f_resp");
  dom.f_status = document.getElementById("f_status");
  dom.f_wsSelect = document.getElementById("f_wsSelect");
  dom.f_dueDateDisplay = document.getElementById("f_dueDateDisplay");
  dom.f_dueDate = document.getElementById("f_dueDate");
  dom.btnDueOpen = document.getElementById("btnDueOpen");
  dom.f_closedAt = document.getElementById("f_closedAt");
  dom.f_meta = document.getElementById("f_meta");
  dom.f_files = document.getElementById("f_files");
  dom.f_notifyOnSave = document.getElementById("f_notifyOnSave");
  dom.btnDeleteTask = document.getElementById("btnDeleteTask");
  dom.btnCancelTask = document.getElementById("btnCancelTask"); // ADICIONADO
  dom.btnSaveTask = document.getElementById("btnSaveTask");
  dom.btnCloseTask = document.getElementById("btnCloseTask");
  dom.attachCount = document.getElementById("attachCount");
  dom.attachList = document.getElementById("attachList");
  dom.filePendingInfo = document.getElementById("filePendingInfo");
  dom.customFieldsContainer = document.getElementById("customFieldsContainer");
  dom.noCustomFieldsMsg = document.getElementById("noCustomFieldsMsg");
  dom.customFieldsCount = document.getElementById("customFieldsCount");

  // Modal responsables
  dom.respBackdrop = document.getElementById("respBackdrop");
  dom.r_name = document.getElementById("r_name");
  dom.r_email = document.getElementById("r_email");
  dom.btnAddResp = document.getElementById("btnAddResp");
  dom.btnClearResp = document.getElementById("btnClearResp");
  // dom.btnCloseResp removed
  dom.btnRespDone = document.getElementById("btnRespDone");
  dom.respTbody = document.getElementById("respTbody");

  // Modal admin workspaces
  dom.adminWSBackdrop = document.getElementById("adminWSBackdrop");
  dom.btnCloseAdminWS = document.getElementById("btnCloseAdminWS");
  dom.btnAdminWSDone = document.getElementById("btnAdminWSDone");
  dom.activeWSCount = document.getElementById("activeWSCount");
  dom.hiddenWSCount = document.getElementById("hiddenWSCount");
  dom.tasksInWSCount = document.getElementById("tasksInWSCount");
  dom.wsAdminCount = document.getElementById("wsAdminCount");

  dom.adminWSTbody = document.getElementById("adminWSTbody");
  dom.newWSName = document.getElementById("newWSName");
  dom.btnCreateNewWS = document.getElementById("btnCreateNewWS");
  dom.btnClearNewWS = document.getElementById("btnClearNewWS");

  // Modal confirmar eliminar espacio
  dom.confirmDeleteWSBackdrop = document.getElementById("confirmDeleteWSBackdrop");
  dom.wsToDeleteName = document.getElementById("wsToDeleteName");
  dom.wsToDeleteTaskCount = document.getElementById("wsToDeleteTaskCount");
  dom.deleteAllTaskCount = document.getElementById("deleteAllTaskCount");
  dom.moveToWSSelect = document.getElementById("moveToWSSelect");
  dom.moveTasksSection = document.getElementById("moveTasksSection");
  dom.btnCancelDeleteWS = document.getElementById("btnCancelDeleteWS");
  dom.btnConfirmDeleteWS = document.getElementById("btnConfirmDeleteWS");

  // Modal Configuración
  dom.configBackdrop = document.getElementById("configBackdrop");
  dom.btnConfig = document.getElementById("btnConfig");
  dom.btnCloseConfig = document.getElementById("btnCloseConfig");
  dom.btnConfigManageResp = document.getElementById("btnResponsables"); // Nota ID difiere si no se actualizó HTML
  dom.btnAdminWS = document.getElementById("btnAdminWS");
  dom.btnManageFields = document.getElementById("btnManageFields");

  // Modal Admin Campos Personalizados
  dom.manageFieldsBackdrop = document.getElementById("manageFieldsBackdrop");
  dom.btnCloseManageFields = document.getElementById("btnCloseManageFields");
  dom.btnManageFieldsDone = document.getElementById("btnManageFieldsDone");
  dom.newFieldName = document.getElementById("newFieldName");
  dom.newFieldType = document.getElementById("newFieldType");
  dom.btnAddCustomField = document.getElementById("btnAddCustomField");
  dom.btnClearNewField = document.getElementById("btnClearNewField");
  dom.fieldsCount = document.getElementById("fieldsCount");
  dom.emptyFieldsMessage = document.getElementById("emptyFieldsMessage");
  dom.fieldsConfigContainer = document.getElementById("fieldsConfigContainer");
  dom.adminWSTbody = document.getElementById("adminWSTbody");
  dom.newWSName = document.getElementById("newWSName");
  dom.btnCreateNewWS = document.getElementById("btnCreateNewWS");
  dom.btnClearNewWS = document.getElementById("btnClearNewWS");
  dom.btnCloseAdminWS = document.getElementById("btnCloseAdminWS");
  dom.btnAdminWSDone = document.getElementById("btnAdminWSDone");
  dom.moveToWSSelect = document.getElementById("moveToWSSelect");
  dom.moveTasksSection = document.getElementById("moveTasksSection");
  dom.btnConfirmDeleteWS = document.getElementById("btnConfirmDeleteWS");
  dom.btnCancelDeleteWS = document.getElementById("btnCancelDeleteWS");
  dom.wsAdminCount = document.getElementById("wsAdminCount");
  dom.activeWSCount = document.getElementById("activeWSCount");
  dom.hiddenWSCount = document.getElementById("hiddenWSCount");
  dom.tasksInWSCount = document.getElementById("tasksInWSCount");
  dom.wsToDeleteName = document.getElementById("wsToDeleteName");
  dom.wsToDeleteTaskCount = document.getElementById("wsToDeleteTaskCount");
  dom.deleteAllTaskCount = document.getElementById("deleteAllTaskCount");
  dom.confirmDeleteWSBackdrop = document.getElementById("confirmDeleteWSBackdrop");

  // Modal campos personalizados
  dom.manageFieldsBackdrop = document.getElementById("manageFieldsBackdrop");
  dom.newFieldName = document.getElementById("newFieldName");
  dom.newFieldType = document.getElementById("newFieldType");
  dom.btnAddCustomField = document.getElementById("btnAddCustomField");
  dom.btnClearNewField = document.getElementById("btnClearNewField");
  dom.btnCloseManageFields = document.getElementById("btnCloseManageFields");
  dom.btnManageFieldsDone = document.getElementById("btnManageFieldsDone");
  dom.fieldsConfigContainer = document.getElementById("fieldsConfigContainer");
  dom.emptyFieldsMessage = document.getElementById("emptyFieldsMessage");
  dom.fieldsCount = document.getElementById("fieldsCount");

  // Modal configuración
  dom.configBackdrop = document.getElementById("configBackdrop");
}

// ========== BOOTSTRAP ==========
async function bootstrap() {
  try {
    showSkeleton();

    // 1. Verificar Sesión (usando getUser para validar token en servidor)
    console.log("Bootstrap: Verifying session...");
    const sessionRes = await gs("authGetUser");
    console.log("Bootstrap: Session result:", sessionRes);

    if (!sessionRes.ok || !sessionRes.user) {
      console.log("Bootstrap: No valid session, redirecting to login.");
      window.location.href = "login.html";
      return;
    }
    const user = sessionRes.user;

    // 2. Obtener Rol
    console.log("Bootstrap: Getting user role for", user.email);
    const roleRes = await gs("getUserRole", user.email);
    console.log("Bootstrap: Role result:", roleRes);

    state.currentUser = {
      email: user.email,
      role: roleRes.role
    };
    state.isAdmin = (state.currentUser.role === 'admin');

    console.log("Logged in as:", state.currentUser);

    // 3. Ajustar UI según rol
    applyRoleUI();

    console.log("Bootstrap: Fetching initial data...");
    const res = await gs("getBootstrap");
    console.log("Bootstrap: Data result:", res);

    if (!res || !res.ok) {
      toast("Error cargando datos: " + (res?.error || "Error desconocido"), "error");
    } else {
      state.workspaces = res.workspaces;
      state.responsables = res.responsables;
      state.tasks = res.tareas;
      state.customFields = res.customFields || [];
    }
    if (state.workspaces.length > 0) {
      state.currentWorkspaceId = state.workspaces.find(w => w.activo !== false)?.id || state.workspaces[0].id;
    }

    // Configurar suscripciones en tiempo real
    setupRealtimeSubscriptions();

    // Renderizar interfaz inicial
    hideSkeleton();
    renderAll();
    renderSidebar();

    toast("Tablero cargado correctamente", "success", 2500);
  } catch (err) {
    console.error("Bootstrap error:", err);
    hideSkeleton();
    toast("Error durante inicializaci\u00F3n: " + err.message, "error", 8000);
  }
}

// ========== SUSCRIPCIONES EN TIEMPO REAL ==========
function setupRealtimeSubscriptions() {
  // Aquí puedes agregar suscripciones a cambios en Supabase si lo necesitas
  // Ej: supabase.channel('tareas').on('*', callback).subscribe();
}

// ========== UI WIRING ==========
function wireUI() {
  // Search con debounce
  const debouncedSearch = debounce(() => {
    renderAll();
  }, 300);

  dom.searchEl.addEventListener("input", debouncedSearch);
  dom.sortByEl.addEventListener("change", renderAll);

  // Vista
  dom.btnViewBoard.addEventListener("click", () => setView("board"));
  dom.btnViewTable.addEventListener("click", () => setView("table"));
  dom.btnViewAll.addEventListener("click", () => setView("all"));

  // Botones principales
  document.getElementById("btnNewTask").addEventListener("click", openCreate);
  document.getElementById("btnResponsables").addEventListener("click", openRespModal);
  document.getElementById("btnAdminWS").addEventListener("click", openWSAdmin);
  document.getElementById("btnConfig").addEventListener("click", openConfigModal);
  document.getElementById("btnManageFields").addEventListener("click", openManageFieldsModal);
  document.getElementById("btnOverdue").addEventListener("click", openOverdueModal);
  document.getElementById("btnExport").addEventListener("click", exportXLSX);

  // Modal tareas
  dom.btnCloseTask.addEventListener("click", closeTaskModal);
  if (dom.btnCancelTask) dom.btnCancelTask.addEventListener("click", closeTaskModal); // ADICIONADO
  // Backdrop click removed per user request
  // dom.modalBackdrop.addEventListener("click", (e) => {
  //   if (e.target === dom.modalBackdrop) closeTaskModal();
  // });

  dom.f_files.addEventListener("change", (e) => {
    pendingFiles = Array.from(e.target.files || []);
    renderPendingFilesInfo();
  });

  dom.btnDeleteTask.addEventListener("click", async () => {
    if (!editingId || !confirm("¿Eliminar esta tarea? No se puede deshacer.")) return;

    try {
      const res = await gs("deleteTarea", editingId);
      if (!res || !res.ok) {
        toast("No se pudo eliminar: " + (res?.error || "Error desconocido"), "error");
        return;
      }

      state.tasks = state.tasks.filter(t => t.id !== editingId);
      closeTaskModal();
      renderAll();
      renderSidebar();
      toast("Tarea eliminada correctamente", "success");
    } catch (err) {
      toast("Error eliminando: " + err.message, "error");
    }
  });

  dom.btnSaveTask.addEventListener("click", saveTaskFlow);

  // Responsables modal
  // dom.btnCloseResp removed
  dom.btnRespDone.addEventListener("click", closeRespModal);
  // Backdrop click removed
  // dom.respBackdrop.addEventListener("click", (e) => {
  //   if (e.target === dom.respBackdrop) closeRespModal();
  // });

  dom.btnClearResp.addEventListener("click", () => {
    dom.r_name.value = "";
    dom.r_email.value = "";
    dom.r_email.disabled = false;
    dom.r_name.focus();
  });

  dom.btnAddResp.addEventListener("click", saveResponsableFlow);

  // Overdue backdrop click
  // dom.overdueBackdrop.addEventListener("click", (e) => {
  //   if (e.target === dom.overdueBackdrop) closeOverdueModal();
  // });

  // Listeners para modal configuración (FALTABA)
  dom.btnCloseConfig.addEventListener("click", closeConfigModal);
  // dom.configBackdrop.addEventListener("click", (e) => {
  //   if (e.target === dom.configBackdrop) closeConfigModal();
  // });

  // Admin workspaces listeners
  // dom.btnCloseAdminWS removed
  dom.btnAdminWSDone.addEventListener("click", closeWSAdmin);
  // dom.adminWSBackdrop.addEventListener("click", (e) => {
  //   if (e.target === dom.adminWSBackdrop) closeWSAdmin();
  // });

  dom.btnCreateNewWS.addEventListener("click", createWSFromAdmin);
  dom.btnClearNewWS.addEventListener("click", () => {
    dom.newWSName.value = '';
    dom.newWSName.focus();
  });

  dom.newWSName.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') createWSFromAdmin();
  });

  // Listeners para modal de confirmación de eliminación
  dom.btnCancelDeleteWS.addEventListener("click", () => {
    dom.confirmDeleteWSBackdrop.classList.remove("show");
    wsToDelete = null;
    wsToDeleteId = null;
  });

  dom.confirmDeleteWSBackdrop.addEventListener("click", (e) => {
    // Solo cerrar si se hace click en el backdrop y NO es una acción peligrosa (pero usuario pidió no cerrar nunca con click afuera)
    // Así que lo deshabilitamos también
    // if (e.target === dom.confirmDeleteWSBackdrop) {
    //   dom.confirmDeleteWSBackdrop.classList.remove("show");
    //   wsToDelete = null;
    //   wsToDeleteId = null;
    // }
  });

  document.querySelectorAll('input[name="deleteOption"]').forEach(radio => {
    radio.addEventListener('change', updateDeleteOptionUI);
  });

  dom.btnConfirmDeleteWS.addEventListener("click", async () => {
    if (!wsToDeleteId) return;

    const selectedOption = document.querySelector('input[name="deleteOption"]:checked').value;

    switch (selectedOption) {
      case 'move':
        const targetWsId = Number(dom.moveToWSSelect.value);
        if (!targetWsId || isNaN(targetWsId)) {
          toast('Selecciona un espacio destino válido', "warning");
          return;
        }
        await moveTasksAndDeleteWS(wsToDeleteId, targetWsId);
        break;

      case 'hide':
        await toggleWSVisibility(wsToDeleteId, true);
        dom.confirmDeleteWSBackdrop.classList.remove("show");
        break;

      case 'deleteAll':
        if (confirm(`⚠️ ¿ESTÁS SEGURO?\n\nSe eliminarán PERMANENTEMENTE ${countTasksInWorkspace(wsToDeleteId)} tarea(s) y el espacio "${wsToDelete.nombre}".\n\nEsta acción NO SE PUEDE DESHACER.`)) {
          await deleteWorkspaceWithTasks(wsToDeleteId);
        }
        break;
    }

    wsToDelete = null;
    wsToDeleteId = null;
  });

  // Listeners para admin campos personalizados
  dom.btnCloseManageFields.addEventListener("click", closeManageFieldsModal);
  dom.btnManageFieldsDone.addEventListener("click", closeManageFieldsModal);
  // dom.manageFieldsBackdrop.addEventListener("click", (e) => {
  //   if (e.target === dom.manageFieldsBackdrop) closeManageFieldsModal();
  // });

  dom.btnAddCustomField.addEventListener("click", addCustomField);
  dom.btnClearNewField.addEventListener("click", () => {
    dom.newFieldName.value = '';
    dom.newFieldType.value = 'text';
    dom.newFieldName.focus();
  });

  dom.newFieldName.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addCustomField();
  });
}

// ========== ROLE UI ADJUSTMENTS ==========
function applyRoleUI() {
  const isAdmin = state.isAdmin;

  // Ocultar botones de administración si no es admin
  if (!isAdmin) {
    if (dom.btnAdminWS) dom.btnAdminWS.parentElement.style.display = "none"; // Ocultar todo el botón contenedor en config
    if (dom.btnManageFields) dom.btnManageFields.parentElement.style.display = "none";

    // En Sidebar, ocultar botón config si no quieres que entren a nada (opcional)
    // Pero como "Responsables" es útil verlos, lo dejamos, solo ocultamos las opciones dentro del modal config (arriba)
  }

  // Header: Agregar botón Logout
  const controls = document.querySelector('.controls');
  const btnLogout = document.createElement('button');
  btnLogout.className = 'secondary';
  btnLogout.textContent = 'Salir';
  btnLogout.onclick = async () => {
    await gs("authSignOut");
    window.location.href = "login.html";
  };
  controls.appendChild(btnLogout);
}

// ========== SAVE TASK FLOW ==========
async function saveTaskFlow() {
  const btn = dom.btnSaveTask;
  const prevTxt = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Guardando...";

  try {
    const nowIso = new Date().toISOString();
    const wsId = Number(dom.f_wsSelect.value) || state.currentWorkspaceId;
    if (!wsId) {
      toast("Debes seleccionar un espacio de trabajo.", "warning");
      return;
    }

    const email = (dom.f_resp.value || "").trim();
    const nombreResp = responsibleLabelByEmail(email);
    const dueStr = (dom.f_dueDate.value || "").trim();

    // Recolectar valores de campos personalizados
    const customFieldsValues = {};
    if (state.customFields && state.customFields.length > 0) {
      state.customFields.forEach(field => {
        const input = document.getElementById(`custom_field_${field.id}`);
        if (input) {
          let value = input.value;

          if (field.type === 'number') {
            value = value ? parseFloat(value) : null;
          } else if (field.type === 'date') {
            value = value || '';
          } else if (field.type === 'priority') {
            value = value || '';
          } else {
            value = value || '';
          }

          customFieldsValues[field.id] = value;
        }
      });
    }

    // Notificar ANTES del await
    if (dom.f_notifyOnSave && dom.f_notifyOnSave.checked) {
      const draftId = (dialogMode === "edit" && editingId != null) ? String(editingId) : "NUEVA";
      const createdForDraft = (dialogMode === "edit" && editingId != null)
        ? (state.tasks.find(x => x.id === editingId)?.creada || nowIso)
        : nowIso;

      notifyByEmailDraft({
        id: draftId,
        workspaceId: wsId,
        workspaceName: workspaceNameById(wsId) || "",
        nombre: dom.f_name.value.trim(),
        descripcion: dom.f_desc.value.trim(),
        responsableEmail: email,
        responsableNombre: nombreResp,
        estado: dom.f_status.value,
        creada: createdForDraft,
        modificada: nowIso,
        fechaTermino: dueStr,
        customFields: customFieldsValues
      });
    }

    if (dialogMode === "create") {
      if (!createRequestId) createRequestId = makeUUID();

      const task = {
        id: 0,
        workspaceId: wsId,
        nombre: dom.f_name.value.trim(),
        descripcion: dom.f_desc.value.trim(),
        responsableEmail: email,
        estado: dom.f_status.value,
        creada: nowIso,
        modificada: nowIso,
        fechaTermino: dueStr,
        fechaCierre: (dom.f_status.value === "Cerrada") ? nowIso : "",
        adjuntos: [],
        customFields: customFieldsValues,
        clientRequestId: createRequestId
      };

      const res = await gs("upsertTarea", task);
      if (!res || !res.ok) {
        toast("No se pudo guardar: " + (res?.error || "Error desconocido"), "error");
        return;
      }

      let saved = res.data;
      saved.adjuntos = Array.isArray(saved.adjuntos) ? saved.adjuntos : [];
      saved.customFields = saved.customFields || {};

      if (pendingFiles.length > 0) {
        const updatedAdj = await uploadPendingFiles(saved.id);
        saved.adjuntos = updatedAdj;
      }

      state.tasks = [saved, ...state.tasks.filter(t => t.id !== saved.id)];
      closeTaskModal();
      renderAll();
      renderSidebar();
      return;
    }

    if (dialogMode === "edit" && editingId != null) {
      const t = state.tasks.find(x => x.id === editingId);
      if (!t) return;

      const newStatus = dom.f_status.value;
      const prevStatus = t.estado;

      const task = {
        ...t,
        workspaceId: wsId,
        nombre: dom.f_name.value.trim(),
        descripcion: dom.f_desc.value.trim(),
        responsableEmail: email,
        estado: newStatus,
        modificada: nowIso,
        fechaTermino: dueStr,
        fechaCierre: t.fechaCierre || "",
        adjuntos: Array.isArray(t.adjuntos) ? t.adjuntos : [],
        customFields: customFieldsValues
      };

      if (newStatus === "Cerrada" && !task.fechaCierre) task.fechaCierre = nowIso;
      if (newStatus !== "Cerrada" && prevStatus === "Cerrada") task.fechaCierre = "";

      const res = await gs("upsertTarea", task);
      if (!res || !res.ok) {
        toast("No se pudo guardar: " + (res?.error || "Error desconocido"), "error");
        return;
      }

      let saved = res.data;
      saved.adjuntos = Array.isArray(saved.adjuntos) ? saved.adjuntos : (task.adjuntos || []);
      saved.customFields = saved.customFields || {};

      if (pendingFiles.length > 0) {
        const updatedAdj = await uploadPendingFiles(saved.id);
        saved.adjuntos = updatedAdj;
      }

      state.tasks = state.tasks.map(x => x.id === saved.id ? saved : x);
      closeTaskModal();
      renderAll();
      renderSidebar();
    }
  } catch (err) {
    toast("Error guardando: " + (err?.message || err), "error");
  } finally {
    savingTask = false;
    btn.disabled = false;
    btn.textContent = prevTxt;
  }
}

// ========== VISTAS ==========
function setView(which) {
  state.currentView = which;
  if (which === "board") {
    dom.viewBoard.classList.remove("hidden");
    dom.viewTable.classList.add("hidden");
    dom.viewAll.classList.add("hidden");
    dom.btnViewBoard.classList.add("active");
    dom.btnViewTable.classList.remove("active");
    dom.btnViewAll.classList.remove("active");
    dom.viewTitle.textContent = "Vista: Tablero";
  } else if (which === "table") {
    dom.viewTable.classList.remove("hidden");
    dom.viewBoard.classList.add("hidden");
    dom.viewAll.classList.add("hidden");
    dom.btnViewTable.classList.add("active");
    dom.btnViewBoard.classList.remove("active");
    dom.btnViewAll.classList.remove("active");
    dom.viewTitle.textContent = "Vista: Tabla";
  } else if (which === "all") {
    dom.viewAll.classList.remove("hidden");
    dom.viewBoard.classList.add("hidden");
    dom.viewTable.classList.add("hidden");
    dom.btnViewAll.classList.add("active");
    dom.btnViewBoard.classList.remove("active");
    dom.btnViewTable.classList.remove("active");
    dom.viewTitle.textContent = "Vista: Todas las tareas";
    renderAllTasks();
  }
}

// ========== SIDEBAR ==========
function renderSidebar() {
  dom.wsList.innerHTML = "";

  const activeCount = state.workspaces.filter(w => w.activo).length;
  const respActive = state.responsables.filter(r => r.activo !== false).length;
  const fieldsCount = state.customFields.length;
  const totalSysTasks = state.tasks.length;

  dom.sbCounts.textContent = `Espacios: ${activeCount} · Resp: ${respActive} · Campos: ${fieldsCount} · Total Tareas: ${totalSysTasks}`;

  for (const ws of state.workspaces.filter(w => w.activo)) {
    const div = document.createElement("div");
    div.className = "ws-item" + (ws.id === state.currentWorkspaceId ? " active" : "");
    div.innerHTML = `
      <div class="dot"></div>
      <div style="display:flex; flex-direction:column; gap:3px; flex: 1;">
        <div class="name">${escapeHtml(ws.nombre)}</div>
      </div>
    `;

    div.addEventListener("click", () => {
      state.currentWorkspaceId = ws.id;
      renderSidebar();
      renderAll();
    });

    div.addEventListener("dragover", (ev) => {
      ev.preventDefault();
      div.classList.add("drop-highlight");
    });
    div.addEventListener("dragleave", () => div.classList.remove("drop-highlight"));
    div.addEventListener("drop", async (ev) => {
      ev.preventDefault();
      div.classList.remove("drop-highlight");
      const id = ev.dataTransfer.getData("text/plain");
      if (!id) return;
      const taskId = parseInt(id, 10);
      if (isNaN(taskId)) {
        console.error("ID de tarea inválido:", id);
        return;
      }
      await moveTaskToWorkspace(taskId, ws.id);
    });

    dom.wsList.appendChild(div);
  }
}

// ========== RENDERIZADO ==========
function renderAll() {
  const filtered = getFilteredTasks();
  renderStats(filtered);
  renderWorkspaceBadge();
  renderOverdueBadge();
  // Solo renderizar la vista activa para mejor rendimiento
  if (state.currentView === "board") {
    renderBoard(filtered);
  } else if (state.currentView === "table") {
    renderTable(filtered);
  } else if (state.currentView === "all") {
    renderAllTasks();
  }
}

function renderWorkspaceBadge() {
  const ws = state.workspaces.find(w => w.id === state.currentWorkspaceId);
  dom.wsBadge.textContent = `Espacio: ${ws ? ws.nombre : "—"}`;
}

function getFilteredTasks() {
  const q = (dom.searchEl.value || "").trim().toLowerCase();
  let arr = state.tasks.filter(t => String(t.workspaceId) === String(state.currentWorkspaceId));

  if (q) {
    arr = arr.filter(t => {
      const basicSearch = `${t.id} ${t.nombre} ${t.descripcion} ${t.responsableNombre} ${t.responsableEmail} ${t.fechaTermino}`.toLowerCase();

      let customFieldsSearch = "";
      if (t.customFields && state.customFields) {
        state.customFields.forEach(field => {
          if (t.customFields[field.id] !== undefined) {
            customFieldsSearch += ` ${String(t.customFields[field.id]).toLowerCase()}`;
          }
        });
      }

      return (basicSearch + customFieldsSearch).includes(q);
    });
  }

  // FILTRO POR ROL: Si no es admin, solo ve sus tareas
  if (!state.isAdmin && state.currentUser) {
    arr = arr.filter(t =>
      (t.responsableEmail || "").toLowerCase() === (state.currentUser.email || "").toLowerCase()
    );
  }

  arr.sort((a, b) => compareTasks(a, b, dom.sortByEl.value));
  return arr;
}

function compareTasks(a, b, mode) {
  const dt = (x) => x ? new Date(x).getTime() : 0;
  const due = (x) => {
    const d = parseDueDate(x);
    return d ? d.getTime() : 0;
  };

  switch (mode) {
    case "id_asc": return String(a.id).localeCompare(String(b.id), undefined, { numeric: true });
    case "id_desc": return String(b.id).localeCompare(String(a.id), undefined, { numeric: true });
    case "created_asc": return dt(a.creada) - dt(b.creada);
    case "created_desc": return dt(b.creada) - dt(a.creada);
    case "updated_asc": return dt(a.modificada) - dt(b.modificada);
    case "updated_desc": return dt(b.modificada) - dt(a.modificada);
    case "due_asc": return due(a.fechaTermino) - due(b.fechaTermino);
    case "due_desc": return due(b.fechaTermino) - due(a.fechaTermino);
    case "status_asc": return String(a.estado).localeCompare(String(b.estado), "es");
    case "resp_asc": return String(responsibleDisplay(a)).localeCompare(String(responsibleDisplay(b)), "es");
    default: return b.id - a.id;
  }
}

function renderStats(tasks) {
  const total = tasks.length;
  const counts = STATUSES.map(s => tasks.filter(t => t.estado === s).length);
  dom.statsEl.textContent = `Total ${total} · Pend ${counts[0]} · Prog ${counts[1]} · Rev ${counts[2]} · Cerr ${counts[3]}`;
}

function renderBoard(tasks) {
  dom.boardEl.innerHTML = "";
  for (const status of STATUSES) {
    const col = document.createElement("div");
    col.className = "col";
    col.dataset.status = status;

    const hd = document.createElement("div");
    hd.className = "col-hd";
    hd.innerHTML = `<div class="name">${escapeHtml(status)} <span class="badge">${tasks.filter(t => t.estado === status).length}</span></div>`;
    col.appendChild(hd);

    const dz = document.createElement("div");
    dz.className = "dropzone";
    dz.dataset.status = status;

    dz.addEventListener("dragover", (ev) => {
      ev.preventDefault();
      dz.style.outline = "2px solid rgba(47,124,255,.35)";
      dz.style.borderRadius = "14px";
    });
    dz.addEventListener("dragleave", () => dz.style.outline = "none");
    dz.addEventListener("drop", async (ev) => {
      ev.preventDefault();
      dz.style.outline = "none";
      const id = ev.dataTransfer.getData("text/plain");
      if (!id) return;
      const taskId = parseInt(id, 10);
      if (isNaN(taskId)) {
        console.error("ID de tarea inválido:", id);
        return;
      }
      await moveTaskToStatus(taskId, status);
    });

    const colTasks = tasks.filter(t => t.estado === status);
    for (const t of colTasks) {
      dz.appendChild(renderCard(t));
    }
    col.appendChild(dz);
    dom.boardEl.appendChild(col);
  }
}

function workspaceNameById(id) {
  const w = state.workspaces.find(x => String(x.id) === String(id));
  return w ? w.nombre : "";
}

function getFirstLine(text) {
  if (!text) return "";
  const lines = text.split('\n');
  return lines[0] || "";
}

function formatDateOnly(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const parts = new Intl.DateTimeFormat("es-CL", {
    timeZone: TZ_CL,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(d).reduce((acc, p) => {
    acc[p.type] = p.value;
    return acc;
  }, {});
  return `${parts.day}-${parts.month}-${parts.year}`;
}

function renderCard(t) {
  const card = document.createElement("div");
  card.className = "card" + (isOverdue(t) ? " overdue" : "");
  card.draggable = true;

  card.addEventListener("dblclick", () => openEdit(t.id));

  card.addEventListener("dragstart", (ev) => {
    ev.dataTransfer.setData("text/plain", String(t.id));
    ev.dataTransfer.effectAllowed = "move";
    card.style.opacity = "0.6";
  });
  card.addEventListener("dragend", (ev) => {
    card.style.opacity = "1";
  });

  card.addEventListener("dragover", (ev) => {
    if (ev.dataTransfer && Array.from(ev.dataTransfer.types || []).includes("Files")) {
      ev.preventDefault();
      card.classList.add("drag-over");
    }
  });
  card.addEventListener("dragleave", () => card.classList.remove("drag-over"));

  card.addEventListener("drop", async (ev) => {
    if (!(ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files.length)) return;
    ev.preventDefault();
    ev.stopPropagation();
    card.classList.remove("drag-over");

    try {
      const payload = await filesToPayload(ev.dataTransfer.files);
      const res = await gs("uploadTaskAttachments", t.id, payload);
      if (!res || !res.ok) throw new Error("No se pudo subir adjuntos");

      const updated = Array.isArray(res.data) ? res.data : [];
      const taskRef = state.tasks.find(x => x.id === t.id);
      if (taskRef) taskRef.adjuntos = updated;

      openEdit(t.id);
      renderAll();
    } catch (err) {
      toast("Error subiendo adjuntos: " + (err?.message || err), "error");
    }
  });

  const duePill = getDuePill(t);
  const closedPill = t.fechaCierre ? `<span class="pill ok">Cierre: ${formatDateOnly(t.fechaCierre)}</span>` : "";

  const respName = responsibleDisplay(t);
  const respPill = respName ? `<span class="pill">Resp: ${escapeHtml(respName)}</span>` : "";

  const attCount = Array.isArray(t.adjuntos) ? t.adjuntos.length : 0;
  const attPill = attCount > 0 ? `<span class="pill">Adjuntos: ${attCount}</span>` : "";

  const customFieldsPills = renderCustomFieldsInCard(t);
  const primeraLineaDesc = getFirstLine(t.descripcion || "");

  card.innerHTML = `
    <div class="row1">
      <div>
        <strong>#${t.id} — ${escapeHtml(t.nombre)}</strong>
        <small>Creación: ${formatDateOnly(t.creada)}</small>
      </div>
      <span class="badge ${isOverdue(t) ? " danger" : ""}">${escapeHtml(t.estado)}</span>
    </div>

    ${primeraLineaDesc ? `<div class="desc">${escapeHtml(primeraLineaDesc)}</div>` : `<div class="desc" style="opacity:.6;">(Sin descripción)</div>`}

    <div class="meta">
      ${respPill}
      ${duePill}
      ${closedPill}
      ${attPill}
      ${customFieldsPills}
    </div>

    <div class="actions">
      ${t.estado !== "Cerrada"
      ? `<button class="secondary mini" data-act="close" type="button">Cerrar</button>`
      : `<button class="secondary mini" data-act="reopen" type="button">Reabrir</button>`}
      <button class="secondary mini" data-act="notify" type="button">Notificar</button>
    </div>
  `;

  card.dataset.id = String(t.id);
  card.dataset.status = t.estado;

  const closeBtn = card.querySelector('[data-act="close"]');
  if (closeBtn) {
    if (!state.isAdmin) {
      closeBtn.style.display = "none";
    } else {
      closeBtn.addEventListener("click", (e) => { e.stopPropagation(); quickClose(t.id); });
    }
  }

  const reopenBtn = card.querySelector('[data-act="reopen"]');
  if (reopenBtn) reopenBtn.addEventListener("click", (e) => { e.stopPropagation(); quickReopen(t.id); });

  const notifyBtn = card.querySelector('[data-act="notify"]');
  if (notifyBtn) notifyBtn.addEventListener("click", (e) => {
    e.preventDefault(); e.stopPropagation();
    notifyByEmail(t.id);
  });

  return card;
}

function renderTable(tasks) {
  dom.tbody.innerHTML = "";
  const wsName = workspaceNameById(state.currentWorkspaceId);

  for (const t of tasks) {
    const attCount = Array.isArray(t.adjuntos) ? t.adjuntos.length : 0;
    const customFieldsDisplay = renderCustomFieldsInTable(t);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>#${t.id}</strong></td>
      <td>${escapeHtml(wsName)}</td>
      <td>${escapeHtml(t.nombre)}<div class="muted">${escapeHtml(t.estado)}</div></td>
      <td>${t.descripcion ? escapeHtml(t.descripcion) : `<span class="muted">(Sin descripción)</span>`}</td>
      <td>${responsibleDisplay(t, true) ? escapeHtml(responsibleDisplay(t, true)) : `<span class="muted">—</span>`}</td>
      <td>${escapeHtml(t.estado)}</td>
      <td>${fmtDateTimeCL(t.creada)}</td>
      <td>${fmtDateTimeCL(t.modificada)}</td>
      <td>${t.fechaTermino ? escapeHtml(normalizeDueString(t.fechaTermino)) : `<span class="muted">—</span>`}</td>
      <td>${t.fechaCierre ? fmtDateTimeCL(t.fechaCierre) : `<span class="muted">—</span>`}</td>
      <td>${attCount ? `<strong>${attCount}</strong>` : `<span class="muted">0</span>`}</td>
      <td>${customFieldsDisplay || `<span class="muted">—</span>`}</td>
      <td>
        <div class="table-actions">
          ${t.estado !== "Cerrada"
        ? `<button class="secondary mini" data-act="close" type="button">Cerrar</button>`
        : `<button class="secondary mini" data-act="reopen" type="button">Reabrir</button>`}
          <button class="secondary mini" data-act="notify" type="button">Notificar</button>
        </div>
      </td>
    `;

    tr.addEventListener("dblclick", () => openEdit(t.id));

    const closeBtn = tr.querySelector('[data-act="close"]');
    if (closeBtn) closeBtn.addEventListener("click", () => quickClose(t.id));

    const reopenBtn = tr.querySelector('[data-act="reopen"]');
    if (reopenBtn) reopenBtn.addEventListener("click", () => quickReopen(t.id));

    const notifyBtn = tr.querySelector('[data-act="notify"]');
    if (notifyBtn) notifyBtn.addEventListener("click", (e) => {
      e.preventDefault(); e.stopPropagation();
      notifyByEmail(t.id);
    });

    dom.tbody.appendChild(tr);
  }
}

function renderAllTasks() {
  const allTasksGrid = document.getElementById("allTasksGrid");
  allTasksGrid.innerHTML = "";

  const allTasks = [...(state.tasks || [])].sort((a, b) => {
    const dateA = new Date(a.creada || 0).getTime();
    const dateB = new Date(b.creada || 0).getTime();
    return dateB - dateA;
  });

  if (allTasks.length === 0) {
    allTasksGrid.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--muted);">No hay tareas para mostrar</div>`;
    return;
  }

  for (const status of STATUSES) {
    const col = document.createElement("div");
    col.className = "all-tasks-col";
    col.dataset.status = status;

    const hd = document.createElement("div");
    hd.className = "all-col-hd";
    const statusTasks = allTasks.filter(t => t.estado === status);
    hd.innerHTML = `<div class="name">${escapeHtml(status)} <span class="badge">${statusTasks.length}</span></div>`;
    col.appendChild(hd);

    const tasksContainer = document.createElement("div");
    tasksContainer.className = "all-col-tasks";

    for (const task of statusTasks) {
      const wsName = workspaceNameById(task.workspaceId);
      const cardHtml = `
        <div class="all-task-card" data-id="${task.id}" data-status="${escapeHtml(task.estado)}">
          <div class="id-badge">#${task.id}</div>
          <div class="title">${escapeHtml(task.nombre)}</div>
          <div class="workspace" style="color: var(--muted); font-size: 12px; margin-bottom: 8px;">📁 ${escapeHtml(wsName || "Sin espacio")}</div>
          ${task.descripcion ? `<div style="font-size: 12px; color: var(--text); margin-bottom: 8px; line-height: 1.4; max-height: 60px; overflow: hidden;">${escapeHtml(task.descripcion)}</div>` : ""}
          <div style="font-size: 11px; color: var(--muted); margin-top: auto; padding-top: 8px; border-top: 1px solid rgba(0,0,0,.05);">
            ${task.fechaTermino ? `<div style="margin-bottom: 4px;">⏰ ${escapeHtml(normalizeDueString(task.fechaTermino))}</div>` : ""}
            <div>📅 ${fmtDateTimeCL(task.creada)}</div>
          </div>
        </div>
      `;

      const div = document.createElement("div");
      div.innerHTML = cardHtml;
      const card = div.firstElementChild;

      card.addEventListener("dblclick", () => openEdit(task.id));
      card.addEventListener("click", (e) => {
        e.stopPropagation();
      });

      tasksContainer.appendChild(card);
    }

    col.appendChild(tasksContainer);
    allTasksGrid.appendChild(col);
  }
}

// ========== MODALES ==========
function openTaskModal() {
  dom.modalBackdrop.classList.add("show");
}

function closeTaskModal() {
  dom.modalBackdrop.classList.remove("show");
  createRequestId = null;

  Object.values(fieldDatePickers).forEach(fp => {
    if (fp && fp.destroy) fp.destroy();
  });
  fieldDatePickers = {};
}

function openCreate() {
  dialogMode = "create";
  editingId = null;
  createRequestId = makeUUID();

  dom.dlgTitle.textContent = "Crear tarea";
  dom.dlgSub.textContent = "Se guarda en Supabase Cloud.";
  dom.btnDeleteTask.style.display = "none";

  populateWorkspaceSelect(state.currentWorkspaceId);
  populateResponsablesSelect();

  dom.f_name.value = "";
  dom.f_resp.value = "";
  dom.f_desc.value = "";
  dom.f_status.value = "Pendiente";

  setDueValue("");
  dom.f_closedAt.value = "";
  dom.f_meta.textContent = "";

  if (dom.f_notifyOnSave) dom.f_notifyOnSave.checked = false;

  resetAttachmentsUI();
  renderAttachmentsUI({ adjuntos: [] });
  renderCustomFieldsInTaskModal();

  openTaskModal();
  setTimeout(() => dom.f_name.focus(), 50);
}

function openEdit(id) {
  const t = state.tasks.find(x => x.id === id);
  if (!t) return;

  dialogMode = "edit";
  editingId = id;
  createRequestId = null;

  dom.dlgTitle.textContent = `Editar tarea #${t.id}`;
  dom.dlgSub.textContent = t.nombre;
  dom.btnDeleteTask.style.display = "inline-flex";

  populateWorkspaceSelect(t.workspaceId || state.currentWorkspaceId);
  populateResponsablesSelect();

  dom.f_name.value = t.nombre;
  dom.f_resp.value = t.responsableEmail || "";
  dom.f_desc.value = t.descripcion;
  dom.f_status.value = t.estado;

  setDueValue(t.fechaTermino || "");

  dom.f_closedAt.value = t.fechaCierre ? fmtDateTimeCL(t.fechaCierre) : "";
  dom.f_meta.textContent = `Creación: ${fmtDateTimeCL(t.creada)} | Última modificación: ${fmtDateTimeCL(t.modificada)}`;

  if (!state.isAdmin) {
    dom.f_dueDateDisplay.disabled = true;
    dom.btnDueOpen.style.display = 'none';
    dom.f_resp.disabled = true;
    dom.btnDeleteTask.style.display = 'none';
  } else {
    dom.f_dueDateDisplay.disabled = false;
    dom.btnDueOpen.style.display = 'inline-block';
    dom.f_resp.disabled = false;
  }

  resetAttachmentsUI();
  renderAttachmentsUI(t);
  renderCustomFieldsInTaskModal(t);

  openTaskModal();
  setTimeout(() => dom.f_name.focus(), 50);
}

// ========== MOVIMIENTO DE TAREAS ==========
async function moveTaskToWorkspace(taskId, targetWorkspaceId) {
  const tId = Number(taskId);

  if (isNaN(tId)) {
    console.error("ID de tarea inválido:", taskId);
    return;
  }

  const t = state.tasks.find(x => x.id === tId);
  if (!t) {
    console.error("Tarea no encontrada:", tId);
    return;
  }

  const wsId = String(targetWorkspaceId);
  const currentWsId = String(t.workspaceId);

  if (currentWsId === wsId) {
    console.log("Tarea ya en este workspace");
    return;
  }

  const ws = state.workspaces.find(x => String(x.id) === wsId);
  if (!ws) {
    console.error("Workspace no encontrado:", wsId);
    return;
  }

  if (t.estado === "Cerrada") {
    if (!confirm(`¿Mover tarea cerrada "#${t.id}" a "${ws.nombre}"?`)) return;
  }

  const nowIso = new Date().toISOString();
  const updated = { ...t, workspaceId: wsId, modificada: nowIso };

  try {
    const res = await gs("upsertTarea", updated);
    if (!res || !res.ok) {
      toast("No se pudo mover la tarea.", "error");
      return;
    }
    const saved = res.data;
    saved.adjuntos = Array.isArray(saved.adjuntos) ? saved.adjuntos : (t.adjuntos || []);
    state.tasks = state.tasks.map(x => x.id === saved.id ? saved : x);

    logChange(tId, "workspace", t.workspaceId, wsId, `${workspaceNameById(t.workspaceId)} → ${ws.nombre}`);

    renderAll();
    renderSidebar();
  } catch (err) {
    toast("Error moviendo tarea: " + (err?.message || err), "error");
  }
}

function logChange(taskId, changeType, oldValue, newValue, details = "") {
  const entry = {
    id: Date.now(),
    taskId: taskId,
    type: changeType,
    oldValue: oldValue,
    newValue: newValue,
    timestamp: new Date().toISOString(),
    details: details
  };
  state.changelog.push(entry);
  if (state.changelog.length > 500) {
    state.changelog = state.changelog.slice(-500);
  }
}

async function moveTaskToStatus(id, status) {
  const tId = Number(id);

  if (isNaN(tId)) {
    console.error("ID inválido:", id);
    return;
  }

  const t = state.tasks.find(x => x.id === tId);
  if (!t) {
    console.error("Tarea no encontrada:", tId);
    return;
  }
  if (t.estado === status) {
    console.log("Tarea ya tiene este estado");
    return;
  }

  if (!STATUSES.includes(status)) {
    console.error("Estado inválido:", status);
    return;
  }

  if (t.estado === "Cerrada" || (t.estado !== "Por Hacer" && status !== "Por Hacer")) {
    if (!confirm(`Cambiar "#${t.id}" de "${t.estado}" a "${status}"?`)) return;
  }

  const nowIso = new Date().toISOString();
  const prev = t.estado;

  const updated = { ...t, estado: status, modificada: nowIso };
  if (status === "Cerrada" && !updated.fechaCierre) updated.fechaCierre = nowIso;
  if (status !== "Cerrada" && prev === "Cerrada") updated.fechaCierre = "";

  try {
    const res = await gs("upsertTarea", updated);
    if (!res || !res.ok) {
      toast("No se pudo cambiar el estado: " + (res?.error || "Error desconocido"), "error");
      return;
    }
    const saved = res.data;
    saved.adjuntos = Array.isArray(saved.adjuntos) ? saved.adjuntos : (t.adjuntos || []);
    state.tasks = state.tasks.map(x => x.id === saved.id ? saved : x);

    logChange(tId, "status", prev, status, `${prev} → ${status}`);

    renderAll();
  } catch (err) {
    toast("Error: " + (err?.message || err), "error");
  }
}

function quickClose(id) { return moveTaskToStatus(id, "Cerrada"); }
function quickReopen(id) { return moveTaskToStatus(id, "Pendiente"); }

// ========== VENCIDOS ==========
function isOverdue(t) {
  if (!t || !t.fechaTermino) return false;
  if (String(t.estado || "").trim() === "Cerrada") return false;
  const d = parseDueDate(t.fechaTermino);
  if (!d) return false;
  return d.getTime() < Date.now();
}

function getOverdueTasks(all = true) {
  const tasks = all ? state.tasks :
    state.tasks.filter(t => String(t.workspaceId) === String(state.currentWorkspaceId));
  return tasks.filter(isOverdue);
}

function renderOverdueBadge() {
  const n = getOverdueTasks(true).length;
  dom.overdueCount.textContent = String(n);
}

function openOverdueModal() {
  renderOverdueModal();
  dom.overdueBackdrop.classList.add("show");
}

function closeOverdueModal() {
  dom.overdueBackdrop.classList.remove("show");
}

function renderOverdueModal() {
  const overdue = getOverdueTasks(true).sort((a, b) => {
    const da = parseDueDate(a.fechaTermino)?.getTime() || 0;
    const db = parseDueDate(b.fechaTermino)?.getTime() || 0;
    return da - db;
  });

  dom.overdueSummary.textContent = `Total vencidas: ${overdue.length}`;
  dom.overdueTbody.innerHTML = "";

  for (const t of overdue) {
    const wsName = workspaceNameById(t.workspaceId) || "—";
    const tr = document.createElement("tr");
    tr.className = "row-overdue";
    tr.innerHTML = `
      <td><strong>#${t.id}</strong></td>
      <td>${escapeHtml(wsName)}</td>
      <td>${escapeHtml(t.nombre || "")}</td>
      <td>${escapeHtml(responsibleDisplay(t) || "—")}</td>
      <td>${escapeHtml(normalizeDueString(t.fechaTermino) || "—")}</td>
      <td>${escapeHtml(t.estado || "")}</td>
      <td>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button class="secondary mini" data-act="go" type="button">Ir</button>
          <button class="secondary mini" data-act="edit" type="button">Editar</button>
          <button class="secondary mini" data-act="notify" type="button">Notificar</button>
        </div>
      </td>
    `;
    tr.querySelector('[data-act="go"]').addEventListener("click", () => {
      state.currentWorkspaceId = Number(t.workspaceId) || state.currentWorkspaceId;
      renderSidebar();
      renderAll();
      closeOverdueModal();
    });
    tr.querySelector('[data-act="edit"]').addEventListener("click", () => {
      state.currentWorkspaceId = Number(t.workspaceId) || state.currentWorkspaceId;
      renderSidebar();
      renderAll();
      closeOverdueModal();
      openEdit(t.id);
    });
    tr.querySelector('[data-act="notify"]').addEventListener("click", (e) => {
      e.preventDefault(); e.stopPropagation();
      notifyByEmail(t.id);
    });

    dom.overdueTbody.appendChild(tr);
  }
}

// ========== MODALES SECUNDARIOS (RESPONSABLES, CONFIG, CAMPOS) ==========
function openConfigModal() {
  dom.configBackdrop.classList.add("show");
}

function closeConfigModal() {
  dom.configBackdrop.classList.remove("show");
}

function openSortModal() {
  dom.configBackdrop.classList.remove("show");
}

function openManageFieldsModal() {
  renderFieldsConfig();
  dom.manageFieldsBackdrop.classList.add("show");
  dom.newFieldName.focus();
}

function closeManageFieldsModal() {
  dom.manageFieldsBackdrop.classList.remove("show");
}

// ========== CAMPOS PERSONALIZADOS ==========
async function addCustomField() {
  const name = dom.newFieldName.value.trim();
  const type = dom.newFieldType.value;

  if (!name) {
    toast('Ingresa un nombre para el campo', "warning");
    dom.newFieldName.focus();
    return;
  }

  if (state.customFields.some(f => f.name.toLowerCase() === name.toLowerCase())) {
    toast('Ya existe un campo con ese nombre', "warning");
    dom.newFieldName.focus();
    return;
  }

  try {
    const field = {
      id: makeFieldId(),
      name: name,
      type: type,
      order: state.customFields.length
    };

    const res = await gs("upsertCustomField", field);
    if (!res || !res.ok) throw new Error("No se pudo guardar el campo");

    state.customFields.push(res.data);

    dom.newFieldName.value = '';
    dom.newFieldType.value = 'text';
    dom.newFieldName.focus();

    renderFieldsConfig();

  } catch (err) {
    toast("Error creando campo: " + (err?.message || err), "error");
  }
}

async function deleteCustomField(fieldId) {
  if (!confirm('¿Eliminar este campo? Esto también eliminará los valores de este campo en todas las tareas.')) {
    return;
  }

  try {
    const res = await gs("deleteCustomField", fieldId);
    if (!res || !res.ok) throw new Error("No se pudo eliminar el campo");

    state.customFields = state.customFields.filter(f => f.id !== fieldId);

    state.tasks.forEach(task => {
      if (task.customFields && task.customFields[fieldId] !== undefined) {
        delete task.customFields[fieldId];
      }
    });

    renderFieldsConfig();

  } catch (err) {
    toast("Error eliminando campo: " + (err?.message || err), "error");
  }
}

function renderFieldsConfig() {
  dom.fieldsConfigContainer.innerHTML = '';

  if (state.customFields.length === 0) {
    dom.emptyFieldsMessage.style.display = 'block';
    dom.fieldsCount.textContent = 'Total: 0';
    return;
  }

  dom.emptyFieldsMessage.style.display = 'none';
  dom.fieldsCount.textContent = `Total: ${state.customFields.length}`;

  const sortedFields = [...state.customFields].sort((a, b) => a.order - b.order);

  sortedFields.forEach((field, index) => {
    const fieldType = FIELD_TYPES.find(t => t.value === field.type) || FIELD_TYPES[0];

    const row = document.createElement('div');
    row.className = 'field-config-row';
    row.innerHTML = `
      <div>
        <label style="margin-bottom:4px; font-size:11px; color:var(--muted);">Nombre</label>
        <input type="text" value="${escapeHtml(field.name)}" class="field-name-input" data-field-id="${field.id}"
          style="width:100%;" maxlength="50" />
      </div>
      <div>
        <label style="margin-bottom:4px; font-size:11px; color:var(--muted);">Tipo</label>
        <div class="custom-field-value" style="display:flex; align-items:center; gap:8px;">
          <span class="field-type-icon">${fieldType.icon}</span>
          <span>${fieldType.label}</span>
        </div>
      </div>
      <div class="field-config-actions">
        <button class="secondary mini danger-btn" type="button" data-act="delete">Eliminar</button>
      </div>
    `;

    const nameInput = row.querySelector('.field-name-input');
    nameInput.addEventListener('change', async () => {
      const newName = nameInput.value.trim();
      if (!newName) {
        toast('El nombre no puede estar vacío', "warning");
        nameInput.value = field.name;
        return;
      }

      if (newName === field.name) return;

      if (state.customFields.some(f => f.id !== field.id && f.name.toLowerCase() === newName.toLowerCase())) {
        toast('Ya existe otro campo con ese nombre', "warning");
        nameInput.value = field.name;
        return;
      }

      try {
        const updatedField = { ...field, name: newName };
        const res = await gs("upsertCustomField", updatedField);
        if (!res || !res.ok) throw new Error("No se pudo actualizar el campo");

        field.name = newName;
        renderFieldsConfig();

      } catch (err) {
        toast("Error actualizando campo: " + (err?.message || err), "error");
        nameInput.value = field.name;
      }
    });

    row.querySelector('[data-act="delete"]').addEventListener('click', () => {
      deleteCustomField(field.id);
    });

    dom.fieldsConfigContainer.appendChild(row);
  });
}

function renderCustomFieldsInTaskModal(task = null) {
  dom.customFieldsContainer.innerHTML = '';

  if (!state.customFields || state.customFields.length === 0) {
    dom.noCustomFieldsMsg.style.display = 'block';
    dom.customFieldsCount.textContent = '0';
    return;
  }

  dom.noCustomFieldsMsg.style.display = 'none';
  dom.customFieldsCount.textContent = state.customFields.length.toString();

  const sortedFields = [...state.customFields].sort((a, b) => a.order - b.order);

  sortedFields.forEach(field => {
    const fieldType = FIELD_TYPES.find(t => t.value === field.type) || FIELD_TYPES[0];
    const fieldId = `custom_field_${field.id}`;

    const currentValue = task && task.customFields ? task.customFields[field.id] : '';

    const fieldElement = document.createElement('div');
    fieldElement.className = 'custom-field-item';

    let inputHTML = '';

    switch (field.type) {
      case 'text':
        inputHTML = `<input type="text" id="${fieldId}" value="${escapeHtml(currentValue || '')}"
          placeholder="Ingresa texto..." />`;
        break;

      case 'number':
        inputHTML = `<input type="number" id="${fieldId}" value="${currentValue || ''}" placeholder="0" step="any" />`;
        break;

      case 'date':
        inputHTML = `
          <div style="display:flex; gap:8px; align-items:center;">
            <input type="text" id="${fieldId}" value="${currentValue ? formatDMY(new Date(currentValue)) : ''}" readonly
              placeholder="DD-MM-YYYY" style="flex:1;" />
            <button type="button" class="secondary cal-btn mini" data-field-id="${field.id}" style="width:44px;">📅</button>
          </div>
        `;
        break;

      case 'priority':
        const priorityOptions = PRIORITY_OPTIONS.map(opt =>
          `<option value="${opt}" ${currentValue === opt ? 'selected' : ''}>${opt}</option>`
        ).join('');
        inputHTML = `<select id="${fieldId}">
          <option value="">Seleccionar...</option>${priorityOptions}
        </select>`;
        break;

      default:
        inputHTML = `<input type="text" id="${fieldId}" value="${escapeHtml(currentValue || '')}" />`;
    }

    fieldElement.innerHTML = `
      <div>
        <label style="margin-bottom:4px; font-size:11px; color:var(--muted);">${escapeHtml(field.name)}</label>
        ${inputHTML}
      </div>
      <div>
        <label style="margin-bottom:4px; font-size:11px; color:var(--muted);">Tipo</label>
        <div class="custom-field-value" style="display:flex; align-items:center; gap:8px;">
          <span class="field-type-icon">${fieldType.icon}</span>
          <span>${fieldType.label}</span>
        </div>
      </div>
      <div style="display:flex; align-items:center;">
        <span class="custom-field-pill">ID: ${field.id}</span>
      </div>
    `;

    dom.customFieldsContainer.appendChild(fieldElement);

    if (field.type === 'date') {
      setTimeout(() => {
        initCustomFieldDatePicker(field.id, currentValue);
      }, 100);
    }
  });
}

function initCustomFieldDatePicker(fieldId, currentValue) {
  const inputId = `custom_field_${fieldId}`;
  const input = document.getElementById(inputId);
  const button = document.querySelector(`[data-field-id="${fieldId}"]`);

  if (!input || !window.flatpickr) return;

  if (fieldDatePickers[fieldId]) {
    fieldDatePickers[fieldId].destroy();
  }

  const fp = flatpickr(input, {
    enableTime: fieldId.includes('_time'),
    time_24hr: true,
    minuteIncrement: 5,
    allowInput: false,
    clickOpens: false,
    disableMobile: true,
    dateFormat: "d-m-Y",
    static: true,
    onChange: (selectedDates) => {
      if (selectedDates && selectedDates[0]) {
        const d = selectedDates[0];
        const isoDate = d.toISOString();
        input.value = formatDMY(d);
        input.dataset.isoValue = isoDate;
      } else {
        input.value = '';
        input.dataset.isoValue = '';
      }
    }
  });

  if (currentValue) {
    try {
      const date = new Date(currentValue);
      if (!isNaN(date.getTime())) {
        fp.setDate(date, false);
        input.value = formatDMY(date);
        input.dataset.isoValue = date.toISOString();
      }
    } catch (e) {
      console.error('Error parsing date:', e);
    }
  }

  if (button) {
    button.addEventListener('click', () => fp.open());
  }

  input.addEventListener('click', () => fp.open());

  fieldDatePickers[fieldId] = fp;
}

function formatDMY(date) {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = date.getFullYear();
  return `${dd}-${mm}-${yy}`;
}

function makeFieldId() {
  return `custom_field_${Math.random().toString(36).substr(2, 9)}`;
}

// ========== POBLAR SELECTORES ==========
function populateResponsablesSelect() {
  dom.f_resp.innerHTML = '<option value="">(Sin asignar)</option>';

  // Filtrar activos y ordenar por nombre
  const actives = state.responsables
    .filter(r => r.activo !== false)
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  for (const r of actives) {
    const opt = document.createElement("option");
    opt.value = r.email;
    opt.textContent = `${r.nombre} (${r.email})`;
    dom.f_resp.appendChild(opt);
  }
}


function getCustomFieldValue(field, value) {
  if (!value) return '';

  switch (field.type) {
    case 'date':
      try {
        const date = new Date(value);
        return isNaN(date.getTime()) ? value : formatDMY(date);
      } catch (e) {
        return value;
      }

    case 'priority':
      return `<span class="priority-badge priority-${value.toLowerCase()}">${value}</span>`;

    default:
      return escapeHtml(String(value));
  }
}

function renderCustomFieldsInCard(task) {
  if (!state.customFields || state.customFields.length === 0 || !task.customFields) return '';

  const fieldsWithValues = state.customFields.filter(field =>
    task.customFields && task.customFields[field.id] !== undefined && task.customFields[field.id] !== ''
  );

  if (fieldsWithValues.length === 0) return '';

  return fieldsWithValues.map(field => {
    const value = task.customFields[field.id];
    const displayValue = getCustomFieldValue(field, value);
    const fieldType = FIELD_TYPES.find(t => t.value === field.type) || FIELD_TYPES[0];

    return `
      <span class="pill" title="${escapeHtml(field.name)}: ${escapeHtml(String(value))}">
        ${fieldType.icon} ${escapeHtml(field.name)}: ${displayValue}
      </span>
    `;
  }).join('');
}

function renderCustomFieldsInTable(task) {
  if (!state.customFields || state.customFields.length === 0 || !task.customFields) return '';

  const fieldsWithValues = state.customFields.filter(field =>
    task.customFields && task.customFields[field.id] !== undefined && task.customFields[field.id] !== ''
  );

  if (fieldsWithValues.length === 0) return '—';

  return fieldsWithValues.map(field => {
    const value = task.customFields[field.id];
    const displayValue = getCustomFieldValue(field, value);
    const fieldType = FIELD_TYPES.find(t => t.value === field.type) || FIELD_TYPES[0];

    return `
      <div style="margin-bottom:4px; font-size:11px;">
        <strong>${fieldType.icon} ${escapeHtml(field.name)}:</strong> ${displayValue}
      </div>
    `;
  }).join('');
}

// ========== ADMIN WORKSPACES ==========
function openWSAdmin() {
  renderWSAdminTable();
  dom.adminWSBackdrop.classList.add("show");
}

function closeWSAdmin() {
  dom.adminWSBackdrop.classList.remove("show");
  renderSidebar();
  renderAll();
}

function countTasksInWorkspace(workspaceId) {
  return state.tasks.filter(t => String(t.workspaceId) === String(workspaceId)).length;
}

function renderWSAdminTable() {
  dom.adminWSTbody.innerHTML = "";

  const sortedWS = [...state.workspaces].sort((a, b) => {
    if ((a.activo !== false) !== (b.activo !== false)) {
      return (a.activo !== false) ? -1 : 1;
    }
    return (a.nombre || "").localeCompare(b.nombre || "", "es");
  });

  let totalTasks = 0;
  let activeCount = 0;
  let hiddenCount = 0;

  for (const ws of sortedWS) {
    const taskCount = countTasksInWorkspace(ws.id);
    totalTasks += taskCount;

    if (ws.activo !== false) {
      activeCount++;
    } else {
      hiddenCount++;
    }

    const tr = document.createElement("tr");

    const taskCountClass = taskCount === 0 ? "empty" : "has-tasks";
    const taskCountText = taskCount === 0 ? "Vacío" : `${taskCount} tarea(s)`;

    const statusText = ws.activo !== false ? "🟢 Visible" : "🟡 Oculto";
    const statusClass = ws.activo !== false ? "ws-status-active" : "ws-status-hidden";

    tr.innerHTML = `
      <td style="padding:10px; border-bottom:1px solid var(--border);">
        <strong>${ws.id}</strong>
      </td>
      <td style="padding:10px; border-bottom:1px solid var(--border);">
        <span class="editable-ws-name" data-ws-id="${ws.id}">
          ${escapeHtml(ws.nombre || "Sin nombre")}
        </span>
      </td>
      <td style="padding:10px; border-bottom:1px solid var(--border);">
        <span class="pill ${statusClass}">${statusText}</span>
      </td>
      <td style="padding:10px; border-bottom:1px solid var(--border);">
        <span class="ws-task-count ${taskCountClass}">${taskCountText}</span>
      </td>
      <td style="padding:10px; border-bottom:1px solid var(--border);">
        <div class="ws-actions">
          ${ws.activo !== false
        ? `<button class="secondary mini ws-btn-hide" data-act="hide" type="button">Ocultar</button>`
        : `<button class="secondary mini ws-btn-show" data-act="show" type="button">Mostrar</button>`}
          <button class="secondary mini ws-btn-rename" data-act="rename" type="button">Editar</button>
          <button class="secondary mini ws-btn-delete" data-act="delete" type="button" ${taskCount > 0 ? 'disabled' : ''}>Eliminar</button>
        </div>
      </td>
    `;

    const nameSpan = tr.querySelector('.editable-ws-name');
    nameSpan.addEventListener('dblclick', () => startEditingWSName(ws.id, nameSpan));

    const hideShowBtn = tr.querySelector('[data-act="hide"], [data-act="show"]');
    if (hideShowBtn) {
      hideShowBtn.addEventListener('click', () => toggleWSVisibility(ws.id, ws.activo !== false));
    }

    const renameBtn = tr.querySelector('[data-act="rename"]');
    if (renameBtn) {
      renameBtn.addEventListener('click', () => startEditingWSName(ws.id, nameSpan));
    }

    const deleteBtn = tr.querySelector('[data-act="delete"]');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => deleteWorkspaceFlow(ws.id));
    }

    dom.adminWSTbody.appendChild(tr);
  }

  dom.wsAdminCount.textContent = `Total: ${sortedWS.length}`;
  dom.activeWSCount.textContent = `Activos: ${activeCount}`;
  dom.hiddenWSCount.textContent = `Ocultos: ${hiddenCount}`;
  dom.tasksInWSCount.textContent = `Tareas: ${totalTasks}`;
}

function startEditingWSName(wsId, element) {
  if (editingWSName) {
    stopEditingWSName();
  }

  const ws = state.workspaces.find(w => w.id === wsId);
  if (!ws) return;

  editingWSName = wsId;
  element.classList.add('editing');

  const currentName = ws.nombre || '';
  element.innerHTML = `
    <input type="text" value="${escapeHtml(currentName)}"
      style="width:100%; padding:4px 8px; border-radius:6px; border:1px solid var(--accent);" maxlength="100" />
    <div style="display:flex; gap:4px; margin-top:4px;">
      <button class="secondary mini" data-act="save-name" style="font-size:11px; padding:2px 6px;">Guardar</button>
      <button class="secondary mini" data-act="cancel-name" style="font-size:11px; padding:2px 6px;">Cancelar</button>
    </div>
  `;

  const input = element.querySelector('input');
  input.focus();
  input.select();

  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      saveWSName(wsId, input.value.trim());
    }
  });

  element.querySelector('[data-act="save-name"]').addEventListener('click', () => {
    saveWSName(wsId, input.value.trim());
  });

  element.querySelector('[data-act="cancel-name"]').addEventListener('click', () => {
    stopEditingWSName();
    renderWSAdminTable();
  });
}

async function saveWSName(wsId, newName) {
  if (!newName || newName.trim() === '') {
    toast('El nombre no puede estar vacío', "warning");
    return;
  }

  const ws = state.workspaces.find(w => w.id === wsId);
  if (!ws) return;

  if (ws.nombre === newName) {
    stopEditingWSName();
    renderWSAdminTable();
    return;
  }

  try {
    const res = await gs("upsertWorkspace", {
      id: wsId,
      nombre: newName.trim(),
      activo: ws.activo !== false
    });

    if (!res || !res.ok) throw new Error("No se pudo actualizar el nombre");

    const idx = state.workspaces.findIndex(w => w.id === wsId);
    if (idx >= 0) {
      state.workspaces[idx] = res.data;
    }

    if (state.currentWorkspaceId === wsId) {
      renderSidebar();
      renderWorkspaceBadge();
    }

    stopEditingWSName();
    renderWSAdminTable();

  } catch (err) {
    toast("Error actualizando nombre: " + (err?.message || err), "error");
  }
}

function stopEditingWSName() {
  editingWSName = null;
}

async function toggleWSVisibility(wsId, isCurrentlyActive) {
  const ws = state.workspaces.find(w => w.id === wsId);
  if (!ws) return;

  const newActiveState = !isCurrentlyActive;

  try {
    const res = await gs("upsertWorkspace", {
      id: wsId,
      nombre: ws.nombre,
      activo: newActiveState
    });

    if (!res || !res.ok) throw new Error("No se pudo cambiar visibilidad");

    const idx = state.workspaces.findIndex(w => w.id === wsId);
    if (idx >= 0) {
      state.workspaces[idx] = res.data;
    }

    if (state.currentWorkspaceId === wsId && !newActiveState) {
      const firstActive = state.workspaces.find(w => w.activo !== false && w.id !== wsId);
      if (firstActive) {
        state.currentWorkspaceId = firstActive.id;
      }
    }

    renderWSAdminTable();
    renderSidebar();
    renderAll();

  } catch (err) {
    toast("Error cambiando visibilidad: " + (err?.message || err), "error");
  }
}

async function createWSFromAdmin() {
  const name = dom.newWSName.value.trim();
  if (!name) {
    toast('Ingresa un nombre para el espacio', "warning");
    dom.newWSName.focus();
    return;
  }

  try {
    const res = await gs("upsertWorkspace", {
      nombre: name,
      activo: true
    });

    if (!res || !res.ok) throw new Error("No se pudo crear espacio");

    state.workspaces = [res.data, ...state.workspaces];
    state.currentWorkspaceId = res.data.id;

    dom.newWSName.value = '';
    dom.newWSName.focus();

    renderWSAdminTable();
    renderSidebar();
    renderAll();

  } catch (err) {
    toast("Error creando espacio: " + (err?.message || err), "error");
  }
}

function deleteWorkspaceFlow(wsId) {
  const ws = state.workspaces.find(w => w.id === wsId);
  if (!ws) return;

  const taskCount = countTasksInWorkspace(wsId);

  if (taskCount === 0) {
    if (confirm(`¿Eliminar el espacio "${ws.nombre}"? Esta acción no se puede deshacer.`)) {
      deleteWorkspace(wsId);
    }
    return;
  }

  wsToDelete = ws;
  wsToDeleteId = wsId;
  dom.wsToDeleteName.textContent = ws.nombre;
  dom.wsToDeleteTaskCount.textContent = taskCount;
  dom.deleteAllTaskCount.textContent = taskCount;

  document.querySelectorAll('input[name="deleteOption"]').forEach(radio => {
    radio.checked = false;
  });
  document.getElementById('optionMoveTasks').checked = true;

  dom.moveToWSSelect.innerHTML = '';
  const otherSpaces = state.workspaces
    .filter(w => w.id !== wsId && w.activo !== false)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  if (otherSpaces.length === 0) {
    dom.moveToWSSelect.innerHTML = '<option value="">No hay otros espacios disponibles</option>';
    dom.moveToWSSelect.disabled = true;
    document.getElementById('optionMoveTasks').disabled = true;
    document.getElementById('optionHideWS').checked = true;
  } else {
    dom.moveToWSSelect.disabled = false;
    document.getElementById('optionMoveTasks').disabled = false;

    otherSpaces.forEach(space => {
      const option = document.createElement('option');
      option.value = space.id;
      option.textContent = `${space.nombre} (ID: ${space.id})`;
      dom.moveToWSSelect.appendChild(option);
    });
  }

  updateDeleteOptionUI();

  dom.confirmDeleteWSBackdrop.classList.add('show');
}

function updateDeleteOptionUI() {
  const selectedOption = document.querySelector('input[name="deleteOption"]:checked').value;
  dom.moveTasksSection.style.display = selectedOption === 'move' ? 'block' : 'none';

  if (selectedOption === 'deleteAll') {
    dom.btnConfirmDeleteWS.textContent = 'Eliminar Todo';
    dom.btnConfirmDeleteWS.classList.add('danger-btn');
  } else {
    dom.btnConfirmDeleteWS.textContent = 'Proceder';
    dom.btnConfirmDeleteWS.classList.remove('danger-btn');
  }
}

async function deleteWorkspace(wsId) {
  try {
    const res = await gs("deleteWorkspace", wsId);
    if (!res || !res.ok) throw new Error(res?.error || "No se pudo eliminar el espacio");

    state.workspaces = state.workspaces.filter(w => w.id !== wsId);

    if (state.currentWorkspaceId === wsId) {
      const firstActive = state.workspaces.find(w => w.activo !== false);
      state.currentWorkspaceId = firstActive ? firstActive.id : 0;
    }

    dom.confirmDeleteWSBackdrop.classList.remove("show");

    renderWSAdminTable();
    renderSidebar();
    renderAll();

    toast('Espacio eliminado exitosamente', "success");

  } catch (err) {
    toast("Error eliminando espacio: " + (err?.message || err), "error");
  }
}

async function moveTasksAndDeleteWS(sourceWsId, targetWsId) {
  try {
    const res = await gs("moveTasksToWorkspace", sourceWsId, targetWsId);
    if (!res || !res.ok) throw new Error(res?.error || "No se pudieron mover las tareas");

    const movedTasks = state.tasks.filter(t => Number(t.workspaceId) === Number(sourceWsId));
    movedTasks.forEach(task => {
      task.workspaceId = targetWsId;
    });

    await deleteWorkspace(sourceWsId);

  } catch (err) {
    toast("Error moviendo tareas: " + (err?.message || err), "error");
  }
}

async function deleteWorkspaceWithTasks(wsId) {
  try {
    const tasksToDelete = state.tasks.filter(t => Number(t.workspaceId) === Number(wsId));

    for (const task of tasksToDelete) {
      const res = await gs("deleteTarea", task.id);
      if (!res || !res.ok) {
        throw new Error(`No se pudo eliminar tarea ${task.id}`);
      }
    }

    state.tasks = state.tasks.filter(t => Number(t.workspaceId) !== Number(wsId));

    await deleteWorkspace(wsId);

  } catch (err) {
    toast("Error eliminando espacio con tareas: " + (err?.message || err), "error");
  }
}

// ========== RESPONSABLES ==========
function openRespModal() {
  dom.respBackdrop.classList.add("show");
  dom.r_name.value = "";
  dom.r_email.value = "";
  dom.r_email.disabled = false;
  renderResponsablesTable();
  setTimeout(() => dom.r_name.focus(), 50);
}

function closeRespModal() {
  dom.respBackdrop.classList.remove("show");
  populateResponsibleSelect();
  renderSidebar();
  renderAll();
}

function renderResponsablesTable() {
  dom.respTbody.innerHTML = "";
  const rows = [...state.responsables].sort((a, b) => {
    if ((a.activo !== false) !== (b.activo !== false)) return (a.activo !== false) ? -1 : 1;
    return (a.nombre || a.email).localeCompare(b.nombre || b.email, "es");
  });

  for (const r of rows) {
    const tr = document.createElement("tr");
    const pill = (r.activo !== false)
      ? `<span class="pill ok">● Activo</span>`
      : `<span class="pill warn">● Inactivo</span>`;

    tr.innerHTML = `
      <td style="padding:10px; border-bottom:1px solid var(--border);">${escapeHtml(r.nombre || "")}</td>
      <td style="padding:10px; border-bottom:1px solid var(--border);">${escapeHtml(r.email || "")}</td>
      <td style="padding:10px; border-bottom:1px solid var(--border);">${pill}</td>
      <td style="padding:10px; border-bottom:1px solid var(--border);">
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button class="secondary mini" data-act="edit" type="button">Editar</button>
          ${(r.activo !== false)
        ? `<button class="secondary mini" data-act="off" type="button">Desactivar</button>`
        : `<button class="secondary mini" data-act="on" type="button">Activar</button>`}
        </div>
      </td>
    `;

    tr.querySelector('[data-act="edit"]').addEventListener("click", () => {
      dom.r_name.value = r.nombre || "";
      dom.r_email.value = r.email || "";
      dom.r_email.disabled = true;
      dom.r_name.focus();
    });

    const off = tr.querySelector('[data-act="off"]');
    if (off) off.addEventListener("click", async () => { await setRespActive(r.email, false); });

    const on = tr.querySelector('[data-act="on"]');
    if (on) on.addEventListener("click", async () => { await setRespActive(r.email, true); });

    dom.respTbody.appendChild(tr);
  }
}

async function saveResponsableFlow() {
  const nombre = (dom.r_name.value || "").trim();
  const email = (dom.r_email.value || "").trim().toLowerCase();
  if (!nombre) { toast("Nombre requerido.", "warning"); return; }
  if (!email) { toast("Email requerido.", "warning"); return; }

  try {
    const res = await gs("upsertResponsable", { nombre, email, activo: true });
    if (!res || !res.ok) throw new Error("No se pudo guardar responsable");

    const saved = res.data;
    const idx = state.responsables.findIndex(x => x.email === saved.email);
    if (idx >= 0) state.responsables[idx] = saved;
    else state.responsables = [saved, ...state.responsables];

    dom.r_name.value = "";
    dom.r_email.value = "";
    dom.r_email.disabled = false;

    renderResponsablesTable();
  } catch (err) {
    toast("Error guardando responsable: " + (err && err.message ? err.message : err), "error");
  }
}

async function setRespActive(email, active) {
  try {
    const res = await gs("setResponsableActive", email, active);
    if (!res || !res.ok) throw new Error("No se pudo cambiar estado");
    const idx = state.responsables.findIndex(x => x.email === String(email).toLowerCase());
    if (idx >= 0) state.responsables[idx].activo = !!active;
    renderResponsablesTable();
  } catch (err) {
    toast("Error actualizando responsable: " + (err && err.message ? err.message : err), "error");
  }
}

// ========== UTILIDADES ==========
function populateWorkspaceSelect(selectedId) {
  const activeWS = state.workspaces.filter(w => w.activo);
  dom.f_wsSelect.innerHTML = "";
  for (const w of activeWS) {
    const opt = document.createElement("option");
    opt.value = String(w.id);
    opt.textContent = w.nombre;
    dom.f_wsSelect.appendChild(opt);
  }
  const pick = Number(selectedId) || state.currentWorkspaceId || (activeWS[0]?.id || 0);
  if (pick) dom.f_wsSelect.value = String(pick);
}

function populateResponsibleSelect() {
  const actives = state.responsables.filter(r => r.activo !== false);
  dom.f_resp.innerHTML = `<option value="">(Sin asignar)</option>`;
  for (const r of actives) {
    const opt = document.createElement("option");
    opt.value = r.email;
    opt.textContent = `${r.nombre} <${r.email}>`;
    dom.f_resp.appendChild(opt);
  }
}

function responsibleLabelByEmail(email) {
  if (!email) return "";
  const r = state.responsables.find(x => x.email === email);
  return r ? (r.nombre || "") : "";
}

function responsibleDisplay(t, includeEmail = false) {
  const email = (t.responsableEmail || "").trim().toLowerCase();
  if (!email) {
    return (t.responsableNombre || "").trim();
  }
  const r = state.responsables.find(x => (x.email || "").toLowerCase() === email);
  if (r && r.nombre) {
    return includeEmail ? `${r.nombre} <${email}>` : r.nombre;
  }
  return email;
}

// ========== ARCHIVOS ==========
function resetAttachmentsUI() {
  pendingFiles = [];
  if (dom.f_files) dom.f_files.value = "";
  dom.filePendingInfo.textContent = "";
}

function renderAttachmentsUI(task) {
  const arr = (task && Array.isArray(task.adjuntos)) ? task.adjuntos : [];
  dom.attachCount.textContent = String(arr.length);
  dom.attachList.innerHTML = "";

  if (arr.length === 0) {
    dom.attachList.innerHTML = `<div class="small-note">Sin adjuntos.</div>`;
    return;
  }

  for (const a of arr) {
    const div = document.createElement("div");
    div.className = "attach-item";

    const fileName = String(a.name || "").toLowerCase();
    const isMsgFile = fileName.endsWith(".msg") ||
      String(a.mimeType || "").toLowerCase().includes("outlook") ||
      String(a.mimeType || "").toLowerCase() === "application/vnd.ms-outlook";

    let linkElement;
    if (isMsgFile) {
      linkElement = document.createElement("a");
      linkElement.href = escapeHtml(a.url || "#");
      linkElement.download = a.name || "archivo.msg";
      linkElement.textContent = escapeHtml(a.name || a.id || "Archivo");
      linkElement.style.cssText = `color: var(--accent); text-decoration: none; font-weight: 700; font-size: 12px;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 520px; display: inline-block; cursor: pointer;`;
      linkElement.title = "Hacer clic para abrir con Microsoft Outlook";
    } else {
      linkElement = document.createElement("a");
      linkElement.href = escapeHtml(a.url || "#");
      linkElement.target = "_blank";
      linkElement.rel = "noopener";
      linkElement.textContent = escapeHtml(a.name || a.id || "Archivo");
      linkElement.style.cssText = `color: var(--accent); text-decoration: none; font-weight: 700; font-size: 12px;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 520px; display: inline-block;`;
    }

    div.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:2px;"></div>
      <div style="display:flex; gap:8px; align-items:center;">
        <button class="secondary mini danger-btn" data-act="del" type="button">Eliminar</button>
      </div>
    `;

    const linkContainer = div.querySelector("div:first-child");
    linkContainer.appendChild(linkElement);
    const small = document.createElement("small");
    small.textContent = escapeHtml(a.mimeType || "");
    linkContainer.appendChild(small);

    div.querySelector('[data-act="del"]').addEventListener("click", async () => {
      if (!editingId) return;
      if (!confirm("¿Eliminar este adjunto?")) return;

      try {
        const res = await gs("deleteTaskAttachment", editingId, a.id);
        if (!res || !res.ok) { toast("No se pudo eliminar adjunto.", "error"); return; }
        const updated = Array.isArray(res.data) ? res.data : [];
        const t = state.tasks.find(x => x.id === editingId);
        if (t) t.adjuntos = updated;
        renderAttachmentsUI(t);
        renderAll();
      } catch (err) {
        toast("Error eliminando adjunto: " + (err?.message || err), "error");
      }
    });

    dom.attachList.appendChild(div);
  }
}

function renderPendingFilesInfo() {
  if (!pendingFiles || pendingFiles.length === 0) {
    dom.filePendingInfo.textContent = "";
    return;
  }
  const totalBytes = pendingFiles.reduce((s, f) => s + (f.size || 0), 0);
  const mb = (totalBytes / (1024 * 1024)).toFixed(2);
  dom.filePendingInfo.textContent = `Archivos seleccionados para subir: ${pendingFiles.length} · Total aprox: ${mb} MB`;
}

async function uploadPendingFiles(taskId) {
  const totalBytes = pendingFiles.reduce((s, f) => s + (f.size || 0), 0);
  if (totalBytes > 20 * 1024 * 1024) {
    toast("Los adjuntos seleccionados superan 20 MB en total. Reduce el tamaño y reintenta.", "warning");
    return [];
  }
  for (const f of pendingFiles) {
    if ((f.size || 0) > 10 * 1024 * 1024) {
      toast(`El archivo "${f.name}" supera 10 MB. Reduce el tamaño y reintenta.`, "warning");
      return [];
    }
  }

  const payload = await Promise.all(pendingFiles.map(fileToPayload));
  const res = await gs("uploadTaskAttachments", taskId, payload);
  if (!res || !res.ok) throw new Error(res?.error || "No se pudo subir adjuntos");
  const updated = Array.isArray(res.data) ? res.data : [];

  resetAttachmentsUI();
  return updated;
}

function fileToPayload(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer archivo: " + file.name));
    reader.onload = () => {
      const result = String(reader.result || "");
      const idx = result.indexOf("base64,");
      const b64 = idx >= 0 ? result.substring(idx + 7) : "";
      resolve({ name: file.name, mimeType: file.type || "application/octet-stream", dataBase64: b64 });
    };
    reader.readAsDataURL(file);
  });
}

function makeUUID() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function filesToPayload(files) {
  return Promise.all(Array.from(files || []).map(fileToPayload));
}

// ========== FECHA TÉRMINO ==========
function initDuePicker() {
  if (!window.flatpickr) {
    dom.f_dueDateDisplay.readOnly = false;
    dom.f_dueDateDisplay.placeholder = "DD-MM-YYYY HH:mm";
    dom.btnDueOpen.disabled = true;
    return;
  }

  fpDue = flatpickr(dom.f_dueDateDisplay, {
    enableTime: true,
    time_24hr: true,
    minuteIncrement: 5,
    allowInput: false,
    clickOpens: false,
    disableMobile: true,
    dateFormat: "d-m-Y H:i",
    static: true,
    onChange: (selectedDates) => {
      if (selectedDates && selectedDates[0]) {
        const d = selectedDates[0];
        dom.f_dueDate.value = d.toISOString();
        dom.f_dueDateDisplay.value = formatDMYHM(d);
      } else {
        dom.f_dueDate.value = "";
        dom.f_dueDateDisplay.value = "";
      }
    }
  });

  dom.btnDueOpen.addEventListener("click", () => fpDue.open());
  dom.f_dueDateDisplay.addEventListener("click", () => fpDue.open());
}

function setDueValue(dueStr) {
  const s = (dueStr || "").trim();
  if (!s) {
    dom.f_dueDate.value = "";
    dom.f_dueDateDisplay.value = "";
    if (fpDue) fpDue.clear();
    return;
  }

  const d = parseDueDate(s);
  if (!d) {
    dom.f_dueDate.value = s;
    dom.f_dueDateDisplay.value = s;
    if (fpDue) fpDue.clear();
    return;
  }

  const norm = formatDMYHM(d);
  dom.f_dueDate.value = d.toISOString();
  dom.f_dueDateDisplay.value = norm;
  if (fpDue) fpDue.setDate(d, false);
}

function normalizeDueString(s) {
  const d = parseDueDate(s);
  return d ? formatDMYHM(d) : String(s || "");
}

function parseDueDate(s) {
  if (!s) return null;
  const str = String(s).trim();

  let m = str.match(/^(\d{2})-(\d{2})-(\d{4})[ T](\d{2}):(\d{2})$/);
  if (m) {
    const dd = Number(m[1]), mm = Number(m[2]), yy = Number(m[3]);
    const hh = Number(m[4]), mi = Number(m[5]);
    const d = new Date(yy, mm - 1, dd, hh, mi, 0, 0);
    return isNaN(d.getTime()) ? null : d;
  }

  m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const yy = Number(m[1]), mm = Number(m[2]), dd = Number(m[3]);
    const d = new Date(yy, mm - 1, dd, 0, 0, 0, 0);
    return isNaN(d.getTime()) ? null : d;
  }

  const d2 = new Date(str);
  return isNaN(d2.getTime()) ? null : d2;
}

function formatDMYHM(d) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}-${mm}-${yy} ${hh}:${mi}`;
}

// ========== EXPORT XLSX ==========
function exportXLSX() {
  if (!window.XLSX) {
    toast("No se pudo cargar la librería XLSX.", "error");
    return;
  }

  let rows;
  let wsName;
  if (state.currentView === "all") {
    rows = state.tasks;
    wsName = "Todas";
  } else {
    rows = getFilteredTasks();
    wsName = workspaceNameById(state.currentWorkspaceId);
  }

  const headers = [
    "ID",
    "Espacio de trabajo",
    "Nombre",
    "Descripción",
    "Responsable",
    "Estado",
    "Creación",
    "Revisión/Modificación",
    "Fecha término",
    "Fecha cierre",
    "Adjuntos (links)"
  ];

  if (state.customFields && state.customFields.length > 0) {
    state.customFields.forEach(field => {
      headers.push(field.name);
    });
  }

  headers.push("Acciones");

  const aoa = [headers];

  for (const t of rows) {
    const links = (Array.isArray(t.adjuntos) && t.adjuntos.length)
      ? t.adjuntos.map(a => `${a.name}: ${a.url}`).join("\n")
      : "";

    const taskWsName = (state.currentView === "all") ? workspaceNameById(t.workspaceId) : wsName;

    const rowData = [
      t.id || "",
      taskWsName || "",
      t.nombre || "",
      t.descripcion || "",
      responsibleDisplay(t) || "",
      t.estado || "",
      fmtDateTimeCL(t.creada) || "",
      fmtDateTimeCL(t.modificada) || "",
      t.fechaTermino ? normalizeDueString(t.fechaTermino) : "",
      t.fechaCierre ? fmtDateTimeCL(t.fechaCierre) : "",
      links
    ];

    if (state.customFields && state.customFields.length > 0) {
      state.customFields.forEach(field => {
        const value = t.customFields && t.customFields[field.id] !== undefined ?
          getExcelFieldValue(field, t.customFields[field.id]) : "";
        rowData.push(value);
      });
    }

    rowData.push("");

    aoa.push(rowData);
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = computeColWidths(aoa);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Tareas");

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });

  downloadBlob(blob, `tareas_${sanitizeFile(wsName || "workspace")}.xlsx`);
}

function getExcelFieldValue(field, value) {
  if (!value && value !== 0) return "";

  switch (field.type) {
    case 'date':
      try {
        const date = new Date(value);
        return isNaN(date.getTime()) ? value : formatDMY(date);
      } catch (e) {
        return value;
      }

    case 'number':
      return isNaN(parseFloat(value)) ? value : parseFloat(value);

    default:
      return String(value);
  }
}

function computeColWidths(aoa) {
  const colCount = Math.max(...aoa.map(r => r.length));
  const widths = new Array(colCount).fill(10).map(() => ({ wch: 12 }));

  for (let c = 0; c < colCount; c++) {
    let maxLen = 10;
    for (let r = 0; r < aoa.length; r++) {
      const v = aoa[r][c];
      const s = (v === null || v === undefined) ? "" : String(v);
      if (s.length > maxLen) maxLen = s.length;
    }
    widths[c] = { wch: Math.min(Math.max(maxLen + 2, 12), 70) };
  }
  return widths;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function sanitizeFile(name) {
  return String(name).replace(/[\\\/:*?"<>|]+/g, "_").trim() || "archivo";
}

// ========== PILLS ==========
function getDuePill(t) {
  if (!t.fechaTermino) return `<span class="pill">Término: —</span>`;

  const due = parseDueDate(t.fechaTermino);
  if (!due) return `<span class="pill">Término: ${escapeHtml(String(t.fechaTermino))}</span>`;

  const now = Date.now();
  const diffHrs = Math.round((due.getTime() - now) / (1000 * 60 * 60));

  if (String(t.estado) === "Cerrada") return `<span class="pill ok">Término: ${formatDMYHM(due)}</span>`;
  if (diffHrs < 0) return `<span class="pill danger">Vencida: ${formatDMYHM(due)}</span>`;
  if (diffHrs <= 48) return `<span class="pill warn">Próx: ${formatDMYHM(due)}</span>`;
  return `<span class="pill">Término: ${formatDMYHM(due)}</span>`;
}

// ========== NOTIFICACIONES ==========
function openMailto(to, subject, body) {
  const mailtoUrl =
    `mailto:${encodeURIComponent(to)}` +
    `?subject=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(body)}`;

  const a = document.createElement("a");
  a.href = mailtoUrl;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function notifyByEmail(taskId) {
  const t = state.tasks.find(x => x.id === taskId);
  if (!t) return;

  const to = String(t.responsableEmail || "").trim();
  if (!to) {
    toast("Esta tarea no tiene Responsable (correo) asignado.", "warning");
    return;
  }

  const wsName = workspaceNameById(t.workspaceId || state.currentWorkspaceId) || "";
  const due = t.fechaTermino ? normalizeDueString(t.fechaTermino) : "—";
  const att = (Array.isArray(t.adjuntos) && t.adjuntos.length)
    ? t.adjuntos.map(a => `- ${a.name}: ${a.url}`).join("\n")
    : "(sin adjuntos)";

  let customFieldsText = "";
  if (t.customFields && state.customFields) {
    const fieldsWithValues = state.customFields.filter(field =>
      t.customFields[field.id] !== undefined && t.customFields[field.id] !== ''
    );

    if (fieldsWithValues.length > 0) {
      customFieldsText = "\n\nCampos Personalizados:\n" + fieldsWithValues.map(field => {
        const value = t.customFields[field.id];
        let displayValue = String(value);

        if (field.type === 'date') {
          try {
            const date = new Date(value);
            displayValue = isNaN(date.getTime()) ? value : formatDMY(date);
          } catch (e) {
            displayValue = value;
          }
        }

        return `- ${field.name}: ${displayValue}`;
      }).join("\n");
    }
  }

  const subject = `Tarea #${t.id} (${wsName || "Sin espacio"}): ${t.nombre}`;

  const bodyLines = [
    `Hola ${(t.responsableNombre || "").trim() || ""}`.trim() + ",",
    "",
    "Te notifico la siguiente tarea:",
    `- ID: ${t.id}`,
    `- Espacio: ${wsName || "—"}`,
    `- Nombre: ${t.nombre || "—"}`,
    `- Descripción: ${t.descripcion || "—"}`,
    `- Estado: ${t.estado || "—"}`,
    `- Fecha término: ${due}`,
    "",
    "Adjuntos:",
    att,
    customFieldsText,
    "",
    `Creación: ${fmtDateTimeCL(t.creada) || "—"}`,
    `Última modificación: ${fmtDateTimeCL(t.modificada) || "—"}`,
    "",
    "Saludos,",
    "",
    "Victor Espinoza Concha",
    "Gerente de Producción y Logística"
  ];

  openMailto(to, subject, bodyLines.join("\n"));
}

function notifyByEmailDraft(d) {
  const to = String(d.responsableEmail || "").trim();
  if (!to) {
    toast("No se puede notificar: falta Responsable (correo).", "warning");
    return;
  }

  const wsName = String(d.workspaceName || "").trim();
  const due = d.fechaTermino ? normalizeDueString(d.fechaTermino) : "—";
  const idTxt = String(d.id || "NUEVA");

  let customFieldsText = "";
  if (d.customFields && state.customFields) {
    const fieldsWithValues = state.customFields.filter(field =>
      d.customFields[field.id] !== undefined && d.customFields[field.id] !== ''
    );

    if (fieldsWithValues.length > 0) {
      customFieldsText = "\n\nCampos Personalizados:\n" + fieldsWithValues.map(field => {
        const value = d.customFields[field.id];
        let displayValue = String(value);

        if (field.type === 'date') {
          try {
            const date = new Date(value);
            displayValue = isNaN(date.getTime()) ? value : formatDMY(date);
          } catch (e) {
            displayValue = value;
          }
        }

        return `- ${field.name}: ${displayValue}`;
      }).join("\n");
    }
  }

  const subject = `Tarea #${idTxt} (${wsName || "Sin espacio"}): ${d.nombre || ""}`.trim();

  const bodyLines = [
    `Hola ${(d.responsableNombre || "").trim() || ""}`.trim() + ",",
    "",
    "Te notifico la siguiente tarea (borrador):",
    `- ID: ${idTxt} (si es NUEVA, el ID final se asigna al guardar)`,
    `- Espacio: ${wsName || "—"}`,
    `- Nombre: ${d.nombre || "—"}`,
    `- Descripción: ${d.descripcion || "—"}`,
    `- Estado: ${d.estado || "—"}`,
    `- Fecha término: ${due}`,
    customFieldsText,
    "",
    "Saludos,",
    "",
    "Victor Espinoza Concha",
    "Gerente de Producción y Logística"
  ];

  openMailto(to, subject, bodyLines.join("\n"));
}

function fmtDateTimeCL(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const parts = new Intl.DateTimeFormat("es-CL", {
    timeZone: TZ_CL,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
    hour12: false
  }).formatToParts(d).reduce((acc, p) => { acc[p.type] = p.value; return acc; }, {});
  return `${parts.day}-${parts.month}-${parts.year} ${parts.hour}:${parts.minute}`;
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[m]));
}

// ========== HOTKEYS ==========
function focusSearchHotkey() {
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      dom.searchEl.focus();
    }
  });
}

// ========== INICIALIZACIÓN ==========
// Nota: La función gs() está definida en utils.js
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  cacheDOM();
  initDuePicker();
  wireUI();
  initSidebar();
  focusSearchHotkey();

  // Dark mode toggle
  const btnTheme = document.getElementById("btnTheme");
  if (btnTheme) btnTheme.addEventListener("click", toggleTheme);

  bootstrap();
});
