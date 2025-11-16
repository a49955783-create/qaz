// ثوابت
const $ = id => document.getElementById(id);

const statusOptions = [
  "في الخدمة",
  "مشغول",
  "مشغول - اختبار",
  "مشغول - تدريب",
  "مشغول حالة موجه 10"
];

const locationOptions = [
  "لا شي",
  "الشمال",
  "الوسط",
  "الشرق",
  "الجنوب",
  "ساندي",
  "بوليتو"
];

const vehicleTypes = ["لا شي", "عادي", "سبيد يونت", "دباب", "الهلي"];

// بيانات
let leaders = [];
let officers = [];
let supervisors = []; // اسم + كود
let ncos = [];
let units = [];
let startTime = null;
let endTime = null;

// مودال
let currentUnitIndex = null;

// Toast
let toastTimeout = null;
function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2000);
}

// Intro
function wireIntro() {
  $("enterAppBtn").addEventListener("click", () => {
    $("intro").classList.add("hidden");
    $("mainLayout").classList.remove("hidden");
  });
}

// Chips helpers
function renderChips(list, containerId) {
  const container = $(containerId);
  container.innerHTML = "";
  list.forEach((value, index) => {
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.textContent = value;
    const x = document.createElement("span");
    x.className = "chip-remove";
    x.textContent = "×";
    x.onclick = () => {
      list.splice(index, 1);
      renderAllChips();
      updateFinalResult();
      showToast("تم الحذف");
    };
    chip.appendChild(x);
    container.appendChild(chip);
  });
}

function renderAllChips() {
  renderChips(leaders, "leadersList");
  renderChips(officers, "officersList");
  renderChips(supervisors, "supervisorList");
  renderChips(ncos, "ncosList");
}

function promptValue(title) {
  const val = window.prompt(title);
  return val && val.trim() ? val.trim() : null;
}

function wireChips() {
  $("addLeaderBtn").onclick = () => {
    const v = promptValue("أدخل كود القيادة:");
    if (!v) return;
    leaders.push(v);
    renderAllChips();
    updateFinalResult();
    showToast("تمت إضافة قيادة");
  };

  $("addOfficerBtn").onclick = () => {
    const v = promptValue("أدخل كود الضابط:");
    if (!v) return;
    officers.push(v);
    renderAllChips();
    updateFinalResult();
    showToast("تمت إضافة ضابط");
  };

  $("addSupervisorBtn").onclick = () => {
    const v = promptValue("أدخل اسم + كود مسؤول الفترة:");
    if (!v) return;
    supervisors = [v]; // دائمًا واحد فقط
    renderAllChips();
    updateFinalResult();
    showToast("تم تعيين مسؤول الفترة");
  };

  $("addNcoBtn").onclick = () => {
    const v = promptValue("أدخل كود ضابط الصف:");
    if (!v) return;
    ncos.push(v);
    renderAllChips();
    updateFinalResult();
    showToast("تمت إضافة ضابط صف");
  };
}

// وحدات
function addUnitRow(initial = {}) {
  units.push({
    code: initial.code || "",
    status: initial.status || "في الخدمة",
    location: initial.location || "لا شي",
    type: initial.type || "لا شي",
    partnerCode: initial.partnerCode || ""
  });
  renderUnitsTable();
  updateFinalResult();
}

function buildClickableCell(text, onClick) {
  const td = document.createElement("td");
  td.textContent = text || "";
  td.className = "clickable-cell";
  td.onclick = onClick;
  return td;
}

function renderUnitsTable() {
  const tbody = $("unitsTableBody");
  tbody.innerHTML = "";

  units.forEach((u, index) => {
    const tr = document.createElement("tr");

    tr.appendChild(buildClickableCell(u.code || "", () => openUnitModal(index)));
    tr.appendChild(buildClickableCell(u.status, () => openUnitModal(index)));
    tr.appendChild(buildClickableCell(u.location, () => openUnitModal(index)));
    tr.appendChild(buildClickableCell(u.type, () => openUnitModal(index)));
    tr.appendChild(buildClickableCell(u.partnerCode || "-", () => openUnitModal(index)));

    const actionsTd = document.createElement("td");

    const editBtn = document.createElement("button");
    editBtn.className = "btn btn-ghost";
    editBtn.textContent = "تعديل";
    editBtn.onclick = () => openUnitModal(index);

    const partnerBtn = document.createElement("button");
    partnerBtn.className = "btn btn-secondary";
    partnerBtn.textContent = "إضافة شريك";
    partnerBtn.onclick = () => {
      const val = promptValue("أدخل كود الشريك:");
      if (!val) return;
      units[index].partnerCode = val;
      renderUnitsTable();
      updateFinalResult();
      showToast("تمت إضافة الشريك");
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-ghost";
    deleteBtn.textContent = "حذف";
    deleteBtn.onclick = () => {
      units.splice(index, 1);
      renderUnitsTable();
      updateFinalResult();
      showToast("تم الحذف");
    };

    actionsTd.appendChild(editBtn);
    actionsTd.appendChild(partnerBtn);
    actionsTd.appendChild(deleteBtn);

    tr.appendChild(actionsTd);
    tbody.appendChild(tr);
  });
}

// Modal
function openUnitModal(index) {
  const u = units[index];
  currentUnitIndex = index;

  $("modalUnitCode").value = u.code || "";
  $("modalUnitStatus").value = statusOptions.includes(u.status) ? u.status : "في الخدمة";
  $("modalUnitLocation").value = locationOptions.includes(u.location) ? u.location : "لا شي";
  $("modalUnitType").value = vehicleTypes.includes(u.type) ? u.type : "لا شي";
  $("modalUnitPartner").value = u.partnerCode || "";

  const typeSelect = $("modalUnitType");
  typeSelect.onchange = () => {
    if (typeSelect.value === "سبيد يونت") {
      const choice = window.prompt("نوع سبيد يونت؟ اكتب: فايبكس أو موتركس", "فايبكس");
      if (choice && (choice.trim() === "فايبكس" || choice.trim() === "موتركس")) {
        // نخزّن نوع السرعة كموقع إضافي لو ترغب
        if (!u.location || u.location === "لا شي") {
          u.location = choice.trim();
        } else {
          u.location = `${u.location} | ${choice.trim()}`;
        }
        $("modalUnitLocation").value = u.location;
      }
    }
  };

  $("unitModal").classList.remove("hidden");
}

function closeUnitModal() {
  $("unitModal").classList.add("hidden");
  currentUnitIndex = null;
}

function wireModal() {
  $("closeModalBtn").onclick = closeUnitModal;
  $("cancelUnitBtn").onclick = closeUnitModal;

  $("saveUnitBtn").onclick = () => {
    if (currentUnitIndex == null) return;
    const u = units[currentUnitIndex];
    u.code = $("modalUnitCode").value.trim();
    u.status = $("modalUnitStatus").value;
    u.location = $("modalUnitLocation").value;
    u.type = $("modalUnitType").value;
    u.partnerCode = $("modalUnitPartner").value.trim();

    renderUnitsTable();
    updateFinalResult();
    showToast("تم حفظ التعديل");
    closeUnitModal();
  };
}

// وقت الاستلام والتسليم
function formatTime(date) {
  if (!date) return "—";
  return date.toLocaleTimeString("ar-SA", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function wireTimeButtons() {
  $("startTimeBtn").onclick = () => {
    startTime = new Date();
    $("startTimeDisplay").textContent = formatTime(startTime);
    updateFinalResult();
    showToast("تم تسجيل وقت الاستلام");
  };

  $("endTimeBtn").onclick = () => {
    endTime = new Date();
    $("endTimeDisplay").textContent = formatTime(endTime);
    updateFinalResult();
    showToast("تم تسجيل وقت التسليم");
  };
}

// OCR (توزيع الأكواد فقط على حقل الكود في الوحدات)
async function runOcrOnImageFile(file) {
  if (!file) return;
  if (typeof Tesseract === "undefined") {
    showToast("مكتبة OCR غير متوفرة");
    return;
  }

  $("ocrStatusLabel").textContent = "جاري التحليل...";
  $("ocrProgressBar").style.width = "0%";
  $("ocrProgressValue").textContent = "0%";

  try {
    const { data } = await Tesseract.recognize(file, "eng", {
      logger: m => {
        if (m.status === "recognizing text" && m.progress) {
          const pct = Math.round(m.progress * 100);
          $("ocrProgressBar").style.width = pct + "%";
          $("ocrProgressValue").textContent = pct + "%";
        }
      }
    });

    const text = data.text || "";
    const codes = text.match(/\d+/g) || [];

    // توزيع على القائمة عموديًا: كل كود = سطر جديد للوحدة
    codes.forEach(code => {
      addUnitRow({ code, status: "في الخدمة", location: "لا شي", type: "لا شي" });
    });

    $("ocrStatusLabel").textContent = "تم التحليل";
    showToast("تم توزيع الأكواد على القائمة");
  } catch (e) {
    console.error(e);
    $("ocrStatusLabel").textContent = "حدث خطأ أثناء التحليل";
    showToast("حدث خطأ أثناء التحليل");
  } finally {
    $("ocrProgressBar").style.width = "100%";
    $("ocrProgressValue").textContent = "100%";
    setTimeout(() => {
      $("ocrProgressBar").style.width = "0%";
      $("ocrProgressValue").textContent = "0%";
      $("ocrStatusLabel").textContent = "جاهز";
    }, 1200);
  }
}

function wireOcr() {
  $("ocrFileInput").addEventListener("change", e => {
    const file = e.target.files[0];
    if (file) runOcrOnImageFile(file);
  });

  // لصق صورة داخل pasteArea
  $("pasteArea").addEventListener("paste", e => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf("image") !== -1) {
        const file = item.getAsFile();
        if (file) {
          runOcrOnImageFile(file);
          e.preventDefault();
          break;
        }
      }
    }
  });
}

// النتيجة النهائية
function buildResultText() {
  let lines = [];

  const operationsName = $("operationsName").value.trim() || "-";
  const operationsDeputy = $("operationsDeputy").value.trim() || "-";

  lines.push("استلام العمليات");
  lines.push(`اسم العمليات : ${operationsName}`);
  lines.push(`نائب مركز العمليات : ${operationsDeputy}`);
  lines.push("");

  lines.push("القيادات");
  lines.push(leaders.length ? leaders.join(" - ") : "-");
  lines.push("");

  lines.push("الضباط");
  lines.push(officers.length ? officers.join(" - ") : "-");
  lines.push("");

  lines.push("مسؤول فترة");
  lines.push(supervisors.length ? supervisors.join(" - ") : "-");
  lines.push("");

  lines.push("ضباط الصف");
  lines.push(ncos.length ? ncos.join(" - ") : "-");
  lines.push("");

  const normalUnits = [];
  const speedUnits = [];
  const bikeUnits = [];
  const heliUnits = [];

  units.forEach(u => {
    const baseString =
      `${u.code}` +
      (u.location && u.location !== "لا شي" ? ` | ${u.location}` : "") +
      (u.status && u.status !== "في الخدمة" ? ` | ${u.status}` : "");

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
    arr
      .map(u => {
        const codePart = u.partnerCode
          ? `${u.code} + ${u.partnerCode}`
          : `${u.code}`;
        const locationPart =
          u.location && u.location !== "لا شي" ? ` | ${u.location}` : "";
        const statusPart =
          u.status && u.status !== "في الخدمة" ? ` | ${u.status}` : "";
        return `${codePart}${locationPart}${statusPart}`;
      })
      .join("\n") || "-";

  lines.push("توزيع الوحدات");
  lines.push(normalUnits.join("\n") || "-");
  lines.push("");

  lines.push("وحدات سبيد يونت");
  lines.push(fmtPartners(speedUnits));
  lines.push("");

  lines.push("وحدات دباب");
  lines.push(fmtPartners(bikeUnits));
  lines.push("");

  lines.push("وحدات الهلي");
  lines.push(fmtPartners(heliUnits));
  lines.push("");

  lines.push(`وقت الاستلام: ${formatTime(startTime)}`);
  lines.push(`وقت التسليم: ${formatTime(endTime)}`);
  lines.push("");
  lines.push("تم التسليم إلى :");

  return lines.join("\n");
}

function updateFinalResult() {
  $("finalResult").value = buildResultText();
}

// Copy
function wireCopy() {
  $("copyResultBtn").onclick = () => {
    const txt = $("finalResult").value;
    navigator.clipboard
      .writeText(txt)
      .then(() => showToast("تم نسخ النص"))
      .catch(() => showToast("تعذر نسخ النص"));
  };
}

// ربط أحداث المدخلات لتحديث النتيجة مباشرة
function wireLiveUpdate() {
  $("operationsName").addEventListener("input", updateFinalResult);
  $("operationsDeputy").addEventListener("input", updateFinalResult);
}

// Init
function init() {
  wireIntro();
  wireChips();
  wireModal();
  wireTimeButtons();
  wireOcr();
  wireCopy();
  wireLiveUpdate();

  // سطر واحد مبدئي للوحدات
  addUnitRow();
}

document.addEventListener("DOMContentLoaded", init);
