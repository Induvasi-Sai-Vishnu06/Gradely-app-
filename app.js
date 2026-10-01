// Grade Points Mapping (Standard 10-Point Scale)
const GRADE_POINTS = {
  'O': 10,
  'A+': 9,
  'A': 8,
  'B+': 7,
  'B': 6,
  'C': 5,
  'P': 4,
  'F': 0
};

// Application State
let currentMode = 'sgpa';

// Initialize App when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadStoredData();
});

// Setup Click Event Listeners
function setupEventListeners() {
  // Landing Page Card Clicks
  const cardSgpa = document.getElementById('cardSgpa');
  const cardCgpa = document.getElementById('cardCgpa');

  if (cardSgpa) {
    cardSgpa.addEventListener('click', () => openCalculator('sgpa'));
  }
  if (cardCgpa) {
    cardCgpa.addEventListener('click', () => openCalculator('cgpa'));
  }

  // Navigation Buttons
  document.getElementById('btnBackHome').addEventListener('click', goHome);
  document.getElementById('toggleSgpaBtn').addEventListener('click', () => switchCalcMode('sgpa'));
  document.getElementById('toggleCgpaBtn').addEventListener('click', () => switchCalcMode('cgpa'));

  // Form Row Actions
  document.getElementById('btnAddSubject').addEventListener('click', () => addSubjectRow());
  document.getElementById('btnAddSemester').addEventListener('click', () => addSemesterRow());
  document.getElementById('btnClearSgpa').addEventListener('click', () => clearAllRows('sgpa'));
  document.getElementById('btnClearCgpa').addEventListener('click', () => clearAllRows('cgpa'));

  // Calculate Buttons
  document.getElementById('btnCalcSgpa').addEventListener('click', calculateSGPA);
  document.getElementById('btnCalcCgpa').addEventListener('click', calculateCGPA);
}

// --- Page & Mode Switches ---

function openCalculator(mode) {
  document.getElementById('pageHome').classList.add('hidden');
  document.getElementById('pageCalc').classList.remove('hidden');
  switchCalcMode(mode);
}

function goHome() {
  document.getElementById('pageCalc').classList.add('hidden');
  document.getElementById('pageHome').classList.remove('hidden');
}

function switchCalcMode(mode) {
  currentMode = mode;
  const sgpaSec = document.getElementById('sgpaCalcSection');
  const cgpaSec = document.getElementById('cgpaCalcSection');
  const toggleSgpa = document.getElementById('toggleSgpaBtn');
  const toggleCgpa = document.getElementById('toggleCgpaBtn');

  if (mode === 'sgpa') {
    sgpaSec.classList.remove('hidden');
    cgpaSec.classList.add('hidden');

    toggleSgpa.className = 'toggle-option active-sgpa';
    toggleCgpa.className = 'toggle-option';

    if (document.getElementById('subjectRows').children.length === 0) {
      for (let i = 0; i < 4; i++) addSubjectRow();
    }
  } else {
    cgpaSec.classList.remove('hidden');
    sgpaSec.classList.add('hidden');

    toggleCgpa.className = 'toggle-option active-cgpa';
    toggleSgpa.className = 'toggle-option';

    if (document.getElementById('semesterRows').children.length === 0) {
      for (let i = 0; i < 2; i++) addSemesterRow();
    }
  }
}

// --- Row Insertion & Deletion ---

// SGPA: Only Credit Hours and Grade Selection
function addSubjectRow(credits = '', grade = 'O') {
  const container = document.getElementById('subjectRows');
  const rowId = `subj-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const div = document.createElement('div');
  div.id = rowId;
  div.className = 'input-row';

  const gradeOptions = Object.keys(GRADE_POINTS).map(g => 
    `<option value="${g}" ${g === grade ? 'selected' : ''}>${g} (${GRADE_POINTS[g]} Points)</option>`
  ).join('');

  div.innerHTML = `
    <div class="field-group">
      <label class="field-label">Credits</label>
      <input type="number" min="1" max="12" placeholder="e.g. 4" value="${credits}" class="input-field subj-credit" />
    </div>
    <div class="field-group">
      <label class="field-label">Grade</label>
      <select class="input-field subj-grade">
        ${gradeOptions}
      </select>
    </div>
    <button type="button" class="btn-remove-row" title="Delete Row">
      <i class="fa-solid fa-trash-can"></i>
    </button>
  `;

  // Dynamic Listeners
  div.querySelector('.btn-remove-row').addEventListener('click', () => removeRow(rowId));
  div.querySelectorAll('.input-field').forEach(input => {
    input.addEventListener('change', autoSaveData);
  });

  container.appendChild(div);
  autoSaveData();
}

// CGPA: Only SGPA and Total Credits Selection (Semester Title Removed)
function addSemesterRow(sgpa = '', credits = '') {
  const container = document.getElementById('semesterRows');
  const rowId = `sem-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const div = document.createElement('div');
  div.id = rowId;
  div.className = 'input-row';

  div.innerHTML = `
    <div class="field-group">
      <label class="field-label">SGPA</label>
      <input type="number" step="0.01" min="0" max="10" placeholder="e.g. 8.5" value="${sgpa}" class="input-field sem-sgpa" />
    </div>
    <div class="field-group">
      <label class="field-label">Total Credits</label>
      <input type="number" min="1" placeholder="e.g. 22" value="${credits}" class="input-field sem-credits" />
    </div>
    <button type="button" class="btn-remove-row" title="Delete Row">
      <i class="fa-solid fa-trash-can"></i>
    </button>
  `;

  // Dynamic Listeners
  div.querySelector('.btn-remove-row').addEventListener('click', () => removeRow(rowId));
  div.querySelectorAll('.input-field').forEach(input => {
    input.addEventListener('change', autoSaveData);
  });

  container.appendChild(div);
  autoSaveData();
}

function removeRow(rowId) {
  const el = document.getElementById(rowId);
  if (el) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(-10px)';
    setTimeout(() => {
      el.remove();
      autoSaveData();
    }, 200);
  }
}

function clearAllRows(mode) {
  if (mode === 'sgpa') {
    document.getElementById('subjectRows').innerHTML = '';
    document.getElementById('sgpaResult').classList.add('hidden');
    for (let i = 0; i < 4; i++) addSubjectRow();
  } else {
    document.getElementById('semesterRows').innerHTML = '';
    document.getElementById('cgpaResult').classList.add('hidden');
    for (let i = 0; i < 2; i++) addSemesterRow();
  }
  showToast('Form cleared successfully');
}

// --- Math & Calculation Logic ---

function calculateSGPA() {
  const credits = document.querySelectorAll('.subj-credit');
  const grades = document.querySelectorAll('.subj-grade');

  let totalPoints = 0;
  let totalCredits = 0;

  for (let i = 0; i < credits.length; i++) {
    const creditVal = parseFloat(credits[i].value);
    const gradeVal = grades[i].value;

    if (isNaN(creditVal) || creditVal <= 0) {
      showToast('Please specify valid credit hours for all courses.');
      return;
    }

    totalPoints += creditVal * GRADE_POINTS[gradeVal];
    totalCredits += creditVal;
  }

  if (totalCredits === 0) {
    showToast('Add at least one course row with valid credit hours.');
    return;
  }

  const score = totalPoints / totalCredits;
  animateValue('sgpaValue', 0, score, 600);

  const percentage = Math.max(0, (score - 0.75) * 10).toFixed(1);
  document.getElementById('sgpaPercent').innerText = `${percentage}%`;
  document.getElementById('sgpaHonors').innerText = getAcademicHonors(score);

  document.getElementById('sgpaResult').classList.remove('hidden');
  autoSaveData();
}

function calculateCGPA() {
  const sgpas = document.querySelectorAll('.sem-sgpa');
  const credits = document.querySelectorAll('.sem-credits');

  let totalWeightedSgpa = 0;
  let totalCredits = 0;

  for (let i = 0; i < sgpas.length; i++) {
    const sgpaVal = parseFloat(sgpas[i].value);
    const creditVal = parseFloat(credits[i].value);

    if (isNaN(sgpaVal) || sgpaVal < 0 || sgpaVal > 10) {
      showToast('Please enter a valid SGPA (0 to 10) for all semesters.');
      return;
    }

    if (isNaN(creditVal) || creditVal <= 0) {
      showToast('Please enter total credits for all semesters.');
      return;
    }

    totalWeightedSgpa += sgpaVal * creditVal;
    totalCredits += creditVal;
  }

  if (totalCredits === 0) {
    showToast('Add at least one semester to calculate.');
    return;
  }

  const score = totalWeightedSgpa / totalCredits;
  animateValue('cgpaValue', 0, score, 600);

  const percentage = Math.max(0, (score - 0.75) * 10).toFixed(1);
  document.getElementById('cgpaPercent').innerText = `${percentage}%`;
  document.getElementById('cgpaHonors').innerText = getAcademicHonors(score);

  document.getElementById('cgpaResult').classList.remove('hidden');
  autoSaveData();
}

// --- Utilities & Local Storage ---

function getAcademicHonors(score) {
  if (score >= 8.5) return 'First Class with Distinction';
  if (score >= 7.0) return 'First Class';
  if (score >= 5.5) return 'Second Class';
  if (score >= 4.0) return 'Pass';
  return 'Fail / Re-appear';
}

function animateValue(elementId, start, end, duration) {
  const obj = document.getElementById(elementId);
  let startTimestamp = null;

  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const currentVal = (progress * (end - start) + start).toFixed(2);
    obj.innerText = currentVal;
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };

  window.requestAnimationFrame(step);
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.innerText = msg;
  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 2500);
}

function autoSaveData() {
  const sgpaData = [];
  document.querySelectorAll('#subjectRows .input-row').forEach(row => {
    sgpaData.push({
      credits: row.querySelector('.subj-credit').value,
      grade: row.querySelector('.subj-grade').value
    });
  });

  const cgpaData = [];
  document.querySelectorAll('#semesterRows .input-row').forEach(row => {
    cgpaData.push({
      sgpa: row.querySelector('.sem-sgpa').value,
      credits: row.querySelector('.sem-credits').value
    });
  });

  localStorage.setItem('gradely_sgpa_data', JSON.stringify(sgpaData));
  localStorage.setItem('gradely_cgpa_data', JSON.stringify(cgpaData));
}

function loadStoredData() {
  const savedSgpa = localStorage.getItem('gradely_sgpa_data');
  const savedCgpa = localStorage.getItem('gradely_cgpa_data');

  if (savedSgpa) {
    const data = JSON.parse(savedSgpa);
    if (data.length > 0) {
      document.getElementById('subjectRows').innerHTML = '';
      data.forEach(item => addSubjectRow(item.credits, item.grade));
    }
  }

  if (savedCgpa) {
    const data = JSON.parse(savedCgpa);
    if (data.length > 0) {
      document.getElementById('semesterRows').innerHTML = '';
      data.forEach(item => addSemesterRow(item.sgpa, item.credits));
    }
  }
}