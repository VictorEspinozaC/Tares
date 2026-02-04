// ===== UTILIDADES Y FUNCIONES AUXILIARES =====

// Caché de referencias DOM (se cachean al iniciar)
const domCache = {};

function cacheDOM() {
  // Header controls
  domCache.btnViewBoard = document.getElementById("btnViewBoard");
  domCache.btnViewTable = document.getElementById("btnViewTable");
  domCache.btnViewAll = document.getElementById("btnViewAll");
  domCache.viewBoard = document.getElementById("viewBoard");
  domCache.viewTable = document.getElementById("viewTable");
  domCache.viewAll = document.getElementById("viewAll");
  domCache.viewTitle = document.getElementById("viewTitle");

  domCache.searchEl = document.getElementById("search");
  domCache.sortByEl = document.getElementById("sortBy");
  domCache.statsEl = document.getElementById("stats");
  domCache.wsBadge = document.getElementById("wsBadge");
  domCache.sbCounts = document.getElementById("sbCounts");

  domCache.btnCreate = document.getElementById("btnCreate");
  domCache.btnExportXLSX = document.getElementById("btnExportXLSX");
  domCache.btnOverdue = document.getElementById("btnOverdue");
  domCache.overdueCount = document.getElementById("overdueCount");

  domCache.wsList = document.getElementById("wsList");
  domCache.boardEl = document.getElementById("board");
  domCache.tbody = document.getElementById("tbody");

  // Modal Task
  domCache.modalBackdrop = document.getElementById("modalBackdrop");
  domCache.dlgCloseX = document.getElementById("dlgCloseX");
  domCache.taskForm = document.getElementById("taskForm");
  domCache.dlgTitle = document.getElementById("dlgTitle");
  domCache.dlgSub = document.getElementById("dlgSub");

  domCache.f_name = document.getElementById("f_name");
  domCache.f_resp = document.getElementById("f_resp");
  domCache.f_desc = document.getElementById("f_desc");
  domCache.f_status = document.getElementById("f_status");
  domCache.f_wsSelect = document.getElementById("f_wsSelect");
  domCache.f_dueDateDisplay = document.getElementById("f_dueDateDisplay");
  domCache.f_dueDate = document.getElementById("f_dueDate");
  domCache.btnDueOpen = document.getElementById("btnDueOpen");
  domCache.f_closedAt = document.getElementById("f_closedAt");
  domCache.f_meta = document.getElementById("f_meta");
  domCache.btnCancelTask = document.getElementById("btnCancelTask");
  domCache.btnDeleteTask = document.getElementById("btnDeleteTask");
  domCache.f_notifyOnSave = document.getElementById("f_notifyOnSave");
  domCache.f_files = document.getElementById("f_files");
  domCache.attachList = document.getElementById("attachList");
  domCache.attachCount = document.getElementById("attachCount");
  domCache.filePendingInfo = document.getElementById("filePendingInfo");
  domCache.customFieldsCount = document.getElementById("customFieldsCount");
  domCache.noCustomFieldsMsg = document.getElementById("noCustomFieldsMsg");
  domCache.customFieldsContainer = document.getElementById("customFieldsContainer");

  // Modal Responsables
  domCache.respBackdrop = document.getElementById("respBackdrop");
  domCache.btnCloseResp = document.getElementById("btnCloseResp");
  domCache.btnRespDone = document.getElementById("btnRespDone");
  domCache.r_name = document.getElementById("r_name");
  domCache.r_email = document.getElementById("r_email");
  domCache.btnAddResp = document.getElementById("btnAddResp");
  domCache.btnClearResp = document.getElementById("btnClearResp");
  domCache.respTbody = document.getElementById("respTbody");

  // Modal Vencidas
  domCache.overdueBackdrop = document.getElementById("overdueBackdrop");
  domCache.btnCloseOverdue = document.getElementById("btnCloseOverdue");
  domCache.overdueTbody = document.getElementById("overdueTbody");
  domCache.overdueSummary = document.getElementById("overdueSummary");
  domCache.btnOverdueRefresh = document.getElementById("btnOverdueRefresh");
  domCache.btnOverdueGoCurrent = document.getElementById("btnOverdueGoCurrent");

  // Modal Admin Espacios
  domCache.adminWSBackdrop = document.getElementById("adminWSBackdrop");
  domCache.btnCloseAdminWS = document.getElementById("btnCloseAdminWS");
  domCache.btnAdminWSDone = document.getElementById("btnAdminWSDone");
  domCache.adminWSTbody = document.getElementById("adminWSTbody");
  domCache.wsAdminCount = document.getElementById("wsAdminCount");
  domCache.activeWSCount = document.getElementById("activeWSCount");
  domCache.hiddenWSCount = document.getElementById("hiddenWSCount");
  domCache.tasksInWSCount = document.getElementById("tasksInWSCount");
  domCache.newWSName = document.getElementById("newWSName");
  domCache.btnCreateNewWS = document.getElementById("btnCreateNewWS");
  domCache.btnClearNewWS = document.getElementById("btnClearNewWS");

  // Modal confirmar eliminar espacio
  domCache.confirmDeleteWSBackdrop = document.getElementById("confirmDeleteWSBackdrop");
  domCache.wsToDeleteName = document.getElementById("wsToDeleteName");
  domCache.wsToDeleteTaskCount = document.getElementById("wsToDeleteTaskCount");
  domCache.deleteAllTaskCount = document.getElementById("deleteAllTaskCount");
  domCache.moveToWSSelect = document.getElementById("moveToWSSelect");
  domCache.moveTasksSection = document.getElementById("moveTasksSection");
  domCache.btnCancelDeleteWS = document.getElementById("btnCancelDeleteWS");
  domCache.btnConfirmDeleteWS = document.getElementById("btnConfirmDeleteWS");

  // Modal Configuración
  domCache.configBackdrop = document.getElementById("configBackdrop");
  domCache.btnConfig = document.getElementById("btnConfig");
  domCache.btnCloseConfig = document.getElementById("btnCloseConfig");
  domCache.btnConfigDone = document.getElementById("btnConfigDone");
  domCache.btnConfigManageResp = document.getElementById("btnConfigManageResp");
  domCache.btnConfigManageWS = document.getElementById("btnConfigManageWS");
  domCache.btnConfigManageFields = document.getElementById("btnConfigManageFields");

  // Modal Admin Campos Personalizados
  domCache.manageFieldsBackdrop = document.getElementById("manageFieldsBackdrop");
  domCache.btnCloseManageFields = document.getElementById("btnCloseManageFields");
  domCache.btnManageFieldsDone = document.getElementById("btnManageFieldsDone");
  domCache.newFieldName = document.getElementById("newFieldName");
  domCache.newFieldType = document.getElementById("newFieldType");
  domCache.btnAddCustomField = document.getElementById("btnAddCustomField");
  domCache.btnClearNewField = document.getElementById("btnClearNewField");
  domCache.fieldsCount = document.getElementById("fieldsCount");
  domCache.emptyFieldsMessage = document.getElementById("emptyFieldsMessage");
  domCache.fieldsConfigContainer = document.getElementById("fieldsConfigContainer");
}

// Función debounce para búsqueda
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

// Funciones auxiliares
function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[m]));
}

function makeUUID() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function makeFieldId() {
  return 'field_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function formatDMY(date) {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = date.getFullYear();
  return `${dd}-${mm}-${yy}`;
}

function formatDMYHM(d) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}-${mm}-${yy} ${hh}:${mi}`;
}

function fmtDateTimeCL(iso, TZ_CL = "America/Santiago") {
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

function formatDateOnly(iso, TZ_CL = "America/Santiago") {
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

function getFirstLine(text) {
  if (!text) return "";
  const lines = text.split('\n');
  return lines[0] || "";
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

function normalizeDueString(s) {
  const d = parseDueDate(s);
  return d ? formatDMYHM(d) : String(s || "");
}

function sanitizeFile(name) {
  return String(name).replace(/[\\\/:*?"<>|]+/g, "_").trim() || "archivo";
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

function filesToPayload(files) {
  return Promise.all(Array.from(files || []).map(fileToPayload));
}

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

// Wrapper genérico para llamadas a supabaseService
async function gs(fnName, ...args) {
  const svc = window.supabaseService;
  if (!svc) {
    console.error("supabaseService no está disponible");
    return { ok: false, error: "supabaseService no disponible" };
  }

  switch (fnName) {
    case "getBootstrap":
      return await svc.getBootstrap();
    case "upsertWorkspace":
      return await svc.upsertWorkspace(args[0]);
    case "upsertTarea":
      return await svc.upsertTarea(args[0]);
    case "deleteTarea":
      return await svc.deleteTarea(args[0]);
    case "upsertResponsable":
      return await svc.upsertResponsable(args[0]);
    case "setResponsableActive":
      return await svc.setResponsableActive(args[0], args[1]);
    case "upsertCustomField":
      return await svc.upsertCustomField(args[0]);
    case "deleteCustomField":
      return await svc.deleteCustomField(args[0]);
    case "uploadTaskAttachments":
      return await svc.uploadTaskAttachments(args[0], args[1]);
    case "deleteTaskAttachment":
      return await svc.deleteTaskAttachment(args[0], args[1]);
    case "deleteWorkspace":
      return await svc.deleteWorkspace(args[0]);
    case "moveTasksToWorkspace":
      return await svc.moveTasksToWorkspace(args[0], args[1]);

    // AUTH wrappers
    case "authSignUp": return await svc.authSignUp(args[0], args[1], args[2]);
    case "authSignIn": return await svc.authSignIn(args[0], args[1]);
    case "authSignOut": return await svc.authSignOut();
    case "authResetPassword": return await svc.authResetPassword(args[0]);
    case "authGetSession": return await svc.authGetSession();
    case "authGetUser": return await svc.authGetUser();
    case "createUserInResponsables": return await svc.createUserInResponsables(args[0], args[1], args[2]);
    case "getUserRole": return await svc.getUserRole(args[0]);

    default:
      console.warn(`Función ${fnName} no implementada`);
      return { ok: false, error: "No implementado" };
  }
}
