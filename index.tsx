/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
declare var bootstrap: any;
declare var MathJax: any;

import { GoogleGenAI } from "@google/genai";
import { getTikzSnippetsForQuery } from './tikz-snippets.ts';

// --- Global State ---
let examStructure = [];
let currentApiKey = '';
let currentSubject = 'toan';
let generatedQuestions = [];
let examData = {};
let fullResponseText = '';
let ai; // GoogleGenAI instance
let uploadedFiles: File[] = [];


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

function setLoadingState(button: HTMLButtonElement, isLoading: boolean) {
    button.disabled = isLoading;

    if (isLoading) {
        button.classList.add('is-loading');
    } else {
        button.classList.remove('is-loading');
    }

    // Handle text changes for specific buttons
    if (button === saveApiKeyBtn) {
        saveApiKeyText.textContent = isLoading ? 'Đang kiểm tra...' : 'Lưu và Kiểm tra';
    } else if (button === generateFinalExamBtn) {
        generateText.textContent = isLoading ? 'Đang tạo...' : 'Tạo đề thi, Ma trận & Đặc tả';
    }
}


// --- INITIALIZATION ---
window.addEventListener('DOMContentLoaded', async () => {
    loadSavedApiKey();
    await loadSubjectData(currentSubject);
    setupEventListeners();
    renderStructure();
});

async function loadSubjectData(subject) {
    currentSubject = subject;
    const localStorageKey = `examData_${subject}`;

    try {
        const savedData = localStorage.getItem(localStorageKey);
        if (savedData) {
            console.log(`Loading data for subject '${subject}' from localStorage.`);
            examData = JSON.parse(savedData);
        } else {
            console.log(`No local data found for '${subject}'. Fetching from server.`);
            const response = await fetch(`${subject}.json`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            examData = await response.json();
            localStorage.setItem(localStorageKey, JSON.stringify(examData));
        }

        populateGradeSelect();
        resetLessonAndObjectives();
    } catch (e) {
        showAlert(`Lỗi nghiêm trọng: Không thể tải tệp dữ liệu \`${subject}.json\`. Vui lòng đảm bảo tệp này tồn tại.`, 'danger');
        console.error("Fetch error:", e);
        if (gradeSelect) gradeSelect.disabled = true;
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
    for (const grade in examData) {
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
                    if (item.type === type && item.difficulty === level) {
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
}

// --- Event Handlers ---

async function handleSaveApiKey() {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        apiKeyMessage.textContent = 'Vui lòng nhập API Key.';
        apiKeyMessage.className = 'text-danger';
        return;
    }

    setLoadingState(saveApiKeyBtn, true);

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
        setLoadingState(saveApiKeyBtn, false);
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
    await loadSubjectData(selectedSubject);
}

async function handleResetData() {
    if (confirm(`Bạn có chắc chắn muốn xóa tất cả các thay đổi đã lưu cho môn ${currentSubject} và quay về dữ liệu gốc không?`)) {
        const localStorageKey = `examData_${currentSubject}`;
        localStorage.removeItem(localStorageKey);
        showAlert(`Đã reset dữ liệu môn ${currentSubject} về trạng thái gốc.`, 'info');
        await loadSubjectData(currentSubject);
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

    reader.onload = (e) => {
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

    setLoadingState(generateFinalExamBtn, true);

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
        setLoadingState(generateFinalExamBtn, false);
    }
}

async function generateFullResponse(): Promise<string> {
    const format = formatSelect.value;

    const BASE_INSTRUCTION = `CHÚ Ý: chỉ tạo các câu hỏi đúng các phần mà mình yêu cầu, nếu không yêu cầu thì không tự tạo thêm. Chỉ cần tạo đề thi và đáp án, không cần tạo ma trận hay bản đặc tả.`;

    const NORMAL_SYSTEM_PROMPT = `
BẠN LÀ MỘT CHUYÊN GIA SOẠN THẢO ĐỀ THI TOÁN HỌC. ${BASE_INSTRUCTION}
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
BẠN LÀ MỘT CHUYÊN GIA SOẠN THẢO ĐỀ THI TOÁN HỌC BẰNG LATEX. ${BASE_INSTRUCTION}
CHỈ TẠO NỘI DUNG BÊN TRONG MÔI TRƯỜNG DOCUMENT, KHÔNG BAO GỒM \\documentclass, \\usepackage, hay \\begin{document}.
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
Là một chuyên gia soạn thảo Word cho các đề thi Toán học, bạn sẽ tạo câu hỏi và đáp án dưới dạng code raw LaTeX tương thích với MathType. ${BASE_INSTRUCTION}
- Luôn dùng $...$ cho môi trường toán học.
- Luôn dùng \\dfrac, \\left( ... \\right), \\overrightarrow.
QUY TẮC ĐỊNH DẠNG TUYỆT ĐỐI: Sau mỗi dòng câu hỏi và mỗi dòng đáp án (A, B, C, D, a, b, c, d) PHẢI có lệnh xuống dòng \\\\.
VÍ DỤ MẪU:
**1. TRẮC NGHIỆM:**
Câu 1 (NB): Trong các câu sau, câu nào không phải là mệnh đề?\\\\
A. $1 + 1 = 2$.\\\\
B. Hình thoi có bốn cạnh bằng nhau.\\\\
C. Hãy đóng cửa sổ lại!\\\\
D. Số pi là một số vô tỉ.\\\\
`;

    let systemPrompt: string;
    switch (format) {
        case 'latex':
            systemPrompt = LATEX_SYSTEM_PROMPT;
            break;
        case 'mathtype':
            systemPrompt = MATHTYPE_SYSTEM_PROMPT;
            break;
        default:
            systemPrompt = NORMAL_SYSTEM_PROMPT;
    }

    if (format === 'latex' || format === 'mathtype') {
        const queryKeywords = examStructure.map(part => `${part.lesson} ${part.objectives.join(' ')}`).join(' ');
        const tikzSnippets = getTikzSnippetsForQuery(queryKeywords);
        if (tikzSnippets) {
            systemPrompt += `

--- TIKZ SNIPPETS THAM KHẢO ---
KHI CẦN VẼ HÌNH BẰNG TIKZ (cho hình học, đồ thị, bảng biến thiên, ...), HÃY THAM KHẢO VÀ ƯU TIÊN SỬ DỤNG CÁC ĐOẠN MÃ SAU ĐÂY ĐỂ ĐẢM BẢO TÍNH CHÍNH XÁC VÀ NHẤT QUÁN. ĐÂY LÀ THƯ VIỆN MÃ LỆNH MẪU:
${tikzSnippets}
--- HẾT TIKZ SNIPPETS ---
`;
        }
    }

    const userPromptText = `
    Dựa vào cấu trúc sau đây, hãy tạo một đề thi hoàn chỉnh kèm đáp án chi tiết.

    **Tiêu đề:** ${examTitleInput.value || 'Đề kiểm tra'}

    **Cấu trúc đề:**
    ${examStructure.map((part, index) => `
    Phần ${index + 1}:
    - Lớp: ${part.grade}
    - Bài học/Chủ đề: ${part.lesson}
    - Số lượng câu hỏi: ${part.numQuestions}
    - Dạng câu hỏi: ${part.type}
    - Mức độ: ${part.difficulty}
    - Yêu cầu cần đạt: ${part.objectives.join(', ')}
    `).join('\n')}

    Hãy đảm bảo đầu ra tuân thủ định dạng đã chọn (${format}) và chỉ bao gồm nội dung đề thi và đáp án.
    `;

    const contentParts: any[] = [];

    if (uploadedFiles.length > 0) {
        contentParts.push({ text: "Dưới đây là một số tệp tham khảo. Hãy sử dụng thông tin trong các tệp này để tạo câu hỏi nếu phù hợp:" });
        for (const file of uploadedFiles) {
            const base64Data = (await readFileAsBase64(file)).split(',')[1];
            contentParts.push({
                inlineData: {
                    mimeType: file.type || 'application/octet-stream',
                    data: base64Data
                }
            });
        }
    }
    contentParts.push({ text: userPromptText });

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: contentParts },
        config: {
            systemInstruction: systemPrompt,
        }
    });

    return response.text;
}