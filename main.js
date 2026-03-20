/* Loudness Analyzer v1.0-beta | (c) 2026 hiroyama-icolle */

const dropZone = document.getElementById('drop-zone');
const resultDisplay = document.getElementById('result');
const historyList = document.getElementById('history-list');

let currentFileName = "";
const worker = new Worker('processor.worker.js');

// --- ブラウザの標準動作（ファイル再生）を防止 ---
window.addEventListener('dragover', e => e.preventDefault(), false);
window.addEventListener('drop', e => e.preventDefault(), false);

// --- UIの視覚効果 ---
dropZone.addEventListener('dragover', () => dropZone.classList.add('hover'));
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('hover'));

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('hover');
    
    const file = e.dataTransfer.files[0];
    if (file) {
        currentFileName = file.name;
        analyzeFile(file);
    }
});

// --- 解析メインロジック ---
async function analyzeFile(file) {
    if (!resultDisplay) return;
    
    resultDisplay.innerText = "Analyzing...";
    
    try {
        const arrayBuffer = await file.arrayBuffer();
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // 昨日の高精度エンジンが期待する「left」「right」形式でデータを抽出
        const leftData = audioBuffer.getChannelData(0);
        // ステレオでない場合は左をコピーして疑似ステレオとして送る
        const rightData = audioBuffer.numberOfChannels > 1 
            ? audioBuffer.getChannelData(1) 
            : new Float32Array(leftData);

        // 昨日のエンジン専用のメッセージ形式（START_ANALYSIS）で送信
        worker.postMessage({
            type: 'START_ANALYSIS',
            payload: {
                sampleRate: audioBuffer.sampleRate,
                left: leftData,
                right: rightData
            }
        });
        
    } catch (err) {
        console.error("Analysis Error:", err);
        resultDisplay.innerText = "Error";
    }
}

// --- Workerからの計算結果（RESULT）受け取り ---
worker.onmessage = (e) => {
    const { type, payload } = e.data;

    if (type === 'PROGRESS') {
        // 進捗表示（昨日版のエンジンにある機能を活用）
        resultDisplay.innerText = `Analyzing ${payload}%`;
    }

    if (type === 'RESULT') {
        const lufs = payload; // 昨日版は integratedLufs.toFixed(2) を返してくる
        
        // 1. メイン表示の更新
        resultDisplay.innerText = `${lufs} LUFS (Integrated)`;
        
        // 2. 履歴への追加
        if (historyList) {
            const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            const item = document.createElement('div');
            item.className = 'history-item';
            item.innerHTML = `
                <span class="history-name">[${time}] ${currentFileName}</span>
                <span style="font-weight:bold; color:#00ff99; margin-left:10px;">${lufs} LUFS</span>
            `;
            historyList.prepend(item);
        }
    }
};

worker.onerror = (err) => {
    console.error("Worker Error:", err);
    resultDisplay.innerText = "Worker Error";
};