// index.js ファイル

// ☆☆☆ ここを設定してください ☆☆☆
const LIFF_ID = '2007298177-JYelpW3d'; // LINE Developers Consoleで発行されたLIFF ID
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwi1GiCjL55Cjh0M61prjFEfu9_6vP4Xi_AcTTYtWCddS6FIzieBRLuYCaqtyCVleHlMA/exec'; // デプロイしたGAS WebアプリのURL
// ☆☆☆ 設定終わり ☆☆☆

// HTMLドキュメントの読み込みが完了したら実行
document.addEventListener('DOMContentLoaded', function() {
    // LIFFの初期化
    liff.init({
        liffId: LIFF_ID
    })
    .then(() => {
        // LIFF初期化成功
        console.log('LIFF initialization successful');
        // ユーザーIDが取得できるか確認（Mini Appなら通常取得可能）
        if (!liff.getContext() || !liff.getContext().userId) {
             console.error('LINE User ID not available.');
             // エラーメッセージを表示するなど
             document.getElementById('statusMessage').textContent = 'LINEユーザー情報の取得に失敗しました。アプリを再起動してください。';
             document.getElementById('statusMessage').className = 'status-message error';
             document.getElementById('statusMessage').style.display = 'block';
             document.getElementById('submitBtn').disabled = true; // 送信ボタン無効化
             return;
         }
         console.log('LINE User ID:', liff.getContext().userId);

        // --- 位置情報自動取得ボタンのイベントリスナー設定 ---
        const getLocationBtn = document.getElementById('getLocationBtn');
        const locationInput = document.getElementById('location');
        const locationStatusDiv = document.getElementById('locationStatus');

        // 要素がすべて見つかったらイベントリスナーを設定
        if (getLocationBtn && locationInput && locationStatusDiv) {
             getLocationBtn.addEventListener('click', function() {
                 // LINEアプリ内ブラウザでのみgetLocationは動作します
                 if (!liff.isInClient()) {
                     locationStatusDiv.textContent = 'この機能はLINEアプリ内で使用してください。';
                     locationStatusDiv.style.color = 'red';
                     return;
                 }

                 locationStatusDiv.textContent = '現在地を取得中...';
                 locationStatusDiv.style.color = 'gray';
                 // getLocationBtn.disabled = true; // 取得中はボタンを無効化しても良い

                 liff.getLocation()
                     .then((location) => {
                         console.log('Location obtained:', location);
                         const lat = location.latitude.toFixed(6); // 緯度 (小数点以下6桁)
                         const lon = location.longitude.toFixed(6); // 経度 (小数点以下6桁)

                         // 手入力フィールドに取得した座標文字列をセット
                         locationInput.value = `緯度: ${lat}, 経度: ${lon}`;
                         locationStatusDiv.textContent = `現在地を取得しました。`;
                         locationStatusDiv.style.color = 'green';

                         // もしhidden inputを使うなら（GASで緯度経度を分けたい場合など）
                         // document.getElementById('latitude').value = location.latitude;
                         // document.getElementById('longitude').value = location.longitude;
                     })
                     .catch((err) => {
                         console.error('Error getting location:', err);
                         locationStatusDiv.textContent = '現在地の取得に失敗しました。手入力してください。';
                         locationStatusDiv.style.color = 'red';
                         locationInput.value = ''; // 失敗したらフィールドをクリア

                         // エラーコードに応じたメッセージ（例: ユーザーが拒否した場合）
                         // https://developers.line.biz/ja/reference/liff/#get-location-response
                         if (err.code === 5) { // PERMISSION_DENIED
                              locationStatusDiv.textContent = '位置情報へのアクセスが許可されていません。端末とLINEアプリの設定を確認してください。';
                         } else if (err.code === 2) { // POSITION_UNAVAILABLE
                             locationStatusDiv.textContent = '位置情報を特定できませんでした。GPSなどを確認し、手入力してください。';
                         } else if (err.code === 3) { // TIMEOUT
                             locationStatusDiv.textContent = '位置情報取得がタイムアウトしました。電波の良い場所でお試しいただくか、手入力してください。';
                         } else { // その他不明なエラー
                            locationStatusDiv.textContent = `位置情報取得で不明なエラーが発生しました（コード: ${err.code}）。手入力してください。`;
                         }
                     })
                     .finally(() => {
                         // getLocationBtn.disabled = false; // 取得中はボタンを無効化した場合、ここで有効化
                     });
             });
         } else {
            // 要素が見つからなかった場合のエラーログ
            console.error("Location elements not found in HTML. Check IDs: getLocationBtn, location, locationStatus");
         }
        // --- 位置情報自動取得ボタンのイベントリスナー設定 終わり ---


        // --- フォーム送信イベントリスナー設定 ---
        const safetyForm = document.getElementById('safetyForm');
        const submitBtn = document.getElementById('submitBtn');
        const statusMessageDiv = document.getElementById('statusMessage');

        // safetyForm, submitBtn, statusMessageDiv が見つかったらイベントリスナーを設定
        if (safetyForm && submitBtn && statusMessageDiv) {
             safetyForm.addEventListener('submit', function(event) {
                 event.preventDefault(); // デフォルトのフォーム送信を防止

                 submitBtn.disabled = true; // 二重送信防止
                 statusMessageDiv.style.display = 'none'; // メッセージ非表示

                 // フォームデータの取得
                 const name = document.getElementById('name').value;
                 const safetySelf = document.getElementById('safetySelf').value;
                 // document.getElementById('safetyFamily').value の修正
                 const safetyFamily = document.getElementById('safetyFamily').value;


                 // ★修正: locationInputから値を取得する (位置情報自動取得ボタン設定箇所で取得した変数 locationInput を使う)
                 const location = locationInput ? locationInput.value : ''; // locationInputが存在しない場合も考慮

                 const commute = document.getElementById('commute').value;
                 const homeStatus = document.getElementById('homeStatus').value;
                 const otherNotes = document.getElementById('otherNotes').value;
                 const userId = liff.getContext().userId; // LIFFからユーザーIDを取得

                 // 必須フィールドの簡易チェック（HTMLのrequired属性でも行われますが、JS側でも念のため）
                 if (!name || !safetySelf || !safetyFamily || !location || !commute || !userId) {
                     statusMessageDiv.textContent = '必須項目が入力されていません。';
                     statusMessageDiv.className = 'status-message error';
                     statusMessageDiv.style.display = 'block';
                     submitBtn.disabled = false;
                     console.error("Missing required fields or userId.");
                     return; // これ以上処理しない
                 }


                 // 送信するデータのオブジェクトを作成
                 const dataToSend = {
                     userId: userId,
                     name: name,
                     safetySelf: safetySelf,
                     safetyFamily: safetyFamily,
                     location: location, // ★locationInputから取得した値をセット
                     commute: commute,
                     homeStatus: homeStatus,
                     otherNotes: otherNotes
                 };

                 console.log('Sending data:', JSON.stringify(dataToSend));

                 // GAS Webアプリへデータを送信 (POSTリクエスト)
                 fetch(GAS_WEB_APP_URL, {
                     method: 'POST',
                     headers: {
                         'Content-Type': 'application/json',
                     },
                     body: JSON.stringify(dataToSend),
                     mode: 'cors' // 異なるオリジン間の通信を許可
                 })
                 .then(response => {
                     console.log('Fetch response received', response); // ★追加ログ
                     if (!response.ok) {
                         // HTTPステータスコードが200番台以外の場合
                         throw new Error(`HTTP error! status: ${response.status}`);
                     }
                     return response.json(); // JSONレスポンスをパース
                 })
                 .then(data => {
                     console.log('GAS response JSON:', data); // ★追加ログ
                     // GASからの応答に基づいてメッセージを表示
                     if (data.status === 'success') {
                         statusMessageDiv.textContent = data.message || '安否報告が完了しました。';
                         statusMessageDiv.className = 'status-message success';
                         // 報告完了後にフォームをクリアまたはウィンドウを閉じるなど
                         safetyForm.reset(); // フォームをリセット
                         // liff.closeWindow(); // ウィンドウを閉じる場合
                     } else {
                         statusMessageDiv.textContent = data.message || '安否報告に失敗しました。';
                         statusMessageDiv.className = 'status-message error';
                     }
                     statusMessageDiv.style.display = 'block';
                 })
                 .catch((error) => {
                     console.error('Fetch error:', error); // ★エラーログ
                     statusMessageDiv.textContent = '通信エラーが発生しました。時間をおいて再度お試しください。';
                     statusMessageDiv.className = 'status-message error';
                     statusMessageDiv.style.display = 'block';
                 })
                 .finally(() => {
                     console.log('Fetch finished'); // ★追加ログ
                     submitBtn.disabled = false; // ボタンを再度有効化
                 });
             });
         } else {
             // 要素が見つからなかった場合のエラーログ
             console.error("Form elements not found in HTML. Check IDs: safetyForm, submitBtn, statusMessageDiv");
             // 致命的なエラーとしてメッセージ表示やボタン無効化など
             if (statusMessageDiv) {
                 statusMessageDiv.textContent = 'アプリの読み込みエラー。開発者にご連絡ください。';
                 statusMessageDiv.className = 'status-message error';
                 statusMessageDiv.style.display = 'block';
             }
             if (submitBtn) {
                 submitBtn.disabled = true;
             }
         }
        // --- フォーム送信イベントリスナー設定 終わり ---


    }) // liff.init().then() の終わり
    .catch((err) => {
        // LIFF初期化失敗
        console.error('LIFF initialization failed', err); // ★エラーログ
         const statusMessageDiv = document.getElementById('statusMessage'); // エラー表示用に取得を試みる
         if (statusMessageDiv) {
             statusMessageDiv.textContent = 'アプリの初期化に失敗しました。LINEアプリのバージョンや通信環境を確認してください。';
             statusMessageDiv.className = 'status-message error';
             statusMessageDiv.style.display = 'block';
         }
         const submitBtn = document.getElementById('submitBtn'); // ボタン無効化用に取得を試みる
         if (submitBtn) {
            submitBtn.disabled = true; // 送信ボタン無効化
         }
    });
});

// document.getElementById('safetyFamily').value が documentgetElementById になっていたのを修正しました。
// 必須フィールドの簡易チェックを追加しました。
// fetch処理の各段階、要素が見つからなかった場合、LIFF初期化失敗時などにログを追加しました。
// 位置情報取得失敗時のエラーコード別のメッセージを追加しました。
// locationInput が見つからない場合の location 取得を安全にしました。
// フォームやボタン、メッセージ表示領域が見つからなかった場合のチェックとエラーログを追加しました。
