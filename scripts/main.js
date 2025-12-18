
const SUPABASE_URL = "https://nlpmptgsupukqljbdgjr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_yjBdIWUbsLlT9WsdTTYulw_ffkuwZXi";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  if (
    sessionStorage.getItem("auth") !== "true" &&
    localStorage.getItem("auth") !== "true"
  ) {
    window.location.href = "index.html";
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
  
  // remove old student cards (keep subject + search)
  document.querySelectorAll(".student-card[data-student]").forEach(e => e.remove());

  list.forEach(m => {
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

    container.appendChild(card);
  });
}


document
  .getElementById("studentSearch")
  .addEventListener("input", (e) => {

    const q = e.target.value.toLowerCase().trim();

    const filtered = members.filter(m =>
      (m.name && m.name.toLowerCase().includes(q)) ||
      (m.admissionNumber && String(m.admissionNumber).includes(q))
    );

    renderMembers(filtered);
  });


  document.querySelectorAll(".nav-item").forEach(item => {
  item.addEventListener("click", () => {
    const view = item.dataset.view;

    // active sidebar
    document.querySelectorAll(".nav-item").forEach(n =>
      n.classList.remove("active")
    );
    item.classList.add("active");

    // switch view
    document.querySelectorAll(".view").forEach(v =>
      v.classList.remove("active")
    );
    document.getElementById(`view-${view}`).classList.add("active");

    // topbar title
    const titleMap = {
      data: "Data Entry",
      progress: "Progress",
      subjects: "Subjects"
    };
    document.querySelector(".topbar-title").textContent = titleMap[view];
  if (view === "subjects") {
    loadSubjects();
  }
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
    .select("code, subject_name")
    .order("code");

  if (error) {
    console.error("Load subjects error:", error);
    return;
  }

  subjects = data;
  renderSubjects(subjects);
}
function renderSubjects(list) {
  const container = document.getElementById("subjectsContainer");
  if (!container) return;

  container.innerHTML = "";

  list.forEach(s => {
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
document.getElementById("addSubjectBtn")?.addEventListener("click", async () => {
  const code = document.getElementById("subjectCode").value.trim();
  const name = document.getElementById("subjectName").value.trim();

  if (!code || !name) return;

  const { error } = await supabaseClient
    .from("students_subjects")
    .insert([
      { code, subject_name: name }
    ]);

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
