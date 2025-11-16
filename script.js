// ==================== Helpers أساسية ====================

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

// ==================== بيانات ====================

let leaders = [];
let officers = [];
let periodManagers = []; // {name, code}
let ncos = [];           // {name, code}

let units = []; // صفوف الوحدات

let startTime = null;
let endTime = null;

// ==================== انترو ====================

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

  wireBasicButtons();
  wireChipButtons();
  wireUnits();
  wireTimeButtons();
  wireCopyResult();
  wireOcrInputs();

  // إضافة صف واحد افتراضياً
  addUnitRow();
  rebuildResult();
});

// ==================== الحقول (قيادات / ضباط / مسؤول فترة / ضباط الصف) ====================

function wireChipButtons() {
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

  // تحديث النتيجة عند تغيير اسم العمليات/النائب
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

// ==================== الوحدات ====================

const statusOptions = ["في الخدمة", "مشغول", "خارج الخدمة"];
const locationOptions = ["لا شي", "الشمال", "الجنوب", "الوسط", "بوليتو", "فايبكس"];
// نوع المركبة – أزلنا "وحدة عادية"
const vehicleTypes = ["لا شي", "سبيد يونت", "دباب", "الهلي"];

function wireUnits() {
  $("addUnitBtn").addEventListener("click", () => {
    addUnitRow();
    rebuildResult();
  });

  $("clearUnitsBtn").addEventListener("click", () => {
    units = [];
    renderUnitsTable();
    rebuildResult();
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

    // الكود
    tr.appendChild(buildClickableCell(u.code || "", () => openUnitModal(index)));

    // الحالة
    tr.appendChild(buildClickableCell(u.status, () => openUnitModal(index)));

    // الموقع
    tr.appendChild(buildClickableCell(u.location, () => openUnitModal(index)));

    // توزيع الوحدات
    tr.appendChild(buildClickableCell(u.assignment || "-", () => openUnitModal(index)));

    // نوع المركبة
    tr.appendChild(buildClickableCell(u.type, () => openUnitModal(index)));

    // الشريك
    tr.appendChild(buildClickableCell(u.partnerCode ? u.partnerCode : "-", () => openUnitModal(index)));

    // إجراءات
    const actionsTd = document.createElement("td");
    const delBtn = document.createElement("button");
    delBtn.className = "btn btn-danger";
    delBtn.textContent = "حذف";
    delBtn.addEventListener("click", () => {
      units.splice(index, 1);
      renderUnitsTable();
      rebuildResult();
    });
    const partnerBtn = document.createElement("button");
    partnerBtn.className = "btn btn-success";
    partnerBtn.style.marginInlineStart = "4px";
    partnerBtn.textContent = "أضف شريك";
    partnerBtn.addEventListener("click", () => {
      const partner = prompt("أدخل كود الشريك:");
      if (partner) {
        units[index].partnerCode = partner.trim();
        renderUnitsTable();
        rebuildResult();
      }
    });

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

// نافذة تعديل بسيطة (prompt) – عشان ما نثقل عليك بمودال CSS جديد
function openUnitModal(index) {
  const u = units[index];
  const code = prompt("الكود:", u.code || "") ?? u.code;
  const status = prompt(`الحالة (${statusOptions.join(" / ")}):`, u.status) ?? u.status;
  const location = prompt(`الموقع (${locationOptions.join(" / ")}):`, u.location) ?? u.location;
  const assignment = prompt("توزيع الوحدات:", u.assignment || "") ?? u.assignment;
  const type = prompt(`نوع المركبة (${vehicleTypes.join(" / ")}):`, u.type) ?? u.type;
  const partner = prompt("كود الشريك (إن وجد):", u.partnerCode || "") ?? u.partnerCode;

  u.code = code.trim();
  u.status = status.trim();
  u.location = location.trim();
  u.assignment = assignment.trim();
  u.type = type.trim();
  u.partnerCode = partner.trim();

  renderUnitsTable();
  rebuildResult();
}

// ==================== الوقت ====================

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

// ==================== النتيجة النهائية ====================

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

  // تقسيم الوحدات حسب نوع المركبة
  const normalUnits = [];
  const speedUnits = [];
  const bikeUnits = [];
  const heliUnits = [];

  units.forEach(u => {
    if (!u.code) return;

    const baseString = `${u.code}${u.location && u.location !== "لا شي" ? " | " + u.location : ""}${u.status && u.status !== "في الخدمة" ? " | " + u.status : ""}${u.assignment ? " | " + u.assignment : ""}`;

    if (u.type === "سبيد يونت") {
      speedUnits.push(u);
    } else if (u.type === "دباب") {
      bikeUnits.push(u);
    } else if (u.type === "الهلي") {
      heliUnits.push(u);
    } else {
      normalUnits.push(baseString || u.code);
    }
  });

  const fmtPartners = arr =>
    arr.map(u => {
      if (u.partnerCode) {
        return `${u.code} + ${u.partnerCode}${u.location && u.location !== "لا شي" ? " | " + u.location : ""}${u.status && u.status !== "في الخدمة" ? " | " + u.status : ""}`;
      }
      return `${u.code}${u.location && u.location !== "لا شي" ? " | " + u.location : ""}${u.status && u.status !== "في الخدمة" ? " | " + u.status : ""}`;
    }).join("\n") || "-";

  const normalText = normalUnits.length ? normalUnits.join("\n") : "-";
  const speedText = fmtPartners(speedUnits);
  const bikeText = fmtPartners(bikeUnits);
  const heliText = fmtPartners(heliUnits);

  const startStr = startTime ? formatTime(startTime) : "—";
  const endStr = endTime ? formatTime(endTime) : "—";

  return [
    "استلام العمليات",
    `اسم العمليات : ${opName || "-"} ${opCode ? "| " + opCode : ""}`,
    `نائب مركز العمليات : ${opDeputyName || "-"} ${opDeputyCode ? "| " + opDeputyCode : ""}`,
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

// ==================== OCR (Tesseract.js) ====================

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

// توزيع الأكواد على الكود في الجدول
function distributeCodesOnUnitsArray(codes) {
  if (!codes || !codes.length) return;
  // لو ما فيه صفوف كافية نضيف
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
      logger: m => {
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

// ==================== Basic buttons ====================

function wireBasicButtons() {
  // فقط placeholder لو احتجنا أزرار إضافية لاحقاً
}
