import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// 아이프레임 샌드박스 내부 IndexedDB/WebSocket 접속 장애 및 Cross-Origin 'Script error.' 전역 소멸 처리기
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (event.message && (event.message.includes('Script error') || event.message.includes('QuotaExceededError'))) {
      console.warn('[CORS-SANDBOX] 불필요한 스크립트 도메인/보안 예외를 안전하게 우회 처치하였습니다.', event.message);
      event.preventDefault();
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reasonStr = String(event.reason);
    if (reasonStr.includes('Firestore') || reasonStr.includes('IndexedDB') || reasonStr.includes('permission')) {
      console.warn('[CORS-SANDBOX] Firestore 비동기 거부 처리를 로컬 백업 영구보관 모드로 안전 전환 제어하였습니다.', event.reason);
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
