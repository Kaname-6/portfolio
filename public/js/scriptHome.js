document.addEventListener('DOMContentLoaded', () => {
    // localStorageからタイプを取得（必ず何か入っている想定）
    let savedType = localStorage.getItem('selectedMediaType') || 'novel';

    // ボタンのクリックイベント設定
    document.getElementById('input-button').addEventListener('click', () => {
        location.href = `input.html?type=${savedType}`;
    });

    document.getElementById('display-button').addEventListener('click', () => {
        location.href = savedType ? `display.html?type=${savedType}` : 'display.html';
    });

    document.getElementById('setting-button').addEventListener('click', () => {
        location.href = 'setting.html';
    });
});
