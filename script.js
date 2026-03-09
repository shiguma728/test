document.addEventListener('DOMContentLoaded', () => {

    // -------------------------------------------------------------
    // 1. ステップ進行・ナビゲーション制御
    // -------------------------------------------------------------
    const nextButtons = document.querySelectorAll('.next-btn');
    const prevButtons = document.querySelectorAll('.prev-btn');
    const progressBar = document.getElementById('progress-bar');
    const stepDots = document.querySelectorAll('.step-dot');

    const totalSteps = 5;

    // バリデーション関数（現在のステップの必須項目が入力されているかチェック）
    function validateStep(stepIndex) {
        const currentSection = document.getElementById(`step-${stepIndex}`);
        const requiredInputs = currentSection.querySelectorAll('[required]');
        let isValid = true;

        // 既存のエラーメッセージをクリア
        currentSection.querySelectorAll('.error-msg').forEach(el => el.remove());

        requiredInputs.forEach(input => {
            // ラジオボタンのグループチェック
            if (input.type === 'radio') {
                const radGroup = currentSection.querySelectorAll(`input[name="${input.name}"]`);
                const isChecked = Array.from(radGroup).some(rad => rad.checked);
                if (!isChecked && isValid) { // 最初の1回だけエラー表示
                    showError(radGroup[0].closest('.radio-group'), '選択してください');
                    isValid = false;
                }
            }
            // テキスト/数値入力のチェック
            else if (!input.value.trim()) {
                showError(input, 'この項目は入力必須です');
                isValid = false;
            }
        });

        return isValid;
    }

    function showError(element, message) {
        const errorSpan = document.createElement('span');
        errorSpan.className = 'error-msg';
        errorSpan.style.color = '#dc2626';
        errorSpan.style.fontSize = '0.85rem';
        errorSpan.style.display = 'block';
        errorSpan.style.marginTop = '0.25rem';
        errorSpan.innerText = message;

        if (element.classList.contains('radio-group')) {
            element.appendChild(errorSpan);
        } else {
            element.parentNode.insertBefore(errorSpan, element.nextSibling);
        }
    }

    function updateProgressIndicator(targetStep) {
        // プログレスバーの幅を更新
        const progressPercent = ((targetStep) / totalSteps) * 100;
        progressBar.style.width = `${progressPercent}%`;

        // 上部のドットのハイライト更新
        stepDots.forEach(dot => {
            if (parseInt(dot.dataset.step) <= targetStep) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    function goToStep(targetStep, currentStep) {
        // DOM表示の切り替え
        document.getElementById(`step-${currentStep}`).classList.remove('active');
        document.getElementById(`step-${targetStep}`).classList.add('active');

        updateProgressIndicator(targetStep);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // 「次へ」ボタンのイベント
    nextButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetStep = parseInt(e.target.dataset.next);
            const currentStep = targetStep - 1;

            if (validateStep(currentStep)) {
                goToStep(targetStep, currentStep);
            }
        });
    });

    // 「戻る」ボタンのイベント
    prevButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetStep = parseInt(e.target.dataset.prev);
            const currentStep = targetStep + 1;
            goToStep(targetStep, currentStep);
        });
    });

    // 初期化（Step1を20%にする）
    updateProgressIndicator(1);


    // -------------------------------------------------------------
    // 2. 文字数カウント機能 (リアルタイム)
    // -------------------------------------------------------------
    const textareas = ['facts', 'life-connection', 'my-opinion'];

    textareas.forEach(id => {
        const textarea = document.getElementById(id);
        const countSpan = document.getElementById(`${id}-count`);

        if (textarea && countSpan) {
            textarea.addEventListener('input', () => {
                const length = textarea.value.trim().length;
                countSpan.innerText = length;
                // ちょっとしたゲーミフィケーション（色が変わる）
                if (length > 100) countSpan.style.color = '#10b981'; // 緑
                else if (length > 50) countSpan.style.color = '#2563eb'; // 青
                else countSpan.style.color = '#64748b'; // デフォルト
            });
        }
    });


    // -------------------------------------------------------------
    // 3. PDF出力（プレビュー生成 ＆ print呼び出し）
    // -------------------------------------------------------------
    const generateBtn = document.getElementById('generate-pdf-btn');

    generateBtn.addEventListener('click', () => {
        // 最終ステップのバリデーション
        if (!validateStep(5)) return;

        // 入力データを取得し、印刷用レイアウト（#print-area）に流し込む
        document.getElementById('print-class').innerText = document.getElementById('student-class').value;
        document.getElementById('print-number').innerText = document.getElementById('student-number').value;
        document.getElementById('print-name').innerText = document.getElementById('student-name').value;

        const selectedTheme = document.querySelector('input[name="theme"]:checked').value;
        document.getElementById('print-theme').innerText = selectedTheme;

        document.getElementById('print-theme-reason').innerText = document.getElementById('theme-reason').value;
        document.getElementById('print-textbook-page').innerText = document.getElementById('textbook-page').value;
        document.getElementById('print-facts').innerText = document.getElementById('facts').value;
        document.getElementById('print-life-connection').innerText = document.getElementById('life-connection').value;
        document.getElementById('print-my-opinion').innerText = document.getElementById('my-opinion').value;

        // すこし待ってから印刷ダイアログを開く（DOMの更新を確実にするため）
        setTimeout(() => {
            window.print();
        }, 300);
    });

});
