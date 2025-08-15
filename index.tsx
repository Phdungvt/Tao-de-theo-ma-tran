/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
declare var bootstrap: any;
declare var MathJax: any;
declare var docx: any; // For docx library
declare var saveAs: any; // For FileSaver.js

import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { getTikzSnippetsForQuery } from './tikz-snippets.ts';

// --- Global State ---
let examStructure: any[] = [];
let currentApiKey = '';
let currentSubject = 'Toan';
let generatedQuestions: any[] = [];
let examData: { [key: string]: any } = {};
let fullResponseText = '';
let ai: GoogleGenAI; // GoogleGenAI instance
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
const resultSection = document.getElementById('resultSection') as HTMLElement;
const examAndAnswerContent = document.getElementById('examAndAnswerContent') as HTMLElement;
const examMatrixContent = document.getElementById('examMatrixContent') as HTMLElement;
const examSpecContent = document.getElementById('examSpecContent') as HTMLElement;
const copyBtn = document.getElementById('copyBtn') as HTMLButtonElement;
const exportDocxBtn = document.getElementById('exportDocxBtn') as HTMLAnchorElement;
const exportTexBtn = document.getElementById('exportTexBtn') as HTMLAnchorElement;
const newExamBtn = document.getElementById('newExamBtn') as HTMLButtonElement;
const messageBox = document.getElementById('messageBox') as HTMLElement;
const webLinks = document.getElementById('webLinks') as HTMLTextAreaElement;
const apiKeyInput = document.getElementById('apiKeyInput') as HTMLInputElement;
const rememberApiKey = document.getElementById('rememberApiKey') as HTMLInputElement;
const saveApiKeyBtn = document.getElementById('saveApiKeyBtn') as HTMLButtonElement;
const apiKeyMessage = document.getElementById('apiKeyMessage') as HTMLElement;
const saveApiKeyText = document.getElementById('saveApiKeyText') as HTMLElement;
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
const resetDataBtn = document.getElementById('resetDataBtn') as HTMLButtonElement;
const fileUploadInput = document.getElementById('fileUploadInput') as HTMLInputElement;
const fileUploadList = document.getElementById('fileUploadList') as HTMLElement;
const questionNumInput = document.getElementById('questionNum') as HTMLInputElement;
const difficultySelect = document.getElementById('difficultySelect') as HTMLSelectElement;
const typeSelect = document.getElementById('typeSelect') as HTMLSelectElement;


// --- UTILITY FUNCTIONS ---
function showAlert(message: string, type = 'info', duration = 5000) {
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
    if (!button) return;
    button.disabled = isLoading;
    const spinner = button.querySelector('.spinner-border, .loading-spinner');

    if (isLoading) {
        button.classList.add('is-loading');
        if (spinner) (spinner as HTMLElement).style.display = 'inline-block';
    } else {
        button.classList.remove('is-loading');
        if (spinner) (spinner as HTMLElement).style.display = 'none';
    }

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

async function loadSubjectData(subject: string) {
    currentSubject = subject;
    // Use a versioned key to force refresh if data structure changes
    const localStorageKey = `examData_v4_${subject}`;

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
        showAlert(`Lỗi nghiêm trọng: Không thể tải tệp dữ liệu \`${subject}.json\`. Vui lòng đảm bảo tệp này tồn tại và có định dạng JSON hợp lệ.`, 'danger');
        console.error("Fetch error:", e);
        if (gradeSelect) gradeSelect.disabled = true;
    }
}


function saveDataToLocalStorage() {
    if (!currentSubject) return;
    const localStorageKey = `examData_v4_${currentSubject}`;
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
    } else {
        apiKeyModal?.show();
    }
}

function populateGradeSelect() {
    if (!gradeSelect) return;
    gradeSelect.innerHTML = '<option selected disabled>-- Chọn lớp --</option>';
    if (!examData || Object.keys(examData).length === 0) {
         showAlert(`Dữ liệu cho môn ${currentSubject} trống hoặc không hợp lệ.`, 'warning');
         gradeSelect.disabled = true;
         return;
    }
    for (const grade in examData) {
        const option = document.createElement('option');
        option.value = grade;
        option.textContent = `Lớp ${grade}`;
        gradeSelect.appendChild(option);
    }
    gradeSelect.disabled = false;
    // Reset subsequent dropdowns
    handleGradeChange();
}

function setupEventListeners() {
    subjectSelect?.addEventListener('change', handleSubjectChange);
    gradeSelect?.addEventListener('change', handleGradeChange);
    lessonSelect?.addEventListener('change', handleLessonChange);
    addBtn?.addEventListener('click', handleAddExamPart);
    generateFinalExamBtn?.addEventListener('click', handleGenerateExam);
    newExamBtn?.addEventListener('click', handleNewExam);
    copyBtn?.addEventListener('click', handleCopyContent);
    exportDocxBtn?.addEventListener('click', (e) => { e.preventDefault(); handleExportToDocx(); });
    exportTexBtn?.addEventListener('click', (e) => { e.preventDefault(); handleExportToTex(); });
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

// --- Event Handlers ---

async function handleSubjectChange() {
    if (!subjectSelect) return;
    const newSubject = subjectSelect.value;
    if (newSubject !== currentSubject) {
        // Reset state for the new subject
        examStructure = [];
        generatedQuestions = [];
        fullResponseText = '';
        if (explanationsContainer) {
            explanationsContainer.innerHTML = '';
            explanationsContainer.style.display = 'none';
        }
        if (resultSection) {
            resultSection.style.display = 'none';
        }
        if (examTitleInput) {
            examTitleInput.value = '';
        }
        uploadedFiles = [];
        renderUploadedFiles();
        await loadSubjectData(newSubject);
        renderStructure();
    }
}

function handleGradeChange() {
    if (!gradeSelect || !lessonSelect) return;
    const selectedGrade = gradeSelect.value;

    lessonSelect.innerHTML = '<option selected disabled>-- Chọn bài học --</option>';
    resetLessonAndObjectives(); // Hide objectives

    if (selectedGrade && examData[selectedGrade]) {
        for (const lesson in examData[selectedGrade]) {
            const option = document.createElement('option');
            option.value = lesson;
            option.textContent = lesson;
            lessonSelect.appendChild(option);
        }
        lessonSelect.disabled = false;
    } else {
        lessonSelect.disabled = true;
    }
    handleLessonChange();
}

function handleLessonChange() {
    if (!gradeSelect || !lessonSelect || !objectivesContainer || !objectivesCheckboxContainer) return;
    const selectedGrade = gradeSelect.value;
    const selectedLesson = lessonSelect.value;

    if (selectedGrade && selectedLesson && examData[selectedGrade]?.[selectedLesson]?.objectives) {
        objectivesContainer.style.display = 'block';
        renderObjectives();
    } else {
        objectivesContainer.style.display = 'none';
        objectivesCheckboxContainer.innerHTML = '';
    }
}

function handleAddExamPart() {
    const selectedObjectives = Array.from(objectivesCheckboxContainer.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked'))
        .map(cb => cb.value);

    if (!gradeSelect.value || !lessonSelect.value || selectedObjectives.length === 0) {
        showAlert('Vui lòng chọn Lớp, Bài học và ít nhất một Yêu cầu cần đạt.', 'warning');
        return;
    }

    const newPart = {
        id: Date.now(),
        grade: gradeSelect.value,
        lesson: lessonSelect.value,
        numQuestions: parseInt(questionNumInput.value, 10) || 1,
        difficulty: difficultySelect.value,
        type: typeSelect.value,
        objectives: selectedObjectives,
    };

    examStructure.push(newPart);
    renderStructure();
    showAlert(`Đã thêm ${newPart.numQuestions} câu về "${newPart.lesson}" vào cấu trúc đề.`, 'success');
}

async function handleGenerateExam() {
    if (!ai) {
        showAlert('Vui lòng nhập và lưu API Key hợp lệ trước khi tạo đề.', 'danger');
        apiKeyModal?.show();
        return;
    }
    if (examStructure.length === 0) {
        showAlert('Vui lòng thêm ít nhất một phần vào cấu trúc đề thi.', 'warning');
        return;
    }

    setLoadingState(generateFinalExamBtn, true);
    resultSection.style.display = 'none';
    if (explanationsContainer) explanationsContainer.innerHTML = '';
    
    // Clear previous results
    examAndAnswerContent.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div><p class="mt-2">AI đang tư duy, vui lòng chờ trong giây lát...</p></div>';
    examMatrixContent.innerHTML = '';
    examSpecContent.innerHTML = '';
    
    try {
        const fileParts = await Promise.all(uploadedFiles.map(async (file) => {
             const base64Data = (await readFileAsBase64(file)).split(',')[1];
             return {
                 inlineData: {
                     mimeType: file.type,
                     data: base64Data,
                 },
             };
         }));
        
        let prompt = `Bạn là một trợ lý AI chuyên tạo đề kiểm tra cho giáo viên Việt Nam. Dựa vào cấu trúc dưới đây, hãy tạo ra một đề kiểm tra hoàn chỉnh, bao gồm câu hỏi và đáp án chi tiết.
        
        **Thông tin đề thi:**
        - Tên đề thi: ${examTitleInput.value || "Đề kiểm tra"}
        - Môn học: ${subjectSelect.options[subjectSelect.selectedIndex].text}
        - Định dạng công thức toán học: ${formatSelect.value}
        
        **Cấu trúc chi tiết:**
        ${examStructure.map(part => `- ${part.numQuestions} câu hỏi loại "${part.type}" về bài "${part.lesson}", mức độ "${part.difficulty}", yêu cầu: ${part.objectives.join(', ')}`).join('\n')}

        **Yêu cầu đầu ra:**
        1.  Trình bày rõ ràng, phân cách giữa câu hỏi, các lựa chọn (nếu có), và đáp án.
        2.  Sử dụng Tiếng Việt có dấu, tuân thủ đúng ngữ pháp và thuật ngữ chuyên ngành.
        3.  Với câu hỏi trắc nghiệm, đáp án phải có dạng "Câu 1: A", "Câu 2: B",...
        4.  Với câu hỏi tự luận, đáp án cần có thang điểm gợi ý.
        5.  Nếu môn học là Toán, Vật lí, Hóa học, hãy sử dụng định dạng công thức đã chọn ở trên.
        6.  Tuyệt đối KHÔNG được tạo Ma trận đề thi và Bảng đặc tả, chỉ tạo đề và đáp án.
        7.  Nội dung câu hỏi nên tham khảo từ các tài liệu được cung cấp (nếu có).
        `;

        if (webLinks.value.trim()) {
            prompt += `\n**Nguồn tham khảo bổ sung từ web:**\n${webLinks.value.trim()}`;
        }
        
        const contents: any[] = [{ text: prompt }];
        if (fileParts.length > 0) {
             contents.push(...fileParts);
        }

        const stream = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: { parts: contents },
        });

        fullResponseText = '';
        resultSection.style.display = 'block'; // Show the section to display streaming text
        examAndAnswerContent.innerHTML = ''; // Clear spinner
        let buffer = '';

        for await (const chunk of stream) {
            const chunkText = chunk.text;
            if (chunkText) {
                buffer += chunkText;
                fullResponseText += chunkText; // Append to full response
                // Simple markdown-like rendering for streaming
                let html = buffer.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                 .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                 .replace(/\n/g, '<br>');
                examAndAnswerContent.innerHTML = `<pre><code>${html}</code></pre>`;
                resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
        displayExamResult(fullResponseText); // Final render after stream ends

    } catch (error) {
        console.error("Error generating exam:", error);
        showAlert('Có lỗi xảy ra khi tạo đề. Vui lòng kiểm tra API Key và thử lại.', 'danger');
        examAndAnswerContent.innerHTML = '<p class="text-danger">Đã xảy ra lỗi. Vui lòng thử lại.</p>';
    } finally {
        setLoadingState(generateFinalExamBtn, false);
    }
}


function handleNewExam() {
    examStructure = [];
    renderStructure();
    resultSection.style.display = 'none';
    examTitleInput.value = '';
    uploadedFiles = [];
    renderUploadedFiles();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showAlert('Đã tạo phiên làm việc mới. Mời bạn xây dựng cấu trúc đề thi.', 'info');
}

function handleCopyContent() {
    const activeTabContent = document.querySelector('.tab-pane.fade.show.active .rendered-table, .tab-pane.fade.show.active #examAndAnswerContent');
    if (activeTabContent) {
        // Create a temporary textarea to preserve formatting
        const textArea = document.createElement("textarea");
        textArea.value = (activeTabContent as HTMLElement).innerText;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showAlert('Đã sao chép nội dung vào clipboard!', 'success');
        } catch (err) {
            showAlert('Lỗi khi sao chép!', 'danger');
        }
        document.body.removeChild(textArea);
    }
}

function handleExportToDocx() {
    const activeTab = document.querySelector('.tab-pane.fade.show.active');
    if (!activeTab) return;

    const title = examTitleInput.value || "Đề kiểm tra";
    const content = activeTab.querySelector('#examAndAnswerContent')?.textContent || '';

    // Simplified approach: just save the text content
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    saveAs(blob, `${title}.docx`);
     showAlert('Tệp .docx chỉ chứa nội dung thuần túy của đề thi và đáp án.', 'info');
}

function handleExportToTex() {
     const activeTab = document.querySelector('.tab-pane.fade.show.active');
    if (!activeTab) return;
    const title = examTitleInput.value || "de-kiem-tra";
    const content = activeTab.querySelector('#examAndAnswerContent')?.textContent || '';

    // Just save the raw content
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    saveAs(blob, `${title.replace(/\s/g, '-')}.tex`);
    showAlert('Tệp .tex chỉ chứa nội dung thuần túy của đề thi và đáp án.', 'info');
}

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
        // Perform a simple test call to validate the key
        await testAi.models.generateContent({model: 'gemini-2.5-flash', contents: {parts: [{text: 'test'}]}});

        currentApiKey = apiKey;
        ai = testAi; // Use the new, validated instance
        apiKeyMessage.textContent = 'API Key hợp lệ và đã được lưu!';
        apiKeyMessage.className = 'text-success';

        if (rememberApiKey.checked) {
            localStorage.setItem('geminiApiKey', apiKey);
        } else {
            localStorage.removeItem('geminiApiKey');
        }

        setTimeout(() => apiKeyModal?.hide(), 1500);
    } catch (error) {
        console.error("API Key check failed:", error);
        apiKeyMessage.textContent = 'API Key không hợp lệ. Vui lòng kiểm tra lại.';
        apiKeyMessage.className = 'text-danger';
    } finally {
        setLoadingState(saveApiKeyBtn, false);
    }
}

function handleAddObjective() {
    const objectiveText = newObjectiveInput.value.trim();
    if (!objectiveText) return;

    const grade = gradeSelect.value;
    const lesson = lessonSelect.value;

    if (grade && lesson && examData[grade]?.[lesson]) {
        if (!examData[grade][lesson].objectives) {
            examData[grade][lesson].objectives = [];
        }
        examData[grade][lesson].objectives.push(objectiveText);
        saveDataToLocalStorage();
        renderObjectives(); // Re-render with the new objective
        newObjectiveInput.value = '';
        showAlert('Đã thêm yêu cầu mới và lưu vào bộ nhớ trình duyệt.', 'success');
    } else {
        showAlert('Vui lòng chọn lớp và bài học trước khi thêm yêu cầu.', 'warning');
    }
}


function handleExportDataFile() {
    if (!currentSubject) return;
    const dataStr = JSON.stringify(examData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentSubject}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showAlert(`Đã xuất dữ liệu cho môn ${currentSubject}.`, 'success');
}

function handleImportDataFile(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const importedData = JSON.parse(e.target?.result as string);
            const fileName = file.name.replace('.json', '');
            
            // Check if the imported subject matches the current subject
            if (fileName !== currentSubject) {
                 if (!confirm(`Tệp bạn nhập là của môn "${fileName}", khác với môn "${currentSubject}" đang chọn. Bạn có muốn chuyển sang môn "${fileName}" và nạp dữ liệu không?`)) {
                    target.value = ''; // Reset input
                    return;
                }
                subjectSelect.value = fileName;
                await handleSubjectChange();
            }

            examData = importedData;
            saveDataToLocalStorage();
            populateGradeSelect(); // Reload UI with new data
            showAlert(`Đã nạp thành công dữ liệu từ tệp ${file.name}.`, 'success');
        } catch (error) {
            showAlert('Tệp dữ liệu không hợp lệ. Vui lòng kiểm tra lại.', 'danger');
        } finally {
            target.value = ''; // Reset input
        }
    };
    reader.readAsText(file);
}

function handleResetData() {
    if (confirm(`Bạn có chắc muốn xoá tất cả các thay đổi và quay về dữ liệu gốc cho môn ${currentSubject}? Hành động này không thể hoàn tác.`)) {
        localStorage.removeItem(`examData_v4_${currentSubject}`);
        loadSubjectData(currentSubject).then(() => {
            showAlert(`Đã reset dữ liệu cho môn ${currentSubject} về trạng thái gốc.`, 'success');
        });
    }
}

async function handleSuggestObjectives() {
     if (!ai) {
        showAlert('Vui lòng nhập API Key hợp lệ.', 'warning');
        apiKeyModal?.show();
        return;
    }
    const grade = gradeSelect.value;
    const lesson = lessonSelect.value;
    if (!grade || !lesson) {
        showAlert('Vui lòng chọn lớp và bài học trước.', 'warning');
        return;
    }

    setLoadingState(suggestObjectivesBtn, true);
    try {
        const lessonContent = examData[grade]?.[lesson]?.content || '';
        const prompt = `Dựa trên nội dung bài học "${lesson}" lớp ${grade} sau đây: "${lessonContent}", hãy gợi ý 5 yêu cầu cần đạt (learning objectives) quan trọng nhất cho học sinh. Trả lời dưới dạng một danh sách JSON, mỗi yêu cầu là một chuỗi. Ví dụ: ["Yêu cầu 1", "Yêu cầu 2", ...]. Chỉ trả về JSON.`;

        const response = await ai.models.generateContent({
             model: "gemini-2.5-flash",
             contents: prompt,
             config: { responseMimeType: "application/json" }
        });

        const suggested = JSON.parse(response.text.trim());
        if (Array.isArray(suggested)) {
            suggested.forEach(obj => {
                if (typeof obj === 'string' && !examData[grade][lesson].objectives.includes(obj)) {
                    examData[grade][lesson].objectives.push(obj);
                }
            });
            saveDataToLocalStorage();
            renderObjectives();
            showAlert('Đã thêm các yêu cầu được gợi ý.', 'success');
        }
    } catch (error) {
        console.error("Error suggesting objectives:", error);
        showAlert('Không thể gợi ý yêu cầu vào lúc này.', 'danger');
    } finally {
        setLoadingState(suggestObjectivesBtn, false);
    }
}

async function handleGenerateExplanations() {
    if (!ai || !fullResponseText) {
        showAlert('Vui lòng tạo đề thi trước khi yêu cầu giải thích.', 'warning');
        return;
    }

    setLoadingState(generateExplanationsBtn, true);
    explanationsContainer.style.display = 'block';
    explanationsContainer.innerHTML = '<div class="text-center"><div class="spinner-border text-success" role="status"></div><p class="mt-2">Đang tạo giải thích...</p></div>';

    try {
        const prompt = `Dựa vào đề thi và đáp án sau đây, hãy viết lời giải thích chi tiết, rõ ràng, và dễ hiểu cho từng câu hỏi.
        
        --- ĐỀ THI VÀ ĐÁP ÁN ---
        ${fullResponseText}
        --- KẾT THÚC ĐỀ THI ---
        
        Yêu cầu:
        - Với câu trắc nghiệm: Giải thích tại sao đáp án đúng là đúng, và tại sao các đáp án còn lại là sai.
        - Với câu tự luận: Trình bày các bước giải chi tiết.
        - Giữ nguyên số thứ tự câu hỏi.
        `;

         const stream = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: { parts: [{text: prompt}] },
        });

        let explanationText = '';
        explanationsContainer.innerHTML = '';
        for await (const chunk of stream) {
            const chunkText = chunk.text;
            if (chunkText) {
                explanationText += chunkText;
                let html = explanationText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
                explanationsContainer.innerHTML = `<div class="explanation-section">${html}</div>`;
                explanationsContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }
        }
         if (MathJax) {
            MathJax.typesetPromise([explanationsContainer]).catch(console.error);
        }

    } catch (error) {
        console.error("Error generating explanations:", error);
        showAlert('Không thể tạo giải thích.', 'danger');
        explanationsContainer.innerHTML = '<p class="text-danger">Lỗi!</p>';
    } finally {
        setLoadingState(generateExplanationsBtn, false);
    }
}

async function handleSuggestTitle() {
    if (!ai || examStructure.length === 0) {
        showAlert('Vui lòng thêm ít nhất một phần vào cấu trúc đề và có API Key hợp lệ.', 'warning');
        return;
    }

    setLoadingState(suggestTitleBtn, true);
    try {
        const lessons = [...new Set(examStructure.map(p => p.lesson))].join(', ');
        const totalQuestions = examStructure.reduce((sum, p) => sum + p.numQuestions, 0);
        const prompt = `Gợi ý một tên đề thi ngắn gọn và phù hợp dựa trên các thông tin sau:
        - Môn học: ${subjectSelect.options[subjectSelect.selectedIndex].text}
        - Lớp: ${examStructure[0].grade}
        - Các bài học chính: ${lessons}
        - Tổng số câu: ${totalQuestions}
        Chỉ trả về một chuỗi duy nhất là tên đề thi được gợi ý. Ví dụ: "Đề kiểm tra 15 phút - Chương I: Động học".`;

        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt});
        const suggestedTitle = response.text.trim().replace(/"/g, ''); // Remove quotes
        if (suggestedTitle) {
            examTitleInput.value = suggestedTitle;
        }

    } catch (error) {
        console.error("Error suggesting title:", error);
        showAlert('Không thể gợi ý tên đề thi.', 'danger');
    } finally {
        setLoadingState(suggestTitleBtn, false);
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
    if(!fileUploadList) return;
    fileUploadList.innerHTML = '';
    if (uploadedFiles.length === 0) return;

    uploadedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'd-flex align-items-center bg-light p-2 rounded mb-2';
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
        fileNameSpan.className = 'file-name me-auto text-truncate';
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

function renderObjectives() {
    if (!objectivesCheckboxContainer) return;
    const grade = gradeSelect.value;
    const lesson = lessonSelect.value;
    const objectives = examData[grade]?.[lesson]?.objectives || [];
    objectivesCheckboxContainer.innerHTML = '';

    if (objectives.length === 0) {
        objectivesCheckboxContainer.innerHTML = '<p class="text-muted small p-2">Chưa có yêu cầu nào cho bài học này. Bạn có thể thêm mới.</p>';
        return;
    }

    objectives.forEach((obj, index) => {
        const div = document.createElement('div');
        div.className = 'objective-item d-flex align-items-center justify-content-between';
        div.innerHTML = `
            <div class="form-check flex-grow-1">
                <input class="form-check-input" type="checkbox" value="${obj.replace(/"/g, '&quot;')}" id="obj-${index}">
                <label class="form-check-label" for="obj-${index}">${obj}</label>
            </div>
            <div class="btn-group btn-group-sm ms-2">
                <button class="btn btn-edit" title="Sửa"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-delete" title="Xóa"><i class="bi bi-trash"></i></button>
            </div>
        `;
        objectivesCheckboxContainer.appendChild(div);
        
        // Event listeners for edit/delete
        const editBtn = div.querySelector('.btn-edit');
        const deleteBtn = div.querySelector('.btn-delete');

        editBtn?.addEventListener('click', () => handleEditObjective(index, div));
        deleteBtn?.addEventListener('click', () => handleDeleteObjective(index));
    });
}

function handleEditObjective(index: number, itemElement: HTMLElement) {
    const grade = gradeSelect.value;
    const lesson = lessonSelect.value;
    const currentText = examData[grade][lesson].objectives[index];
    
    itemElement.innerHTML = `
        <input type="text" class="form-control form-control-sm editing-input" value="${currentText.replace(/"/g, '&quot;')}">
        <div class="btn-group btn-group-sm ms-2">
            <button class="btn btn-save-edit" title="Lưu"><i class="bi bi-check-lg"></i></button>
        </div>
    `;

    const input = itemElement.querySelector('.editing-input') as HTMLInputElement;
    input.focus();
    const saveBtn = itemElement.querySelector('.btn-save-edit');

    const saveChanges = () => {
        const newText = input.value.trim();
        if (newText && newText !== currentText) {
            examData[grade][lesson].objectives[index] = newText;
            saveDataToLocalStorage();
        }
        renderObjectives(); // Re-render the list
    };
    
    saveBtn?.addEventListener('click', saveChanges);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveChanges();
        if (e.key === 'Escape') renderObjectives();
    });
}

function handleDeleteObjective(index: number) {
     if (confirm('Bạn có chắc muốn xóa yêu cầu này?')) {
        const grade = gradeSelect.value;
        const lesson = lessonSelect.value;
        examData[grade][lesson].objectives.splice(index, 1);
        saveDataToLocalStorage();
        renderObjectives();
        showAlert('Đã xóa yêu cầu.', 'info');
    }
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
            rowHtml += `<td class="text-left">${item.objectives.map((o: string) => `<span>- ${o.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>`).join('<br>')}</td>`;
            
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
        MathJax.typesetPromise([examAndAnswerContent, examMatrixContent, examSpecContent]).catch((err: Error) =>
            console.error('MathJax typesetting error:', err)
        );
    }

    resultSection.style.display = 'block';
    copyBtn.disabled = false;
    exportDocxBtn.classList.remove('disabled');
    exportTexBtn.classList.remove('disabled');
    generateExplanationsBtn.disabled = false;
}