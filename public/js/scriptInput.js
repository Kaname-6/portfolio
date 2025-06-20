const fieldset = document.getElementById('tagFieldset');

document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('form').classList.remove('input');

    const authorLabel = document.getElementById('authorlabel');
    const companyLabel = document.getElementById('companylabel');
    const releaseYearLabel = document.getElementById('releaseYearlabel');
    const watchYearLabel = document.getElementById('watchYearlabel');
    const typeRadios = document.querySelectorAll('input[name="type"]');
    const ratingRange = document.getElementById('rating');
    const ratingValue = document.getElementById('ratingValue');
    const now = document.getElementById('nowYear');
    const params = new URLSearchParams(location.search);
    const id = params.get("id");
    const type = params.get("type");

    if (type) {
        document.querySelector(`input[name="type"][value="${type}"]`).checked = true;
    }

    if (id) {
        // hidden input を作成
        let idInput = document.querySelector('input[name="edit_id"]');
        if (!idInput) {
            idInput = document.createElement('input');
            idInput.type = 'hidden';
            idInput.name = 'edit_id';
            document.getElementById('mediaForm').appendChild(idInput);
        }
        idInput.value = id;

        // タイプ選択が DOM に反映されてから呼ぶ
        setTimeout(() => {
            editDetail(id);
        }, 100);
    }

    function updateLabels(type) {
        if (type === 'movie' || type === 'drama' || type === 'anime') { // 映像
            watchYearLabel.innerHTML = '視聴年：';

            authorLabel.innerHTML = '原作者：';
            companyLabel.innerHTML = ' 制作会社：';
            releaseYearLabel.innerHTML = ' 公開年：';
        } else {    // 本
            watchYearLabel.innerHTML = '閲覧年：';

            authorLabel.innerHTML = '著者：';
            companyLabel.innerHTML = ' 出版社：';
            releaseYearLabel.innerHTML = ' 出版年：';
        }
    }

    // ページ読み込み時に現在選択中のタイプでラベルを更新
    const checkedRadio = document.querySelector('input[name="type"]:checked');
    if (checkedRadio) updateLabels(checkedRadio.value);

    // ラジオボタンが変更されたらラベルを更新
    typeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            updateLabels(e.target.value);
        });
    });

    // サブタイトル更新
    const typeDisplayNames = {
        novel: '小説',
        comic: '漫画',
        movie: '映画',
        anime: 'アニメ',
        drama: 'ドラマ'
    };
    const subTitle = document.getElementById('subTitle');
    if (id) {
        // 編集画面
        const displayName = typeDisplayNames[type] || '';
        subTitle.textContent = displayName ? `${displayName} ＞ 編集画面` : '編集画面';
    } else {
        // 新規入力
        const displayName = typeDisplayNames[type] || '';
        subTitle.textContent = displayName ? `${displayName} ＞ 新規入力画面` : '新規入力画面';
    }

    // 閲覧年の基準を今年にする
    const nowDate = new Date();
    const year = nowDate.getFullYear();
    now.value = year;

    // 評価の数字ラベル
    ratingValue.textContent = ratingRange.value;
    ratingRange.addEventListener('input', () => {
        ratingValue.textContent = ratingRange.value;
    });

    // 「推し」追加ボタン
    const favoriteContainer = document.getElementById('favoriteInputsContainer');
    const addFavoriteBtn = document.getElementById('addFavoriteInputBtn');
    addFavoriteBtn.addEventListener('click', () => {
        const div = document.createElement('div');
        div.className = 'favoriteInputWrapper';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'favoriteInput';
        input.name = 'favorites[]';

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'removeBtn';
        removeBtn.textContent = '✕';
        removeBtn.addEventListener('click', e => {
            div.remove();
        });

        div.appendChild(input);
        div.appendChild(removeBtn);
        favoriteContainer.appendChild(div);
    });

    // タグのJSONデータを取得
    fetch('data/setting.json')
        .then(response => {
            if (!response.ok) throw new Error('データ取得失敗');
            return response.json();
        })
        .then(json => {
            // データを配列で取得
            const tagsArray = json.settingTags;
            // チェックボックス生成
            tagsArray.forEach(tag => {
                const label = document.createElement('label');
                label.style.marginRight = '10px';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.name = 'tags[]';
                checkbox.value = tag;

                label.appendChild(checkbox);
                label.appendChild(document.createTextNode(' ' + tag));

                fieldset.appendChild(label);
            });
        })
        .catch(error => {
            console.error('エラー:', error);
        });
});

// form の action を設定
document.getElementById('mediaForm').addEventListener('submit', function (e) {
    const editIdInput = document.querySelector('input[name="edit_id"]');
    const id = editIdInput?.value || crypto.randomUUID();
    e.preventDefault(); // 通常の送信を止める

    const checkedRadio = document.querySelector('input[name="type"]:checked');
    const formData = new FormData(this);
    const data = {
        id: id,
        title: formData.get('title'),
        series_title: formData.get('series_title'),
        author: formData.get('author'),
        company: formData.get('company'),
        release_year: formData.get('release_year'),
        watch_year: formData.get('watch_year'),
        rating: formData.get('rating'),
        status: formData.get('status'),
        favorite: formData.getAll('favorites[]').filter(tag => tag.trim() !== ""),
        impression: formData.get('impression'),
        tobe: formData.get('tobe') == 'on',
        tags: formData.getAll('tags[]'),
        user_id: 'guest'
    };
    const url = '/save/' + checkedRadio.value;
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
        .then(res => res.text())
        .then(text => {
            alert(text);
            this.reset();  // 送信後フォームリセット（必要なら）
            window.location.href = 'home.html';
        })
        .catch(err => {
            console.error(err);
            alert('送信失敗');
        });
});


function editDetail(id) {
    const type = document.querySelector('input[name="type"]:checked').value;

    fetch(`data/${type}.json`)
        .then(res => res.json())
        .then(data => {
            const item = data.find(entry => entry.id == id);
            if (!item) return alert('データが見つかりません');

            // フォームに流し込む
            document.querySelector('input[name="title"]').value = item.title || '';
            document.querySelector('input[name="series_title"]').value = item.series_title || '';
            document.querySelector('input[name="author"]').value = item.author || '';
            document.querySelector('input[name="company"]').value = item.company || '';
            document.querySelector('input[name="release_year"]').value = item.release_year || '';
            document.querySelector('input[name="watch_year"]').value = item.watch_year || '';
            document.querySelector('input[name="rating"]').value = item.rating || '';
            document.querySelector(`#ratingValue`).textContent = item.rating || '';

            const statusRadios = document.querySelectorAll('input[name="status"]');
            statusRadios.forEach(radio => {
                radio.checked = (radio.value === item.status);
            });

            // お気に入り（複数）
            const favContainer = document.getElementById('favoriteInputsContainer');
            favContainer.innerHTML = ''; // 一旦クリア
            (item.favorite || []).forEach(fav => {
                const div = document.createElement('div');
                div.className = 'favoriteInputWrapper';

                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'favoriteInput';
                input.name = 'favorites[]';
                input.value = fav;

                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'removeBtn';
                removeBtn.textContent = '✕';
                removeBtn.addEventListener('click', () => div.remove());

                div.appendChild(input);
                div.appendChild(removeBtn);
                favContainer.appendChild(div);
            });

            document.querySelector('textarea[name="impression"]').value = item.impression || '';
            document.querySelector('input[name="tobe"]').checked = item.tobe || false;

            // タグ（チェックボックス）
            const tagCheckboxes = document.querySelectorAll('input[name="tags[]"]');
            tagCheckboxes.forEach(cb => {
                cb.checked = item.tags?.includes(cb.value) || false;
            });

            // 隠しフィールドとしてIDをセット（後で保存時に必要）
            let idInput = document.querySelector('input[name="edit_id"]');
            if (!idInput) {
                idInput = document.createElement('input');
                idInput.type = 'hidden';
                idInput.name = 'edit_id';
                document.getElementById('mediaForm').appendChild(idInput);
            }
            idInput.value = item.id;
        });
}
window.editDetail = editDetail;

const params = new URLSearchParams(location.search);
const id = params.get("id");
const type = params.get("type");

if (type) {
    document.querySelector(`input[name="type"][value="${type}"]`).checked = true;
}

if (id) {
    // editDetail 関数でフォームに流し込む
    setTimeout(() => {
        editDetail(id);
    }, 100);
}