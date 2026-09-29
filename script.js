let songs = [];
let selectedGenre = "すべて";

// CSVを読み込む
async function loadSongs() {
  try {
    const response = await fetch("songs.csv");

    if (!response.ok) {
      throw new Error("CSVを読み込めませんでした");
    }

    const text = await response.text();

    songs = parseCSV(text);

    createGenreButtons();
    displaySongs();

  } catch (error) {
    console.error(error);

    document.getElementById("song-list").innerHTML =
      "<p>曲データを読み込めませんでした。</p>";
  }
}


// CSVをデータに変換
function parseCSV(text) {

  const lines = text.trim().split(/\r?\n/);

  // 1行目は見出しなので除外
  lines.shift();

  return lines
    .filter(line => line.trim() !== "")
    .map(line => {

      const columns = parseCSVLine(line);

      return {
        title: columns[0]?.trim() || "",
        artist: columns[1]?.trim() || "",
        genre: columns[2]?.trim() || "",
        favorite:
          columns[3]?.trim().toLowerCase() === "true"
      };
    });
}


// 「"」で囲まれたカンマにも対応
function parseCSVLine(line) {

  const result = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {

    const char = line[i];

    if (char === '"') {

      // "" は1つの " として扱う
      if (insideQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }

    } else if (char === "," && !insideQuotes) {

      result.push(current);
      current = "";

    } else {

      current += char;

    }
  }

  result.push(current);

  return result;
}


// ジャンルボタンを自動生成
function createGenreButtons() {

  const container =
    document.getElementById("genre-buttons");

  const genres = [
    "すべて",
    ...new Set(
      songs
        .map(song => song.genre)
        .filter(Boolean)
    )
  ];

  container.innerHTML = "";

  genres.forEach(genre => {

    const button =
      document.createElement("button");

    button.textContent = genre;

    button.className = "genre-button";

    if (genre === selectedGenre) {
      button.classList.add("active");
    }

    button.addEventListener("click", () => {

      selectedGenre = genre;

      document
        .querySelectorAll(".genre-button")
        .forEach(btn =>
          btn.classList.remove("active")
        );

      button.classList.add("active");

      displaySongs();
    });

    container.appendChild(button);
  });
}


// 曲一覧を表示
function displaySongs() {

  const list =
    document.getElementById("song-list");

  const search =
    document
      .getElementById("search-input")
      .value
      .trim()
      .toLowerCase();

  const favoriteOnly =
    document
      .getElementById("favorite-only")
      .checked;


  const filteredSongs =
    songs.filter(song => {

      // 曲名・アーティスト検索
      const matchesSearch =
        song.title.toLowerCase().includes(search) ||
        song.artist.toLowerCase().includes(search);

      // ジャンル
      const matchesGenre =
        selectedGenre === "すべて" ||
        song.genre === selectedGenre;

      // 得意曲
      const matchesFavorite =
        !favoriteOnly ||
        song.favorite;

      return (
        matchesSearch &&
        matchesGenre &&
        matchesFavorite
      );
    });


  list.innerHTML = "";


  // 曲数表示
  document.getElementById("song-count").textContent =
    `歌える曲 ${filteredSongs.length}曲`;


  // 0件表示
  const noResults =
    document.getElementById("no-results");

  if (filteredSongs.length === 0) {

    noResults.hidden = false;
    return;

  } else {

    noResults.hidden = true;
  }


  // 曲カードを作る
  filteredSongs.forEach(song => {

    const card =
      document.createElement("article");

    card.className = "song-card";


    const info =
      document.createElement("div");

    info.className = "song-info";


    const title =
      document.createElement("h2");

    title.className = "song-title";

    title.textContent =
      `${song.favorite ? "⭐ " : ""}${song.title}`;


    const meta =
  document.createElement("p");

meta.className = "song-meta";

meta.textContent =
  `${song.artist} ｜ ${song.genre}`;

info.appendChild(title);
info.appendChild(meta);


    // コピーボタン
    const copyButton =
      document.createElement("button");

    copyButton.className = "copy-button";
    copyButton.textContent = "📋 コピー";

    copyButton.addEventListener(
      "click",
      async () => {

        const copyText =
          `${song.title} / ${song.artist}`;

        try {

          await navigator.clipboard.writeText(copyText);

          copyButton.textContent =
            "✓ コピーしました";

          setTimeout(() => {

            copyButton.textContent =
              "📋 コピー";

          }, 1500);

        } catch (error) {

          console.error(
            "コピーに失敗しました",
            error
          );
        }
      }
    );


    card.appendChild(info);
    card.appendChild(copyButton);

    list.appendChild(card);
  });
}


// 検索欄を入力するたび更新
document
  .getElementById("search-input")
  .addEventListener(
    "input",
    displaySongs
  );


// 得意曲チェック変更時
document
  .getElementById("favorite-only")
  .addEventListener(
    "change",
    displaySongs
  );


// 最初にCSVを読み込む
loadSongs();
