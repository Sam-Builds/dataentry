const SUPABASE_URL = "https://nlpmptgsupukqljbdgjr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_yjBdIWUbsLlT9WsdTTYulw_ffkuwZXi";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
loadSubjects(); 
loadMembers();

let modalState = {
  marks: {},
  attendance: {},
};

function semToYear(sem) {
  if (sem <= 2) return 1;
  if (sem <= 4) return 2;
  if (sem <= 6) return 3;
  return 4;
}

function gradeFromPercentage(p) {
  if (p >= 85) return "A";
  if (p >= 75) return "B";
  return "C";
}

if (
  sessionStorage.getItem("auth") !== "true" &&
  localStorage.getItem("auth") !== "true"
) {
  window.location.href = "index.html";
}
function getSubjectsForSem(sem) {
  const year = semToYear(Number(sem));
  return subjects.filter(s => s.year === year);
}


if (supabaseClient) {
  console.log("Supabase client initialized");
}

loadMembers();
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
}
let subjects = [];

let members = [];

async function loadMembers() {
  const { data, error } = await supabaseClient
    .from("members")
    .select("id, name, admissionNumber, progress");

  if (error) {
    console.error(error);
    return;
  }

  members = data;
  renderMembers(members);
}

function renderMembers(list) {
  const container = document.getElementById("studentsContainer");

  // remove old  student cards (keep subject + search)
  document
    .querySelectorAll(".student-card[data-student]")
    .forEach((e) => e.remove());

  list.forEach((m) => {
    const status =
      m.progress === 1
        ? { text: "COMPLETED", cls: "ok" }
        : { text: "INCOMPLETE", cls: "missing" };

    const card = document.createElement("div");
    card.className = "student-card";
    card.dataset.student = "true";

    card.innerHTML = `
      <div class="student-row">
        <div>
          <div class="student-name">${m.name ?? "—"}</div>
          <div class="student-meta">
            ${m.admissionNumber ?? "—"}
          </div>
        </div>
        <span class="status ${status.cls}">
          ${status.text}
        </span>
      </div>
    `;

    card.addEventListener("click", async () => {
      selectedMember = m;

      document.getElementById("modalStudentName").textContent = m.name ?? "—";
      document.getElementById("modalAdmission").textContent =
        "Admission No: " + (m.admissionNumber ?? "—");

      // load marks + attendance row
      const { data } = await supabaseClient
        .from("students_marks_attendence")
        .select("marks, attendence_percentage")
        .eq("id", m.id)
        .maybeSingle();

      modalState.marks = data?.marks ?? {};
      modalState.attendance = data?.attendence_percentage ?? {};

      renderMarks();
      renderAttendance();

      document.getElementById("studentModal").classList.add("open");
    });

    container.appendChild(card);
  });
}

document.getElementById("addMarksBtn").addEventListener("click", () => {
  addMarksBlock();
});

function addMarksBlock() {
  const container = document.getElementById("marksContainer");

  const form = document.createElement("div");
  form.className = "inline-form";

  form.innerHTML = `
    <div class="inline-form-row">
      <select class="search-input sem-select">
        ${[1,2,3,4,5,6,7,8].map(s => `<option value="${s}">SEM ${s}</option>`).join("")}
      </select>

      <select class="search-input exam-select">
        <option value="1IA">1st IA</option>
        <option value="2IA">2nd IA</option>
        <option value="SEM">Semester Exam</option>
      </select>
    </div>

    <div class="inline-form-row">
      <select class="search-input subject-select">
  <option value="">Select subject</option>
</select>
      <input class="search-input mark-input" type="number" min="0" max="50" placeholder="Marks / 50" />
    </div>

    <button class="action-btn save-mark-btn">Add</button>
  `;

  const semSelect = form.querySelector(".sem-select");
const subjectSelect = form.querySelector(".subject-select");

function populateSubjects() {
  const sem = semSelect.value;
  const list = getSubjectsForSem(sem);

  subjectSelect.innerHTML =
    `<option value="">Select subject</option>` +
    list
      .map(s => `<option value="${s.code}">${s.code} — ${s.subject_name}</option>`)
      .join("");
}
semSelect.value = 1;

populateSubjects();

semSelect.addEventListener("change", populateSubjects);

  form.querySelector(".save-mark-btn").addEventListener("click", () => {
    const sem = form.querySelector(".sem-select").value;
    const exam = form.querySelector(".exam-select").value;
const subject = form.querySelector(".subject-select").value;
    const marks = parseInt(form.querySelector(".mark-input").value, 10);

    if (!subject || isNaN(marks) || marks < 0 || marks > 50) return;

    const semKey = `SEM${sem}`;
    modalState.marks[semKey] ??= {};
    modalState.marks[semKey][exam] ??= {};
    modalState.marks[semKey][exam][subject] = marks;

    renderMarks();
    form.remove();
  });

  container.prepend(form);
}



function renderMarks() {
  const container = document.getElementById("marksContainer");
  container.innerHTML = "";

  for (const sem in modalState.marks) {
    for (const exam in modalState.marks[sem]) {
      const block = document.createElement("div");
      block.className = "student-card";

      block.innerHTML = `<b>${sem} – ${exam}</b>`;

      Object.entries(modalState.marks[sem][exam]).forEach(([code, mark]) => {
        block.innerHTML += `
          <div class="student-meta">${code}: ${mark}/50</div>
        `;
      });

      container.appendChild(block);
    }
  }
}


document.getElementById("addAttendanceBtn").addEventListener("click", () => {
  const container = document.getElementById("attendanceContainer");

  const form = document.createElement("div");
  form.className = "inline-form";

  form.innerHTML = `
    <div class="inline-form-row">
      <select class="search-input sem-select">
        ${[1,2,3,4,5,6,7,8].map(s => `<option value="${s}">SEM ${s}</option>`).join("")}
      </select>
<select class="search-input subject-select">
  <option value="">Select subject</option>
</select>
    </div>

    <div class="inline-form-row">
      <input class="search-input perc-input" type="number" min="0" max="100" placeholder="Attendance %" />
    </div>

    <button class="action-btn save-att-btn">Add</button>
  `;

  const semSelect = form.querySelector(".sem-select");
const subjectSelect = form.querySelector(".subject-select");

function populateSubjects() {
  const sem = semSelect.value;
  const list = getSubjectsForSem(sem);

  subjectSelect.innerHTML =
    `<option value="">Select subject</option>` +
    list
      .map(s => `<option value="${s.code}">${s.code} — ${s.subject_name}</option>`)
      .join("");
}
semSelect.value = 1;

populateSubjects();
semSelect.addEventListener("change", populateSubjects);


  form.querySelector(".save-att-btn").addEventListener("click", () => {
    const sem = form.querySelector(".sem-select").value;
const subject = form.querySelector(".subject-select").value;
    const perc = parseFloat(form.querySelector(".perc-input").value);

    if (!subject || isNaN(perc) || perc < 0 || perc > 100) return;

    const semKey = `SEM${sem}`;
    modalState.attendance[semKey] ??= {};
    modalState.attendance[semKey][subject] = {
      percentage: perc,
      grade: gradeFromPercentage(perc)
    };

    renderAttendance();
    form.remove();
  });

  container.prepend(form);
});


function renderAttendance() {
  const container = document.getElementById("attendanceContainer");
  container.innerHTML = "";

  for (const sem in modalState.attendance) {
    for (const code in modalState.attendance[sem]) {
      const a = modalState.attendance[sem][code];
      container.innerHTML += `
        <div class="student-card">
          ${sem} – ${code}: ${a.percentage}% (${a.grade})
        </div>
      `;
    }
  }
}



document.getElementById("saveAllBtn").addEventListener("click", async () => {
  const { error } = await supabaseClient
    .from("students_marks_attendence")
    .upsert({
      id: selectedMember.id,
      marks: modalState.marks,
      attendence_percentage: modalState.attendance
    });

  if (error) {
    console.error(error);
    return;
  }

  modal.classList.remove("open");
});



document.getElementById("studentSearch").addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase().trim();

  const filtered = members.filter(
    (m) =>
      (m.name && m.name.toLowerCase().includes(q)) ||
      (m.admissionNumber && String(m.admissionNumber).includes(q))
  );

  renderMembers(filtered);
});

document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", () => {
    const view = item.dataset.view;

    // active sidebar
    document
      .querySelectorAll(".nav-item")
      .forEach((n) => n.classList.remove("active"));
    item.classList.add("active");

    // switch view
    document
      .querySelectorAll(".view")
      .forEach((v) => v.classList.remove("active"));
    document.getElementById(`view-${view}`).classList.add("active");

    // topbar title
    const titleMap = {
      data: "Data Entry",
      progress: "Progress",
      subjects: "Subjects",
    };
    document.querySelector(".topbar-title").textContent = titleMap[view];

    // close sidebar on mobile
    document.getElementById("sidebar").classList.remove("open");
  });
});

const sidebar = document.getElementById("sidebar");
const sidebarPanel = document.querySelector(".sidebar-panel");

// close when clicking outside panel
sidebar.addEventListener("click", () => {
  sidebar.classList.remove("open");
});

// prevent closing when clicking inside panel
sidebarPanel.addEventListener("click", (e) => {
  e.stopPropagation();
});


async function loadSubjects() {
  const { data, error } = await supabaseClient
    .from("students_subjects")
    .select("code, subject_name, year")
    .order("code");
  console.log(data);
  if (error) {
    console.error("Load subjects error:", error);
    return;
  }

  subjects = data;
  renderSubjects(subjects)
}


function renderSubjects(list) {
  const container = document.getElementById("subjectsContainer");
  if (!container) return;

  container.innerHTML = "";
  console.log("Rendering subjects:", list);
  list.forEach((s) => {
    const card = document.createElement("div");
    card.className = "student-card";

    card.innerHTML = `
      <div class="student-row">
        <div>
          <div class="student-name">${s.subject_name ?? "—"}</div>
          <div class="student-meta">${s.code}</div>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}
document
  .getElementById("addSubjectBtn")
  ?.addEventListener("click", async () => {
    const code = document.getElementById("subjectCode").value.trim();
    const name = document.getElementById("subjectName").value.trim();

    if (!code || !name) return;

    const { error } = await supabaseClient
      .from("students_subjects")
      .insert([{ code, subject_name: name }]);

    if (error) {
      console.error("Insert subject error:", error);
      return;
    }

    // clear inputs
    document.getElementById("subjectCode").value = "";
    document.getElementById("subjectName").value = "";

    // reload list
    loadSubjects();
  });

const modal = document.getElementById("studentModal");

document.getElementById("closeModal").addEventListener("click", () => {
  modal.classList.remove("open");
});

modal.addEventListener("click", () => {
  modal.classList.remove("open");
});

document.querySelector(".modal-content").addEventListener("click", (e) => {
  e.stopPropagation();
});


