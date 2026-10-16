(() => {
  "use strict";

  const STORAGE_KEY = "campus-connect-placement-data-v1";
  const departments = [
    "Computer Science",
    "Information Technology",
    "Electronics",
    "Mechanical",
    "Electrical",
    "Civil",
    "Business Administration",
    "Other",
  ];
  const demoData = {
    students: [
      { id: "student-1", name: "Ananya Sharma", email: "ananya.sharma@college.edu", department: "Computer Science", cgpa: 9.1, year: 2027, status: "Placed", company: "Microsoft" },
      { id: "student-2", name: "Rahul Verma", email: "rahul.verma@college.edu", department: "Information Technology", cgpa: 8.7, year: 2027, status: "In Process", company: "" },
      { id: "student-3", name: "Priya Nair", email: "priya.nair@college.edu", department: "Electronics", cgpa: 8.9, year: 2027, status: "Placed", company: "Google" },
      { id: "student-4", name: "Arjun Patel", email: "arjun.patel@college.edu", department: "Mechanical", cgpa: 7.8, year: 2027, status: "Not Placed", company: "" },
      { id: "student-5", name: "Meera Iyer", email: "meera.iyer@college.edu", department: "Computer Science", cgpa: 9.3, year: 2027, status: "In Process", company: "" },
    ],
    jobs: [
      { id: "job-1", role: "Software Engineer", company: "Microsoft", location: "Bengaluru", package: 18, deadline: "2026-12-15", department: "Computer Science" },
      { id: "job-2", role: "Associate Developer", company: "Infosys", location: "Mysuru", package: 6.5, deadline: "2026-11-30", department: "All departments" },
      { id: "job-3", role: "Graduate Engineer", company: "Tata Motors", location: "Pune", package: 8, deadline: "2026-12-05", department: "Mechanical" },
    ],
  };
  const state = { students: [], jobs: [] };
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  let toastTimer;

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[character]);
  }

  function createId(prefix) {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return `${prefix}-${window.crypto.randomUUID()}`;
    }
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function showToast(message, isError = false) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.toggle("error", isError);
    toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 3200);
  }

  function loadData() {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === null) {
        state.students = demoData.students.map((student) => ({ ...student }));
        state.jobs = demoData.jobs.map((job) => ({ ...job }));
        saveData();
        return;
      }

      const parsed = JSON.parse(saved);
      if (!parsed || !Array.isArray(parsed.students) || !Array.isArray(parsed.jobs)) {
        throw new Error("Saved placement data is not in the expected format.");
      }
      state.students = parsed.students;
      state.jobs = parsed.jobs;
    } catch (error) {
      console.error("Unable to load placement data.", error);
      state.students = demoData.students.map((student) => ({ ...student }));
      state.jobs = demoData.jobs.map((job) => ({ ...job }));
      showToast("Saved data could not be loaded. Showing the sample records.", true);
    }
  }

  function saveData() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        students: state.students,
        jobs: state.jobs,
      }));
      return true;
    } catch (error) {
      console.error("Unable to save placement data.", error);
      showToast("Changes are visible for this session but could not be saved in this browser.", true);
      return false;
    }
  }

  function getInitials(name) {
    return String(name).trim().split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase();
  }

  function statusClass(status) {
    if (status === "Placed") return "status-placed";
    if (status === "In Process") return "status-process";
    return "status-not-placed";
  }

  function statusBadge(status) {
    return `<span class="status-badge ${statusClass(status)}">${escapeHtml(status)}</span>`;
  }

  function studentCell(student, index) {
    return `<div class="student-cell">
      <span class="avatar student-avatar ${index % 2 ? "avatar-purple" : "avatar-blue"}">${escapeHtml(getInitials(student.name))}</span>
      <span class="student-cell-copy"><strong>${escapeHtml(student.name)}</strong><small>${escapeHtml(student.email)}</small></span>
    </div>`;
  }

  function sortedStudents() {
    return [...state.students].sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }

  function renderStats() {
    const total = state.students.length;
    const placed = state.students.filter((student) => student.status === "Placed").length;
    const rate = total ? Math.round((placed / total) * 100) : 0;
    $("#stat-students").textContent = String(total);
    $("#stat-placed").textContent = String(placed);
    $("#stat-rate").textContent = `${rate}%`;
    $("#stat-openings").textContent = String(state.jobs.length);
    $("#progress-copy").textContent = total ? `${placed} of ${total} students placed` : "No students registered yet";
    $("#progress-subcopy").textContent = total
      ? `${total - placed} ${total - placed === 1 ? "candidate is" : "candidates are"} still seeking placement.`
      : "Add candidates to start tracking placement progress.";
    $("#progress-percent").textContent = `${rate}%`;
    $("#progress-bar").style.width = `${rate}%`;
    $(".progress-track").setAttribute("aria-valuenow", String(rate));
  }

  function renderRecentStudents() {
    const students = [...state.students].sort((a, b) => String(b.id).localeCompare(String(a.id))).slice(0, 5);
    $("#recent-students-body").innerHTML = students.length
      ? students.map((student, index) => `<tr>
          <td>${studentCell(student, index)}</td>
          <td>${escapeHtml(student.department)}</td>
          <td>${Number(student.cgpa).toFixed(2)}</td>
          <td>${statusBadge(student.status)}</td>
        </tr>`).join("")
      : `<tr><td colspan="4" class="empty-row">No students yet. Add a profile to get started.</td></tr>`;
  }

  function renderStudents() {
    const query = $("#student-search").value.trim().toLowerCase();
    const status = $("#student-status-filter").value;
    const students = sortedStudents().filter((student) => {
      const searchable = `${student.name} ${student.email} ${student.department} ${student.company || ""}`.toLowerCase();
      return searchable.includes(query) && (status === "all" || student.status === status);
    });

    $("#students-table-body").innerHTML = students.map((student, index) => `<tr>
      <td>${studentCell(student, index)}</td>
      <td>${escapeHtml(student.department)}</td>
      <td>${Number(student.cgpa).toFixed(2)}</td>
      <td>${escapeHtml(student.year)}</td>
      <td>${statusBadge(student.status)}</td>
      <td>${student.company ? escapeHtml(student.company) : '<span class="muted-cell">—</span>'}</td>
      <td><div class="row-actions">
        <button class="row-action" type="button" data-action="edit-student" data-id="${escapeHtml(student.id)}" aria-label="Edit ${escapeHtml(student.name)}" title="Edit student">✎</button>
        <button class="row-action delete" type="button" data-action="delete-student" data-id="${escapeHtml(student.id)}" aria-label="Delete ${escapeHtml(student.name)}" title="Delete student">×</button>
      </div></td>
    </tr>`).join("");
    $("#students-empty").hidden = students.length > 0;
  }

  function companyInitials(company) {
    return String(company).trim().split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase();
  }

  function formattedDate(dateValue) {
    if (!dateValue) return "No deadline";
    const date = new Date(`${dateValue}T12:00:00`);
    return Number.isNaN(date.getTime())
      ? "No deadline"
      : `Apply by ${new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date)}`;
  }

  function matchingJobs() {
    const query = $("#job-search").value.trim().toLowerCase();
    return [...state.jobs]
      .sort((a, b) => String(a.deadline).localeCompare(String(b.deadline)))
      .filter((job) => `${job.role} ${job.company} ${job.location} ${job.department}`.toLowerCase().includes(query));
  }

  function renderLatestJobs() {
    const jobs = [...state.jobs].sort((a, b) => String(a.deadline).localeCompare(String(b.deadline))).slice(0, 3);
    $("#latest-jobs-list").innerHTML = jobs.length
      ? jobs.map((job, index) => `<div class="opening-item">
          <span class="company-logo color-${index % 4}">${escapeHtml(companyInitials(job.company))}</span>
          <span class="opening-details"><strong>${escapeHtml(job.role)}</strong><small>${escapeHtml(job.company)} · ${escapeHtml(job.location)}</small></span>
          <span class="opening-package">${Number(job.package).toLocaleString(undefined, { maximumFractionDigits: 1 })} LPA</span>
        </div>`).join("")
      : `<p class="empty-message">No openings yet. Add an opportunity for your students.</p>`;
  }

  function renderJobs() {
    const jobs = matchingJobs();
    $("#job-count").textContent = `${jobs.length} ${jobs.length === 1 ? "opening" : "openings"}`;
    $("#jobs-grid").innerHTML = jobs.map((job, index) => `<article class="job-card">
      <div class="job-card-top">
        <span class="company-logo color-${index % 4}">${escapeHtml(companyInitials(job.company))}</span>
        <div class="job-card-actions">
          <button class="row-action" type="button" data-action="edit-job" data-id="${escapeHtml(job.id)}" aria-label="Edit ${escapeHtml(job.role)} at ${escapeHtml(job.company)}" title="Edit opening">✎</button>
          <button class="row-action delete" type="button" data-action="delete-job" data-id="${escapeHtml(job.id)}" aria-label="Delete ${escapeHtml(job.role)} at ${escapeHtml(job.company)}" title="Delete opening">×</button>
        </div>
      </div>
      <h2>${escapeHtml(job.role)}</h2>
      <span class="job-company">${escapeHtml(job.company)}</span>
      <div class="job-meta"><span>⌖ ${escapeHtml(job.location)}</span><span class="job-tag">${escapeHtml(job.department)}</span></div>
      <div class="job-card-bottom"><span class="job-salary">${Number(job.package).toLocaleString(undefined, { maximumFractionDigits: 1 })} LPA</span><span class="job-deadline">${escapeHtml(formattedDate(job.deadline))}</span></div>
    </article>`).join("");
    $("#jobs-empty").hidden = jobs.length > 0;
  }

  function render() {
    renderStats();
    renderRecentStudents();
    renderStudents();
    renderLatestJobs();
    renderJobs();
  }

  function showView(viewName) {
    const viewTitles = { dashboard: "Overview", students: "Students", jobs: "Job openings" };
    const title = viewTitles[viewName] ? viewName : "dashboard";
    $$(".page-view").forEach((view) => {
      const isActive = view.id === `${title}-view`;
      view.hidden = !isActive;
      view.classList.toggle("active", isActive);
    });
    $$(".nav-link").forEach((link) => link.classList.toggle("active", link.dataset.view === title));
    $("#breadcrumb-current").textContent = viewTitles[title];
    if (title === "students") renderStudents();
    if (title === "jobs") renderJobs();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function setAcademicYear() {
    const now = new Date();
    const startYear = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
    const endYear = String(startYear + 1).slice(-2);
    const year = `${startYear}–${endYear}`;
    $("#academic-year").textContent = `Academic year ${year}`;
    $("#season-label").textContent = `Placement season '${endYear}`;
    $("#today-label").textContent = `PLACEMENT SEASON ${year.toUpperCase()}`;
  }

  function resetForm(form, errorElement) {
    form.reset();
    errorElement.hidden = true;
    errorElement.textContent = "";
  }

  function openStudentForm(student = null) {
    const form = $("#student-form");
    const error = $("#student-form-error");
    resetForm(form, error);
    $("#student-modal-title").textContent = student ? "Edit student" : "Add student";
    $("#student-id").value = student?.id || "";
    if (student) {
      $("#student-name").value = student.name;
      $("#student-email").value = student.email;
      $("#student-department").value = departments.includes(student.department) ? student.department : "Other";
      $("#student-cgpa").value = student.cgpa;
      $("#student-year").value = student.year;
      $("#student-status").value = student.status;
      $("#student-company").value = student.company || "";
    } else {
      $("#student-year").value = String(new Date().getFullYear());
    }
    $("#student-modal").showModal();
    $("#student-name").focus();
  }

  function openJobForm(job = null) {
    const form = $("#job-form");
    const error = $("#job-form-error");
    resetForm(form, error);
    $("#job-modal-title").textContent = job ? "Edit job opening" : "Add job opening";
    $("#job-id").value = job?.id || "";
    if (job) {
      $("#job-role").value = job.role;
      $("#job-company").value = job.company;
      $("#job-location").value = job.location;
      $("#job-package").value = job.package;
      $("#job-deadline").value = job.deadline;
      $("#job-department").value = job.department;
    }
    $("#job-modal").showModal();
    $("#job-role").focus();
  }

  function validateForm(form, errorElement) {
    if (!form.reportValidity()) return false;
    if (!form.checkValidity()) {
      errorElement.textContent = "Check the highlighted fields and try again.";
      errorElement.hidden = false;
      return false;
    }
    errorElement.hidden = true;
    return true;
  }

  function handleStudentSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const error = $("#student-form-error");
    if (!validateForm(form, error)) return;
    const cgpa = Number($("#student-cgpa").value);
    const year = Number($("#student-year").value);
    if (!Number.isFinite(cgpa) || cgpa < 0 || cgpa > 10) {
      error.textContent = "CGPA must be a number between 0 and 10.";
      error.hidden = false;
      $("#student-cgpa").focus();
      return;
    }
    if (!Number.isInteger(year) || year < 2020 || year > 2100) {
      error.textContent = "Enter a valid graduation year.";
      error.hidden = false;
      $("#student-year").focus();
      return;
    }

    const id = $("#student-id").value;
    const student = {
      id: id || createId("student"),
      name: $("#student-name").value.trim(),
      email: $("#student-email").value.trim(),
      department: $("#student-department").value,
      cgpa,
      year,
      status: $("#student-status").value,
      company: $("#student-company").value.trim(),
    };
    const existingIndex = state.students.findIndex((item) => item.id === id);
    if (existingIndex >= 0) state.students[existingIndex] = student;
    else state.students.unshift(student);
    saveData();
    render();
    $("#student-modal").close();
    showToast(id ? "Student profile updated." : "Student added successfully.");
  }

  function handleJobSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!validateForm(form, $("#job-form-error"))) return;
    const packageValue = Number($("#job-package").value);
    if (!Number.isFinite(packageValue) || packageValue < 0) {
      $("#job-form-error").textContent = "Package must be a valid non-negative number.";
      $("#job-form-error").hidden = false;
      $("#job-package").focus();
      return;
    }
    const id = $("#job-id").value;
    const job = {
      id: id || createId("job"),
      role: $("#job-role").value.trim(),
      company: $("#job-company").value.trim(),
      location: $("#job-location").value.trim(),
      package: packageValue,
      deadline: $("#job-deadline").value,
      department: $("#job-department").value.trim(),
    };
    const existingIndex = state.jobs.findIndex((item) => item.id === id);
    if (existingIndex >= 0) state.jobs[existingIndex] = job;
    else state.jobs.unshift(job);
    saveData();
    render();
    $("#job-modal").close();
    showToast(id ? "Job opening updated." : "Job opening added successfully.");
  }

  function handleActionClick(button) {
    const { action, id } = button.dataset;
    if (action === "add-student") openStudentForm();
    if (action === "add-job") openJobForm();
    if (action === "edit-student") {
      const student = state.students.find((item) => item.id === id);
      if (student) openStudentForm(student);
    }
    if (action === "edit-job") {
      const job = state.jobs.find((item) => item.id === id);
      if (job) openJobForm(job);
    }
    if (action === "delete-student") {
      const student = state.students.find((item) => item.id === id);
      if (student && window.confirm(`Delete ${student.name}'s student profile? This cannot be undone.`)) {
        state.students = state.students.filter((item) => item.id !== id);
        saveData();
        render();
        showToast("Student profile deleted.");
      }
    }
    if (action === "delete-job") {
      const job = state.jobs.find((item) => item.id === id);
      if (job && window.confirm(`Delete the ${job.role} opening at ${job.company}? This cannot be undone.`)) {
        state.jobs = state.jobs.filter((item) => item.id !== id);
        saveData();
        render();
        showToast("Job opening deleted.");
      }
    }
  }

  function initialize() {
    setAcademicYear();
    loadData();
    render();
    $$("[data-view]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        showView(button.dataset.view);
      });
    });
    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action]");
      if (button) handleActionClick(button);
    });
    $("#student-search").addEventListener("input", renderStudents);
    $("#student-status-filter").addEventListener("change", renderStudents);
    $("#job-search").addEventListener("input", renderJobs);
    $("#student-form").addEventListener("submit", handleStudentSubmit);
    $("#job-form").addEventListener("submit", handleJobSubmit);
    $$("[data-close-modal]").forEach((button) => {
      button.addEventListener("click", () => button.closest("dialog").close());
    });
    $$("dialog.modal").forEach((dialog) => {
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) dialog.close();
      });
    });
  }

  document.addEventListener("DOMContentLoaded", initialize);
})();