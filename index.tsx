/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
declare var bootstrap: any;
declare var MathJax: any;

import { GoogleGenAI } from "@google/genai";

// --- Global State ---
let examStructure = [];
let currentApiKey = '';
let currentSubject = 'toan';
let generatedQuestions = [];
let examData = {};
let fullResponseText = '';
let ai; // GoogleGenAI instance

// --- DOM Elements ---
const subjectSelect = document.getElementById('subjectSelect') as HTMLSelectElement;
const gradeSelect = document.getElementById('gradeSelect') as HTMLSelectElement;
const lessonSelect = document.getElementById('lessonSelect') as HTMLSelectElement;
const objectivesContainer = document.getElementById('objectivesContainer') as HTMLElement;
const objectivesCheckboxContainer = document.getElementById('objectivesCheckboxContainer') as HTMLSelectElement;
const addBtn = document.getElementById('addBtn') as HTMLButtonElement;
const structureContainer = document.getElementById('structureContainer') as HTMLElement;
const structureList = document.getElementById('structureList') as HTMLElement;
const generateFinalExamBtn = document.getElementById('generateFinalExamBtn') as HTMLButtonElement;
const generateText = document.getElementById('generateText') as HTMLElement;
const generateSpinner = document.getElementById('generateSpinner') as HTMLElement;
const resultSection = document.getElementById('resultSection') as HTMLElement;
const examAndAnswerContent = document.getElementById('examAndAnswerContent') as HTMLElement;
const examMatrixContent = document.getElementById('examMatrixContent') as HTMLElement;
const examSpecContent = document.getElementById('examSpecContent') as HTMLElement;
const copyBtn = document.getElementById('copyBtn') as HTMLButtonElement;
const exportDocxBtn = document.getElementById('exportDocxBtn') as HTMLAnchorElement;
const exportTexBtn = document.getElementById('exportTexBtn') as HTMLAnchorElement;
const newExamBtn = document.getElementById('newExamBtn') as HTMLButtonElement;
const messageBox = document.getElementById('messageBox') as HTMLElement;
const useTextbook = document.getElementById('useTextbook') as HTMLInputElement;
const webLinks = document.getElementById('webLinks') as HTMLElement;
const apiKeyInput = document.getElementById('apiKeyInput') as HTMLInputElement;
const rememberApiKey = document.getElementById('rememberApiKey') as HTMLInputElement;
const saveApiKeyBtn = document.getElementById('saveApiKeyBtn') as HTMLButtonElement;
const apiKeyMessage = document.getElementById('apiKeyMessage') as HTMLElement;
const saveApiKeyText = document.getElementById('saveApiKeyText') as HTMLElement;
const apiKeySpinner = document.getElementById('apiKeySpinner') as HTMLElement;
const apiKeyModalEl = document.getElementById('apiKeyModal') as HTMLElement;
const apiKeyModal = apiKeyModalEl ? new bootstrap.Modal(apiKeyModalEl) : null;
const customObjectivesTextarea = document.getElementById('customObjectivesTextarea') as HTMLTextAreaElement;
const saveCustomObjectivesBtn = document.getElementById('saveCustomObjectivesBtn') as HTMLButtonElement;
const exportDataFileBtn = document.getElementById('exportDataFileBtn') as HTMLButtonElement;
const formatSelect = document.getElementById('formatSelect') as HTMLSelectElement;
const suggestObjectivesBtn = document.getElementById('suggestObjectivesBtn') as HTMLButtonElement;
const suggestObjectivesSpinner = document.getElementById('suggestObjectivesSpinner') as HTMLElement;
const generateExplanationsBtn = document.getElementById('generateExplanationsBtn') as HTMLButtonElement;
const generateExplanationsSpinner = document.getElementById('generateExplanationsSpinner') as HTMLElement;
const explanationsContainer = document.getElementById('explanationsContainer') as HTMLElement;
const examTitleInput = document.getElementById('examTitleInput') as HTMLInputElement;
const suggestTitleBtn = document.getElementById('suggestTitleBtn') as HTMLButtonElement;
const suggestTitleSpinner = document.getElementById('suggestTitleSpinner') as HTMLElement;
const resetDataBtn = document.getElementById('resetDataBtn') as HTMLButtonElement;


// --- INITIALIZATION ---
window.addEventListener('DOMContentLoaded', async () => {
    loadSavedApiKey();
    await loadSubjectData(currentSubject);
    setupEventListeners();
});

async function loadSubjectData(subject) {
    currentSubject = subject;
    const localStorageKey = `examData_${subject}`;

    try {
        // 1. Try to load from localStorage first
        const savedData = localStorage.getItem(localStorageKey);
        if (savedData) {
            console.log(`Loading data for subject '${subject}' from localStorage.`);
            examData = JSON.parse(savedData);
        } else {
            // 2. If not in localStorage, fetch from server file
            console.log(`No local data found for '${subject}'. Fetching from server.`);
            const response = await fetch(`${subject}.json`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            examData = await response.json();
            // 3. Save the fetched data to localStorage for future use
            localStorage.setItem(localStorageKey, JSON.stringify(examData));
        }

        populateGradeSelect();
        resetLessonAndObjectives();
    } catch (e) {
        showAlert(`Lỗi nghiêm trọng: Không thể tải tệp dữ liệu \`${subject}.json\`. Vui lòng đảm bảo tệp này tồn tại.`, 'danger');
        console.error("Fetch error:", e);
        gradeSelect.disabled = true;
    }
}

function saveDataToLocalStorage() {
    if (!currentSubject) return;
    const localStorageKey = `examData_${currentSubject}`;
    try {
        localStorage.setItem(localStorageKey, JSON.stringify(examData));
    } catch (e) {
        console.error("Could not save data to localStorage", e);
        showAlert('Không thể lưu thay đổi vào bộ nhớ trình duyệt.', 'danger');
    }
}

function resetLessonAndObjectives() {
    lessonSelect.innerHTML = '<option selected disabled>-- Chọn lớp trước --</option>';
    lessonSelect.disabled = true;
    objectivesContainer.style.display = 'none';
    objectivesCheckboxContainer.innerHTML = '';
}

function loadSavedApiKey() {
    const savedApiKey = localStorage.getItem('geminiApiKey');
    if (savedApiKey) {
        apiKeyInput.value = savedApiKey;
        rememberApiKey.checked = true;
        currentApiKey = savedApiKey;
        ai = new GoogleGenAI({ apiKey: currentApiKey });
    }
}

function populateGradeSelect() {
    gradeSelect.innerHTML = '<option selected disabled>-- Chọn lớp --</option>';
    for (const grade in examData) {
        const option = document.createElement('option');
        option.value = grade;
        option.textContent = `Lớp ${grade}`;
        gradeSelect.appendChild(option);
    }
    gradeSelect.disabled = false;
}

function setupEventListeners() {
    subjectSelect.addEventListener('change', handleSubjectChange);
    gradeSelect.addEventListener('change', handleGradeChange);
    lessonSelect.addEventListener('change', handleLessonChange);
    addBtn.addEventListener('click', handleAddExamPart);
    generateFinalExamBtn.addEventListener('click', handleGenerateExam);
    newExamBtn.addEventListener('click', handleNewExam);
    copyBtn.addEventListener('click', handleCopyContent);
    exportDocxBtn.addEventListener('click', handleExportToDocx);
    exportTexBtn.addEventListener('click', handleExportToTex);
    saveApiKeyBtn.addEventListener('click', handleSaveApiKey);
    saveCustomObjectivesBtn.addEventListener('click', handleSaveCustomObjectives);
    exportDataFileBtn.addEventListener('click', handleExportDataFile);
    resetDataBtn.addEventListener('click', handleResetData);
    suggestObjectivesBtn.addEventListener('click', handleSuggestObjectives);
    generateExplanationsBtn.addEventListener('click', handleGenerateExplanations);
    suggestTitleBtn.addEventListener('click', handleSuggestTitle);
    // Use event delegation for objective buttons
    objectivesCheckboxContainer.addEventListener('click', handleObjectiveActions);
}

async function handleSubjectChange() {
    const selectedSubject = subjectSelect.value;
    await loadSubjectData(selectedSubject);
}

async function handleResetData() {
    if (confirm(`Bạn có chắc chắn muốn xóa tất cả các thay đổi đã lưu cho môn ${currentSubject} và quay về dữ liệu gốc không?`)) {
        const localStorageKey = `examData_${currentSubject}`;
        localStorage.removeItem(localStorageKey);
        showAlert(`Đã reset dữ liệu môn ${currentSubject} về trạng thái gốc.`, 'info');
        await loadSubjectData(currentSubject); // Reload the original data from file
    }
}

function handleExportDataFile() {
    try {
        const fileContent = JSON.stringify(examData, null, 4);
        const blob = new Blob([fileContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${currentSubject}_backup.json`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
        showAlert(`Đã sao lưu thành công tệp \`${currentSubject}_backup.json\`!`, 'success');
    } catch (e) {
        showAlert('Không thể sao lưu tệp dữ liệu. Lỗi: ' + e.message, 'danger');
        console.error(e);
    }
}

function handleGradeChange() {
    const selectedGrade = gradeSelect.value;
    const lessons = examData[selectedGrade] || {};
    
    lessonSelect.innerHTML = '<option selected disabled>-- Chọn bài học --</option>';
    objectivesContainer.style.display = 'none';
    
    for (const lessonName in lessons) {
        const option = document.createElement('option');
        option.value = lessonName;
        option.textContent = lessonName;
        lessonSelect.appendChild(option);
    }
    
    lessonSelect.disabled = false;
}

function handleLessonChange() {
    renderObjectives();
}

/**
 * Renders the list of objectives for the currently selected lesson.
 */
function renderObjectives() {
    const selectedGrade = gradeSelect.value;
    const selectedLesson = lessonSelect.value;
    const objectivesArray = examData[selectedGrade]?.[selectedLesson]?.objectives;

    objectivesCheckboxContainer.innerHTML = ''; // Clear previous items

    if (objectivesArray && objectivesArray.length > 0) {
        objectivesArray.forEach((obj, index) => {
            createObjectiveItem(obj, index);
        });
        objectivesContainer.style.display = 'block';
    } else {
        objectivesContainer.style.display = 'none';
    }
}

/**
 * Creates and appends a single objective item to the list.
 * @param {string} text The objective text.
 * @param {number} index The index of the objective in the data array.
 */
function createObjectiveItem(text, index) {
    const objId = `obj-${index}`;

    const itemDiv = document.createElement('div');
    itemDiv.className = 'objective-item d-flex align-items-center justify-content-between';
    itemDiv.dataset.index = index.toString(); // Store the index

    const checkDiv = document.createElement('div');
    checkDiv.className = 'form-check flex-grow-1 me-2';

    const checkbox = document.createElement('input');
    checkbox.className = 'form-check-input';
    checkbox.type = 'checkbox';
    checkbox.value = text;
    checkbox.id = objId;

    const label = document.createElement('label');
    label.className = 'form-check-label';
    label.htmlFor = objId;
    label.textContent = text;

    checkDiv.appendChild(checkbox);
    checkDiv.appendChild(label);

    const btnGroupDiv = document.createElement('div');
    btnGroupDiv.className = 'btn-group btn-group-sm';
    btnGroupDiv.setAttribute('role', 'group');

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn btn-edit';
    editBtn.title = 'Sửa';
    editBtn.innerHTML = '<i class="bi bi-pencil"></i>';

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn btn-delete';
    deleteBtn.title = 'Xóa';
    deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';

    btnGroupDiv.appendChild(editBtn);
    btnGroupDiv.appendChild(deleteBtn);

    itemDiv.appendChild(checkDiv);
    itemDiv.appendChild(btnGroupDiv);

    objectivesCheckboxContainer.appendChild(itemDiv);
}


// --- EVENT HANDLERS FOR EDIT AND DELETE BUTTONS ---

/**
 * Handles click actions within the objectives container using event delegation.
 * @param {MouseEvent} e - The click event.
 */
function handleObjectiveActions(e: MouseEvent) {
    const target = e.target as HTMLElement;
    const button = target.closest('button');
    
    if (!button) return;

    const itemDiv = button.closest('.objective-item') as HTMLElement;
    if (!itemDiv || itemDiv.dataset.index === undefined) return;

    const index = parseInt(itemDiv.dataset.index, 10);
    const grade = gradeSelect.value;
    const lesson = lessonSelect.value;
    const objectivesArray = examData?.[grade]?.[lesson]?.objectives;

    if (!objectivesArray || isNaN(index)) return;

    // --- DELETE ACTION ---
    if (button.classList.contains('btn-delete')) {
        const objectiveToDelete = objectivesArray[index];
         if (confirm(`Bạn có chắc chắn muốn xóa yêu cầu này không?\n\n"${objectiveToDelete}"`)) {
            objectivesArray.splice(index, 1);
            saveDataToLocalStorage();
            renderObjectives();
            showAlert('Đã xóa yêu cầu và lưu vào bộ nhớ trình duyệt.', 'info');
        }
    } 
    // --- EDIT ACTION ---
    else if (button.classList.contains('btn-edit')) {
        enterEditMode(itemDiv, objectivesArray[index]);
    } 
    // --- SAVE EDIT ACTION ---
    else if (button.classList.contains('btn-save-edit')) {
        saveEdit(itemDiv, index);
    }
}

/**
 * Switches an objective item to edit mode.
 * @param {HTMLElement} itemDiv - The objective item's div.
 * @param {string} currentText - The current objective text.
 */
function enterEditMode(itemDiv, currentText) {
    const checkDiv = itemDiv.querySelector('.form-check');
    const label = itemDiv.querySelector('label');
    const checkbox = itemDiv.querySelector('input[type="checkbox"]');
    checkbox.style.display = 'none'; // Hide checkbox while editing

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-control form-control-sm editing-input';
    input.value = currentText;
    
    checkDiv.replaceChild(input, label);
    input.focus();
    input.select();

    const btnGroup = itemDiv.querySelector('.btn-group');
    btnGroup.innerHTML = `<button type="button" class="btn btn-sm btn-save-edit" title="Lưu"><i class="bi bi-check-lg"></i></button>`;
}

/**
 * Saves the edited objective.
 * @param {HTMLElement} itemDiv - The objective item's div.
 * @param {number} index - The index of the objective in the data array.
 */
function saveEdit(itemDiv, index) {
    const input = itemDiv.querySelector('input.editing-input') as HTMLInputElement;
    const newText = input.value.trim();
    const grade = gradeSelect.value;
    const lesson = lessonSelect.value;

    if (newText) {
        examData[grade][lesson].objectives[index] = newText;
        showAlert('Đã cập nhật yêu cầu và lưu vào bộ nhớ trình duyệt.', 'info');
    } else {
        // If user deleted all text, remove the objective
        examData[grade][lesson].objectives.splice(index, 1);
        showAlert('Đã xóa yêu cầu trống và lưu vào bộ nhớ trình duyệt.', 'info');
    }
    saveDataToLocalStorage();
    renderObjectives();
}


function handleSaveCustomObjectives() {
    const selectedGrade = gradeSelect.value;
    const selectedLesson = lessonSelect.value;
    const newObjectivesText = customObjectivesTextarea.value.trim();

    if (!selectedGrade || gradeSelect.selectedIndex === 0 || !selectedLesson || lessonSelect.selectedIndex === 0) {
        showAlert('Vui lòng chọn Lớp và Bài học trước khi thêm yêu cầu.', 'warning');
        return;
    }

    if (!newObjectivesText) {
        showAlert('Vui lòng nhập nội dung yêu cầu cần đạt.', 'warning');
        return;
    }

    const objectivesSet = new Set(examData[selectedGrade][selectedLesson].objectives);
    const newObjectivesArray = newObjectivesText.split('\n').map(s => s.trim()).filter(Boolean);
    newObjectivesArray.forEach(obj => objectivesSet.add(obj));
    examData[selectedGrade][selectedLesson].objectives = Array.from(objectivesSet);
    
    saveDataToLocalStorage();
    showAlert('Đã thêm yêu cầu mới và lưu vào bộ nhớ trình duyệt.', 'info');
    customObjectivesTextarea.value = '';
    renderObjectives(); // Rerender objectives list
}

function handleAddExamPart() {
    const grade = gradeSelect.value;
    const lesson = lessonSelect.value;
    const numQuestions = (document.getElementById('questionNum') as HTMLInputElement).value;
    const difficulty = (document.getElementById('difficultySelect') as HTMLSelectElement).value;
    const type = (document.getElementById('typeSelect') as HTMLSelectElement).value;
    
    const selectedObjectives = Array.from(objectivesCheckboxContainer.querySelectorAll('input[type="checkbox"]:checked'))
                                   .map(cb => (cb as HTMLInputElement).value);


    if (!grade || gradeSelect.selectedIndex === 0 || !lesson || lessonSelect.selectedIndex === 0) {
        showAlert('Vui lòng chọn đầy đủ Lớp và Bài học.', 'warning');
        return;
    }

    const selection = {
        id: Date.now(),
        grade,
        lesson,
        numQuestions,
        difficulty,
        type,
        objectives: selectedObjectives.length > 0 ? selectedObjectives : ['Toàn bộ bài học']
    };

    examStructure.push(selection);
    renderStructure();
    showAlert(`Đã thêm phần "${lesson}" vào cấu trúc đề thi.`, 'success');
}

async function handleGenerateExam() {
    if (examStructure.length === 0) {
        showAlert('Cấu trúc đề thi đang trống. Vui lòng thêm ít nhất một phần.', 'danger');
        return;
    }

    if (!currentApiKey || !ai) {
        showAlert('Vui lòng nhập API Key trước khi tạo đề thi.', 'warning');
        apiKeyModal?.show();
        return;
    }

    setLoadingState(generateFinalExamBtn, true);
    generateText.textContent = 'Đang tạo...';

    try {
        fullResponseText = await generateFullResponse();
        displayExamResult(fullResponseText);
        resultSection.style.display = 'block';
        setTimeout(() => resultSection.scrollIntoView({ behavior: 'smooth' }), 100);
        showAlert('Đã tạo thành công Đề thi, Ma trận và Bản đặc tả!', 'success');
    } catch (error) {
        showAlert(`Lỗi tạo đề thi: ${error.message}`, 'danger');
        console.error(error);
    } finally {
        setLoadingState(generateFinalExamBtn, false);
        generateText.textContent = 'Tạo đề thi, Ma trận & Đặc tả';
    }
}

async function generateFullResponse() {
    const NORMAL_SYSTEM_PROMPT = `
BẠN LÀ MỘT CHUYÊN GIA SOẠN THẢO ĐỀ THI TOÁN HỌC.
HÃY TUÂN THỦ NGHIÊM NGẶT CÁC QUY TẮC VÀ LÀM THEO CÁC VÍ DỤ MẪU SAU ĐÂY CHO TỪNG LOẠI CÂU HỎI:
CHÚ Ý: chỉ tạo các câu hỏi đúng các phần mà mình yầu, nếu không yêu cầu thì không tự tạo thêm
**1. TRẮC NGHIỆM (A, B, C, D):**
- Luôn có 4 lựa chọn A, B, C, D.
- Ví dụ:
Câu 1 (NB): Trong các câu sau, câu nào không phải là mệnh đề?
A. 1 + 1 = 2.
B. Hình thoi có bốn cạnh bằng nhau.
C. Hãy đóng cửa sổ lại!
D. Số pi là một số vô tỉ.

**2. ĐÚNG/SAI:**
- Luôn cung cấp một đoạn văn bản, hình ảnh hoặc dữ kiện làm ngữ cảnh chung (Tư liệu).
- Dưới ngữ cảnh đó, đưa ra 4 nhận định (a, b, c, d). Học sinh sẽ phải xác định mỗi nhận định là Đúng hay Sai. Có thể có nhiều ý đúng hoặc sai.
- Ví dụ:
Câu 1. Trong mặt phẳng Oxy, cho điểm A(2;3), đường thẳng d có phương trình 3x - y + 2 = 0 và đường tròn (C) có phương trình (x-1)² + (y-2)²=9.
a) Tâm và bán kính đường tròn (C) là I(1;2), R = 3.
b) Một vector pháp tuyến của đường thẳng d là n̄ = (1;3).
c) Phương trình đường thẳng đi qua A và song song với d là 3x - y - 3 = 0.
d) Đường thẳng d cắt đường tròn (C) tại hai điểm.

**3. TRẢ LỜI NGẮN:**
- Câu hỏi yêu cầu học sinh tính toán và điền một con số cụ thể vào chỗ trống hoặc trả lời bằng một giá trị số duy nhất.
- Ví dụ:
Câu 1. Cho hàm số f(x) = x² - 2mx + m + 2. Có bao nhiêu giá trị nguyên của m để f(x) ≥ 0 với mọi x ∈ ℝ?
Câu 2. Tính số đo của góc giữa hai đường thẳng d₁: 2x - y + 3 = 0 và d₂: x + 3y - 1 = 0 (kết quả làm tròn đến hàng phần chục).
Câu 3. Từ 5 chữ cái A, B, C, D, E, lập được bao nhiêu mật khẩu có 3 chữ cái khác nhau và phải chứa chữ A?
Câu 4. Một hộp có 6 bi trắng và 4 bi đen. Lấy ngẫu nhiên 2 bi. Tính xác suất để 2 bi lấy được cùng màu (kết quả làm tròn đến hàng phần trăm).
**4. TỰ LUẬN:**
- Câu hỏi yêu cầu trình bày lời giải chi tiết.
- Ví dụ:
Câu 1 (VD): Cho ba điểm A(1;2), B(-2;1) và C(4;-2) trong mặt phẳng tọa độ Oxy. Tìm tọa độ trực tâm H của tam giác ABC.
`;

            const LATEX_SYSTEM_PROMPT = `
BẠN LÀ MỘT CHUYÊN GIA SOẠN THẢO ĐỀ THI TOÁN HỌC BẰNG LATEX.
CHỈ TẠO NỘI DUNG BÊN TRONG MÔI TRƯỜNG DOCUMENT, KHÔNG BAO GỒM \\documentclass, \\usepackage, hay \\begin{document}.
SAU MỖI ĐÁP ÁN TRẮC NGHIỆM PHẢI THÊM KÍ HIỆU XUỐNG DÒNG \\\\ ( 2 dấu này).
CHÚ Ý: chỉ tạo các câu hỏi đúng các phần mà mình yêu cầu, nếu không yêu cầu thì không tự tạo thêm.
HÃY TUÂN THỦ NGHIÊM NGẶT CÁC QUY TẮC VÀ LÀM THEO CÁC VÍ DỤ MẪU SAU ĐÂY CHO TỪNG LOẠI CÂU HỎI:

**1. TRẮC NGHIỆM (A, B, C, D):**
- Luôn có 4 lựa chọn A, B, C, D.
- Ví dụ:
Câu 1 (NB): Trong các câu sau, câu nào không phải là mệnh đề?
A. $1 + 1 = 2$.
B. Hình thoi có bốn cạnh bằng nhau.
C. Hãy đóng cửa sổ lại!
D. Số pi là một số vô tỉ.

**2. ĐÚNG/SAI:**
- Luôn cung cấp một đoạn văn bản, hình ảnh hoặc dữ kiện làm ngữ cảnh chung (Tư liệu).
- Dưới ngữ cảnh đó, đưa ra 4 nhận định (a, b, c, d). Học sinh sẽ phải xác định mỗi nhận định là Đúng hay Sai. Có thể có nhiều ý đúng hoặc sai.
- Ví dụ:
Câu 1. Trong mặt phẳng Oxy, cho điểm $A(2;3)$, đường thẳng d có phương trình $3x - y + 2 = 0$ và đường tròn (C) có phương trình $(x-1)² + (y-2)²=9$.
a) Tâm và bán kính đường tròn (C) là $I(1;2), R = 3$.
b) Một vector pháp tuyến của đường thẳng d là $\\vec{n} = (1;3)$.
c) Phương trình đường thẳng đi qua A và song song với d là $3x - y - 3 = 0$.
d) Đường thẳng d cắt đường tròn (C) tại hai điểm.

**3. TRẢ LỜI NGẮN:**
- Câu hỏi yêu cầu học sinh tính toán và điền một con số cụ thể vào chỗ trống hoặc trả lời bằng một giá trị số duy nhất.
- Ví dụ:
Câu 1. Cho hàm số $f(x) = x^2 - 2mx + m + 2$. Có bao nhiêu giá trị nguyên của m để $f(x) \\ge 0$ với mọi $x \\in \\mathbb{R}$?
Câu 2. Tính số đo của góc giữa hai đường thẳng $d_1: 2x - y + 3 = 0$ và $d_2: x + 3y - 1 = 0$ (kết quả làm tròn đến hàng phần chục).

**4. TỰ LUẬN:**
- Câu hỏi yêu cầu trình bày lời giải chi tiết.
- Ví dụ:
Câu 1 (VD): Cho ba điểm $A(1;2), B(-2;1)$ và $C(4;-2)$ trong mặt phẳng tọa độ Oxy. Tìm tọa độ trực tâm H của tam giác ABC.
`;
            const MATHTYPE_SYSTEM_PROMPT = `
Là một chuyên gia soạn thảo Word cho các đề thi Toán học, bạn sẽ tạo câu hỏi và đáp án dưới dạng code raw LaTeX tương thích với MathType.
- Luôn dùng $...$ cho môi trường toán học.
- Luôn dùng \\dfrac, \\left( ... \\right), \\overrightarrow.
CHÚ Ý: chỉ tạo các câu hỏi đúng các phần mà mình yầu, nếu không yêu cầu thì không tự tạo thêm
VÍ DỤ MẪU:
**1. TRẮC NGHIỆM (A, B, C, D):**
Câu 1 (TH). Cho tam giác ABC có $a = 21, b = 17, c = 10$. Diện tích của tam giác ABC bằng:
A. $S=16$.
B. $S=48$.
C. $S=20$.
D. $S=100$.
Câu 2 (NB): Trong các câu sau, câu nào không phải là mệnh đề?
A. 1 + 1 = 2.
B. Hình thoi có bốn cạnh bằng nhau.
C. Hãy đóng cửa sổ lại!
D. Số pi là một số vô tỉ.

**2. ĐÚNG/SAI:**
- Luôn cung cấp một đoạn văn bản, hình ảnh hoặc dữ kiện làm ngữ cảnh chung (Tư liệu).
- Dưới ngữ cảnh đó, đưa ra 4 nhận định (a, b, c, d). Học sinh sẽ phải xác định mỗi nhận định là Đúng hay Sai. Có thể có nhiều ý đúng hoặc sai.
- Ví dụ:
Câu 1. Trong mặt phẳng Oxy, cho điểm A(2;3), đường thẳng d có phương trình 3x - y + 2 = 0 và đường tròn (C) có phương trình (x-1)² + (y-2)²=9.
a) Tâm và bán kính đường tròn (C) là I(1;2), R = 3.
b) Một vector pháp tuyến của đường thẳng d là n̄ = (1;3).
c) Phương trình đường thẳng đi qua A và song song với d là 3x - y - 3 = 0.
d) Đường thẳng d cắt đường tròn (C) tại hai điểm.

**3. TRẢ LỜI NGẮN:**
- Câu hỏi yêu cầu học sinh tính toán và điền một con số cụ thể vào chỗ trống hoặc trả lời bằng một giá trị số duy nhất.
- Ví dụ:
Câu 1. Cho hàm số f(x) = x² - 2mx + m + 2. Có bao nhiêu giá trị nguyên của m để f(x) ≥ 0 với mọi x ∈ ℝ?
Câu 2. Tính số đo của góc giữa hai đường thẳng d₁: 2x - y + 3 = 0 và d₂: x + 3y - 1 = 0 (kết quả làm tròn đến hàng phần chục).
Câu 3. Từ 5 chữ cái A, B, C, D, E, lập được bao nhiêu mật khẩu có 3 chữ cái khác nhau và phải chứa chữ A?
Câu 4. Một hộp có 6 bi trắng và 4 bi đen. Lấy ngẫu nhiên 2 bi. Tính xác suất để 2 bi lấy được cùng màu (kết quả làm tròn đến hàng phần trăm).
**4. TỰ LUẬN:**
- Câu hỏi yêu cầu trình bày lời giải chi tiết.
- Ví dụ:
Câu 1 (VD): Cho ba điểm A(1;2), B(-2;1) và C(4;-2) trong mặt phẳng tọa độ Oxy. Tìm tọa độ trực tâm H của tam giác ABC.
`;

    let structuredPrompt = examStructure.map((part, index) => {
        const lessonInfo = examData[part.grade][part.lesson];
        let contentForPrompt = useTextbook.checked && lessonInfo.content ? lessonInfo.content : "Không sử dụng sách giáo khoa.";
        return `
PHẦN ${index + 1}:
- Bài học: "${part.lesson}".
- Chủ đề/Chương: "${lessonInfo.chapter}"
- Nội dung cốt lõi từ SGK: ${contentForPrompt}
- Yêu cầu cần đạt trọng tâm: ${part.objectives.join(', ')}.
- Tạo ra ${part.numQuestions} câu hỏi loại "${part.type}" ở mức độ "${part.difficulty}".`;
    }).join('\n');

    let systemPrompt = '';
    const mathFormat = formatSelect.value;
    let formatInstruction = '';

    switch (mathFormat) {
        case 'latex': 
            systemPrompt = LATEX_SYSTEM_PROMPT; 
            formatInstruction = "Quan trọng: Toàn bộ phần ĐỀ THI VÀ ĐÁP ÁN phải được định dạng LaTeX, sử dụng $...$ cho tất cả các môi trường toán học.";
            break;
        case 'mathtype': 
            systemPrompt = MATHTYPE_SYSTEM_PROMPT; 
            formatInstruction = "Quan trọng: Toàn bộ công thức toán trong phần ĐỀ THI VÀ ĐÁP ÁN phải được định dạng tương thích với MathType, sử dụng dấu $...$ cho tất cả các môi trường toán học như trong ví dụ đã cho.";
            break;
        default: 
            systemPrompt = NORMAL_SYSTEM_PROMPT; 
            formatInstruction = "Quan trọng: Toàn bộ phần ĐỀ THI VÀ ĐÁP ÁN phải được trình bày dưới dạng văn bản thường như trong ví dụ đã cho.";
            break;
    }

    const taskDescription = `
Hãy tạo ra một bộ sản phẩm hoàn chỉnh gồm 3 phần: Đề thi, Ma trận, và Bản đặc tả.
${formatInstruction} 
---
NGUỒN KIẾN THỨC VÀ CẤU TRÚC ĐỀ THI:
${structuredPrompt}
---
YÊU CẦU ĐẦU RA:
Hãy trả về một chuỗi văn bản duy nhất chứa cả 3 phần, được ngăn cách bởi các dấu hiệu đặc biệt.

1.  **PHẦN ĐỀ THI:**
    - Bắt đầu bằng '---EXAM_START---'.
    - Tạo đề thi.
    - Sau khi tạo xong toàn bộ câu hỏi, hãy thêm một dấu phân cách là '---ANSWER_KEY_START---', sau đó cung cấp đáp án chi tiết.
    - Kết thúc bằng '---EXAM_END---'.

2.  **PHẦN MA TRẬN:**
    - Bắt đầu bằng '---MATRIX_START---'.
    - Tạo 'I. MA TRẬN ĐỀ KIỂM TRA' dạng bảng văn bản.
    - Kết thúc bằng '---MATRIX_END---'.

3.  **PHẦN BẢN ĐẶC TẢ:**
    - Bắt đầu bằng '---SPEC_START---'.
    - Tạo 'II. BẢN ĐẶC TẢ ĐỀ KIỂM TRA' dạng bảng văn bản.
    - Kết thúc bằng '---SPEC_END---'.

Vui lòng tuân thủ nghiêm ngặt định dạng và các dấu phân cách.`;

    if (!ai) {
        throw new Error("Gemini AI client not initialized.");
    }
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: taskDescription,
        config: {
            systemInstruction: systemPrompt
        }
    });

    const text = response.text;
    if (!text) {
        let reason = "Không nhận được phản hồi hợp lệ từ AI.";
        if (response.promptFeedback && response.promptFeedback.blockReason) {
            reason = `Yêu cầu bị chặn. Lý do: ${response.promptFeedback.blockReason}.`;
        }
        throw new Error(reason);
    }
    return text;
}

function handleNewExam() {
    window.location.reload();
}

function handleCopyContent() {
    const activePane = document.querySelector('.tab-pane.active');
    if (activePane) {
            const renderedTable = activePane.querySelector('.rendered-table') as HTMLElement;
            const contentToCopy = activePane.id === 'exam-tab-pane' ? 
            examAndAnswerContent.innerText + '\n\n' + explanationsContainer.innerText :
            (renderedTable ? renderedTable.innerText : '');

        const tempTextArea = document.createElement('textarea');
        tempTextArea.value = contentToCopy;
        document.body.appendChild(tempTextArea);
        tempTextArea.select();
        try {
            document.execCommand('copy');
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="bi bi-check2"></i> Đã sao chép';
            setTimeout(() => { copyBtn.innerHTML = originalText; }, 2000);
        } catch (err) {
            showAlert('Không thể sao chép.', 'warning');
        } finally {
            document.body.removeChild(tempTextArea);
        }
    }
}

function handleExportToDocx() {
    try {
        const examHtml = `<h2>ĐỀ THI VÀ ĐÁP ÁN</h2><div>${examAndAnswerContent.innerHTML.replace(/\n/g, '<br>')}</div>`;
        const explanationsHtml = explanationsContainer.style.display !== 'none' ? `<h2>GIẢI THÍCH CHI TIẾT</h2><div>${explanationsContainer.innerHTML.replace(/\n/g, '<br>')}</div>` : '';
        const matrixHtml = examMatrixContent.innerHTML;
        const specHtml = examSpecContent.innerHTML;
        
        const fullHtml = `
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <title>Đề thi, Ma trận và Đặc tả</title>
                <style>
                    body { font-family: 'Times New Roman', serif; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-family: 'Times New Roman', serif; }
                    th, td { border: 1px solid black; padding: 8px; text-align: center; vertical-align: middle; }
                    th { background-color: #f2f2f2; }
                    .text-left { text-align: left; }
                    .question-item { page-break-inside: avoid; }
                </style>
            </head>
            <body>
                ${examHtml}
                <br style="page-break-after: always">
                ${explanationsHtml}
                <br style="page-break-after: always">
                ${matrixHtml}
                <br style="page-break-after: always">
                ${specHtml}
            </body>
            </html>
        `;

        const blob = new Blob(['\ufeff', fullHtml], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "de_thi_va_ma_tran.docx";
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
        showAlert('File Word đã được tạo!', 'success');
    } catch (e) {
        showAlert('Không thể xuất file Word. Lỗi: ' + e.message, 'danger');
    }
}

function handleExportToTex() {
    if (exportTexBtn.classList.contains('disabled')) {
        return;
    }

    try {
        const examWithAnswerRaw = fullResponseText.split('---EXAM_START---')[1]?.split('---EXAM_END---')[0];

        if (!examWithAnswerRaw) {
            throw new Error('Không có nội dung LaTeX để xuất.');
        }

        let contentToExport = examWithAnswerRaw.trim();
        const format = formatSelect.value;
        
        // This block now handles both 'latex' and 'mathtype' to ensure a valid document is always created.
        if (format === 'latex' || format === 'mathtype') {
            const [examRaw, answerRaw] = contentToExport.split('---ANSWER_KEY_START---');
            const title = examTitleInput.value.trim() || 'Đề kiểm tra';
            
            contentToExport = `\\documentclass[12pt,a4paper]{article}
\\usepackage[utf8]{vietnam}
\\usepackage{amsmath}
\\usepackage{geometry}
\\geometry{a4paper, margin=1in}

\\title{${title}}
\\author{AG-AI}
\\date{\\today}

\\begin{document}
\\maketitle

\\section*{Phần I: Đề thi}
${examRaw ? examRaw.trim() : ''}

\\section*{Phần II: Đáp án}
${answerRaw ? answerRaw.trim() : ''}

\\end{document}
`;
        }

        const blob = new Blob([contentToExport], { type: 'application/x-tex' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "de_thi.tex";
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
        showAlert('File .tex đã được tải về!', 'success');

    } catch (e) {
        showAlert('Không thể xuất file .tex. Lỗi: ' + e.message, 'danger');
        console.error(e);
    }
}


async function handleSaveApiKey() {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        showApiKeyMessage('Vui lòng nhập API Key', 'danger');
        return;
    }

    setLoadingState(saveApiKeyBtn, true);
    saveApiKeyText.textContent = 'Đang kiểm tra...';

    const isValid = await validateApiKey(apiKey);
    if (isValid) {
        if (rememberApiKey.checked) {
            localStorage.setItem('geminiApiKey', apiKey);
        } else {
            localStorage.removeItem('geminiApiKey');
        }
        currentApiKey = apiKey;
        ai = new GoogleGenAI({ apiKey: currentApiKey });
        showApiKeyMessage('API Key hợp lệ và đã được lưu!', 'success');
        setTimeout(() => {
            apiKeyModal?.hide();
            showAlert('Đã lưu API Key thành công!', 'success');
        }, 1000);
    } else {
        showApiKeyMessage('API Key không hợp lệ hoặc đã xảy ra lỗi. Vui lòng kiểm tra lại.', 'danger');
    }
    
    setLoadingState(saveApiKeyBtn, false);
    saveApiKeyText.textContent = 'Lưu API Key';
}

async function validateApiKey(apiKey) {
    try {
        const testAi = new GoogleGenAI({ apiKey });
        const response = await testAi.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: "Xin chào"
        });
        return response && typeof response.text === 'string';
    } catch (e) {
        console.error("API Key validation failed", e);
        return false;
    }
}

function renderStructure() {
    if (examStructure.length === 0) {
        structureContainer.style.display = 'none';
        return;
    }
    structureContainer.style.display = 'block';
    structureList.innerHTML = '';

    examStructure.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'structure-item';
        itemDiv.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <h6 class="mb-1">Phần ${index + 1}: ${item.lesson}</h6>
                    <p><strong>Số câu:</strong> ${item.numQuestions} | <strong>Loại:</strong> ${item.type} | <strong>Mức độ:</strong> ${item.difficulty}</p>
                    <p class="text-muted small"><strong>Yêu cầu:</strong> ${item.objectives.join(', ')}</p>
                </div>
                <button class="btn btn-sm btn-outline-danger" data-id="${item.id}"><i class="bi bi-trash"></i></button>
            </div>
        `;
        itemDiv.querySelector('button').addEventListener('click', () => removeItem(item.id));
        structureList.appendChild(itemDiv);
    });
}

function removeItem(id) {
    examStructure = examStructure.filter(item => item.id !== id);
    renderStructure();
    showAlert('Đã xóa một phần khỏi cấu trúc đề thi.', 'info');
}

function displayExamResult(fullResponse) {
    const examWithAnswerRaw = fullResponse.split('---EXAM_START---')[1]?.split('---EXAM_END---')[0] || "Không thể tạo đề thi.";
    const format = formatSelect.value;
    
    if (format === 'normal') {
        exportTexBtn.classList.add('disabled');
        exportTexBtn.setAttribute('aria-disabled', 'true');
    } else {
        exportTexBtn.classList.remove('disabled');
        exportTexBtn.removeAttribute('aria-disabled');
    }


    generatedQuestions = [];
    explanationsContainer.style.display = 'none';
    explanationsContainer.innerHTML = '';

    if (format === 'latex') {
        examAndAnswerContent.innerHTML = `<pre>${examWithAnswerRaw.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`;
        document.getElementById('generateExplanationsBtn').style.display = 'none';
    } else if (format === 'mathtype') {
        const [examRaw, answerRaw] = examWithAnswerRaw.split('---ANSWER_KEY_START---');
        const examHtml = examRaw ? `<div class="exam-content-block">${examRaw.trim().replace(/\n/g, '<br>')}</div>` : '';
        const answerHtml = answerRaw ? `<hr><h4 class="mt-4">Đáp án</h4><div class="answer-content-block">${answerRaw.trim().replace(/\n/g, '<br>')}</div>` : '';
        examAndAnswerContent.innerHTML = examHtml + answerHtml;
        document.getElementById('generateExplanationsBtn').style.display = 'none';
        
        if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
            MathJax.typesetPromise([examAndAnswerContent]).catch(function (err) {
                console.error('MathJax typesetting error: ' + err.message);
                showAlert('Lỗi hiển thị công thức MathJax. ' + err.message, 'warning');
            });
        }
    } else { // 'normal' format
        document.getElementById('generateExplanationsBtn').style.display = 'block';
        const [examRaw, answerRaw] = examWithAnswerRaw.split('---ANSWER_KEY_START---');

        const questionRegex = /Câu\s*\d+\s*\(.*?\):/g;
        const questionsText = examRaw.split(questionRegex);
        const questionHeaders = examRaw.match(questionRegex);
        
        if (questionsText.length > 0) questionsText.shift(); 

        if (questionHeaders) {
            questionHeaders.forEach((header, index) => {
                const content = questionsText[index] ? questionsText[index].trim() : '';
                generatedQuestions.push({
                    id: `q-${index}`,
                    header: header.trim(),
                    content: content,
                    answer: '', 
                    explanation: ''
                });
            });
        }

        if (answerRaw) {
            const answerLines = answerRaw.trim().split('\n').filter(line => line.trim() !== '');
            answerLines.forEach(line => {
                const match = line.match(/Câu\s*(\d+):(.*)/);
                if (match) {
                    const qIndex = parseInt(match[1], 10) - 1;
                    if (generatedQuestions[qIndex]) {
                        generatedQuestions[qIndex].answer = match[2].trim();
                    }
                }
            });
        }
        
        renderExamAndAnswers();
            if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
            MathJax.typesetPromise([examAndAnswerContent]).catch(function (err) {
                console.error('MathJax typesetting error: ' + err.message);
                showAlert('Lỗi hiển thị công thức MathJax. ' + err.message, 'warning');
            });
        }
    }
    
    renderMatrixTable();
    renderSpecTable();
}

function renderExamAndAnswers() {
    examAndAnswerContent.innerHTML = '';
    generatedQuestions.forEach(q => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-item';
        questionDiv.id = q.id;
        questionDiv.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <p><strong>${q.header}</strong></p>
                <button class="btn btn-sm btn-outline-primary generate-similar-btn" data-question-id="${q.id}">
                    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>✨ Tạo câu hỏi tương tự</span>
                </button>
            </div>
            <p>${q.content.replace(/\n/g, '<br>')}</p>
            <p><strong>Đáp án:</strong> ${q.answer}</p>
        `;
        examAndAnswerContent.appendChild(questionDiv);
    });

    document.querySelectorAll('.generate-similar-btn').forEach(button => {
        button.addEventListener('click', handleGenerateSimilarQuestion);
    });
}

function renderMatrixTable() {
    const container = document.getElementById('examMatrixContent');
    const tableHtml = `
        <h2>I. MA TRẬN ĐỀ KIỂM TRA</h2>
        <table>
            <thead>
                <tr>
                    <th rowspan="3">TT</th>
                    <th rowspan="3">Chương/chủ đề</th>
                    <th rowspan="3">Nội dung/đơn vị kiến thức</th>
                    <th colspan="12">Năng lực và mức độ đánh giá</th>
                    <th rowspan="3">Tổng</th>
                    <th rowspan="3">Tỉ lệ % điểm</th>
                </tr>
                <tr>
                    <th colspan="3">TNKQ nhiều lựa chọn</th>
                    <th colspan="3">TNKQ đúng sai</th>
                    <th colspan="3">Tự luận</th>
                    <th colspan="3">Tổng</th>
                </tr>
                <tr>
                    <th>Biết</th><th>Hiểu</th><th>VD</th>
                    <th>Biết</th><th>Hiểu</th><th>VD</th>
                    <th>Biết</th><th>Hiểu</th><th>VD</th>
                    <th>Biết</th><th>Hiểu</th><th>VD</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>`;
    container.innerHTML = tableHtml;
    const tbody = container.querySelector('tbody');
    
    const chapters = {};
    examStructure.forEach(item => {
        const chapterName = examData[item.grade][item.lesson].chapter;
        if (!chapters[chapterName]) {
            chapters[chapterName] = [];
        }
        chapters[chapterName].push(item);
    });

    let tt = 1;
    for (const chapterName in chapters) {
        const lessonsInChapter = chapters[chapterName];
        lessonsInChapter.forEach((item, index) => {
            const tr = document.createElement('tr');
            let rowHtml = '';
            if (index === 0) {
                rowHtml += `<td rowspan=${lessonsInChapter.length}>${tt++}</td>`;
                rowHtml += `<td rowspan=${lessonsInChapter.length}>${chapterName}</td>`;
            }
            rowHtml += `<td>${item.lesson}</td>`;
            
            const levels = ['nhận biết', 'thông hiểu', 'vận dụng'];
            const types = ['trắc nghiệm', 'đúng/sai', 'tự luận'];
            let totalByLevel = { 'nhận biết': 0, 'thông hiểu': 0, 'vận dụng': 0 };

            types.forEach(type => {
                levels.forEach(level => {
                    if (item.type === type && item.difficulty === level) {
                        rowHtml += `<td>${item.numQuestions}</td>`;
                        totalByLevel[level] += parseInt(item.numQuestions);
                    } else {
                        rowHtml += `<td></td>`;
                    }
                });
            });
            
            levels.forEach(level => {
                rowHtml += `<td>${totalByLevel[level] || ''}</td>`;
            });

            rowHtml += `<td>${item.numQuestions}</td><td></td>`;
            tr.innerHTML = rowHtml;
            tbody.appendChild(tr);
        });
    }
}

function renderSpecTable() {
        const container = document.getElementById('examSpecContent');
        const tableHtml = `
            <h2>II. BẢN ĐẶC TẢ ĐỀ KIỂM TRA</h2>
            <table>
                <thead>
                    <tr>
                        <th rowspan="2">TT</th>
                        <th rowspan="2">Chương/chủ đề</th>
                        <th rowspan="2">Nội dung/đơn vị kiến thức</th>
                        <th rowspan="2">Yêu cầu cần đạt</th>
                        <th colspan="3">Số câu hỏi theo mức độ nhận thức</th>
                    </tr>
                    <tr>
                        <th>Nhận biết</th>
                        <th>Thông hiểu</th>
                        <th>Vận dụng</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>`;
    container.innerHTML = tableHtml;
    const tbody = container.querySelector('tbody');

    const chapters = {};
    examStructure.forEach(item => {
        const chapterName = examData[item.grade][item.lesson].chapter;
        if (!chapters[chapterName]) {
            chapters[chapterName] = [];
        }
        chapters[chapterName].push(item);
    });

    let tt = 1;
    for (const chapterName in chapters) {
        const lessonsInChapter = chapters[chapterName];
        lessonsInChapter.forEach((item, index) => {
            const tr = document.createElement('tr');
            let rowHtml = '';
                if (index === 0) {
                        rowHtml += `<td rowspan=${lessonsInChapter.length}>${tt++}</td>`;
                        rowHtml += `<td class="text-left" rowspan=${lessonsInChapter.length}>${chapterName}</td>`;
                    }
            rowHtml += `<td class="text-left">${item.lesson}</td>`;
            rowHtml += `<td class="text-left">${item.objectives.map(o => `- ${o}`).join('<br>')}</td>`;
            
            let nb = (item.difficulty === 'nhận biết') ? `${item.numQuestions} (${item.type})` : '';
            let th = (item.difficulty === 'thông hiểu') ? `${item.numQuestions} (${item.type})` : '';
            let vd = (item.difficulty === 'vận dụng') ? `${item.numQuestions} (${item.type})` : '';

            rowHtml += `<td>${nb}</td>`;
            rowHtml += `<td>${th}</td>`;
            rowHtml += `<td>${vd}</td>`;
            tr.innerHTML = rowHtml;
            tbody.appendChild(tr);
        });
    }
}

function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
    messageBox.prepend(alertDiv);
    setTimeout(() => {
        const bsAlert = bootstrap.Alert.getOrCreateInstance(alertDiv);
        if (alertDiv.parentElement) bsAlert.close();
    }, 7000);
}

function showApiKeyMessage(message, type) {
    apiKeyMessage.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
}

function setLoadingState(button: HTMLButtonElement, isLoading: boolean) {
    button.disabled = isLoading;
    if (isLoading) {
        button.classList.add('is-loading');
    } else {
        button.classList.remove('is-loading');
    }
}

// --- Gemini API Features ---

async function callGemini(prompt) {
    if (!ai) {
        throw new Error('API Key không được cung cấp hoặc chưa được khởi tạo.');
    }
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        const text = response.text;
        if (typeof text !== 'string') {
            throw new Error('Phản hồi từ API không hợp lệ.');
        }
        return text;
    } catch(e) {
        console.error("Gemini API call failed", e);
        throw new Error(`Lỗi từ Gemini API: ${e.message}`);
    }
}

async function handleSuggestObjectives(e) {
    const button = e.currentTarget as HTMLButtonElement;
    const selectedGrade = gradeSelect.value;
    const selectedLesson = lessonSelect.value;

    if (!currentApiKey) {
        showAlert('Vui lòng nhập API Key trước khi dùng tính năng này.', 'warning');
        apiKeyModal?.show();
        return;
    }

    if (!selectedGrade || gradeSelect.selectedIndex === 0 || !selectedLesson || lessonSelect.selectedIndex === 0) {
        showAlert('Vui lòng chọn Lớp và Bài học trước khi dùng tính năng này.', 'warning');
        return;
    }

    const lessonInfo = examData[selectedGrade]?.[selectedLesson];
    const lessonContent = lessonInfo?.content || 'Không có nội dung chi tiết.';

    const prompt = `Dựa trên nội dung bài học "${selectedLesson}" môn Toán lớp ${selectedGrade}, với nội dung chính là: "${lessonContent}", hãy gợi ý 3-5 yêu cầu cần đạt (mục tiêu học tập) cụ thể, có thể đo lường được. Trình bày dưới dạng danh sách, mỗi yêu cầu trên một dòng, không có gạch đầu dòng hay đánh số.`;
    
    setLoadingState(button, true);

    try {
        const result = await callGemini(prompt);
        customObjectivesTextarea.value = result;
        showAlert('Đã nhận được gợi ý từ AI!', 'success');
    } catch (error) {
        showAlert(`Lỗi khi gợi ý yêu cầu: ${error.message}`, 'danger');
    } finally {
        setLoadingState(button, false);
    }
}

async function handleSuggestTitle(e) {
    const button = e.currentTarget as HTMLButtonElement;

    if (!currentApiKey) {
        showAlert('Vui lòng nhập API Key trước khi dùng tính năng này.', 'warning');
        apiKeyModal?.show();
        return;
    }

    if (examStructure.length === 0) {
        showAlert('Vui lòng thêm ít nhất một phần vào cấu trúc đề thi trước.', 'warning');
        return;
    }

    const lessons = [...new Set(examStructure.map(item => item.lesson))].join(', ');
    const chapters = [...new Set(examStructure.map(item => examData[item.grade][item.lesson].chapter))].join(', ');
    const grade = examStructure[0].grade;

    const prompt = `Hãy gợi ý 1 tên đề thi phù hợp cho một bài kiểm tra môn Toán lớp ${grade} bao gồm các nội dung sau: ${lessons} (thuộc các chương: ${chapters}). Chỉ trả về một dòng duy nhất chứa tên đề thi đó.`;

    setLoadingState(button, true);

    try {
        const result = await callGemini(prompt);
        examTitleInput.value = result.trim();
        showAlert('Đã nhận được gợi ý tên đề thi!', 'success');
    } catch (error) {
        showAlert(`Lỗi khi gợi ý tên đề thi: ${error.message}`, 'danger');
    } finally {
        setLoadingState(button, false);
    }
}

async function handleGenerateExplanations(e) {
    const button = e.currentTarget as HTMLButtonElement;
    
    if (!currentApiKey) {
        showAlert('Vui lòng nhập API Key trước khi dùng tính năng này.', 'warning');
        apiKeyModal?.show();
        return;
    }

    if (generatedQuestions.length === 0) {
        showAlert('Không có câu hỏi nào để tạo giải thích.', 'warning');
        return;
    }

    const prompt = `Bạn là một giáo viên giỏi. Hãy cung cấp lời giải thích chi tiết, từng bước cho các câu hỏi và đáp án sau đây. Giữ nguyên tiêu đề "Câu X:" cho mỗi phần giải thích.
    
    ${generatedQuestions.map(q => `Câu ${q.id.split('-')[1] * 1 + 1}:\n- Câu hỏi: ${q.header} ${q.content}\n- Đáp án: ${q.answer}`).join('\n\n')}
    `;

    setLoadingState(button, true);
    explanationsContainer.style.display = 'block';
    explanationsContainer.innerHTML = '<p>Đang tạo giải thích...</p>';

    try {
        const result = await callGemini(prompt);
        explanationsContainer.innerHTML = `<h4 class="explanation-section-title">Giải thích chi tiết</h4><pre>${result}</pre>`;
        showAlert('Đã tạo giải thích chi tiết thành công!', 'success');
    } catch (error) {
        showAlert(`Lỗi khi tạo giải thích: ${error.message}`, 'danger');
        explanationsContainer.innerHTML = '<p class="text-danger">Không thể tạo giải thích.</p>';
    } finally {
        setLoadingState(button, false);
    }
}

async function handleGenerateSimilarQuestion(e) {
    const button = e.currentTarget as HTMLButtonElement;
    const questionId = button.dataset.questionId;
    const question = generatedQuestions.find(q => q.id === questionId);

    if (!currentApiKey) {
        showAlert('Vui lòng nhập API Key trước khi dùng tính năng này.', 'warning');
        apiKeyModal?.show();
        return;
    }

    if (!question) return;

    const prompt = `Bạn là một chuyên gia ra đề thi. Cho câu hỏi sau:
    - Câu hỏi gốc: "${question.header} ${question.content}"
    - Đáp án gốc: "${question.answer}"
    
    Hãy tạo một câu hỏi MỚI nhưng có cùng dạng, cùng độ khó, và kiểm tra cùng một yêu cầu cần đạt. Giữ nguyên định dạng đầu ra bao gồm tiêu đề câu hỏi (ví dụ: Câu X (Mức độ):) và các lựa chọn nếu có. Chỉ trả về câu hỏi và đáp án mới, không giải thích gì thêm. Phân tách câu hỏi và đáp án bằng '---ANSWER---'.`;
    
    setLoadingState(button, true);

    try {
        const result = await callGemini(prompt);
        const [newQuestionRaw, newAnswerRaw] = result.split('---ANSWER---');
        
        const questionRegex = /^(Câu\s*\d+\s*\(.*?\):)/;
        const headerMatch = newQuestionRaw.trim().match(questionRegex);
        const newHeader = headerMatch ? headerMatch[0] : question.header;
        const newContent = headerMatch ? newQuestionRaw.trim().replace(questionRegex, '').trim() : newQuestionRaw.trim();
        const newAnswer = newAnswerRaw ? newAnswerRaw.trim() : 'Không có đáp án';

        // Update the question in the array
        question.header = newHeader;
        question.content = newContent;
        question.answer = newAnswer;

        // Re-render the specific question
        const questionDiv = document.getElementById(questionId);
        if (questionDiv) {
            questionDiv.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <p><strong>${newHeader}</strong></p>
                    <button class="btn btn-sm btn-outline-primary generate-similar-btn" data-question-id="${questionId}">
                        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        <span>✨ Tạo câu hỏi tương tự</span>
                    </button>
                </div>
                <p>${newContent.replace(/\n/g, '<br>')}</p>
                <p><strong>Đáp án:</strong> ${newAnswer}</p>
            `;
            questionDiv.querySelector('.generate-similar-btn').addEventListener('click', handleGenerateSimilarQuestion);
        }
        showAlert('Đã tạo câu hỏi tương tự thành công!', 'success');

    } catch (error) {
        showAlert(`Lỗi khi tạo câu hỏi tương tự: ${error.message}`, 'danger');
    } finally {
        setLoadingState(button, false);
    }
}