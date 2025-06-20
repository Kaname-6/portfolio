document.addEventListener('DOMContentLoaded', () => {
    // 1. URLのtypeパラメータを取得。なければlocalStorageから、さらに無ければ'novel'
    const url = new URL(window.location.href);
    let savedType = url.searchParams.get('type') || localStorage.getItem('selectedMediaType') || 'novel';

    // 2. localStorage更新
    localStorage.setItem('selectedMediaType', savedType);

    // 3. bodyクラス設定
    document.body.classList.add(savedType);

    // 4. ラジオボタンを選択状態に
    const radio = document.querySelector(`input[name="type"][value="${savedType}"]`);
    if (radio) radio.checked = true;

    // 5. 表示名マッピングとサブタイトル更新関数
    const typeDisplayNames = {
        novel: '小説',
        comic: '漫画',
        movie: '映画',
        anime: 'アニメ',
        drama: 'ドラマ'
    };

    const subTitle = document.getElementById('subTitle');
    const updateSubTitle = (type) => {
        const displayName = typeDisplayNames[type] || '';
        const originalText = subTitle.textContent; // すでに「小説＞」が付いてた場合に削除
        subTitle.textContent = `${displayName} ＞ ${originalText}`;
    };


    // 初期サブタイトル設定
    updateSubTitle(savedType);

    // 6. ラジオボタンのchangeイベント設定
    const radios = document.querySelectorAll('input[name="type"]');
    radios.forEach(radio => {
        radio.addEventListener('change', e => {
            const newType = e.target.value;

            // bodyクラス更新
            document.body.classList.remove('novel', 'comic', 'movie', 'anime', 'drama');
            document.body.classList.add(newType);

            // localStorage更新
            localStorage.setItem('selectedMediaType', newType);

            // URLのtypeパラメータを書き換えてページ遷移
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('type', newType);
            location.href = newUrl.toString();
        });
    });

    // 7. 各ボタンのクリックイベント
    document.getElementById('input-button')?.addEventListener('click', () => {
        const selected = document.querySelector('input[name="type"]:checked');
        const type = selected ? selected.value : 'novel';
        location.href = `input.html?type=${type}`;
    });

    document.getElementById('display-button')?.addEventListener('click', () => {
        const selected = document.querySelector('input[name="type"]:checked');
        const type = selected ? selected.value : '';
        location.href = type ? `display.html?type=${type}` : 'display.html';
    });

    document.getElementById('analysis-button')?.addEventListener('click', () => {
        location.href = 'analysis.html';
    });

    document.getElementById('setting-button')?.addEventListener('click', () => {
        location.href = 'setting.html';
    });
});
