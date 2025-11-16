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

let leaders = [];
let officers = [];
let supervisors = [];
let ncos = [];
let units = [];
let startTime = null;
let endTime = null;

let currentUnitIndex = null;

let chipContext = { type: null };

let ocrMode = "replace";

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

function wireIntro() {
  $("enterAppBtn").addEventListener("click", () => {
    $("intro").classList.add("hidden");
    $("mainLayout").classList.remove("hidden");
  });
}

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

function openChipModal(type, title, label, placeholder) {
  chipContext.type = type;
  $("chipModalTitle").textContent = title;
  $("chipModalLabel").textContent = label;
  const input = $("chipModalInput");
  input.value = "";
  input.placeholder = placeholder || "";
  $("chipModal").classList.remove("hidden");
  input.focus();
}

function closeChipModal() {
  $("chipModal").classList.add("hidden");
  chipContext.type = null;
}

function applyChipModalValue() {
  const val = $("chipModalInput").value.trim();
  if (!val) {
    showToast("الرجاء إدخال قيمة");
    return;
  }
  switch (chipContext.type) {
    case "leader":
      leaders.push(val);
      showToast("تمت إضافة قيادة");
      break;
    case "officer":
      officers.push(val);
      showToast("تمت إضافة ضابط");
      break;
    case "supervisor":
      supervisors = [val];
      showToast("تم تعيين مسؤول الفترة");
      break;
    case "nco":
      ncos.push(val);
      showToast("تمت إضافة ضابط صف");
      break;
  }
  renderAllChips();
  updateFinalResult();
  closeChipModal();
}

function wireChipModal() {
  $("chipCloseBtn").onclick = closeChipModal;
  $("chipCancelBtn").onclick = closeChipModal;
  $("chipSaveBtn").onclick = applyChipModalValue;
}

function wireChips() {
  $("addLeaderBtn").onclick = () =>
    openChipModal("leader", "إضافة قيادة", "كود القيادة", "مثال: 101");

  $("addOfficerBtn").onclick = () =>
    openChipModal("officer", "إضافة ضابط", "كود الضابط", "مثال: 1126");

  $("addSupervisorBtn").onclick = () =>
    openChipModal(
      "supervisor",
      "تعيين مسؤول الفترة",
      "مسؤول الفترة (اسم + كود)",
      "مثال: عبدالله صالح 145"
    );

  $("addNcoBtn").onclick = () =>
    openChipModal("nco", "إضافة ضابط صف", "كود ضابط الصف", "مثال: 141");
}

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
  if (!tbody) return;
  tbody.innerHTML = "";

  units.forEach((u, index) => {
    const tr = document.createElement("tr");

    tr.appendChild(buildClickableCell(u.code || "", () => openUnitModal(index)));
    tr.appendChild(buildClickableCell(u.status || "", () => openUnitModal(index)));
    tr.appendChild(buildClickableCell(u.location || "", () => openUnitModal(index)));
    tr.appendChild(buildClickableCell(u.type || "", () => openUnitModal(index)));
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
      const val = window.prompt("أدخل كود الشريك:");
      if (!val || !val.trim()) return;
      units[index].partnerCode = val.trim();
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

function updateSpeedFieldVisibility(typeValue) {
  const field = $("speedTypeField");
  if (typeValue === "سبيد يونت") {
    field.classList.remove("hidden");
  } else {
    field.classList.add("hidden");
  }
}

function openUnitModal(index) {
  const u = units[index];
  currentUnitIndex = index;

  $("modalUnitCode").value = u.code || "";
  $("modalUnitStatus").value = statusOptions.includes(u.status) ? u.status : "في الخدمة";
  $("modalUnitLocation").value = locationOptions.includes(u.location)
    ? u.location
    : "لا شي";
  $("modalUnitType").value = vehicleTypes.includes(u.type) ? u.type : "لا شي";
  $("modalUnitPartner").value = u.partnerCode || "";

  let speedSubType = "";
  if (u.type === "سبيد يونت" && u.location) {
    if (u.location.includes("فايبكس")) speedSubType = "فايبكس";
    if (u.location.includes("موتركس")) speedSubType = "موتركس";
  }
  $("modalSpeedSubType").value = speedSubType;

  updateSpeedFieldVisibility(u.type);

  $("modalUnitType").onchange = e => {
    const val = e.target.value;
    updateSpeedFieldVisibility(val);
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

    if (u.type === "سبيد يونت") {
      const sub = $("modalSpeedSubType").value;
      if (sub === "فايبكس" || sub === "موتركس") {
        const baseLoc = u.location && u.location !== "لا شي" ? u.location : "";
        u.location = baseLoc ? `${baseLoc} | ${sub}` : sub;
      }
    }

    renderUnitsTable();
    updateFinalResult();
    showToast("تم حفظ التعديل");
    closeUnitModal();
  };
}

function formatTime(date) {
  if (!date) return "—";
  return date.toLocaleTimeString("en-US", {
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

function wireOcrModeToggle() {
  const replaceBtn = $("ocrModeReplace");
  const mergeBtn = $("ocrModeMerge");

  [replaceBtn, mergeBtn].forEach(btn => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.mode;
      ocrMode = mode;

      replaceBtn.classList.remove("active");
      mergeBtn.classList.remove("active");
      btn.classList.add("active");

      showToast(mode === "replace" ? "وضع الاستبدال مفعل" : "وضع الدمج مفعل");
    });
  });
}

function applyOcrCodesToUnits(codes) {
  if (!codes.length) {
    showToast("لم يتم العثور على أكواد");
    return;
  }

  if (ocrMode === "replace") {
    units = [];
  }

  codes.forEach(code => {
    addUnitRow({
      code,
      status: "في الخدمة",
      location: "لا شي",
      type: "لا شي"
    });
  });

  renderUnitsTable();
  updateFinalResult();
}

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

    applyOcrCodesToUnits(codes);

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

function fmtUnitsPartners(arr) {
  return (
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
      .join("\n") || "-"
  );
}

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

  lines.push("توزيع الوحدات");
  lines.push(normalUnits.join("\n") || "-");
  lines.push("");

  lines.push("وحدات سبيد يونت");
  lines.push(fmtUnitsPartners(speedUnits));
  lines.push("");

  lines.push("وحدات دباب");
  lines.push(fmtUnitsPartners(bikeUnits));
  lines.push("");

  lines.push("وحدات الهلي");
  lines.push(fmtUnitsPartners(heliUnits));
  lines.push("");

  lines.push(`وقت الاستلام: ${formatTime(startTime)}`);
  lines.push(`وقت التسليم: ${formatTime(endTime)}`);
  lines.push("");
  lines.push("تم التسليم إلى :");

  return lines.join("\n");
}

function autoResizeResult() {
  const ta = $("finalResult");
  if (!ta) return;
  ta.style.height = "auto";
  ta.style.height = ta.scrollHeight + "px";
}

function updateFinalResult() {
  $("finalResult").value = buildResultText();
  autoResizeResult();
}

function wireCopy() {
  $("copyResultBtn").onclick = () => {
    const txt = $("finalResult").value;
    navigator.clipboard
      .writeText(txt)
      .then(() => showToast("تم نسخ النص"))
      .catch(() => showToast("تعذر نسخ النص"));
  };
}

function wireLiveUpdate() {
  $("operationsName").addEventListener("input", updateFinalResult);
  $("operationsDeputy").addEventListener("input", updateFinalResult);
}

function init() {
  wireIntro();
  wireChipModal();
  wireChips();
  wireModal();
  wireTimeButtons();
  wireOcrModeToggle();
  wireOcr();
  wireCopy();
  wireLiveUpdate();

  $("addUnitRowBtn").onclick = () => {
    addUnitRow();
    showToast("تمت إضافة سطر جديد");
  };

  addUnitRow();
  autoResizeResult();
}

document.addEventListener("DOMContentLoaded", init);
