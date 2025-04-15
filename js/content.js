// 가격을 나타내는 요소를 찾는 함수
function findPriceElements() {
  // 모든 가격 관련 요소를 찾습니다
  let priceElements = [];
  
  // 1. 텍스트 패턴으로 가격 찾기 (기본 방식)
  const priceRegex = /(\$|₩|US\s*\$)\s*\d+([.,]\d{1,2})?/; // $10.99 또는 ₩10,000 같은 패턴
  
  // 문서 내 모든 텍스트 노드를 검사하여 가격 패턴을 찾습니다
  const textNodes = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  let currentNode;
  while (currentNode = textNodes.nextNode()) {
    if (priceRegex.test(currentNode.nodeValue)) {
      priceElements.push(currentNode.parentNode);
    }
  }
  
  // 2. HTML 구조 패턴 인식 - 예제에서 제공된 형식
  // 여러 개의 span 요소들을 포함하는 div 구조 찾기
  const divElements = document.querySelectorAll('div');
  
  divElements.forEach(div => {
    // div 안에 여러 개의 span 요소가 있는지 확인
    const spans = div.querySelectorAll('span');
    
    if (spans.length >= 2) {
      // 예시 HTML 구조와 비슷한 구조인지 확인
      let hasPrice = false;
      let hasCurrency = false;
      
      spans.forEach(span => {
        const text = span.textContent.trim();
        // 통화 기호 확인
        if (text.includes('$') || text.includes('₩') || text.includes('US')) {
          hasCurrency = true;
        }
        // 숫자 확인
        if (/\d+/.test(text)) {
          hasPrice = true;
        }
      });
      
      // 특정 구조: div 안에 여러 span이 있고, 통화 기호와 숫자가 모두 포함된 경우
      if (hasPrice && hasCurrency && !priceElements.includes(div)) {
        priceElements.push(div);
      }
    }
  });
  
  // 3. 알리익스프레스 예제에서 제공된 HTML 구조 특별 처리
  // 예시: <div><span>US $</span><span>24</span><span>.</span><span>89</span></div>
  // 또는: <div><span>₩</span><span>143</span><span>,</span><span>517</span></div>
  
  divElements.forEach(div => {
    const spans = div.querySelectorAll('span');
    
    // 네 개 이상의 span 요소가 있는 경우 (숫자, 소수점/쉼표, 통화 기호가 각각 분리됨)
    if (spans.length >= 3) {
      let dollarPattern = false;
      let wonPattern = false;
      
      // US $ 패턴 확인
      for (let i = 0; i < spans.length; i++) {
        if (spans[i].textContent.includes('US $') || spans[i].textContent.includes('$')) {
          // 다음 span들이 숫자인지 확인
          if (i + 1 < spans.length && /^\d+$/.test(spans[i + 1].textContent.trim())) {
            dollarPattern = true;
            break;
          }
        }
      }
      
      // ₩ 패턴 확인
      for (let i = 0; i < spans.length; i++) {
        if (spans[i].textContent.includes('₩')) {
          // 다음 span들이 숫자인지 확인
          if (i + 1 < spans.length && /^\d+$/.test(spans[i + 1].textContent.trim())) {
            wonPattern = true;
            break;
          }
        }
      }
      
      if ((dollarPattern || wonPattern) && !priceElements.includes(div)) {
        priceElements.push(div);
      }
    }
  });
  
  return Array.from(new Set(priceElements)); // 중복 제거
}

// 초기 설정 및 변수
let settings = {
    extensionEnabled: true,
    fontSize: 'medium',
    textColor: '#ffffff',
    bgColor: '#ff4747'
};
let exchangeRate = 1350; // 기본 환율: 1 USD = 1,350 KRW

// 팝업 생성 함수
function createPricePopup(element) {
  // 이미 팝업이 설정되어 있는지 확인
  if (element.dataset.pricePopupAdded) return;
  
  element.dataset.pricePopupAdded = "true";
  
  // 마우스 오버 이벤트 추가
  element.addEventListener('mouseenter', function(e) {
    // 기존에 생성된 팝업이 있으면 제거
    const existingPopup = document.querySelector('.price-popup');
    if (existingPopup) {
      existingPopup.remove();
    }
    
    // 팝업 요소 생성
    const popup = document.createElement('div');
    popup.className = 'price-popup';
    
    // 현재 설정에 따른 글자 크기 클래스 추가
    if (settings.fontSize === 'small') {
      popup.classList.add('small');
    } else if (settings.fontSize === 'large') {
      popup.classList.add('large');
    } else {
      popup.classList.add('medium');
    }
    
    // 가격 텍스트 추출 및 구성
    let priceValue = extractPriceFromElement(element);
    
    // 빈 공간을 모두 제거했을 때 내용이 없으면 팝업을 보여주지 않음
    if (!priceValue || priceValue.replace(/\s+/g, '') === '') {
      return;
    }
    
    popup.textContent = priceValue;
    
    // 현재 설정된 색상 적용
    popup.style.backgroundColor = settings.bgColor;
    popup.style.color = settings.textColor;
    
    // 설정에 따른 글자 크기 적용
    if (settings.fontSize === 'small') {
      popup.style.fontSize = '12px';
    } else if (settings.fontSize === 'large') {
      popup.style.fontSize = '16px';
    } else {
      popup.style.fontSize = '14px';
    }
    
    // 팝업을 적절한 위치에 배치
    const rect = element.getBoundingClientRect();
    popup.style.top = `${rect.top + window.scrollY - 30}px`; // 요소 위에 배치
    popup.style.left = `${rect.left + window.scrollX}px`;
    
    // 팝업을 문서에 추가
    document.body.appendChild(popup);
  });
  
  // 마우스 나가기 이벤트 추가
  element.addEventListener('mouseleave', function() {
    const popup = document.querySelector('.price-popup');
    if (popup) {
      popup.remove();
    }
  });
}

// 요소에서 가격 추출 함수
function extractPriceFromElement(element) {
  // 기본 텍스트 추출
  const elementText = element.textContent.trim();
  
  // 1. 달러 패턴 매칭 시도 (US $XX.XX)
  const dollarMatch = elementText.match(/US\s*\$\s*(\d+([.,]\d{1,2})?)/);
  if (dollarMatch) {
    // 달러를 원화로 변환
    const price = parseFloat(dollarMatch[1].replace(/,/g, ''));
    const koreanPrice = Math.round(price * exchangeRate);
    // return `${dollarMatch[0]} ⟹ ₩${koreanPrice.toLocaleString()}`;
    return `₩${koreanPrice.toLocaleString()}`;
  }
  
  // 2. 단순 달러 패턴 매칭 ($XX.XX)
  const simpleDollarMatch = elementText.match(/\$\s*(\d+([.,]\d{1,2})?)/);
  if (simpleDollarMatch && !dollarMatch) {
    // 달러를 원화로 변환
    const price = parseFloat(simpleDollarMatch[1].replace(/,/g, ''));
    const koreanPrice = Math.round(price * exchangeRate);
    // return `${simpleDollarMatch[0]} ⟹ ₩${koreanPrice.toLocaleString()}`;
    return `₩${koreanPrice.toLocaleString()}`;
  }
  
  // 3. 원화 패턴 매칭 (₩XX,XXX)
  const wonMatch = elementText.match(/₩\s*(\d+([.,]\d{1,3})?)/);
  if (wonMatch) {
    // 원화를 달러로 변환
    const price = parseFloat(wonMatch[1].replace(/,/g, ''));
    const dollarPrice = (price / exchangeRate).toFixed(2);
    // return `${wonMatch[0]} ⟹ US $${dollarPrice}`;
    return `$${dollarPrice}`;
  }
  
  // 4. 복합 구조 처리 (예시와 같은 구조)
  // span 요소들의 내용 조합
  const spans = element.querySelectorAll('span');
  if (spans.length >= 3) {
    let combinedPrice = '';
    let isDollar = false;
    let isWon = false;
    
    spans.forEach(span => {
      const text = span.textContent.trim();
      combinedPrice += text;
      
      // 통화 기호 확인
      if (text.includes('$') || text.includes('US')) {
        isDollar = true;
      }
      if (text.includes('₩')) {
        isWon = true;
      }
    });
    
    // 달러 금액 추출 시도
    const dollarPriceMatch = combinedPrice.match(/US\s*\$\s*(\d+([.,]\d{1,2})?)/);
    if (dollarPriceMatch && dollarPriceMatch[1]) {
      const dollarAmount = parseFloat(dollarPriceMatch[1].replace(/,/g, ''));
      const koreanPrice = Math.round(dollarAmount * exchangeRate);
      // return `${dollarPriceMatch[0]} ⟹ ₩${koreanPrice.toLocaleString()}`;
      return `₩${koreanPrice.toLocaleString()}`
    }
    
    // 단순 달러 금액 추출 시도
    const simpleDollarPriceMatch = combinedPrice.match(/\$\s*(\d+([.,]\d{1,2})?)/);
    if (simpleDollarPriceMatch && simpleDollarPriceMatch[1] && !dollarPriceMatch) {
      const dollarAmount = parseFloat(simpleDollarPriceMatch[1].replace(/,/g, ''));
      const koreanPrice = Math.round(dollarAmount * exchangeRate);
      // return `${simpleDollarPriceMatch[0]} ⟹ ₩${koreanPrice.toLocaleString()}`;
      return `₩${koreanPrice.toLocaleString()}`
    }
    
    // 원화 금액 추출 시도
    const wonPriceMatch = combinedPrice.match(/₩\s*(\d+([.,]\d{1,3})?)/);
    if (wonPriceMatch && wonPriceMatch[1]) {
      const wonAmount = parseFloat(wonPriceMatch[1].replace(/,/g, ''));
      const dollarPrice = (wonAmount / exchangeRate).toFixed(2);
      // return `${wonPriceMatch[0]} ⟹ US $${dollarPrice}`;
      return `$${dollarPrice}`;
    }
    
    // combinedPrice가 50자가 넘으면 return ''
    if (combinedPrice.length > 50) {
      return '';
    }

    if ((isDollar || isWon) && /\d+/.test(combinedPrice)) {
      return `${combinedPrice}`;
    }
  }
  
  return '';
}

// 초기화 함수
function initialize() {
    // 저장된 설정 불러오기
    chrome.storage.sync.get(['settings', 'exchangeRate'], function(data) {
        if (data.settings) {
            settings = data.settings;
        }
        if (data.exchangeRate) {
            exchangeRate = data.exchangeRate;
        }
        
        // 확장 프로그램이 활성화되어 있으면 팝업 초기화
        if (settings.extensionEnabled) {
            initializePricePopups();
            
            // 페이지 변경 감지 (SPA 대응)
            observeDOMChanges();
        }
    });
}

// DOM 변경 감지 (Single Page Application 대응)
function observeDOMChanges() {
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length > 0 && settings.extensionEnabled) {
                // 새로운 노드가 추가되면 팝업 초기화 실행
                initializePricePopups();
            }
        });
    });
    
    // 전체 문서 관찰
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// 팝업 스타일 업데이트
function updatePopupStyles() {
    const popup = document.querySelector('.price-popup');
    if (popup) {
        popup.style.backgroundColor = settings.bgColor;
        popup.style.color = settings.textColor;
        
        // 글자 크기 설정 업데이트
        if (settings.fontSize === 'small') {
            popup.style.fontSize = '12px';
            popup.classList.add('small');
            popup.classList.remove('medium', 'large');
        } else if (settings.fontSize === 'large') {
            popup.style.fontSize = '16px';
            popup.classList.add('large');
            popup.classList.remove('medium', 'small');
        } else {
            popup.style.fontSize = '14px';
            popup.classList.add('medium');
            popup.classList.remove('small', 'large');
        }
    }
}

// 확장 프로그램 메시지 수신 처리
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {    
    switch (message.action) {
        case 'toggleExtension':
            settings.extensionEnabled = message.enabled;
            
            if (message.enabled) {
                initializePricePopups();
            } else {
                // 팝업 이벤트 제거
                removeAllPricePopups();
            }
            break;
            
        case 'updateFontSize':
            settings.fontSize = message.size;
            updatePopupStyles();
            break;
            
        case 'updateColors':
            if (message.textColor) {
                settings.textColor = message.textColor;
            }
            if (message.bgColor) {
                settings.bgColor = message.bgColor;
            }
            updatePopupStyles();
            break;
            
        case 'updateExchangeRate':
            exchangeRate = message.rate;
            break;
            
        case 'resetSettings':
            // 설정 초기화 처리
            settings = message.settings;
            updatePopupStyles();
            break;
    }
});

// 모든 가격 팝업 이벤트 제거
function removeAllPricePopups() {
    // 팝업 요소 제거
    const popup = document.querySelector('.price-popup');
    if (popup) {
        popup.remove();
    }
    
    // 팝업 이벤트가 설정된 모든 요소 찾기
    const priceElements = document.querySelectorAll('[data-price-popup-added="true"]');
    
    priceElements.forEach(element => {
        // 이벤트를 제거하기 위해 요소를 복제하고 원본을 교체
        const clone = element.cloneNode(true);
        clone.removeAttribute('data-price-popup-added');
        element.parentNode.replaceChild(clone, element);
    });
}

// 페이지 로드 시 가격 요소 찾기 및 팝업 설정
function initializePricePopups() {
    const priceElements = findPriceElements();
    priceElements.forEach(element => {
        createPricePopup(element);
    });
}

// 초기화 실행
initialize(); 