let songs = [];
let selectedGenre = "すべて";


/* =========================
   CSV読み込み
========================= */

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
      '<p class="load-error">曲データを読み込めませんでした</p>';

  }

}


/* =========================
   CSV解析
========================= */

function parseCSV(text) {

  text = text.replace(/^\uFEFF/, "");

  const lines =
    text.trim().split(/\r?\n/);

  lines.shift();

  return lines

    .filter(line => line.trim() !== "")

    .map(line => {

      const columns =
        parseCSVLine(line);

      return {

        title:
          columns[0]?.trim() || "",

        artist:
          columns[1]?.trim() || "",

        genre:
          columns[2]?.trim() || "その他",

        favorite:
          columns[3]
            ?.trim()
            .toLowerCase() === "true"

      };

    });

}


/* カンマ・ダブルクォート対応 */

function parseCSVLine(line) {

  const result = [];

  let current = "";
  let insideQuotes = false;

  for (
    let i = 0;
    i < line.length;
    i++
  ) {

    const char = line[i];

    if (char === '"') {

      if (
        insideQuotes &&
        line[i + 1] === '"'
      ) {

        current += '"';

        i++;

      } else {

        insideQuotes =
          !insideQuotes;

      }

    } else if (
      char === "," &&
      !insideQuotes
    ) {

      result.push(current);

      current = "";

    } else {

      current += char;

    }

  }

  result.push(current);

  return result;

}


/* =========================
   ジャンル取得
========================= */

function getGenres() {

  return [

    ...new Set(

      songs

        .map(song =>
          song.genre
        )

        .filter(Boolean)

    )

  ];

}


/* =========================
   ジャンルボタン
========================= */

function createGenreButtons() {

  const container =
    document.getElementById(
      "genre-buttons"
    );

  const genres = [

    "すべて",

    ...getGenres()

  ];

  container.innerHTML = "";

  genres.forEach(genre => {

    const button =
      document.createElement(
        "button"
      );

    button.type = "button";

    button.className =
      "genre-button";

    button.textContent =
      genre;

    if (
      genre === selectedGenre
    ) {

      button.classList.add(
        "active"
      );

    }

    button.addEventListener(
      "click",
      () => {

        selectedGenre =
          genre;

        document
          .querySelectorAll(
            ".genre-button"
          )
          .forEach(btn => {

            btn.classList.remove(
              "active"
            );

          });

        button.classList.add(
          "active"
        );

        displaySongs();

      }
    );

    container.appendChild(
      button
    );

  });

}


/* =========================
   曲一覧表示
========================= */

function displaySongs() {

  const list =
    document.getElementById(
      "song-list"
    );

  const search =
    document
      .getElementById(
        "search-input"
      )
      .value
      .trim()
      .toLowerCase();

  const favoriteOnly =
    document
      .getElementById(
        "favorite-only"
      )
      .checked;

  const sortType =
    document
      .getElementById(
        "sort-select"
      )
      .value;


  /* =====================
     検索・絞り込み
  ===================== */

  let filteredSongs =
    songs.filter(song => {

      const matchesSearch =

        song.title
          .toLowerCase()
          .includes(search)

        ||

        song.artist
          .toLowerCase()
          .includes(search);


      const matchesGenre =

        selectedGenre ===
          "すべて"

        ||

        song.genre ===
          selectedGenre;


      const matchesFavorite =

        !favoriteOnly

        ||

        song.favorite;


      return (

        matchesSearch

        &&

        matchesGenre

        &&

        matchesFavorite

      );

    });


  /* =====================
     並び替え
  ===================== */


  /* 登録順 */

  if (sortType === "default") {

    // songs.csvの順番をそのまま使用

  }


  /* 曲名順 */

  else if (
    sortType === "title"
  ) {

    filteredSongs.sort(
      (a, b) =>

        a.title.localeCompare(
          b.title,
          "ja",
          {
            numeric: true,
            sensitivity: "base"
          }
        )

    );

  }


  /* アーティスト順 */

  else if (
    sortType === "artist"
  ) {

    filteredSongs.sort(
      (a, b) => {

        const result =
          a.artist.localeCompare(
            b.artist,
            "ja",
            {
              numeric: true,
              sensitivity: "base"
            }
          );

        if (result !== 0) {
          return result;
        }

        return (
          a.title.localeCompare(
            b.title,
            "ja",
            {
              numeric: true,
              sensitivity: "base"
            }
          )
        );

      }
    );

  }


  /* ジャンル順 */

  else if (
    sortType === "genre"
  ) {

    /*
      songs.csvにジャンルが
      最初に登場する順番
    */

    const genreOrder =
      getGenres();


    filteredSongs.sort(
      (a, b) =>

        genreOrder.indexOf(
          a.genre
        )

        -

        genreOrder.indexOf(
          b.genre
        )

    );

  }


  /* 得意曲優先 */

  else if (
    sortType === "favorite"
  ) {

    filteredSongs.sort(
      (a, b) =>

        Number(
          b.favorite
        )

        -

        Number(
          a.favorite
        )

    );

  }


  /* =====================
     表示
  ===================== */

  list.innerHTML = "";


  document
    .getElementById(
      "song-count"
    )
    .textContent =
      `${filteredSongs.length}曲`;


  const noResults =
    document.getElementById(
      "no-results"
    );


  if (
    filteredSongs.length === 0
  ) {

    noResults.hidden =
      false;

    return;

  }


  noResults.hidden =
    true;


  /* =====================
     1曲ずつ作成
  ===================== */

  filteredSongs.forEach(song => {


    const card =
      document.createElement(
        "article"
      );

    card.className =
      "song-card";


    const info =
      document.createElement(
        "div"
      );

    info.className =
      "song-info";


    /* 曲名 */

    const title =
      document.createElement(
        "div"
      );

    title.className =
      "song-title";


    if (song.favorite) {

      const star =
        document.createElement(
          "span"
        );

      star.className =
        "favorite-star";

      star.textContent =
        "⭐";

      title.appendChild(
        star
      );

    }


    const titleText =
      document.createElement(
        "span"
      );

    titleText.textContent =
      song.title;

    title.appendChild(
      titleText
    );


    /* アーティスト・ジャンル */

    const meta =
      document.createElement(
        "div"
      );

    meta.className =
      "song-meta";


    const artist =
      document.createElement(
        "span"
      );

    artist.textContent =
      song.artist;


    const separator =
      document.createElement(
        "span"
      );

    separator.className =
      "separator";

    separator.textContent =
      "｜";


    const genre =
      document.createElement(
        "span"
      );

    genre.textContent =
      song.genre;


    meta.appendChild(
      artist
    );

    meta.appendChild(
      separator
    );

    meta.appendChild(
      genre
    );


    info.appendChild(
      title
    );

    info.appendChild(
      meta
    );


    /* =====================
       コピーボタン
    ===================== */

    const copyButton =
      document.createElement(
        "button"
      );

    copyButton.type =
      "button";

    copyButton.className =
      "copy-button";

    copyButton.textContent =
      "コピー";


    copyButton.addEventListener(
      "click",
      async () => {


        const copyText =
          `${song.title} / ${song.artist}`;


        try {

          await navigator
            .clipboard
            .writeText(
              copyText
            );


          copyButton.textContent =
            "✓";


          copyButton.classList.add(
            "copied"
          );


          setTimeout(
            () => {

              copyButton.textContent =
                "コピー";

              copyButton.classList.remove(
                "copied"
              );

            },
            1200
          );


        } catch (error) {

          console.error(
            "コピー失敗",
            error
          );


          const textarea =
            document.createElement(
              "textarea"
            );

          textarea.value =
            copyText;

          document.body.appendChild(
            textarea
          );

          textarea.select();

          document.execCommand(
            "copy"
          );

          textarea.remove();


          copyButton.textContent =
            "✓";


          setTimeout(
            () => {

              copyButton.textContent =
                "コピー";

            },
            1200
          );

        }

      }
    );


    card.appendChild(
      info
    );

    card.appendChild(
      copyButton
    );


    list.appendChild(
      card
    );

  });

}


/* =========================
   検索イベント
========================= */

document
  .getElementById(
    "search-input"
  )
  .addEventListener(
    "input",
    displaySongs
  );


/* =========================
   得意曲
========================= */

document
  .getElementById(
    "favorite-only"
  )
  .addEventListener(
    "change",
    displaySongs
  );


/* =========================
   並び替え
========================= */

document
  .getElementById(
    "sort-select"
  )
  .addEventListener(
    "change",
    displaySongs
  );


/* =========================
   起動
========================= */

loadSongs();
