// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()); // JSONを扱う
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// データを受け取る
app.post('/save/:type', (req, res) => {
  const type = req.params.type;
  const filePath = path.join(__dirname, 'public', 'data', `${type}.json`);
  const data = req.body;
  const fileData = JSON.stringify(data, null, 2);

  if (type == 'setting') {  // タグデータだったら書き換え
    fs.writeFile(filePath, fileData, (err) => {
      if (err) {
        console.error('保存失敗:', err);
        return res.status(500).send('保存に失敗しました');
      }
      res.send(`タグ設定を保存しました`);
    });
  } else {  // メディアデータだったら追記
    // 既存のファイルを読み込む
    fs.readFile(filePath, 'utf8', (err, fileContent) => {
      let dataArray = [];

      if (!err) {
        try {
          dataArray = JSON.parse(fileContent);
          if (!Array.isArray(dataArray)) {
            dataArray = [];  // もし配列じゃなかったら空配列に
          }
        } catch (e) {
          dataArray = []; // 読み込み失敗したら空配列に
        }
      }
      
      // ID一致する既存データがあれば削除
      const filteredData = dataArray.filter(item => String(item.id) !== String(data.id));


      // 新しいデータを追加
      filteredData.push(data);

      // 追加した配列をファイルに書き込む
      fs.writeFile(filePath, JSON.stringify(filteredData, null, 2), (err) => {
        if (err) {
          console.error('保存失敗:', err);
          return res.status(500).send('保存に失敗しました');
        }
        res.send(`${type}データに追記しました`);
      });
    });
  }
});

// データを返す
app.get('/get', (req, res) => {
  res.json({ message: 'こんにちは！これはサーバーからのデータです。' });
});

app.listen(PORT, () => {
});

app.delete('/delete/:type/:id', (req, res) => {
  const type = req.params.type;
  const id = req.params.id;
  const filePath = path.join(__dirname, `data/${type}.json`);

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: '読み込み失敗' });

    let items = [];
    try {
      items = JSON.parse(data);
    } catch (e) {
      return res.status(500).json({ error: 'JSONパース失敗' });
    }

    const newItems = items.filter(item => String(item.id) !== String(id));

    fs.writeFile(filePath, JSON.stringify(newItems, null, 2), (err) => {
      if (err) return res.status(500).json({ error: '書き込み失敗' });
      res.json({ message: '削除成功' });
    });
  });
});
