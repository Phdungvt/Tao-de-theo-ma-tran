/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
declare var bootstrap: any;
declare var MathJax: any;

import { GoogleGenAI, Type } from "@google/genai";
import { getTikzSnippetsForQuery } from './tikz-snippets.ts';

// --- Global State ---
let examStructure = [];
let currentApiKey = '';
let currentSubject = 'Toan';
let generatedQuestions = [];
let examData = {};
let bankViewingData = {}; // Data for the subject selected in the bank view
let fullResponseText = '';
let ai; // GoogleGenAI instance
let uploadedFiles: File[] = [];
let selectedBankQuestions: any[] = [];


// --- DOM Elements ---
const subjectSelect = document.getElementById('subjectSelect') as HTMLSelectElement;
const gradeSelect = document.getElementById('gradeSelect') as HTMLSelectElement;
const lessonSelect = document.getElementById('lessonSelect') as HTMLSelectElement;
const objectivesContainer = document.getElementById('objectivesContainer') as HTMLElement;
const newObjectiveInput = document.getElementById('newObjectiveInput') as HTMLInputElement;
const addObjectiveBtn = document.getElementById('addObjectiveBtn') as HTMLButtonElement;
const objectivesCheckboxContainer = document.getElementById('objectivesCheckboxContainer') as HTMLElement;
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
const webLinks = document.getElementById('webLinks') as HTMLElement;
const apiKeyInput = document.getElementById('apiKeyInput') as HTMLInputElement;
const rememberApiKey = document.getElementById('rememberApiKey') as HTMLInputElement;
const saveApiKeyBtn = document.getElementById('saveApiKeyBtn') as HTMLButtonElement;
const apiKeyMessage = document.getElementById('apiKeyMessage') as HTMLElement;
const saveApiKeyText = document.getElementById('saveApiKeyText') as HTMLElement;
const apiKeySpinner = document.getElementById('apiKeySpinner') as HTMLElement;
const apiKeyModalEl = document.getElementById('apiKeyModal') as HTMLElement;
const apiKeyModal = apiKeyModalEl ? new bootstrap.Modal(apiKeyModalEl) : null;
const exportDataFileBtn = document.getElementById('exportDataFileBtn') as HTMLButtonElement;
const importDataFileInput = document.getElementById('importDataFileInput') as HTMLInputElement;
const formatSelect = document.getElementById('formatSelect') as HTMLSelectElement;
const suggestObjectivesBtn = document.getElementById('suggestObjectivesBtn') as HTMLButtonElement;
const generateExplanationsBtn = document.getElementById('generateExplanationsBtn') as HTMLButtonElement;
const explanationsContainer = document.getElementById('explanationsContainer') as HTMLElement;
const examTitleInput = document.getElementById('examTitleInput') as HTMLInputElement;
const suggestTitleBtn = document.getElementById('suggestTitleBtn') as HTMLButtonElement;
const suggestTitleSpinner = document.getElementById('suggestTitleSpinner') as HTMLElement;
const resetDataBtn = document.getElementById('resetDataBtn') as HTMLButtonElement;
const fileUploadInput = document.getElementById('fileUploadInput') as HTMLInputElement;
const fileUploadList = document.getElementById('fileUploadList') as HTMLElement;
const updateQuestionBankBtn = document.getElementById('updateQuestionBankBtn') as HTMLButtonElement;

// --- Question Bank DOM Elements ---
const bankSubjectSelect = document.getElementById('bankSubjectSelect') as HTMLSelectElement;
const bankGradeSelect = document.getElementById('bankGradeSelect') as HTMLSelectElement;
const bankLessonSelect = document.getElementById('bankLessonSelect') as HTMLSelectElement;
const bankTypeSelect = document.getElementById('bankTypeSelect') as HTMLSelectElement;
const bankDifficultySelect = document.getElementById('bankDifficultySelect') as HTMLSelectElement;
const bankObjectiveSelect = document.getElementById('bankObjectiveSelect') as HTMLSelectElement;
const questionBankDisplay = document.getElementById('questionBankDisplay') as HTMLElement;
const questionBankActions = document.getElementById('questionBankActions') as HTMLElement;
const selectedQuestionCount = document.getElementById('selectedQuestionCount') as HTMLElement;
const exportSelectedBtn = document.getElementById('exportSelectedBtn') as HTMLButtonElement;
const importQuestionBankInput = document.getElementById('importQuestionBankInput') as HTMLInputElement;
const exportFullBankBtn = document.getElementById('exportFullBankBtn') as HTMLButtonElement;


// --- UTILITY FUNCTIONS ---
function showAlert(message, type = 'info', duration = 5000) {
    if (!messageBox) return;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert" style="margin-bottom: 0.5rem;">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    messageBox.append(wrapper);
    if (duration > 0) {
        setTimeout(() => {
            wrapper.querySelector('.alert')?.remove();
        }, duration);
    }
}

function setLoadingState(button: HTMLButtonElement, isLoading: boolean, text?: string) {
    button.disabled = isLoading;
    const originalText = button.dataset.originalText || button.innerText;
    if (!button.dataset.originalText) {
        button.dataset.originalText = originalText;
    }

    if (isLoading) {
        button.classList.add('is-loading');
        if (text) {
             const textSpan = button.querySelector('span:not(.spinner-border)');
             if (textSpan) textSpan.textContent = text;
        }
    } else {
        button.classList.remove('is-loading');
        const textSpan = button.querySelector('span:not(.spinner-border)');
        if (textSpan) textSpan.textContent = originalText.replace(/<i.*><\/i>/, '').trim();
    }
}

function downloadDataAsJson(data: object, filename: string) {
    try {
        const fileContent = JSON.stringify(data, null, 4);
        const blob = new Blob([fileContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
        showAlert(`Đã tải về thành công tệp \`${filename}\`!`, 'success');
    } catch (e) {
        showAlert('Không thể tải về tệp. Lỗi: ' + (e as Error).message, 'danger');
        console.error(e);
    }
}


// --- INITIALIZATION ---
window.addEventListener('DOMContentLoaded', async () => {
    loadSavedApiKey();
    
    bankSubjectSelect.innerHTML = subjectSelect.innerHTML;
    bankSubjectSelect.value = currentSubject;
    
    await loadSubjectData(currentSubject);

    // Add a check for potentially stale data from localStorage
    if (localStorage.getItem(`examData_${currentSubject}`) && examData && !examData['1']) {
        showAlert('Dữ liệu của bạn có thể đã cũ. Vui lòng vào phần "Quản lý dạng bài tập" và nhấn <strong>"Reset về dữ liệu gốc"</strong> để cập nhật dữ liệu mới nhất cho môn học này.', 'warning', 0);
    }

    await loadBankData(currentSubject);

    updateQuestionTypesForSubject(currentSubject);
    setupEventListeners();
    renderStructure();
});

/**
 * Fetches subject data from localStorage or server, with a specific cache invalidation
 * check for CNNN (Agricultural Technology) to fix stale data issues.
 * @param subject The subject key (e.g., 'Toan', 'CNNN').
 * @returns A promise that resolves to the subject data object.
 */
async function getSubjectData(subject: string): Promise<any> {
    const localStorageKey = `examData_${subject}`;
    const savedData = localStorage.getItem(localStorageKey);

    if (savedData) {
        const parsedData = JSON.parse(savedData);
        // Specific check for CNNN to invalidate stale cache.
        // If CNNN data is loaded but contains a lesson from CNCN ("Công nghệ và đời sống"), it's stale.
        if (subject === 'CNNN' && parsedData['10'] && parsedData['10']['Bài 1. Công nghệ và đời sống']) {
            console.warn(`Stale CNNN data for key '${localStorageKey}' detected. Refetching from server.`);
            // By not returning here, we allow the code to fall through to the fetch operation.
        } else {
            console.log(`Loading data for subject '${subject}' from localStorage.`);
            return parsedData;
        }
    }

    // Fetch new data if no local data exists or if it was detected as stale.
    console.log(`Fetching fresh data for '${subject}' from server.`);
    const response = await fetch(`${subject}.json`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const freshData = await response.json();
    // Save the newly fetched data to localStorage, overwriting any stale data.
    localStorage.setItem(localStorageKey, JSON.stringify(freshData));
    return freshData;
}


async function loadSubjectData(subject) {
    currentSubject = subject;
    try {
        examData = await getSubjectData(subject);
        populateGradeSelect();
        resetLessonAndObjectives();
    } catch (e) {
        showAlert(`Lỗi nghiêm trọng: Không thể tải tệp dữ liệu \`${subject}.json\`. Vui lòng đảm bảo tệp này tồn tại.`, 'danger');
        console.error("Fetch error:", e);
        if (gradeSelect) gradeSelect.disabled = true;
    }
}

// Loads data for the question bank view specifically
async function loadBankData(subject: string) {
    try {
        bankViewingData = await getSubjectData(subject);

        populateBankGradeSelect();
        // Reset lower-level dropdowns
        if (bankLessonSelect) {
            bankLessonSelect.innerHTML = '<option value="all" selected>-- Tất cả bài học --</option>';
            bankLessonSelect.disabled = true;
        }
        if (bankObjectiveSelect) {
            bankObjectiveSelect.innerHTML = '<option value="all" selected>-- Tất cả Yêu cầu --</option>';
            bankObjectiveSelect.disabled = true;
        }
        if (questionBankDisplay) {
            questionBankDisplay.innerHTML = '<p class="text-center text-muted p-4">Hãy chọn Lớp để xem các câu hỏi trong ngân hàng.</p>';
        }
    } catch (e) {
        showAlert(`Lỗi: Không thể tải dữ liệu ngân hàng cho môn ${subject}.`, 'danger');
        bankViewingData = {};
        populateBankGradeSelect(); // This will clear the grade select
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
    if (lessonSelect) {
        lessonSelect.innerHTML = '<option selected disabled>-- Chọn lớp trước --</option>';
        lessonSelect.disabled = true;
    }
    if (objectivesContainer) objectivesContainer.style.display = 'none';
    if (objectivesCheckboxContainer) objectivesCheckboxContainer.innerHTML = '';
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
    const grades = Object.keys(examData).sort((a, b) => parseInt(a) - parseInt(b));
    for (const grade of grades) {
        const option = document.createElement('option');
        option.value = grade;
        option.textContent = `Lớp ${grade}`;
        gradeSelect.appendChild(option);
    }
    gradeSelect.disabled = false;
}

function setupEventListeners() {
    subjectSelect?.addEventListener('change', handleSubjectChange);
    gradeSelect?.addEventListener('change', handleGradeChange);
    lessonSelect?.addEventListener('change', handleLessonChange);
    addBtn?.addEventListener('click', handleAddExamPart);
    generateFinalExamBtn?.addEventListener('click', handleGenerateExam);
    newExamBtn?.addEventListener('click', handleNewExam);
    copyBtn?.addEventListener('click', handleCopyContent);
    exportDocxBtn?.addEventListener('click', handleExportToDocx);
    exportTexBtn?.addEventListener('click', handleExportToTex);
    saveApiKeyBtn?.addEventListener('click', handleSaveApiKey);
    addObjectiveBtn?.addEventListener('click', handleAddObjective);
    newObjectiveInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddObjective();
        }
    });
    exportDataFileBtn?.addEventListener('click', handleExportDataFile);
    importDataFileInput?.addEventListener('change', handleImportDataFile);
    resetDataBtn?.addEventListener('click', handleResetData);
    suggestObjectivesBtn?.addEventListener('click', handleSuggestObjectives);
    generateExplanationsBtn?.addEventListener('click', handleGenerateExplanations);
    suggestTitleBtn?.addEventListener('click', handleSuggestTitle);
    fileUploadInput?.addEventListener('change', handleFileUpload);
    updateQuestionBankBtn?.addEventListener('click', handleUpdateQuestionBank);

    // Question Bank Listeners
    bankSubjectSelect?.addEventListener('change', handleBankSubjectChange);
    bankGradeSelect?.addEventListener('change', handleBankGradeChange);
    bankLessonSelect?.addEventListener('change', () => {
        populateBankObjectives();
        renderQuestionBank();
    });
    [bankTypeSelect, bankDifficultySelect, bankObjectiveSelect].forEach(el => {
        el?.addEventListener('change', renderQuestionBank);
    });
    importQuestionBankInput?.addEventListener('change', handleImportQuestionBank);
    exportFullBankBtn?.addEventListener('click', handleExportFullBank);

    document.querySelectorAll('.export-selected-action').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const format = (e.currentTarget as HTMLElement).dataset.format;
            handleExportSelectedQuestions(format as 'docx' | 'tex');
        });
    });
}

function updateQuestionTypesForSubject(subject: string) {
    const typeSelect = document.getElementById('typeSelect') as HTMLSelectElement;
    const bankTypeSelect = document.getElementById('bankTypeSelect') as HTMLSelectElement;
    if (!typeSelect || !bankTypeSelect) return;

    const defaultTypes = `
        <option value="trắc nghiệm">Trắc nghiệm</option>
        <option value="đúng/sai">Đúng/Sai (dựa trên tư liệu)</option>
        <option value="trả lời ngắn">Trả lời ngắn</option>
        <option value="tự luận">Tự luận</option>
    `;

    const englishTypes = `
        <option value="Trắc nghiệm (Ngữ pháp & Từ vựng)">Trắc nghiệm (Ngữ pháp & Từ vựng)</option>
        <option value="Đúng/Sai (Ngữ pháp & Từ vựng)">Đúng/Sai (Ngữ pháp & Từ vựng)</option>
        <option value="Trắc nghiệm (Đọc hiểu)">Trắc nghiệm (Đọc hiểu)</option>
        <option value="Đúng/Sai (Đọc hiểu)">Đúng/Sai (Đọc hiểu)</option>
        <option value="Trắc nghiệm (Nghe hiểu)">Trắc nghiệm (Nghe hiểu)</option>
        <option value="Đúng/Sai (Nghe hiểu)">Đúng/Sai (Nghe hiểu)</option>
        <option value="Điền vào chỗ trống">Điền vào chỗ trống (Cloze Test)</option>
        <option value="Sắp xếp câu/hội thoại">Sắp xếp câu/hội thoại</option>
        <option value="Viết lại câu">Viết lại câu</option>
        <option value="Viết đoạn văn">Viết đoạn văn</option>
    `;

    const bankDefaultTypes = `
        <option value="all" selected>Tất cả</option>
        <option value="trắc nghiệm">Trắc nghiệm</option>
        <option value="đúng/sai">Đúng/Sai</option>
        <option value="trả lời ngắn">Trả lời ngắn</option>
        <option value="tự luận">Tự luận</option>
    `;

    const bankEnglishTypes = `
        <option value="all" selected>Tất cả</option>
        <option value="Trắc nghiệm (Ngữ pháp & Từ vựng)">Trắc nghiệm (Ngữ pháp & Từ vựng)</option>
        <option value="Đúng/Sai (Ngữ pháp & Từ vựng)">Đúng/Sai (Ngữ pháp & Từ vựng)</option>
        <option value="Trắc nghiệm (Đọc hiểu)">Trắc nghiệm (Đọc hiểu)</option>
        <option value="Đúng/Sai (Đọc hiểu)">Đúng/Sai (Đọc hiểu)</option>
        <option value="Trắc nghiệm (Nghe hiểu)">Trắc nghiệm (Nghe hiểu)</option>
        <option value="Đúng/Sai (Nghe hiểu)">Đúng/Sai (Nghe hiểu)</option>
        <option value="Điền vào chỗ trống">Điền vào chỗ trống (Cloze Test)</option>
        <option value="Sắp xếp câu/hội thoại">Sắp xếp câu/hội thoại</option>
        <option value="Viết lại câu">Viết lại câu</option>
        <option value="Viết đoạn văn">Viết đoạn văn</option>
    `;

    if (subject === 'Anh') {
        typeSelect.innerHTML = englishTypes;
        bankTypeSelect.innerHTML = bankEnglishTypes;
    } else {
        typeSelect.innerHTML = defaultTypes;
        bankTypeSelect.innerHTML = bankDefaultTypes;
    }
}


// --- File Upload Handlers ---
function readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

function handleFileUpload(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files) {
        const existingFileNames = new Set(uploadedFiles.map(f => f.name));
        for (const file of Array.from(target.files)) {
            if (!existingFileNames.has(file.name)) {
                uploadedFiles.push(file);
            }
        }
        renderUploadedFiles();
    }
    target.value = '';
}

function removeUploadedFile(indexToRemove: number) {
    uploadedFiles.splice(indexToRemove, 1);
    renderUploadedFiles();
}

function renderUploadedFiles() {
    fileUploadList.innerHTML = '';
    if (uploadedFiles.length === 0) return;

    uploadedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'uploaded-file-item';
        const fileIcon = document.createElement('i');
        fileIcon.className = 'bi me-2';
        if (file.type.startsWith('image/')) {
            fileIcon.classList.add('bi-file-earmark-image');
        } else if (file.name.endsWith('.pdf')) {
            fileIcon.classList.add('bi-file-earmark-pdf');
        } else if (file.name.endsWith('.tex')) {
            fileIcon.classList.add('bi-filetype-tex');
        } else {
            fileIcon.classList.add('bi-file-earmark-text');
        }
        const fileNameSpan = document.createElement('span');
        fileNameSpan.className = 'file-name';
        fileNameSpan.textContent = file.name;
        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn btn-sm btn-outline-danger btn-remove-file';
        removeBtn.innerHTML = '&times;';
        removeBtn.title = 'Xóa tệp';
        removeBtn.onclick = () => removeUploadedFile(index);
        fileItem.appendChild(fileIcon);
        fileItem.appendChild(fileNameSpan);
        fileItem.appendChild(removeBtn);
        fileUploadList.appendChild(fileItem);
    });
}

// --- UI & State Handlers ---
function renderStructure() {
    if (!structureContainer || !structureList || !generateFinalExamBtn) return;

    if (examStructure.length === 0) {
        structureContainer.style.display = 'none';
        structureList.innerHTML = '<li><p class="text-center text-muted small p-3">Cấu trúc đề thi sẽ hiện ở đây sau khi bạn thêm các phần.</p></li>';
        generateFinalExamBtn.disabled = true;
        return;
    }

    structureContainer.style.display = 'block';
    structureList.innerHTML = '';
    generateFinalExamBtn.disabled = false;
    
    examStructure.forEach((part) => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-start';
        li.innerHTML = `
            <div class="ms-2 me-auto">
                <div class="fw-bold">${part.lesson} (${part.numQuestions} câu)</div>
                <small class="text-muted">Loại: ${part.type} | Độ khó: ${part.difficulty}</small>
                <div class="small mt-1 fst-italic">YC: ${part.objectives.join(', ')}</div>
            </div>
            <button class="btn btn-sm btn-outline-danger" data-id="${part.id}" title="Xóa phần này">&times;</button>
        `;
        const deleteButton = li.querySelector('button');
        if (deleteButton) {
            deleteButton.addEventListener('click', () => {
                examStructure = examStructure.filter(p => p.id !== part.id);
                renderStructure();
                showAlert('Đã xóa một phần khỏi cấu trúc.', 'info');
            });
        }
        structureList.appendChild(li);
    });
}

function renderMatrixTable() {
    if (!examMatrixContent) return;

    const mapEnglishTypeToGeneric = (englishType: string): string => {
        if (englishType.startsWith('Trắc nghiệm') || englishType === 'Điền vào chỗ trống') {
            return 'trắc nghiệm';
        }
        if (englishType.startsWith('Đúng/Sai')) {
            return 'đúng/sai';
        }
        if (englishType === 'Trả lời ngắn') {
            return 'trả lời ngắn';
        }
        // Sắp xếp câu/hội thoại, Viết lại câu, Viết đoạn văn
        return 'tự luận';
    };

    const tableHtml = `
        <div class="rendered-table">
            <h2>I. MA TRẬN ĐỀ KIỂM TRA</h2>
            <table>
                <thead>
                    <tr>
                        <th rowspan="3">TT</th>
                        <th rowspan="3">Chương/chủ đề</th>
                        <th rowspan="3" class="text-left">Nội dung/đơn vị kiến thức</th>
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
            </table>
        </div>`;
    examMatrixContent.innerHTML = tableHtml;
    const tbody = examMatrixContent.querySelector('tbody');
    if (!tbody) return;
    
    const chapters: { [key: string]: any[] } = {};
    examStructure.forEach((item: any) => {
        const chapterName = examData[item.grade]?.[item.lesson]?.chapter || "Chương không xác định";
        if (!chapters[chapterName]) {
            chapters[chapterName] = [];
        }
        chapters[chapterName].push(item);
    });

    let tt = 1;
    let grandTotalQuestions = examStructure.reduce((sum, item) => sum + parseInt(item.numQuestions, 10), 0);
    const totalByLevel = { 'nhận biết': 0, 'thông hiểu': 0, 'vận dụng': 0 };

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
            
            const levels = ['nhận biết', 'thông hiểu', 'vận dụng'];
            const types = ['trắc nghiệm', 'đúng/sai', 'tự luận'];
            const rowTotalByLevel = { 'nhận biết': 0, 'thông hiểu': 0, 'vận dụng': 0 };

            types.forEach(type => {
                levels.forEach(level => {
                    const itemType = currentSubject === 'Anh' ? mapEnglishTypeToGeneric(item.type) : item.type;
                    if (itemType === type && item.difficulty === level) {
                        const qNum = parseInt(item.numQuestions, 10);
                        rowHtml += `<td>${qNum}</td>`;
                        rowTotalByLevel[level] += qNum;
                    } else {
                        rowHtml += `<td></td>`;
                    }
                });
            });
            
            levels.forEach(level => {
                rowHtml += `<td>${rowTotalByLevel[level] || ''}</td>`;
                totalByLevel[level] += rowTotalByLevel[level];
            });
            
            const itemTotalQuestions = parseInt(item.numQuestions, 10);
            const percentage = grandTotalQuestions > 0 ? ((itemTotalQuestions / grandTotalQuestions) * 100).toFixed(1) : 0;

            rowHtml += `<td>${itemTotalQuestions}</td><td>${percentage}%</td>`;
            tr.innerHTML = rowHtml;
            tbody.appendChild(tr);
        });
    }
}

function renderSpecTable() {
    if (!examSpecContent) return;
    const tableHtml = `
        <div class="rendered-table">
            <h2>II. BẢN ĐẶC TẢ ĐỀ KIỂM TRA</h2>
            <table>
                <thead>
                    <tr>
                        <th rowspan="2">TT</th>
                        <th rowspan="2" class="text-left">Chương/chủ đề</th>
                        <th rowspan="2" class="text-left">Nội dung/đơn vị kiến thức</th>
                        <th rowspan="2" class="text-left">Yêu cầu cần đạt</th>
                        <th colspan="3">Số câu hỏi theo mức độ nhận thức</th>
                    </tr>
                    <tr>
                        <th>Nhận biết</th>
                        <th>Thông hiểu</th>
                        <th>Vận dụng</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>`;
    examSpecContent.innerHTML = tableHtml;
    const tbody = examSpecContent.querySelector('tbody');
    if (!tbody) return;

    const chapters: { [key: string]: any[] } = {};
    examStructure.forEach((item: any) => {
        const chapterName = examData[item.grade]?.[item.lesson]?.chapter || "Chương không xác định";
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
            rowHtml += `<td class="text-left">${item.objectives.map(o => `<span>- ${o.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>`).join('<br>')}</td>`;
            
            let nb = (item.difficulty === 'nhận biết') ? `<b>${item.numQuestions}</b><br><i>(${item.type})</i>` : '';
            let th = (item.difficulty === 'thông hiểu') ? `<b>${item.numQuestions}</b><br><i>(${item.type})</i>` : '';
            let vd = (item.difficulty === 'vận dụng') ? `<b>${item.numQuestions}</b><br><i>(${item.type})</i>` : '';

            rowHtml += `<td>${nb}</td>`;
            rowHtml += `<td>${th}</td>`;
            rowHtml += `<td>${vd}</td>`;
            tr.innerHTML = rowHtml;
            tbody.appendChild(tr);
        });
    }
}


function displayExamResult(fullResponseText: string) {
    const examText = fullResponseText.trim() || "Không tìm thấy nội dung đề thi trong phản hồi của AI.";

    examAndAnswerContent.innerHTML = `<pre><code>${examText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`;

    // Render tables from client-side data
    renderMatrixTable();
    renderSpecTable();

    if (MathJax) {
        MathJax.typesetPromise([examAndAnswerContent, examMatrixContent, examSpecContent]).catch((err) =>
            console.error('MathJax typesetting error:', err)
        );
    }

    resultSection.style.display = 'block';
    copyBtn.disabled = false;
    exportDocxBtn.classList.remove('disabled');
    exportTexBtn.classList.remove('disabled');
    generateExplanationsBtn.disabled = false;
    updateQuestionBankBtn.disabled = false;
}

// --- Event Handlers ---

async function handleSaveApiKey() {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        apiKeyMessage.textContent = 'Vui lòng nhập API Key.';
        apiKeyMessage.className = 'text-danger';
        return;
    }

    setLoadingState(saveApiKeyBtn, true, 'Đang kiểm tra...');

    try {
        const testAi = new GoogleGenAI({ apiKey });
        // Make a simple test call to validate the key
        await testAi.models.generateContent({ model: 'gemini-2.5-flash', contents: 'test' });

        currentApiKey = apiKey;
        ai = testAi;

        if (rememberApiKey.checked) {
            localStorage.setItem('geminiApiKey', apiKey);
        } else {
            localStorage.removeItem('geminiApiKey');
        }

        apiKeyMessage.textContent = 'Lưu API Key thành công!';
        apiKeyMessage.className = 'text-success';
        showAlert('API Key hợp lệ và đã được lưu.', 'success');

        setTimeout(() => {
            apiKeyModal?.hide();
            apiKeyMessage.textContent = '';
        }, 1500);

    } catch (error) {
        apiKeyMessage.textContent = 'API Key không hợp lệ hoặc đã xảy ra lỗi. Vui lòng kiểm tra lại.';
        apiKeyMessage.className = 'text-danger';
        console.error("API Key validation failed:", error);
    } finally {
        setLoadingState(saveApiKeyBtn, false, 'Lưu và Kiểm tra');
    }
}

function handleNewExam() {
    if (confirm('Bạn có chắc chắn muốn tạo đề thi mới không? Tất cả cấu trúc và kết quả hiện tại sẽ bị xóa.')) {
        examStructure = [];
        generatedQuestions = [];
        fullResponseText = '';
        renderStructure();
        resultSection.style.display = 'none';
        examAndAnswerContent.innerHTML = '';
        examMatrixContent.innerHTML = '';
        examSpecContent.innerHTML = '';
        explanationsContainer.innerHTML = '';
        examTitleInput.value = '';
        uploadedFiles = [];
        renderUploadedFiles();
        showAlert('Đã xóa cấu trúc cũ. Sẵn sàng cho đề thi mới!', 'info');
    }
}

function handleCopyContent() {
    const activeTabPane = document.querySelector('#resultTabsContent .tab-pane.active');
    if (!activeTabPane) {
        showAlert('Không có nội dung để sao chép.', 'warning');
        return;
    }
    
    // Check if it's a table or preformatted text
    const table = activeTabPane.querySelector('table');
    const pre = activeTabPane.querySelector('pre');
    let contentToCopy = '';

    if (table) {
        contentToCopy = table.innerText;
    } else if (pre) {
        contentToCopy = pre.innerText;
    } else {
        showAlert('Không tìm thấy nội dung có thể sao chép trong tab này.', 'warning');
        return;
    }

    navigator.clipboard.writeText(contentToCopy).then(() => {
        showAlert('Đã sao chép nội dung vào clipboard!', 'success');
    }).catch(err => {
        showAlert('Lỗi khi sao chép: ' + err, 'danger');
        console.error('Copy failed', err);
    });
}

function handleExportToDocx(event) {
    event.preventDefault();
    const activeTabPane = document.querySelector('#resultTabsContent .tab-pane.active');
     if (!activeTabPane) {
        showAlert('Không có nội dung để xuất tệp.', 'warning');
        return;
    }
    
    let contentHtml = activeTabPane.innerHTML;
    // Convert Markdown bold (**text**) to HTML bold (<b>text</b>) for Word
    contentHtml = contentHtml.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

    
    const htmlContent = `
        <!DOCTYPE html>
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>Export HTML To Doc</title>
        <style> 
            body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; }
            pre { white-space: pre-wrap; word-wrap: break-word; font-family: 'Times New Roman', Times, serif; font-size: 12pt; } 
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid black; padding: 8px; text-align: center; vertical-align: middle; }
            th { background-color: #f2f2f2; }
           .text-left { text-align: left; }
        </style>
        </head>
        <body>${contentHtml}</body>
        </html>`;

    const blob = new Blob(['\ufeff', htmlContent], {
        type: 'application/msword'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'DeThi.doc';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function handleExportToTex(event) {
    event.preventDefault();
    const activeTabPane = document.querySelector('#resultTabsContent .tab-pane.active pre');
    if (!activeTabPane || !activeTabPane.textContent?.trim()) {
        showAlert('Chỉ có thể xuất nội dung từ tab "Đề thi & Đáp án" sang .tex.', 'warning');
        return;
    }

    const content = activeTabPane.textContent;
    const examTitle = examTitleInput.value.trim() || 'ĐỀ KIỂM TRA';
    
    // A comprehensive preamble to support TikZ, tkz-euclide, tkz-tab, and pandoc compilation
    const fullTexDocument = `
\\documentclass[12pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[vietnamese]{babel}
\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{graphicx}
\\usepackage{geometry}
\\geometry{a4paper, margin=2cm}

% --- TikZ and related packages for diagrams and tables ---
\\usepackage{tikz}
\\usepackage{tkz-euclide}
\\usepackage{tkz-tab}
\\usetikzlibrary{calc,intersections,through,backgrounds,patterns,arrows.meta,quotes}

% --- PGFPlots for advanced function graphing ---
\\usepackage{pgfplots}
\\pgfplotsset{compat=1.18} % Use a recent compatibility level

\\title{${examTitle.replace(/([&%$#_{}])/g, '\\$1')}}
\\author{AG-AI Exam Generator}
\\date{\\today}

\\begin{document}

\\begin{center}
    \\Large\\bfseries ${examTitle.replace(/([&%$#_{}])/g, '\\$1')}
\\end{center}
\\vspace{1em}

${content}

\\end{document}
    `;

    const blob = new Blob([fullTexDocument], { type: 'application/x-tex;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'DeThi.tex';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}


async function handleSubjectChange() {
    const selectedSubject = subjectSelect.value;
    // Clear selections when changing subject to avoid confusion
    selectedBankQuestions = [];
    updateSelectedCountDisplay();
    await loadSubjectData(selectedSubject);

    // Sync bank UI
    if (bankSubjectSelect) {
        bankSubjectSelect.value = selectedSubject;
    }
    await loadBankData(selectedSubject);
    
    updateQuestionTypesForSubject(selectedSubject);
}

async function handleResetData() {
    if (confirm(`Bạn có chắc chắn muốn xóa tất cả các thay đổi đã lưu cho môn ${currentSubject} và quay về dữ liệu gốc không? Hành động này bao gồm cả việc xóa ngân hàng câu hỏi của môn này.`)) {
        const localStorageKey = `examData_${currentSubject}`;
        localStorage.removeItem(localStorageKey);
        showAlert(`Đã reset dữ liệu môn ${currentSubject} về trạng thái gốc.`, 'info');
        
        // Clear selections as the underlying data is gone
        selectedBankQuestions = [];
        updateSelectedCountDisplay();
        
        await loadSubjectData(currentSubject);
        await loadBankData(currentSubject); // Reload bank data as well
    }
}

function handleExportDataFile() {
    downloadDataAsJson(examData, `${currentSubject}_backup.json`);
}

function handleImportDataFile(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) {
        return;
    }

    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
        showAlert('Vui lòng chọn một tệp .json hợp lệ.', 'warning');
        target.value = '';
        return;
    }

    const reader = new FileReader();

    reader.onload = async (e) => {
        try {
            const text = e.target?.result as string;
            if (!text) throw new Error("Tệp rỗng.");
            
            const importedData = JSON.parse(text);

            const grades = Object.keys(importedData);
            const firstGrade = grades[0];
            const firstLesson = Object.keys(importedData[firstGrade])[0];

            if (grades.length === 0 || typeof importedData[firstGrade] !== 'object' || !('chapter' in importedData[firstGrade][firstLesson])) {
                throw new Error("Tệp không có cấu trúc dữ liệu hợp lệ.");
            }
            
            examData = importedData;
            saveDataToLocalStorage();

            populateGradeSelect();
            resetLessonAndObjectives();
            
            // Also update the bank view if it's the same subject
            if (bankSubjectSelect.value === currentSubject) {
                await loadBankData(currentSubject);
            }
            
            showAlert(`Đã nạp thành công dữ liệu cho môn ${subjectSelect.options[subjectSelect.selectedIndex].text}!`, 'success');

        } catch (error) {
            console.error("Error importing data file:", error);
            showAlert(`Lỗi khi nạp tệp: ${error.message}. Vui lòng kiểm tra lại tệp.`, 'danger');
        } finally {
            target.value = '';
        }
    };

    reader.onerror = () => {
         showAlert('Không thể đọc được tệp. Vui lòng thử lại.', 'danger');
         target.value = '';
    };

    reader.readAsText(file);
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
    objectivesContainer.style.display = 'block';
    renderObjectives();
}

// --- Objectives CRUD ---

function renderObjectives() {
    const selectedGrade = gradeSelect.value;
    const selectedLesson = lessonSelect.value;

    if (!selectedGrade || gradeSelect.selectedIndex === 0 || !selectedLesson || lessonSelect.selectedIndex === 0) {
        objectivesCheckboxContainer.innerHTML = '<p class="text-muted text-center small p-3">Chọn lớp và bài học để xem các yêu cầu.</p>';
        return;
    }

    const objectivesArray = examData[selectedGrade]?.[selectedLesson]?.objectives || [];
    objectivesCheckboxContainer.innerHTML = '';

    if (objectivesArray.length === 0) {
        objectivesCheckboxContainer.innerHTML = '<p class="text-muted text-center small p-3">Chưa có yêu cầu nào. Thêm mới hoặc để AI gợi ý.</p>';
        return;
    }

    objectivesArray.forEach((objectiveText, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'objective-item d-flex justify-content-between align-items-center';
        itemDiv.dataset.index = index.toString();

        itemDiv.innerHTML = `
            <div class="form-check flex-grow-1 me-2">
                <input class="form-check-input" type="checkbox" value="" id="objective-${index}">
                <label class="form-check-label" for="objective-${index}">
                    ${objectiveText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
                </label>
            </div>
            <div class="btn-group" role="group">
                <button class="btn btn-sm btn-outline-secondary btn-edit" title="Sửa"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger btn-delete" title="Xóa"><i class="bi bi-trash"></i></button>
            </div>
        `;

        itemDiv.querySelector('.btn-edit').addEventListener('click', () => handleEditObjective(index));
        itemDiv.querySelector('.btn-delete').addEventListener('click', () => handleDeleteObjective(index));
        objectivesCheckboxContainer.appendChild(itemDiv);
    });
}

function handleAddObjective() {
    const text = newObjectiveInput.value.trim();
    if (!text) return;

    const selectedGrade = gradeSelect.value;
    const selectedLesson = lessonSelect.value;
    if (!selectedGrade || gradeSelect.selectedIndex === 0 || !selectedLesson || lessonSelect.selectedIndex === 0) {
        showAlert('Vui lòng chọn Lớp và Bài học trước khi thêm yêu cầu.', 'warning');
        return;
    }

    if (!examData[selectedGrade][selectedLesson].objectives) {
        examData[selectedGrade][selectedLesson].objectives = [];
    }
    examData[selectedGrade][selectedLesson].objectives.push(text);

    saveDataToLocalStorage();
    renderObjectives();
    newObjectiveInput.value = '';
    newObjectiveInput.focus();
}

function handleDeleteObjective(index) {
    const selectedGrade = gradeSelect.value;
    const selectedLesson = lessonSelect.value;
    examData[selectedGrade][selectedLesson].objectives.splice(index, 1);
    saveDataToLocalStorage();
    renderObjectives();
}

function handleEditObjective(index) {
    const itemDiv = objectivesCheckboxContainer.querySelector(`.objective-item[data-index='${index}']`);
    if (!itemDiv) return;

    const currentText = examData[gradeSelect.value][lessonSelect.value].objectives[index];

    itemDiv.innerHTML = `
        <div class="input-group">
            <input type="text" class="form-control editing-input" value="${currentText.replace(/"/g, "&quot;")}">
            <button class="btn btn-outline-success btn-save-edit" title="Lưu"><i class="bi bi-check-lg"></i></button>
        </div>
    `;

    const inputEl = itemDiv.querySelector('.editing-input') as HTMLInputElement;
    inputEl.focus();
    inputEl.select();

    const saveChanges = () => {
        const newText = inputEl.value.trim();
        if (newText) {
            examData[gradeSelect.value][lessonSelect.value].objectives[index] = newText;
            saveDataToLocalStorage();
        }
        renderObjectives();
    };

    inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveChanges();
        else if (e.key === 'Escape') renderObjectives();
    });

    itemDiv.querySelector('.btn-save-edit').addEventListener('click', saveChanges);
}


function handleAddExamPart() {
    const grade = gradeSelect.value;
    const lesson = lessonSelect.value;
    const numQuestions = (document.getElementById('questionNum') as HTMLInputElement).value;
    const difficulty = (document.getElementById('difficultySelect') as HTMLSelectElement).value;
    const type = (document.getElementById('typeSelect') as HTMLSelectElement).value;

    if (!grade || gradeSelect.selectedIndex === 0 || !lesson || lessonSelect.selectedIndex === 0) {
        showAlert('Vui lòng chọn đầy đủ Lớp và Bài học.', 'warning');
        return;
    }

    const checkedCheckboxes = objectivesCheckboxContainer.querySelectorAll<HTMLInputElement>('.form-check-input:checked');
    const objectivesForPart = Array.from(checkedCheckboxes).map(cb => {
        const label = cb.closest('.form-check').querySelector('.form-check-label');
        return label ? label.textContent.trim() : '';
    }).filter(Boolean);

    if (objectivesForPart.length === 0) {
        showAlert('Vui lòng chọn ít nhất một yêu cầu cần đạt để thêm vào cấu trúc.', 'warning');
        return;
    }

    const selection = {
        id: Date.now(),
        grade,
        lesson,
        numQuestions,
        difficulty,
        type,
        objectives: objectivesForPart
    };

    examStructure.push(selection);
    renderStructure();
    showAlert(`Đã thêm phần "${lesson}" vào cấu trúc đề thi.`, 'success');

    // Uncheck boxes after adding
    checkedCheckboxes.forEach(cb => cb.checked = false);
}

// --- AI FEATURE HANDLERS ---
async function handleSuggestTitle() {
    if (examStructure.length === 0) {
        showAlert('Vui lòng xây dựng cấu trúc đề thi trước.', 'warning');
        return;
    }
    if (!ai) {
        showAlert('Vui lòng cấu hình API Key.', 'warning');
        apiKeyModal?.show();
        return;
    }

    setLoadingState(suggestTitleBtn, true);

    try {
        const structureSummary = examStructure.map(part => `Chủ đề ${part.lesson} (Lớp ${part.grade})`).join(', ');
        const prompt = `
        Dựa trên cấu trúc đề thi bao gồm các chủ đề: ${structureSummary}, hãy gợi ý 5 tiêu đề (title) hấp dẫn và phù hợp cho bài kiểm tra này. 
        Mỗi tiêu đề trên một dòng. Không thêm bất cứ thứ gì khác.
        Ví dụ:
        Đề kiểm tra giữa kì I - Môn Toán Lớp 10
        Đề kiểm tra 45 phút - Hình học & Đại số Lớp 10
        `;

        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        const titles = response.text.split('\n').filter(Boolean);

        if (titles.length > 0) {
            examTitleInput.value = titles[0].trim();
            showAlert('Đã gợi ý tiêu đề.', 'success');
        } else {
            showAlert('Không thể tạo được gợi ý. Vui lòng thử lại.', 'warning');
        }

    } catch (error) {
        showAlert(`Lỗi khi gợi ý tiêu đề: ${error.message}`, 'danger');
    } finally {
        setLoadingState(suggestTitleBtn, false);
    }
}

async function handleSuggestObjectives() {
    const grade = gradeSelect.value;
    const lesson = lessonSelect.value;
    const subjectName = subjectSelect.options[subjectSelect.selectedIndex].text;

    if (!grade || gradeSelect.selectedIndex === 0 || !lesson || lessonSelect.selectedIndex === 0) {
        showAlert('Vui lòng chọn Lớp và Bài học để nhận gợi ý.', 'warning');
        return;
    }
    if (!ai) {
        showAlert('Vui lòng cấu hình API Key.', 'warning');
        apiKeyModal?.show();
        return;
    }

    setLoadingState(suggestObjectivesBtn, true);

    try {
        const prompt = `
        Hãy đóng vai một chuyên gia giáo dục. Dựa vào chương trình giáo dục phổ thông môn ${subjectName}, 
        hãy liệt kê 5-7 "yêu cầu cần đạt" (learning objectives) quan trọng nhất cho bài học "${lesson}" của lớp ${grade}. 
        Mỗi yêu cầu cần rõ ràng, có thể đo lường được. CHỈ trả về danh sách các yêu cầu, mỗi yêu cầu trên một dòng, không có đánh số hay gạch đầu dòng, không có chữ "Yêu cầu:".
        `;

        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        const suggested = response.text.split('\n').map(s => s.trim().replace(/^-/, '').trim()).filter(Boolean);

        if (!examData[grade][lesson].objectives) {
            examData[grade][lesson].objectives = [];
        }

        const existingObjectives = new Set(examData[grade][lesson].objectives.map(o => o.toLowerCase()));
        let addedCount = 0;
        suggested.forEach(obj => {
            if (!existingObjectives.has(obj.toLowerCase())) {
                examData[grade][lesson].objectives.push(obj);
                addedCount++;
            }
        });

        if (addedCount > 0) {
            saveDataToLocalStorage();
            renderObjectives();
            showAlert(`Đã thêm ${addedCount} gợi ý yêu cầu cần đạt mới.`, 'success');
        } else {
            showAlert(`Không có yêu cầu mới nào được tìm thấy.`, 'info');
        }


    } catch (error) {
        showAlert(`Lỗi khi gợi ý: ${error.message}`, 'danger');
        console.error(error);
    } finally {
        setLoadingState(suggestObjectivesBtn, false);
    }
}

async function handleGenerateExplanations() {
    if (!fullResponseText || !ai) {
        showAlert('Vui lòng tạo đề thi trước khi yêu cầu lời giải chi tiết.', 'warning');
        return;
    }

    setLoadingState(generateExplanationsBtn, true);
    explanationsContainer.innerHTML = '<div class="text-center p-3"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div><p class="mt-2">Đang tạo lời giải chi tiết...</p></div>';
    explanationsContainer.style.display = 'block';

    try {
        const examText = examAndAnswerContent.innerText;
        const prompt = `
        Dựa vào Đề thi và Đáp án sau đây, hãy cung cấp lời giải thích chi tiết, từng bước cho TẤT CẢ các câu hỏi. 
        Trình bày rõ ràng, dễ hiểu cho học sinh, sử dụng định dạng Markdown để làm nổi bật các công thức toán học và các bước quan trọng.
        
        --- BẮT ĐẦU ĐỀ THI ---
        ${examText}
        --- KẾT THÚC ĐỀ THI ---
        `;

        const responseStream = await ai.models.generateContentStream({ model: 'gemini-2.5-flash', contents: prompt });

        explanationsContainer.innerHTML = '';
        let buffer = '';
        for await (const chunk of responseStream) {
            buffer += chunk.text;
            explanationsContainer.innerHTML = `<pre>${buffer.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`;
        }

        showAlert('Đã tạo xong lời giải chi tiết.', 'success');

    } catch (error) {
        showAlert(`Lỗi khi tạo lời giải: ${error.message}`, 'danger');
        explanationsContainer.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
    } finally {
        setLoadingState(generateExplanationsBtn, false);
    }
}


// --- Exam Generation ---

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

    setLoadingState(generateFinalExamBtn, true, 'Đang tạo...');

    try {
        fullResponseText = await generateFullResponse();
        if (fullResponseText) {
            displayExamResult(fullResponseText);
            resultSection.style.display = 'block';
            setTimeout(() => resultSection.scrollIntoView({ behavior: 'smooth' }), 100);
            showAlert('Đã tạo thành công Đề thi!', 'success');
        } else {
            throw new Error("Phản hồi từ AI trống.");
        }
    } catch (error) {
        showAlert(`Lỗi tạo đề thi: ${error.message}`, 'danger');
        console.error(error);
    } finally {
        setLoadingState(generateFinalExamBtn, false, 'Tạo đề thi, Ma trận & Đặc tả');
    }
}

async function generateFullResponse(): Promise<string> {
    const format = formatSelect.value;
    const subjectName = subjectSelect.options[subjectSelect.selectedIndex].text;

    const BASE_INSTRUCTION = `CHÚ Ý: chỉ tạo các câu hỏi đúng các phần mà mình yêu cầu, nếu không yêu cầu thì không tự tạo thêm. Chỉ cần tạo đề thi và đáp án, không cần tạo ma trận hay bản đặc tả.`;

    const ENGLISH_SYSTEM_PROMPT = `
BẠN LÀ MỘT CHUYÊN GIA SOẠN THẢO ĐỀ THI TIẾNG ANH. ${BASE_INSTRUCTION}
HÃY TUÂN THỦ NGHIÊM NGẶT CÁC QUY TẮC SAU ĐÂY CHO TỪNG LOẠI CÂU HỎI:

**1. Trắc nghiệm (Ngữ pháp & Từ vựng):**
- Luôn có 4 lựa chọn A, B, C, D.
- Câu hỏi tập trung vào các điểm ngữ pháp, cấu trúc câu, và từ vựng.
- Ví dụ:
Câu 1 (NB): Mrs. Pike __________ the door before the customers arrived.
A. had opened
B. opened
C. will open
D. would open

**2. Đúng/Sai (Ngữ pháp & Từ vựng):**
- Cung cấp một câu.
- Yêu cầu học sinh xác định câu đó Đúng (True) về mặt ngữ pháp hay Sai (False).
- Ví dụ:
Câu 5 (NB): The following sentence is grammatically correct: "He have finished his homework."
A. True
B. False

**3. Trắc nghiệm (Đọc hiểu):**
- Cung cấp một đoạn văn (Passage) làm ngữ cảnh.
- Dưới đoạn văn, đưa ra các câu hỏi trắc nghiệm A, B, C, D về nội dung của đoạn văn.
- Ví dụ:
(Đoạn văn về trường dạy nghề...)
Câu 15 (TH): According to paragraph 2, how do vocational schools help students gain experience?
A. By offering theoretical subjects.
B. By providing job opportunities after graduation.
C. By collaborating with companies to offer internships.
D. By requiring students to work before enrolling.

**4. Đúng/Sai (Đọc hiểu):**
- Cung cấp một đoạn văn (Passage) làm ngữ cảnh.
- Dưới đoạn văn, đưa ra các nhận định về nội dung đoạn văn.
- Yêu cầu học sinh xác định nhận định đó là Đúng (True) hay Sai (False) dựa trên thông tin trong bài đọc.
- Ví dụ:
(Đoạn văn về lịch sử Internet...)
Câu 20 (TH): The Internet was first created for commercial purposes.
A. True
B. False

**5. Trắc nghiệm (Nghe hiểu):**
- Ghi rõ phần "LISTENING". AI không cần tạo file âm thanh, chỉ cần tạo câu hỏi và đáp án dựa trên một kịch bản nghe giả định (Listening Script).
- Ví dụ:
(Listening Script: A hotel clerk says: "You need to fill out this registration form.")
Câu 6 (NB): What does the guest have to do?
A. fill out a registration form B. show a credit card C. show a driver's license

**6. Đúng/Sai (Nghe hiểu):**
- Cung cấp một kịch bản nghe giả định (Listening Script).
- Dưới kịch bản, đưa ra các nhận định về nội dung đã nghe.
- Yêu cầu học sinh xác định nhận định đó là Đúng (True) hay Sai (False).
- Ví dụ:
(Listening script: A conversation about weekend plans where Mary says she will visit her grandparents.)
Câu 8 (NB): Mary is going to the cinema this weekend.
A. True
B. False

**7. Điền vào chỗ trống (Cloze Test):**
- Cung cấp một đoạn văn có các chỗ trống được đánh số (I), (II), ...
- Dưới đoạn văn, đưa ra các câu hỏi trắc nghiệm A, B, C, D cho mỗi chỗ trống.
- Ví dụ:
... helps them become more responsible and (I) ________.
Câu 24: A. confides B. confident C. confidently D. confidence

**8. Sắp xếp câu/hội thoại (Sentence/Dialogue Arrangement):**
- Cho các câu/phát biểu rời rạc (đánh dấu A, B, C,...).
- Yêu cầu sắp xếp chúng thành một đoạn hội thoại hoặc văn bản có logic.
- Ví dụ:
Question 29: Arrange the sentences to make a complete dialogue.
1. ___ 2. ___ 3. ___
A. Minh: Let's go! It'll be a fun way...
B. An: That sounds like a great idea...
C. Minh: Do you want to ride our bikes...?

**9. Viết lại câu (Sentence Transformation):**
- Đưa ra một câu gốc và yêu cầu viết lại câu đó theo một cấu trúc ngữ pháp khác mà không đổi nghĩa.
- Ví dụ:
Question 32: Lan is the first person who has completed the project. (to infinitive clause)
→ _________________________________

**10. Viết đoạn văn (Paragraph Writing):**
- Đưa ra một hoặc nhiều chủ đề.
- Yêu cầu viết một đoạn văn ngắn (khoảng 100-120 từ) về một trong các chủ đề đó.
- Ví dụ:
Part C: Writing a paragraph (choose one topic)
1/ In about 100-120 words, write a paragraph about Ways to preserve our heritage...
`;

    const NORMAL_SYSTEM_PROMPT = `
BẠN LÀ MỘT CHUYÊN GIA SOẠN THẢO ĐỀ THI MÔN ${subjectName.toUpperCase()}. ${BASE_INSTRUCTION}
HÃY TUÂN THỦ NGHIÊM NGẶT CÁC QUY TẮC VÀ LÀM THEO CÁC VÍ DỤ MẪU SAU ĐÂY CHO TỪNG LOẠI CÂU HỎI:
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

**4. TỰ LUẬN:**
- Câu hỏi yêu cầu trình bày lời giải chi tiết.
- Ví dụ:
Câu 1 (VD): Cho ba điểm A(1;2), B(-2;1) và C(4;-2) trong mặt phẳng tọa độ Oxy. Tìm tọa độ trực tâm H của tam giác ABC.
`;

    const LATEX_SYSTEM_PROMPT = `
BẠN LÀ MỘT CHUYÊN GIA SOẠN THẢO ĐỀ THI MÔN ${subjectName.toUpperCase()} BẰNG LATEX. ${BASE_INSTRUCTION}
CHỈ TẠO NỘI DUNG BÊN TRONG MÔI TRƯNG DOCUMENT, KHÔNG BAO GỒM \\documentclass, \\usepackage, hay \\begin{document}.
QUY TẮC ĐỊNH DẠNG TUYỆT ĐỐI: Sau mỗi dòng câu hỏi và mỗi dòng đáp án (A, B, C, D, a, b, c, d) PHẢI có lệnh xuống dòng \\\\.
HÃY TUÂN THỦ NGHIÊM NGẶT CÁC QUY TẮC VÀ LÀM THEO CÁC VÍ DỤ MẪU SAU ĐÂY CHO TỪNG LOẠI CÂU HỎI:
**1. TRẮC NGHIỆM (A, B, C, D):**
- Ví dụ:
Câu 1 (NB): Trong các câu sau, câu nào không phải là mệnh đề?\\\\
A. $1 + 1 = 2$.\\\\
B. Hình thoi có bốn cạnh bằng nhau.\\\\
C. Hãy đóng cửa sổ lại!\\\\
D. Số pi là một số vô tỉ.\\\\

**2. ĐÚNG/SAI:**
- Ví dụ:
Câu 1. Trong mặt phẳng Oxy, cho điểm $A(2;3)$, đường thẳng d có phương trình $3x - y + 2 = 0$ và đường tròn (C) có phương trình $(x-1)² + (y-2)²=9$.\\\\
a) Tâm và bán kính đường tròn (C) là $I(1;2), R = 3$.\\\\
b) Một vector pháp tuyến của đường thẳng d là $\\vec{n} = (1;3)$.\\\\
c) Phương trình đường thẳng đi qua A và song song với d là $3x - y - 3 = 0$.\\\\
d) Đường thẳng d cắt đường tròn (C) tại hai điểm.\\\\
`;

    const MATHTYPE_SYSTEM_PROMPT = `
Là một chuyên gia soạn thảo Word cho các đề thi môn ${subjectName}, bạn sẽ tạo câu hỏi và đáp án.
QUY TẮC TUYỆT ĐỐI:
1.  **Chỉ tạo nội dung, không có lời dẫn hay giải thích gì thêm.**
2.  Sử dụng định dạng MathType tuyến tính (linear format) cho tất cả các công thức toán học. Ví dụ: \`x^2\`, \`\\sqrt(x-1)\`, \`(x+1)/(x-2)\`, \`\\vec(AB)\`.
3.  Không sử dụng LaTeX (ví dụ: \`$...$\`, \`\\\\frac{}{}\`).
4.  Cấu trúc câu hỏi và đáp án phải rõ ràng, giống như văn bản Word thông thường.

VÍ DỤ MẪU:
**1. TRẮC NGHIỆM:**
Câu 1 (NB): Trong mặt phẳng Oxy, cho đường thẳng d: 3x - y + 2 = 0. Một vector pháp tuyến của d là:
A. n = (3; -1).
B. n = (1; 3).
C. n = (-1; 3).
D. n = (3; 1).

**2. TỰ LUẬN:**
Câu 1 (VD): Tìm tọa độ trực tâm H của tam giác ABC biết A(1;2), B(-2;1) và C(4;-2).
`;

    const systemPrompt = format === 'latex' ? LATEX_SYSTEM_PROMPT : (
        format === 'mathtype' ? MATHTYPE_SYSTEM_PROMPT : (
            currentSubject === 'Anh' ? ENGLISH_SYSTEM_PROMPT : NORMAL_SYSTEM_PROMPT
        )
    );

    const examTitle = examTitleInput.value.trim();

    let promptForAI = `
        Hãy tạo một đề thi và đáp án chi tiết dựa trên cấu trúc sau.
        ${examTitle ? `Tiêu đề: ${examTitle}` : ''}
        
        --- CẤU TRÚC ĐỀ THI ---
    `;

    examStructure.forEach((part, index) => {
        promptForAI += `
        Phần ${index + 1}:
        - Bài học: ${part.lesson} (Lớp ${part.grade})
        - Số câu: ${part.numQuestions}
        - Mức độ: ${part.difficulty}
        - Loại câu hỏi: ${part.type}
        - Yêu cầu cần đạt: ${part.objectives.join('; ')}
        ---
        `;
    });

    const webLinksContent = (document.getElementById('webLinks') as HTMLTextAreaElement).value.trim();
    if (webLinksContent) {
        promptForAI += `
        --- NGUỒN THAM KHẢO BỔ SUNG TỪ WEB ---
        Hãy tham khảo các thông tin từ các đường link sau đây để làm phong phú câu hỏi:
        ${webLinksContent}
        ---
        `;
    }

    const fileParts: any[] = [];
    if (uploadedFiles.length > 0) {
        promptForAI += `
        --- NGUỒN THAM KHẢO BỔ SUNG TỪ TỆP ĐÍNH KÈM ---
        Hãy phân tích và sử dụng nội dung từ các tệp đính kèm sau đây để tạo ra các câu hỏi phù hợp và bám sát tài liệu.
        ---
        `;

        for (const file of uploadedFiles) {
             if (file.type.startsWith('image/')) {
                const base64Data = (await readFileAsBase64(file)).split(',')[1];
                fileParts.push({
                    inlineData: {
                        mimeType: file.type,
                        data: base64Data,
                    },
                });
             } else {
                 const textContent = await readFileAsText(file);
                 promptForAI += `\nNội dung tệp ${file.name}:\n${textContent}\n---`;
             }
        }
    }
    
    if (currentSubject === 'Toan' && format === 'latex') {
        const tikzQuery = examStructure.map(p => p.objectives.join(' ')).join(' ');
        const tikzSnippets = getTikzSnippetsForQuery(tikzQuery);
        promptForAI += `
        --- MẪU MÃ LỆNH TIKZ ĐỂ VẼ HÌNH (THAM KHẢO) ---
        Khi cần vẽ hình học, hãy sử dụng các đoạn mã TikZ tương tự như các ví dụ sau đây. Chỉ sử dụng khi câu hỏi yêu cầu vẽ hình.
        ${tikzSnippets}
        ---
        `;
    }
    
    const contents = [...fileParts, { text: promptForAI }];
    
    generateSpinner.style.display = 'inline-block';
    generateText.textContent = 'Đang tạo đề thi...';

    const responseStream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: { parts: contents },
        config: {
            systemInstruction: systemPrompt,
        }
    });

    let fullText = '';
    let buffer = '';
    examAndAnswerContent.innerHTML = '<pre><code></code></pre>';
    const codeElement = examAndAnswerContent.querySelector('code');

    for await (const chunk of responseStream) {
        buffer += chunk.text;
        if (codeElement) {
            codeElement.textContent = buffer;
        }
    }
    fullText = buffer;
    
    generateSpinner.style.display = 'none';
    generateText.textContent = 'Tạo đề thi, Ma trận & Đặc tả';
    
    return fullText;
}


// --- QUESTION BANK FUNCTIONS ---

async function handleBankSubjectChange() {
    const selectedBankSubject = bankSubjectSelect.value;
    // Clear selections when changing subject to avoid confusion
    selectedBankQuestions = [];
    updateSelectedCountDisplay();
    await loadBankData(selectedBankSubject);
}

function populateBankGradeSelect() {
    if (!bankGradeSelect) return;
    bankGradeSelect.innerHTML = '<option selected disabled>-- Chọn lớp --</option>';
    const grades = Object.keys(bankViewingData).sort((a, b) => parseInt(a) - parseInt(b));
    for (const grade of grades) {
        const option = document.createElement('option');
        option.value = grade;
        option.textContent = `Lớp ${grade}`;
        bankGradeSelect.appendChild(option);
    }
    bankGradeSelect.disabled = grades.length === 0;
}

function handleBankGradeChange() {
    const selectedGrade = bankGradeSelect.value;
    const lessons = bankViewingData[selectedGrade] || {};
    if (!bankLessonSelect) return;
    
    bankLessonSelect.innerHTML = '<option value="all" selected>-- Tất cả bài học --</option>';
    for (const lessonName in lessons) {
        const option = document.createElement('option');
        option.value = lessonName;
        option.textContent = lessonName;
        bankLessonSelect.appendChild(option);
    }
    bankLessonSelect.disabled = false;
    
    populateBankObjectives();
    renderQuestionBank();
}

function populateBankObjectives() {
    const grade = bankGradeSelect.value;
    const lesson = bankLessonSelect.value;
    if (!bankObjectiveSelect) return;

    bankObjectiveSelect.innerHTML = '<option value="all" selected>-- Tất cả Yêu cầu --</option>';
    bankObjectiveSelect.disabled = true;

    if (grade && grade !== 'all' && lesson && lesson !== 'all') {
        const objectives = bankViewingData[grade]?.[lesson]?.objectives || [];
        if (objectives.length > 0) {
            objectives.forEach(obj => {
                const option = document.createElement('option');
                option.value = obj;
                option.textContent = obj.length > 50 ? obj.substring(0, 50) + '...' : obj;
                bankObjectiveSelect.appendChild(option);
            });
            bankObjectiveSelect.disabled = false;
        }
    }
}

function renderQuestionBank() {
    if (!questionBankDisplay) return;

    const grade = bankGradeSelect.value;
    const lesson = bankLessonSelect.value;
    const type = bankTypeSelect.value;
    const difficulty = bankDifficultySelect.value;
    const objective = bankObjectiveSelect.value;

    let allQuestions: any[] = [];
    if (grade && bankGradeSelect.selectedIndex > 0) {
        if (lesson === 'all') { // All lessons in a grade
            Object.values(bankViewingData[grade] || {}).forEach((lessonData: any) => {
                if(lessonData.questionBank) allQuestions.push(...(lessonData.questionBank));
            });
        } else { // Specific lesson
            allQuestions = bankViewingData[grade]?.[lesson]?.questionBank || [];
        }
    }

    const filteredQuestions = allQuestions.filter(q => {
        return (type === 'all' || q.type === type) &&
               (difficulty === 'all' || q.difficulty === difficulty) &&
               (objective === 'all' || q.objective === objective);
    });

    questionBankDisplay.innerHTML = '';
    if (filteredQuestions.length === 0) {
        questionBankDisplay.innerHTML = '<p class="text-center text-muted p-4">Không tìm thấy câu hỏi nào phù hợp với bộ lọc.</p>';
        return;
    }

    filteredQuestions.forEach(q => {
        const item = document.createElement('div');
        item.className = 'bank-question-item';
        const isSelected = selectedBankQuestions.some(sq => sq.id === q.id);
        
        item.innerHTML = `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="" id="q-${q.id}" data-id="${q.id}" ${isSelected ? 'checked' : ''}>
                <label class="form-check-label" for="q-${q.id}">
                    <div>${q.question_text.replace(/\n/g, '<br>')}</div>
                    <div class="mt-2 text-primary small"><em>Đáp án: ${q.answer_text}</em></div>
                    <div class="mt-1">
                        <span class="badge bg-secondary">${q.type || 'N/A'}</span>
                        <span class="badge bg-info">${q.difficulty || 'N/A'}</span>
                    </div>
                </label>
            </div>
        `;
        questionBankDisplay.appendChild(item);
    });
    
    questionBankDisplay.querySelectorAll('.form-check-input').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            const questionId = target.dataset.id;
            const question = allQuestions.find(q => q.id === questionId);
            if (!question) return;
            
            if (target.checked) {
                if (!selectedBankQuestions.some(sq => sq.id === questionId)) {
                    selectedBankQuestions.push(question);
                }
            } else {
                selectedBankQuestions = selectedBankQuestions.filter(sq => sq.id !== questionId);
            }
            updateSelectedCountDisplay();
        });
    });
}

function updateSelectedCountDisplay() {
    if (!selectedQuestionCount || !questionBankActions || !exportSelectedBtn) return;
    const count = selectedBankQuestions.length;
    selectedQuestionCount.textContent = `Đã chọn: ${count} câu hỏi`;
    
    if (count > 0) {
        questionBankActions.style.display = 'flex';
        exportSelectedBtn.disabled = false;
    } else {
        questionBankActions.style.display = 'none';
        exportSelectedBtn.disabled = true;
    }
}

/**
 * Parses the generated exam text, adds new questions to the question bank,
 * and saves the data to localStorage.
 * @returns {Promise<boolean>} True if successful, false otherwise.
 */
async function updateBankFromResponse(): Promise<boolean> {
    if (!fullResponseText || !ai) {
        return false;
    }
    try {
        const prompt = `
        BẠN LÀ MỘT CHUYÊN GIA PHÂN LOẠI CÂU HỎI. Dựa vào Đề thi và Đáp án đã tạo, hãy phân tích và trích xuất TỪNG câu hỏi một cách độc lập và trả về dưới dạng một MẢNG JSON.

        CẤU TRÚC JSON CHO MỖI CÂU HỎI PHẢI TUÂN THỦ NGHIÊM NGẶT NHƯ SAU:
        {
            "question_text": "Toàn bộ nội dung câu hỏi. QUAN TRỌNG: Đối với câu hỏi dạng 'đúng/sai', nội dung này BẮT BUỘC phải bao gồm cả đoạn văn bản dẫn (tư liệu) và đủ 4 nhận định (a, b, c, d). Phải sử dụng kí tự xuống dòng (\\n) sau đoạn tư liệu và sau mỗi nhận định. Ví dụ: 'Câu 1. Tư liệu lịch sử...\\na) Nhận định 1.\\nb) Nhận định 2.\\nc) Nhận định 3.\\nd) Nhận định 4.'",
            "answer_text": "Đáp án chính xác và lời giải thích ngắn gọn (nếu có). Ví dụ cho câu đúng/sai: 'a-Đúng, b-Sai, c-Sai, d-Đúng.'",
            "grade": "Lớp (chỉ ghi số, ví dụ: 10, 11, 12)",
            "lesson": "Tên bài học chính xác mà câu hỏi thuộc về.",
            "type": "Loại câu hỏi (ví dụ: 'trắc nghiệm', 'tự luận', 'đúng/sai', ...)",
            "difficulty": "Mức độ ('nhận biết', 'thông hiểu', hoặc 'vận dụng').",
            "objective": "Yêu cầu cần đạt chính mà câu hỏi này kiểm tra. Chọn yêu cầu phù hợp nhất từ danh sách."
        }
        
        DỮ LIỆU ĐẦU VÀO ĐỂ PHÂN TÍCH:
        --- CẤU TRÚC ĐỀ THI GỐC ---
        ${JSON.stringify(examStructure, null, 2)}
        --- NỘI DUNG ĐỀ THI VÀ ĐÁP ÁN ---
        ${fullResponseText}
        ---
        
        QUY TẮC PHÂN LOẠI:
        - Với mỗi câu hỏi trong đề, hãy xác định nó thuộc 'Phần' nào trong cấu trúc gốc để lấy thông tin về Lớp (grade), Bài học (lesson), Loại (type), Mức độ (difficulty), và Yêu cầu (objective).
        - "objective" PHẢI LÀ MỘT TRONG CÁC YÊU CẦU CÓ SẴN trong cấu trúc của phần đó.
        - Đảm bảo trích xuất đầy đủ và chính xác nội dung câu hỏi và đáp án, đặc biệt là định dạng của câu hỏi 'đúng/sai' như đã mô tả ở trên.
        - Kết quả cuối cùng CHỈ LÀ MỘT MẢNG JSON, không có bất kỳ văn bản giải thích nào khác. Ví dụ: [ {câu hỏi 1}, {câu hỏi 2}, ... ]
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        });
        
        let jsonStr = response.text.trim();
        if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.substring(7, jsonStr.length - 3).trim();
        }
        
        const newQuestions = JSON.parse(jsonStr);

        if (!Array.isArray(newQuestions)) {
            throw new Error("AI did not return a valid JSON array.");
        }

        let addedCount = 0;
        newQuestions.forEach(q => {
            if (q.grade && q.lesson && q.question_text && q.answer_text) {
                const grade = q.grade.toString();
                const lesson = q.lesson;
                
                if (examData[grade] && examData[grade][lesson]) {
                    if (!examData[grade][lesson].questionBank) {
                        examData[grade][lesson].questionBank = [];
                    }
                    if (!examData[grade][lesson].questionBank.some(existingQ => existingQ.question_text === q.question_text)) {
                         examData[grade][lesson].questionBank.push({
                            id: `qb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            ...q
                         });
                         addedCount++;
                    }
                }
            }
        });
        
        if (addedCount > 0) {
            saveDataToLocalStorage();
            showAlert(`Đã thêm ${addedCount} câu hỏi mới vào ngân hàng trên trình duyệt.`, 'success');
            
            if (bankSubjectSelect.value === currentSubject) {
                await loadBankData(currentSubject);
            }
            renderQuestionBank();

        } else {
            showAlert('Không có câu hỏi mới nào được thêm. Có thể chúng đã tồn tại.', 'info');
        }
        return true;

    } catch (error) {
        showAlert(`Lỗi khi cập nhật ngân hàng câu hỏi: ${error.message}`, 'danger');
        console.error("Error updating question bank:", error);
        return false;
    }
}

async function handleUpdateQuestionBank() {
    if (!fullResponseText || !ai) {
        showAlert('Vui lòng tạo đề thi trước khi lưu vào ngân hàng.', 'warning');
        return;
    }

    setLoadingState(updateQuestionBankBtn, true);
    await updateBankFromResponse();
    setLoadingState(updateQuestionBankBtn, false);
}

async function handleExportFullBank() {
    // New part: Check and update if there is a pending exam
    if (fullResponseText.trim() !== '') {
        if (confirm('Bạn có đề thi vừa tạo chưa được lưu vào ngân hàng. Bạn có muốn lưu vào ngân hàng trước khi tải về không? Thao tác này có thể mất một chút thời gian.')) {
            setLoadingState(exportFullBankBtn, true);
            const success = await updateBankFromResponse();
            setLoadingState(exportFullBankBtn, false);

            if (!success) {
                showAlert('Không thể lưu đề thi vào ngân hàng. Đã hủy thao tác tải về.', 'warning');
                return; // Stop if saving fails
            }
            // After updating, clear the response text to avoid asking again
            fullResponseText = '';
        }
    }

    if (!confirm('Thao tác này sẽ tổng hợp ngân hàng câu hỏi của TẤT CẢ các môn đã lưu trên trình duyệt này vào một tệp duy nhất. Bạn có muốn tiếp tục?')) {
        return;
    }

    const fullBankData = {};
    const subjectOptions = subjectSelect.options;

    for (let i = 0; i < subjectOptions.length; i++) {
        const subjectKey = subjectOptions[i].value;
        const localStorageKey = `examData_${subjectKey}`;
        const savedData = localStorage.getItem(localStorageKey);

        if (savedData) {
            try {
                fullBankData[subjectKey] = JSON.parse(savedData);
                console.log(`Exporting data for subject: ${subjectKey}`);
            } catch (e) {
                console.error(`Could not parse data for subject ${subjectKey}`, e);
            }
        }
    }
    
    if (Object.keys(fullBankData).length === 0) {
        showAlert('Không tìm thấy dữ liệu ngân hàng câu hỏi nào được lưu trên trình duyệt.', 'warning');
        return;
    }

    downloadDataAsJson(fullBankData, `Ngan hang cau hoi.json`);
}

function handleImportQuestionBank(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) {
        return;
    }

    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
        showAlert('Vui lòng chọn một tệp ngân hàng .json hợp lệ.', 'warning');
        target.value = '';
        return;
    }

    const reader = new FileReader();

    reader.onload = async (e) => {
        try {
            const text = e.target?.result as string;
            if (!text) throw new Error("Tệp rỗng.");
            
            const importedFullBank = JSON.parse(text);

            const subjectKeys = Object.keys(importedFullBank);
            if (subjectKeys.length === 0 || typeof importedFullBank[subjectKeys[0]] !== 'object') {
                 throw new Error("Tệp không có cấu trúc dữ liệu hợp lệ. Tệp phải chứa dữ liệu cho từng môn học.");
            }

            if (!confirm(`Tệp này chứa dữ liệu cho ${subjectKeys.length} môn học. Thao tác này sẽ GHI ĐÈ dữ liệu của các môn tương ứng đang có trên trình duyệt. Bạn có chắc chắn muốn tiếp tục không?`)) {
                target.value = '';
                return;
            }
            
            let importedCount = 0;
            for (const subjectKey in importedFullBank) {
                if (Object.prototype.hasOwnProperty.call(importedFullBank, subjectKey)) {
                    const localStorageKey = `examData_${subjectKey}`;
                    const subjectData = importedFullBank[subjectKey];
                    localStorage.setItem(localStorageKey, JSON.stringify(subjectData));
                    importedCount++;
                }
            }

            // Reload UI to reflect changes for the currently selected subjects
            await loadSubjectData(currentSubject); // Reloads main form data
            await loadBankData(bankSubjectSelect.value); // Reloads bank view data
            
            showAlert(`Đã nạp thành công dữ liệu cho ${importedCount} môn học từ tệp!`, 'success');

        } catch (error) {
            console.error("Error importing question bank file:", error);
            showAlert(`Lỗi khi nạp tệp ngân hàng: ${(error as Error).message}. Vui lòng kiểm tra lại tệp.`, 'danger');
        } finally {
            target.value = '';
        }
    };

    reader.onerror = () => {
         showAlert('Không thể đọc được tệp. Vui lòng thử lại.', 'danger');
         target.value = '';
    };

    reader.readAsText(file);
}


function handleExportSelectedQuestions(format: 'docx' | 'tex') {
    if (selectedBankQuestions.length === 0) {
        showAlert('Vui lòng chọn ít nhất một câu hỏi để xuất.', 'warning');
        return;
    }

    const title = prompt("Nhập tiêu đề cho tệp xuất:", "Tuyển tập câu hỏi");
    if (title === null) return; // User cancelled
    if (title.trim() === "") {
        showAlert('Tiêu đề không được để trống.', 'warning');
        return;
    }

    try {
        if (format === 'docx') {
            let content = `<h1>${title}</h1><hr>`;
            content += selectedBankQuestions.map((q, index) => {
                const questionText = (q.question_text || '').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\*(.*?)\*/g, '<i>$1</i>').replace(/\n/g, '<br>');
                const answerText = (q.answer_text || '').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\*(.*?)\*/g, '<i>$1</i>').replace(/\n/g, '<br>');
                return `<div><b>Câu ${index + 1}:</b> ${questionText}</div><div style="margin-left: 20px;"><i>Đáp án: ${answerText}</i></div><br>`;
            }).join('');
            
            const html = `
                <!DOCTYPE html><html><head><meta charset='utf-8'><title>${title}</title>
                <style>body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; }</style>
                </head><body>${content}</body></html>`;

            const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'TuyenTapCauHoi.doc';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        } else if (format === 'tex') {
            let content = selectedBankQuestions.map((q, index) => {
                // For LaTeX, replace \n with \\ and a newline for readability in the .tex file
                const questionText = (q.question_text || '').replace(/\*\*(.*?)\*\*/g, '\\textbf{$1}').replace(/\*(.*?)\*/g, '\\textit{$1}').replace(/\n/g, '\\\\ \n');
                const answerText = (q.answer_text || '').replace(/\*\*(.*?)\*\*/g, '\\textbf{$1}').replace(/\*(.*?)\*/g, '\\textit{$1}').replace(/\n/g, '\\\\ \n');
                return `\\section*{Câu ${index + 1}}\n${questionText}\n\n\\textit{Đáp án: ${answerText}}\n`;
            }).join('\n');
            
            const fullTexDocument = `
    \\documentclass[12pt,a4paper]{article}
    \\usepackage[utf8]{inputenc}
    \\usepackage[vietnamese]{babel}
    \\usepackage{amsmath}
    \\usepackage{amssymb}
    \\usepackage{geometry}
    \\geometry{a4paper, margin=2cm}
    \\title{${title.replace(/([&%$#_{}])/g, '\\$1')}}
    \\author{AG-AI Exam Generator}
    \\date{\\today}
    \\begin{document}
    \\maketitle
    ${content}
    \\end{document}
            `;

            const blob = new Blob([fullTexDocument], { type: 'application/x-tex;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'TuyenTapCauHoi.tex';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
        
        showAlert(`Đã xuất ${selectedBankQuestions.length} câu hỏi thành công.`, 'success');
    } catch(error) {
        showAlert(`Đã xảy ra lỗi khi xuất tệp: ${error.message}`, 'danger');
        console.error("Error exporting questions:", error);
    }
}
