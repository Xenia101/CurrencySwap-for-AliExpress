// 다국어 지원을 위한 번역 데이터
const translations = {
    'ko': {
        'title': 'AliExpress 환율 변환기',
        'languageSettings': '언어 설정',
        'exchangeRateInfo': '환율 정보',
        'currentRate': '현재 적용 환율',
        'updateInterval': '업데이트 주기:',
        'noAutoUpdate': '자동 업데이트X',
        '6hours': '6시간',
        '12hours': '12시간',
        'updateRateNow': '지금 환율 업데이트',
        'updating': '업데이트 중...',
        'lastUpdate': '마지막 업데이트:',
        'displaySettings': '디스플레이 설정',
        'fontSize': '글자 크기:',
        'small': '작음',
        'medium': '보통',
        'large': '큼',
        'textColor': '글자 색상:',
        'bgColor': '배경 색상:',
        'preview': '미리보기',
        'previewDesc': '실제 사이트에서 표시되는 모습입니다',
        'resetSettings': '설정 초기화',
        'closeModal': '모달 닫기',
        'resetConfirmMessage': '모든 설정을 기본값으로 초기화하시겠습니까?',
        'resetConfirmYes': '예, 초기화합니다',
        'resetConfirmNo': '아니오',
        'userGuide': '사용자 안내',
        'userGuideText': '본 확장 프로그램은 사용자 편의성을 위한 상품 가격의 대략적인 환율 참고용입니다. 실제 결제 시에는 알리익스프레스에서 제공하는 공식 가격을 확인해주세요.',
        'footerTitle': '환율 변환기'
    },
    'en': {
        'title': 'AliExpress Currency Converter',
        'languageSettings': 'Language Settings',
        'exchangeRateInfo': 'Exchange Rate Info',
        'currentRate': 'Current Applied Rate',
        'updateInterval': 'Update Interval:',
        'noAutoUpdate': 'No Auto Update',
        '6hours': '6 Hours',
        '12hours': '12 Hours',
        'updateRateNow': 'Update Rate Now',
        'updating': 'Updating...',
        'lastUpdate': 'Last Update:',
        'displaySettings': 'Display Settings',
        'fontSize': 'Font Size:',
        'small': 'Small',
        'medium': 'Medium',
        'large': 'Large',
        'textColor': 'Text Color:',
        'bgColor': 'Background Color:',
        'preview': 'Preview',
        'previewDesc': 'This is how it will appear on the site',
        'resetSettings': 'Reset Settings',
        'closeModal': 'Close Modal',
        'resetConfirmMessage': 'Do you want to reset all settings to default?',
        'resetConfirmYes': 'Yes, Reset',
        'resetConfirmNo': 'No',
        'userGuide': 'User Guide',
        'userGuideText': 'This extension is for reference purposes only, providing approximate exchange rates for product prices. Please check the official prices provided by AliExpress when making actual payments.',
        'footerTitle': 'Currency Converter'
    }
};

// 현재 언어 설정 가져오기
function getCurrentLanguage() {
    return localStorage.getItem('language') || 'ko'; // 기본값은 한국어
}

// 언어 설정 저장하기
function setLanguage(lang) {
    localStorage.setItem('language', lang);
    applyTranslations();
}

// 언어 적용하기
function applyTranslations() {
    const currentLang = getCurrentLanguage();
    const elements = document.querySelectorAll('[data-i18n]');
    
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[currentLang] && translations[currentLang][key]) {
            element.textContent = translations[currentLang][key];
        }
    });
    
    // HTML lang 속성 업데이트
    document.documentElement.lang = currentLang;
}

// 언어 선택기 이벤트 리스너 설정
document.addEventListener('DOMContentLoaded', () => {
    const languageSelector = document.getElementById('languageSelector');
    
    // 현재 언어로 선택기 설정
    languageSelector.value = getCurrentLanguage();
    
    // 언어 변경 이벤트 리스너
    languageSelector.addEventListener('change', (e) => {
        setLanguage(e.target.value);
    });
    
    // 초기 번역 적용
    applyTranslations();
}); 