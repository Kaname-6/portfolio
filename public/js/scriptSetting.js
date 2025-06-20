document.addEventListener("DOMContentLoaded", () => {
  const tagInputsContainer = document.getElementById("tagInputsContainer");
  const addTagInputBtn = document.getElementById("addTagInputBtn");
  const form = document.querySelector("form");

  // +タグ追加ボタン
  addTagInputBtn.addEventListener("click", () => {
    const newInput = createTagInput();
    tagInputsContainer.appendChild(newInput);
  });

  // タグのJSONデータを取得, 欄を作って表示
  fetch('data/setting.json')
    .then(response => {
      if (!response.ok) throw new Error('データ取得失敗');
      return response.json();
    })
    .then(json => {
      json.settingTags.forEach(tag => {
        const inputElement = createTagInput(tag);
        tagInputsContainer.appendChild(inputElement); // 表示
      });
    })
    .catch(error => {
      console.error('エラー:', error);
    });
});

// タグ入力欄を1つ作る関数
function createTagInput(value = "") {
  const wrapper = document.createElement("div");
  wrapper.className = "tagInputWrapper";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "tagInput";
  input.name = "tags[]";
  input.placeholder = "タグを入力";
  input.value = value;

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "removeBtn";
  removeBtn.textContent = "✕";
  removeBtn.addEventListener("click", () => {
    wrapper.remove();
  });

  wrapper.appendChild(input);
  wrapper.appendChild(removeBtn);

  return wrapper;
}

document.getElementById('setForm').addEventListener('submit', function (e) {
  e.preventDefault();  // フォームのデフォルト送信を止める

  const form = e.target;
  const formData = new FormData(form);
  const filteredTags = formData.getAll('tags[]').filter(tag => tag.trim() !== "");
  const data = {
    settingTags: filteredTags,
    user_id: 'guest'
  }

  fetch(form.action, {
    method: form.method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
    .then(res => res.text())
    .then(text => {
      alert(text);
      window.location.href = 'home.html';
    })
    .catch(err => {
      console.error(err);
      alert('送信失敗');
    });
});
