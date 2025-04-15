document.addEventListener('DOMContentLoaded', function() {
    // 전역 타이머 변수
    window.autoRateUpdateTimer = null;
    
    // 현재 탭이 AliExpress 도메인인지 확인
    checkCurrentDomain();
    
    // 설정 로드
    loadSettings();

    // 익스텐션 상태 토글 버튼
    // const extensionToggle = document.getElementById('extensionToggle');
    // extensionToggle.addEventListener('change', function() {
    //     saveSettings({ extensionEnabled: this.checked });
        
    //     // 이 부분에서 content script에 메시지를 보내 확장 프로그램 활성화/비활성화 상태 변경
    //     chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    //         chrome.tabs.sendMessage(tabs[0].id, {
    //             action: 'toggleExtension',
    //             enabled: extensionToggle.checked
    //         });
    //     });
    // });

    // 환율 업데이트 주기 설정
    const rateUpdateInterval = document.getElementById('rateUpdateInterval');
    rateUpdateInterval.addEventListener('change', function() {
        saveSettings({ updateInterval: this.value });
        
        // 설정 변경 시 즉시 타이머 업데이트
        setupAutoRateUpdate(this.value);
    });

    // 글자 크기 설정
    const fontSize = document.getElementById('fontSize');
    fontSize.addEventListener('change', function() {
        saveSettings({ fontSize: this.value });
        
        // content script에 메시지 전송
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'updateFontSize',
                size: fontSize.value
            });
        });
        
        // 미리보기 업데이트
        updatePreview();
    });

    // 색상 피커 관련 요소
    const textColorPicker = document.getElementById('textColorPicker');
    const textColorInput = document.getElementById('textColorInput');
    
    const bgColorPicker = document.getElementById('bgColorPicker');
    const bgColorInput = document.getElementById('bgColorInput');
    
    // 미리보기 요소
    const previewBox = document.querySelector('.preview-box');

    // 텍스트 색상 변경 이벤트
    textColorPicker.addEventListener('input', function() {
        const color = this.value;
        textColorInput.value = color;
        updateColor('text', color);
        updatePreview();
    });

    textColorInput.addEventListener('input', function() {
        let color = this.value;
        
        // # 문자가 없으면 추가
        if (color.charAt(0) !== '#') {
            color = '#' + color;
        }
        
        // 유효한 색상 코드 확인
        if (/^#([0-9A-F]{3}){1,2}$/i.test(color)) {
            textColorPicker.value = color;
            updateColor('text', color);
            updatePreview();
        }
    });

    // 배경 색상 변경 이벤트
    bgColorPicker.addEventListener('input', function() {
        const color = this.value;
        bgColorInput.value = color;
        updateColor('bg', color);
        updatePreview();
    });

    bgColorInput.addEventListener('input', function() {
        let color = this.value;
        
        // # 문자가 없으면 추가
        if (color.charAt(0) !== '#') {
            color = '#' + color;
        }
        
        // 유효한 색상 코드 확인
        if (/^#([0-9A-F]{3}){1,2}$/i.test(color)) {
            bgColorPicker.value = color;
            updateColor('bg', color);
            updatePreview();
        }
    });

    // 환율 업데이트 버튼
    const updateRateNow = document.getElementById('updateRateNow');
    updateRateNow.addEventListener('click', function() {
        updateExchangeRate();
    });
    
    // 설정 초기화 버튼
    const resetSettingsBtn = document.getElementById('resetSettings');
    resetSettingsBtn.addEventListener('click', function() {
        // 모달 열기
        const modal = document.getElementById('resetConfirmModal');
        modal.classList.remove('hidden');
        // 애니메이션을 위한 타이밍
        setTimeout(() => {
            modal.querySelector('.relative.w-full').classList.add('translate-y-0');
            modal.querySelector('.relative.w-full').classList.remove('translate-y-4', 'opacity-0');
        }, 10);
    });
    
    // 모달 확인 버튼
    const resetConfirmYes = document.getElementById('resetConfirmYes');
    resetConfirmYes.addEventListener('click', function() {
        resetSettings();
        
        // 모달 닫기
        closeModal();
    });
    
    // 모달 취소 버튼
    const resetConfirmNo = document.getElementById('resetConfirmNo');
    resetConfirmNo.addEventListener('click', function() {
        // 모달 닫기
        closeModal();
    });
    
    // 모달 X 버튼
    const closeModalBtn = document.getElementById('closeModal');
    closeModalBtn.addEventListener('click', function() {
        // 모달 닫기
        closeModal();
    });
    
    // 모달 외부 클릭 시 닫기
    const resetConfirmModal = document.getElementById('resetConfirmModal');
    resetConfirmModal.addEventListener('click', function(e) {
        if (e.target === resetConfirmModal) {
            closeModal();
        }
    });
    
    // ESC 키 누를 때 모달 닫기
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !resetConfirmModal.classList.contains('hidden')) {
            closeModal();
        }
    });
    
    // 모달 닫기 함수
    function closeModal() {
        const modal = document.getElementById('resetConfirmModal');
        const modalContent = modal.querySelector('.relative.w-full');
        
        // 애니메이션 추가
        modalContent.classList.add('translate-y-4', 'opacity-0');
        modalContent.classList.remove('translate-y-0');
        
        // 애니메이션 후 모달 숨기기
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 200);
    }
    
    // 색상 변경 함수
    function updateColor(type, color) {
        if (type === 'text') {
            saveSettings({ textColor: color });
        } else {
            saveSettings({ bgColor: color });
        }
        
        // content script에 메시지 전송
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'updateColors',
                textColor: type === 'text' ? color : null,
                bgColor: type === 'bg' ? color : null
            });
        });
    }
    
    // 미리보기 업데이트 함수
    function updatePreview() {
        // 색상 가져오기
        const textColor = textColorPicker.value;
        const bgColor = bgColorPicker.value;
        const fontSizeValue = fontSize.value;
        
        // 미리보기 요소 스타일 업데이트
        if (previewBox) {
            previewBox.style.backgroundColor = bgColor;
            previewBox.style.color = textColor;
            
            // 글자 크기 설정
            if (fontSizeValue === 'small') {
                previewBox.style.fontSize = '12px';
                previewBox.style.padding = '6px 10px';
            } else if (fontSizeValue === 'medium') {
                previewBox.style.fontSize = '14px';
                previewBox.style.padding = '8px 12px';
            } else if (fontSizeValue === 'large') {
                previewBox.style.fontSize = '16px';
                previewBox.style.padding = '10px 14px';
            }
        }
    }
});

// 설정 저장
function saveSettings(settings) {
    chrome.storage.sync.get('settings', function(data) {
        const currentSettings = data.settings || getDefaultSettings();
        const newSettings = { ...currentSettings, ...settings };
        
        chrome.storage.sync.set({ settings: newSettings }, function() {
            console.log('설정이 저장되었습니다:', newSettings);
        });
    });
}

// 설정 로드
function loadSettings() {
    chrome.storage.sync.get(['settings', 'exchangeRate', 'lastUpdate'], function(data) {
        const settings = data.settings || getDefaultSettings();
        const exchangeRate = data.exchangeRate || 1350; // 기본값 1 USD = 1,350 KRW
        const lastUpdate = data.lastUpdate || new Date().toLocaleString();
        
        // UI 업데이트
        // document.getElementById('extensionToggle').checked = settings.extensionEnabled;
        document.getElementById('rateUpdateInterval').value = settings.updateInterval;
        document.getElementById('fontSize').value = settings.fontSize;
        
        // 환율 정보 업데이트
        document.getElementById('currentRate').innerHTML = `<span class="red-rate">1</span><span class="text-xs text-gray-500 ml-1 mr-2">USD</span><span class="text-gray-500">=</span><span class="text-xl ml-2 red-rate">${Math.floor(exchangeRate).toLocaleString()}</span><span class="text-xs text-gray-500 ml-1">KRW</span>`;
        document.getElementById('lastUpdate').textContent = lastUpdate;
        
        // 색상 피커 업데이트
        const textColorPicker = document.getElementById('textColorPicker');
        const textColorInput = document.getElementById('textColorInput');
        
        const bgColorPicker = document.getElementById('bgColorPicker');
        const bgColorInput = document.getElementById('bgColorInput');
        
        textColorPicker.value = settings.textColor;
        textColorInput.value = settings.textColor;
        
        bgColorPicker.value = settings.bgColor;
        bgColorInput.value = settings.bgColor;
        
        // 미리보기 업데이트
        const previewBox = document.querySelector('.preview-box');
        if (previewBox) {
            previewBox.style.backgroundColor = settings.bgColor;
            previewBox.style.color = settings.textColor;
            
            // 글자 크기 설정
            if (settings.fontSize === 'small') {
                previewBox.style.fontSize = '12px';
                previewBox.style.padding = '6px 10px';
            } else if (settings.fontSize === 'medium') {
                previewBox.style.fontSize = '14px';
                previewBox.style.padding = '8px 12px';
            } else if (settings.fontSize === 'large') {
                previewBox.style.fontSize = '16px';
                previewBox.style.padding = '10px 14px';
            }
        }
        
        // 자동 환율 업데이트 타이머 설정
        setupAutoRateUpdate(settings.updateInterval);
    });
}

// 기본 설정
function getDefaultSettings() {
    return {
        extensionEnabled: true,
        updateInterval: '0',  // 기본값을 자동 업데이트X로 변경
        fontSize: 'medium',
        textColor: '#ffffff',
        bgColor: '#ff4747'
    };
}

// 설정 초기화
function resetSettings() {
    const defaultSettings = getDefaultSettings();
    
    // 저장소에 기본 설정 저장
    chrome.storage.sync.set({ settings: defaultSettings }, function() {
        console.log('설정이 초기화되었습니다.');
        
        // UI 업데이트
        // document.getElementById('extensionToggle').checked = defaultSettings.extensionEnabled;
        document.getElementById('rateUpdateInterval').value = defaultSettings.updateInterval;
        document.getElementById('fontSize').value = defaultSettings.fontSize;
        
        // 색상 피커 업데이트
        const textColorPicker = document.getElementById('textColorPicker');
        const textColorInput = document.getElementById('textColorInput');
        
        const bgColorPicker = document.getElementById('bgColorPicker');
        const bgColorInput = document.getElementById('bgColorInput');
        
        textColorPicker.value = defaultSettings.textColor;
        textColorInput.value = defaultSettings.textColor;
        
        bgColorPicker.value = defaultSettings.bgColor;
        bgColorInput.value = defaultSettings.bgColor;
        
        // 미리보기 업데이트
        const previewBox = document.querySelector('.preview-box');
        if (previewBox) {
            previewBox.style.backgroundColor = defaultSettings.bgColor;
            previewBox.style.color = defaultSettings.textColor;
            
            // 글자 크기 설정
            if (defaultSettings.fontSize === 'small') {
                previewBox.style.fontSize = '12px';
                previewBox.style.padding = '6px 10px';
            } else if (defaultSettings.fontSize === 'medium') {
                previewBox.style.fontSize = '14px';
                previewBox.style.padding = '8px 12px';
            } else if (defaultSettings.fontSize === 'large') {
                previewBox.style.fontSize = '16px';
                previewBox.style.padding = '10px 14px';
            }
        }
        
        // 타이머 업데이트
        setupAutoRateUpdate(defaultSettings.updateInterval);
        
        // content script에 변경 알림
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'resetSettings',
                settings: defaultSettings
            });
        });
    });
}

// 현재 탭이 AliExpress 도메인인지 확인하는 함수
function checkCurrentDomain() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs && tabs.length > 0) {
            console.log('현재 탭 URL:', tabs[0].url);
            
            if (tabs[0].url) {
                try {
                    const url = new URL(tabs[0].url);
                    const isAliExpressDomain = url.hostname.includes('aliexpress');
                    
                    if (!isAliExpressDomain) {
                        // AliExpress 도메인이 아닌 경우 UI 비활성화
                        disableUI();
                        showDomainWarning();
                    }
                } catch (error) {
                    // URL 생성 중 오류 발생 - 유효하지 않은 URL이므로 AliExpress가 아님
                    console.error('URL 파싱 오류:', error);
                    disableUI();
                    showDomainWarning();
                }
            } else {
                // URL이 없는 경우
                disableUI();
                showDomainWarning();
            }
        } else {
            // 탭 정보를 가져올 수 없는 경우
            disableUI();
            showDomainWarning();
        }
    });
}

// UI 비활성화 함수
function disableUI() {
    // 모든 인터랙티브 요소 비활성화
    const allInputs = document.querySelectorAll('input, select, button');
    allInputs.forEach(element => {
        element.disabled = true;
    });
    
    // 전체 UI에 비활성화 스타일 적용
    document.body.classList.add('disabled-ui');
    
    // 색상 피커 비활성화
    const colorPickers = document.querySelectorAll('input[type="color"]');
    colorPickers.forEach(picker => {
        picker.style.pointerEvents = 'none';
    });
}

// 도메인 경고 표시 함수
function showDomainWarning() {
    // 경고 메시지 요소 생성
    const warningElement = document.createElement('div');
    warningElement.className = 'domain-warning';
    warningElement.innerHTML = `
        <div class="warning-icon"><i class="fas fa-exclamation-triangle"></i></div>
        <div class="warning-message">
            <p>이 확장 프로그램은 AliExpress 웹사이트에서만 작동합니다.</p>
            <p>AliExpress.com에서 이용해 주세요.</p>
        </div>
    `;
    
    // 페이지 상단에 경고 메시지 추가
    const container = document.querySelector('.container') || document.body;
    container.prepend(warningElement);
    
    // 스타일 추가
    const style = document.createElement('style');
    style.textContent = `
        .disabled-ui {
            opacity: 0.7;
            pointer-events: none;
        }
        .domain-warning {
            background-color: #fff3cd;
            color: #856404;
            border: 1px solid #ffeeba;
            border-radius: 4px;
            padding: 15px;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            pointer-events: auto;
            opacity: 1;
        }
        .warning-icon {
            font-size: 24px;
            margin-right: 15px;
            color: #e0a800;
        }
        .warning-message h3 {
            margin: 0 0 8px 0;
            font-size: 16px;
        }
        .warning-message p {
            margin: 0;
            font-size: 14px;
        }
    `;
    document.head.appendChild(style);
}

// 환율 업데이트
function updateExchangeRate() {
    const button = document.getElementById('updateRateNow');
    button.disabled = true;
    
    // 아이콘 넣기 (로딩 표시)
    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> 업데이트 중...';

    // 환율 API 요청
    fetch('https://api.xenia.kr/api/v1/exchange-rate/', {
        method: 'GET',
        headers: {
            'accept': 'application/json'
        }
    })
        .then(response => response.json())
        .then(data => {
            const rate = data.conversion_rates.KRW;
            const now = new Date().toLocaleString();
            
            // 환율 정보 저장
            chrome.storage.sync.set({
                exchangeRate: rate,
                lastUpdate: now
            }, function() {
                // UI 업데이트
                document.getElementById('currentRate').innerHTML = `<span class="red-rate">1</span><span class="text-xs text-gray-500 ml-1 mr-2">USD</span><span class="text-gray-500">=</span><span class="text-xl ml-2 red-rate">${Math.floor(rate).toLocaleString()}</span><span class="text-xs text-gray-500 ml-1">KRW</span>`;
                document.getElementById('lastUpdate').textContent = now;
                
                // 버튼 상태 복원
                button.disabled = false;
                button.innerHTML = '<i class="fas fa-sync-alt mr-2"></i> 지금 환율 업데이트';
                
                // Content script에 환율 업데이트 알림
                try {
                    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                        if (tabs && tabs.length > 0 && tabs[0].id) {                            
                            chrome.tabs.sendMessage(tabs[0].id, {
                                action: 'updateExchangeRate',
                                rate: rate
                            }, function(response) {
                                // 응답이 없어도 오류로 처리하지 않음
                                if (chrome.runtime.lastError) {
                                    console.log('메시지 전송 실패, 오류 무시: ', chrome.runtime.lastError);
                                } else {
                                    console.log('환율 업데이트 메시지 전송 성공');
                                }
                            });
                        }
                    });
                } catch (err) {
                    console.log('환율 업데이트 메시지 전송 오류 무시: ', err);
                }
            });
        })
        .catch(error => {
            console.error('환율 업데이트 실패:', error);
            
            // 오류 표시
            button.innerHTML = '<i class="fas fa-exclamation-circle mr-2"></i> 업데이트 실패';
            
            // 3초 후 버튼 상태 복원
            setTimeout(() => {
                button.disabled = false;
                button.innerHTML = '<i class="fas fa-sync-alt mr-2"></i> 지금 환율 업데이트';
            }, 3000);
        });
}

// 자동 환율 업데이트 타이머 설정
function setupAutoRateUpdate(interval) {
    // 현재 타이머가 있는 경우 제거
    if (window.autoRateUpdateTimer) {
        clearInterval(window.autoRateUpdateTimer);
        window.autoRateUpdateTimer = null;
    }

    // 자동 업데이트 X 옵션인 경우 타이머를 설정하지 않음
    if (interval === '0') {
        console.log('자동 환율 업데이트가 비활성화되었습니다.');
        return;
    }

    // 새로운 타이머 설정
    window.autoRateUpdateTimer = setInterval(function() {
        updateExchangeRate();
    }, interval * 60000); // 분 단위로 변환
    
    console.log(`환율 자동 업데이트 타이머가 ${interval}분으로 설정되었습니다.`);
} 