const nav = document.getElementById('displayNav');
let allData = [];

document.addEventListener('DOMContentLoaded', () => {
  const typeRadios = document.querySelectorAll('input[name="type"]');
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
      const fieldset = document.getElementById('tagFieldset');
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

  const checkedRadio = document.querySelector('input[name="type"]:checked');
  reloadData(checkedRadio.value);
  // ラジオボタンが変更されたらラベルを更新
  typeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      reloadData(e.target.value);
    });
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('filterNav');

  toggleBtn.addEventListener('click', () => {
    if (nav.style.display === 'none' || nav.style.display === '') {
      nav.style.display = 'block';
      toggleBtn.textContent = '絞り込み▲';
    } else {
      nav.style.display = 'none';
      toggleBtn.textContent = '絞り込み▽';
    }
  });
});

// リロード（並び替え）
function reloadData(type) {
  const sortKey = document.getElementById("sortSelect")?.value || "rating"; // 並び替え
  const sortDirection = document.querySelector('input[name="sortDirection"]:checked')?.value || "desc"; // 昇順 or 降順
  const tbody = document.getElementById("data_list");
  tbody.innerHTML = '';
  fetch('data/' + type + '.json')
    .then(response => {
      if (!response.ok) throw new Error('データ取得失敗');
      return response.json();
    })
    .then(data => {
      if (!Array.isArray(data) || data.length === 0) return;

      allData = data;

      data.sort((a, b) => {
        let result = 0;

        if (sortKey === "rating" || sortKey === "release_year" || sortKey === "watch_year") {
          result = (a[sortKey] || 0) - (b[sortKey] || 0);
        } else if (sortKey === "title") {
          result = (a.title || "").localeCompare(b.title || "");
        }

        return sortDirection === "asc" ? result : -result;
      });

      data.forEach(item => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
          <td>${item.title}</td>
          <td>${item.rating}</td>
          <td>${item.watch_year || "-"}</td>
          <td>${item.status || "-"}</td>
          <td>
          <button onclick="showDetail('${item.id}')">詳細</button>
          <button onclick="location.href='input.html?id=${item.id}&type=${type}'">編集</button>
          <button onclick="deleteItem('ID_HERE')">削除</button>
          </td>
        `;

        tbody.appendChild(tr);
      });
    }).catch(error => {
      console.error(error);
    });
}

// 検索
function search() {
  const type = document.querySelector('input[name="type"]:checked').value;
  const keyword = document.querySelector('input[name="search"]').value.trim().toLowerCase();
  const series = document.querySelector('input[name="series_search"]').value.trim().toLowerCase();
  const hasReview = document.querySelector('input[name="hasReview"]:checked')?.value;
  const hasUrl = document.querySelector('input[name="hasUrl"]')?.checked;
  const selectedStatuses = Array.from(document.querySelectorAll('input[name="status"]:checked')).map(cb => cb.value);
  const selectedTags = Array.from(document.querySelectorAll('input[name="tags[]"]:checked')).map(cb => cb.value);
  const bestInSeries = document.getElementById('bestInSeries')?.checked;

  const tbody = document.getElementById("data_list");
  tbody.innerHTML = '';

  fetch(`data/${type}.json`)
    .then(response => {
      if (!response.ok) throw new Error('データ取得失敗');
      return response.json();
    })
    .then(data => {
      if (!Array.isArray(data)) return;

      // 絞り込み処理
      const filtered = data.filter(item => {
        const title = item.title?.toLowerCase() || "";
        const author = item.author?.toLowerCase() || "";
        const favorites = (item.favorite || []).join(' ').toLowerCase();

        if (keyword && !title.includes(keyword) && !author.includes(keyword) && !favorites.includes(keyword)) return false;
        if (series && !title.includes(series)) return false;
        if (hasReview && hasReview === "yes" && !item.impression) return false;
        if (hasReview === "no" && item.impression) return false;
        if (hasUrl && !item.tobe) return false;
        if (selectedStatuses.length && !selectedStatuses.includes(item.status)) return false;
        if (selectedTags.length && (!item.tags || !selectedTags.some(tag => item.tags.includes(tag)))) return false;
        return true;
      });

      // シリーズ内一件だけ
      if (bestInSeries) {
        const seriesMap = new Map();
        filtered.forEach(item => {
          const key = item.series_title?.trim() || item.title?.trim();
          const current = seriesMap.get(key);
          if (!current || Number(item.rating || 0) > Number(current.rating || 0)) {
            seriesMap.set(key, item);
          }
        });
        filtered.length = 0;
        seriesMap.forEach(item => filtered.push(item));
      }

      filtered.forEach(item => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${item.title}</td>
          <td>${item.rating}</td>
          <td>${item.watch_year || "不明"}</td>
          <td>${item.status || "不明"}</td>
          <td><button onclick="showDetail('${item.id}')">詳細</button>
              <button onclick="location.href='input.html?id=${item.id}&type=${type}'">編集</button></td>
        `;
        tbody.appendChild(tr);
      });
    })
    .catch(error => {
      console.error(error);
    });
}

// 絞り込みクリア
function navClear() {
  const nav = document.getElementById('displayNav');
  const inputs = nav.querySelectorAll('input');

  inputs.forEach(input => {
    if (input.type === 'checkbox' || input.type === 'radio') {
      input.checked = false;
    } else if (input.type === 'text') {
      input.value = '';
    }
  });
  search();
}

// ソート変更更新
document.getElementById("sortSelect").addEventListener("change", () => {
  const checkedRadio = document.querySelector('input[name="type"]:checked');
  reloadData(checkedRadio.value);
});

// 昇順・降順更新
const sortDirectionRadios = document.querySelectorAll('input[name="sortDirection"]');
sortDirectionRadios.forEach(radio => {
  radio.addEventListener('change', () => {
    const checkedRadio = document.querySelector('input[name="type"]:checked');
    reloadData(checkedRadio.value);
  });
});

// 絞り込み更新
document.addEventListener('DOMContentLoaded', () => {
  const nav = document.getElementById('displayNav');
  // 入力が変わったら即絞り込み（動的追加も対応）
  nav.addEventListener('change', (e) => {
    if (e.target.matches('input, select')) {
      search();
    }
  });
});


function showDetail(id) {
  const data = allData.find(item => String(item.id) === String(id));

  if (!data) {
    alert('データが見つかりません');
    return;
  }

  const modal = document.getElementById('detailModal');
  const content = document.getElementById('detailContent');


  content.innerHTML = `
  <div class="detail-card">
    <h3 class="title">${data.title || '―'}</h3>
    <ul class="info-list">
      <li><strong>シリーズ：</strong> ${data.series_title || '―'}</li>
      <li><strong>著者・原作者：</strong> ${data.author || '―'}</li>
      <li><strong>制作会社：</strong> ${data.company || '―'}</li>
      <li><strong>公開年：</strong> ${data.release_year || '―'}</li>
      <li><strong>記録年：</strong> ${data.watch_year || '―'}</li>
      <hr>
      <li><strong>評価：</strong> ${data.rating || '―'}</li>
      <li><strong>ステータス：</strong> ${data.status || '―'}</li>
      <li><strong>推し：</strong> ${data.favorite?.length ? data.favorite.join(', ') : '―'}</li>
      <li><strong>タグ：</strong> ${data.tags?.length ? data.tags.join(', ') : '―'}</li>
      <li><strong>もう一度見たい：</strong> ${data.tobe ? '✔️' : '―'}</li>
    </ul>
    <div class="impression">
      <strong>感想：</strong><br>
      ${data.impression ? data.impression.replace(/\n/g, '<br>') : '―'}
    </div>
  </div>
`;


  modal.style.display = 'flex';

  // 閉じるボタン処理
  document.getElementById('modalClose').onclick = () => {
    modal.style.display = 'none';
  };

  // モーダル外クリックで閉じる
  window.onclick = (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  };
}

function deleteItem(id) {
  const type = document.querySelector('input[name="type"]:checked').value;

  if (!confirm('本当に削除しますか？')) return;

  fetch(`/delete/${type}/${id}`, { method: 'DELETE' })
    .then(res => {
      if (!res.ok) throw new Error('削除失敗');
      alert('削除しました');
      reloadData(type);
    })
    .catch(err => {
      console.error(err);
      alert('削除に失敗しました');
    });
}
