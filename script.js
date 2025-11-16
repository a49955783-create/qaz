// ===== Helpers =====
function $(id) {
  return document.getElementById(id);
}

function showToast(msg, type = "success") {
  const t = $("toast");
  if (!t) return;
  t.textContent = msg;
  t.className = "toast show " + type;
  setTimeout(() => {
    t.className = "toast hidden";
  }, 2200);
}

function formatTime(date) {
  if (!date) return "—";
  let h = date.getHours();
  const m = date.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

// ===== بيانات عامّة =====
let leaders = [];
let officers = [];
let periodManagers = [];
let ncos = [];
let units = [];

let startTime = null;
let endTime = null;

// مودال تعديل
let currentUnitIndex = null;

// خيارات
const statusOptions = ["في الخدمة", "مشغول", "خارج الخدمة"];
const locationOptions = ["لا شي", "الشمال", "الجنوب", "الوسط", "بوليتو", "فايبكس"];
const vehicleTypes = ["لا شي", "سبيد يونت", "دباب", "الهلي"];

// ===== Init =====
document.addEventListener("DOMContentLoaded", () => {
  const intro = $("intro-screen");
  const introBtn = $("intro-enter-btn");
  if (intro && introBtn) {
    introBtn.addEventListener("click", () => {
      intro.style.opacity = "0";
      setTimeout(() => {
        intro.style.display = "none";
      }, 300);
    });
  }

  wireChips();
  wireUnits();
  wireTimeButtons();
  wireCopyResult();
  wireOcrInputs();
  wireModal();

  addUnitRow();
  rebuildResult();
});

// ===== Chips (قيادات / ضباط / مسؤول فترة / ضباط الصف) =====
function wireChips() {
  $("addLeaderBtn").addEventListener("click", () => {
    const val = $("leaderCodeInput").value.trim();
    if (!val) return;
    leaders.push(val);
    $("leaderCodeInput").value = "";
    renderChips("leadersList", leaders, (idx) => {
      leaders.splice(idx, 1);
      renderChips("leadersList", leaders, arguments.callee);
      rebuildResult();
    });
    rebuildResult();
  });

  $("addOfficerBtn").addEventListener("click", () => {
    const val = $("officerCodeInput").value.trim();
    if (!val) return;
    officers.push(val);
    $("officerCodeInput").value = "";
    renderChips("officersList", officers, (idx) => {
      officers.splice(idx, 1);
      renderChips("officersList", officers, arguments.callee);
      rebuildResult();
    });
    rebuildResult();
  });

  $("addPeriodManagerBtn").addEventListener("click", () => {
    const name = $("periodManagerNameInput").value.trim();
    const code = $("periodManagerCodeInput").value.trim();
    if (!name && !code) return;
    periodManagers.push({ name, code });
    $("periodManagerNameInput").value = "";
    $("periodManagerCodeInput").value = "";
    renderPeopleChips("periodManagersList", periodManagers, (idx) => {
      periodManagers.splice(idx, 1);
      renderPeopleChips("periodManagersList", periodManagers, arguments.callee);
      rebuildResult();
    });
    rebuildResult();
  });

  $("addNcoBtn").addEventListener("click", () => {
    const name = $("ncoNameInput").value.trim();
    const code = $("ncoCodeInput").value.trim();
    if (!name && !code) return;
    ncos.push({ name, code });
    $("ncoNameInput").value = "";
    $("ncoCodeInput").value = "";
    renderPeopleChips("ncosList", ncos, (idx) => {
      ncos.splice(idx, 1);
      renderPeopleChips("ncosList", ncos, arguments.callee);
      rebuildResult();
    });
    rebuildResult();
  });

  ["opName", "opCode", "opDeputyName", "opDeputyCode"].forEach((id) => {
    $(id).addEventListener("input", rebuildResult);
  });
}

function renderChips(containerId, arr, onDelete) {
  const c = $(containerId);
  c.innerHTML = "";
  arr.forEach((v, i) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = v;
    const btn = document.createElement("button");
    btn.textContent = "×";
    btn.addEventListener("click", () => onDelete(i));
    chip.appendChild(btn);
    c.appendChild(chip);
  });
}

function renderPeopleChips(containerId, arr, onDelete) {
  const c = $(containerId);
  c.innerHTML = "";
  arr.forEach((obj, i) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = `${obj.name || "-"} | ${obj.code || "-"}`;
    const btn = document.createElement("button");
    btn.textContent = "×";
    btn.addEventListener("click", () => onDelete(i));
    chip.appendChild(btn);
    c.appendChild(chip);
  });
}

// ===== وحدات =====
function wireUnits() {
  $("addUnitBtn").addEventListener("click", () => {
    addUnitRow();
    rebuildResult();
    showToast("تم إضافة وحدة جديدة", "success");
  });

  $("clearUnitsBtn").addEventListener("click", () => {
    units = [];
    renderUnitsTable();
    rebuildResult();
    showToast("تم مسح جميع الوحدات", "warning");
  });
}

function addUnitRow(initial = {}) {
  units.push({
    code: initial.code || "",
    status: initial.status || "في الخدمة",
    location: initial.location || "لا شي",
    assignment: initial.assignment || "",
    type: initial.type || "لا شي",
    partnerCode: initial.partnerCode || ""
  });
  renderUnitsTable();
}

function renderUnitsTable() {
  const tbody = $("unitsTableBody");
  tbody.innerHTML = "";
  units.forEach((u, index) => {
    const tr = document.createElement("tr");

    tr.appendChild(buildClickableCell(u.code || "", () => openUnitModal(index)));
    tr.appendChild(buildClickableCell(u.status, () => openUnitModal(index)));
    tr.appendChild(buildClickableCell(u.location, () => openUnitModal(index)));
    tr.appendChild(buildClickableCell(u.assignment || "-", () => openUnitModal(index)));
    tr.appendChild(buildClickableCell(u.type, () => openUnitModal(index)));
    tr.appendChild(buildClickableCell(u.partnerCode || "-", () => openUnitModal(index)));

    const actionsTd = document.createElement("td");

    const editBtn = document.createElement("button");
    editBtn.className = "btn btn-secondary";
    editBtn.textContent = "تعديل";
    editBtn.addEventListener("click", () => openUnitModal(index));

    const delBtn = document.createElement("button");
    delBtn.className = "btn btn-danger";
    delBtn.textContent = "حذف";
    delBtn.style.marginInlineStart = "4px";
    delBtn.addEventListener("click", () => {
      units.splice(index, 1);
      renderUnitsTable();
      rebuildResult();
      showToast("تم حذف الوحدة", "warning");
    });

    const partnerBtn = document.createElement("button");
    partnerBtn.className = "btn btn-success";
    partnerBtn.textContent = "أضف شريك";
    partnerBtn.style.marginInlineStart = "4px";
    partnerBtn.addEventListener("click", () => {
      const partner = prompt("أدخل كود الشريك:");
      if (partner) {
        units[index].partnerCode = partner.trim();
        renderUnitsTable();
        rebuildResult();
        showToast("تم إضافة الشريك", "success");
      }
    });

    actionsTd.appendChild(editBtn);
    actionsTd.appendChild(delBtn);
    actionsTd.appendChild(partnerBtn);
    tr.appendChild(actionsTd);

    tbody.appendChild(tr);
  });
}

function buildClickableCell(text, onClick) {
  const td = document.createElement("td");
  td.textContent = text || "";
  td.className = "unit-cell-clickable";
  td.addEventListener("click", onClick);
  return td;
}

// ===== مودال التعديل =====
function wireModal() {
  const modal = $("unitModal");
  const cancelBtn = $("unitModalCancel");
  const closeBtn = $("unitModalClose");
  const saveBtn = $("unitModalSave");
  const backdrop = modal.querySelector(".modal-backdrop");

  const close = () => {
    modal.classList.add("hidden");
    currentUnitIndex = null;
  };

  cancelBtn.addEventListener("click", () => {
    close();
    showToast("تم إلغاء التعديل", "warning");
  });

  closeBtn.addEventListener("click", close);
  backdrop.addEventListener("click", close);

  saveBtn.addEventListener("click", () => {
    if (currentUnitIndex == null) return;
    const u = units[currentUnitIndex];
    u.code = $("modalUnitCode").value.trim();
    u.status = $("modalUnitStatus").value;
    u.location = $("modalUnitLocation").value;
    u.type = $("modalUnitType").value;
    u.assignment = $("modalUnitAssignment").value.trim();
    u.partnerCode = $("modalUnitPartner").value.trim();

    renderUnitsTable();
    rebuildResult();
    close();
    showToast("تم حفظ تعديل الوحدة ✅", "success");
  });
}

function openUnitModal(index) {
  const u = units[index];
  currentUnitIndex = index;

  $("modalUnitCode").value = u.code || "";
  $("modalUnitStatus").value = statusOptions.includes(u.status) ? u.status : "في الخدمة";
  $("modalUnitLocation").value = locationOptions.includes(u.location) ? u.location : "لا شي";
  $("modalUnitType").value = vehicleTypes.includes(u.type) ? u.type : "لا شي";
  $("modalUnitAssignment").value = u.assignment || "";
  $("modalUnitPartner").value = u.partnerCode || "";

  $("unitModal").classList.remove("hidden");
}

// ===== الوقت =====
function wireTimeButtons() {
  $("startTimeBtn").addEventListener("click", () => {
    startTime = new Date();
    $("startTimeLabel").textContent = formatTime(startTime);
    rebuildResult();
    showToast("تم تسجيل وقت الاستلام", "success");
  });

  $("endTimeBtn").addEventListener("click", () => {
    endTime = new Date();
    $("endTimeLabel").textContent = formatTime(endTime);
    rebuildResult();
    showToast("تم تسجيل وقت التسليم", "success");
  });
}

// ===== النتيجة =====
function buildResultText() {
  const opName = $("opName").value.trim();
  const opCode = $("opCode").value.trim();
  const opDeputyName = $("opDeputyName").value.trim();
  const opDeputyCode = $("opDeputyCode").value.trim();

  const leadersLine = leaders.length ? leaders.join(" - ") : "-";
  const officersLine = officers.length ? officers.join(" - ") : "-";

  const periodLine = periodManagers.length
    ? periodManagers.map(p => `${p.name || "-"} ${p.code || ""}`.trim()).join(" ، ")
    : "-";

  const ncoLine = ncos.length
    ? ncos.map(p => `${p.name || "-"} ${p.code || ""}`.trim()).join(" ، ")
    : "-";

  const normalUnits = [];
  const speedUnits = [];
  const bikeUnits = [];
  const heliUnits = [];

  units.forEach(u => {
    if (!u.code) return;

    const baseString =
      `${u.code}` +
      (u.location && u.location !== "لا شي" ? ` | ${u.location}` : "") +
      (u.status && u.status !== "في الخدمة" ? ` | ${u.status}` : "") +
      (u.assignment ? ` | ${u.assignment}` : "");

    if (u.type === "سبيد يونت") {
      speedUnits.push(u);
    } else if (u.type === "دباب") {
      bikeUnits.push(u);
    } else if (u.type === "الهلي") {
      heliUnits.push(u);
    } else {
      normalUnits.push(baseString);
    }
  });

  const fmtPartners = arr =>
    arr.map(u => {
      const main =
        `${u.code}` +
        (u.location && u.location !== "لا شي" ? ` | ${u.location}` : "") +
        (u.status && u.status !== "في الخدمة" ? ` | ${u.status}` : "");
      if (u.partnerCode) return `${main} + ${u.partnerCode}`;
      return main;
    }).join("\n") || "-";

  const normalText = normalUnits.length ? normalUnits.join("\n") : "-";
  const speedText = fmtPartners(speedUnits);
  const bikeText = fmtPartners(bikeUnits);
  const heliText = fmtPartners(heliUnits);

  const startStr = startTime ? formatTime(startTime) : "—";
  const endStr = endTime ? formatTime(endTime) : "—";

  return [
    "استلام العمليات",
    `اسم العمليات : ${opName || "-"}${opCode ? " | " + opCode : ""}`,
    `نائب مركز العمليات : ${opDeputyName || "-"}${opDeputyCode ? " | " + opDeputyCode : ""}`,
    "",
    "القيادات",
    leadersLine,
    "",
    "الضباط",
    officersLine,
    "",
    "مسؤول فترة",
    periodLine,
    "",
    "ضباط الصف",
    ncoLine,
    "",
    "توزيع الوحدات",
    normalText,
    "",
    "وحدات سبيد يونت",
    speedText,
    "",
    "وحدات دباب",
    bikeText,
    "",
    "وحدات الهلي",
    heliText,
    "",
    `وقت الاستلام: ${startStr}`,
    `وقت التسليم: ${endStr}`,
    "",
    "تم التسليم إلى :"
  ].join("\n");
}

function rebuildResult() {
  $("finalResult").textContent = buildResultText();
}

function wireCopyResult() {
  $("copyResultBtn").addEventListener("click", async () => {
    const text = $("finalResult").textContent;
    try {
      await navigator.clipboard.writeText(text);
      showToast("تم النسخ ✅", "success");
    } catch {
      showToast("لم يتم النسخ، انسخ يدويًا.", "warning");
    }
  });
}

// ===== OCR =====
function wireOcrInputs() {
  const fileInput = $("ocr-image-input");
  if (fileInput) {
    fileInput.addEventListener("change", e => {
      const file = e.target.files[0];
      if (file) runOcrOnImageFile(file);
    });
  }

  const pasteArea = $("ocr-paste-area");
  pasteArea.addEventListener("paste", e => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.type.indexOf("image") !== -1) {
        const file = it.getAsFile();
        runOcrOnImageFile(file);
        e.preventDefault();
        return;
      }
    }
  });
}

function distributeCodesOnUnitsArray(codes) {
  if (!codes || !codes.length) return;

  while (units.length < codes.length) {
    addUnitRow();
  }

  codes.forEach((code, index) => {
    if (!units[index]) return;
    units[index].code = code;
  });
  renderUnitsTable();
  rebuildResult();
}

async function runOcrOnImageFile(file) {
  if (!window.Tesseract) {
    showToast("خطأ: مكتبة Tesseract غير متوفرة.", "error");
    return;
  }

  const progressBar = $("ocr-progress");
  const progressText = $("ocr-progress-text");
  if (progressBar) progressBar.value = 0;
  if (progressText) progressText.textContent = "0%";

  try {
    const { data } = await Tesseract.recognize(file, "eng", {
      logger: (m) => {
        if (m.status === "recognizing text" && m.progress != null && progressBar) {
          const pct = Math.round(m.progress * 100);
          progressBar.value = pct;
          if (progressText) progressText.textContent = pct + "%";
        }
      }
    });

    const raw = (data.text || "").trim();
    const codes = raw
      .split(/\s+/)
      .map(t => t.replace(/[^\d]/g, ""))
      .filter(t => t.length > 0);

    if (!codes.length) {
      showToast("لم يتم العثور على أرقام في الصورة.", "warning");
      return;
    }

    distributeCodesOnUnitsArray(codes);
    showToast("تم استخراج الأكواد وتوزيعها ✅", "success");
  } catch (err) {
    console.error(err);
    showToast("حصل خطأ أثناء تحليل الصورة.", "error");
  }
}
