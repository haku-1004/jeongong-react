import React, { useEffect, useState } from 'react';
import Header from './Header';  // Header.js 파일 임포트

function App() {
  const [searchQuery, setSearchQuery] = useState('');  // 검색어 상태 관리

  // 네이버 지도 API 초기화
  useEffect(() => {
    const map = new window.naver.maps.Map('map', {
      center: new window.naver.maps.LatLng(37.5665, 126.9780), // 서울의 위도, 경도
      zoom: 19,
    });
  }, []);

  // 검색 버튼 클릭 시 호출되는 함수
  const handleSearch = () => {
    console.log('검색어:', searchQuery);  // 검색어 출력 (나중에 실제 검색 로직으로 변경 가능)
  };

  // 오피스텔 리스트 데이터
  const officetels = [
    { id: 1, name: "전공 스퀘어", price: "1억대", location: "서울 강남구" },
    { id: 2, name: "SK VIEW", price: "2억대", location: "인천 영종도" },
    { id: 3, name: "현대 오피스텔", price: "3억대", location: "부산 해운대" },
  ];

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      {/* 상단바 컴포넌트 추가 */}
      <Header />

      {/* 지도 영역 */}
      <div 
        id="map" 
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          top: 0,
          left: 0,
        }} 
      />

      

      {/* 오피스텔 리스트 배치 */}
      <div style={{
        position: 'absolute',
        bottom: '10px', // 화면 하단에 배치
        left: '50%',
        transform: 'translateX(-50%)',
        width: '90%',  // 화면의 90% 너비로 설정
        zIndex: 20,
      }}>
        <button 
          style={{
            position: 'absolute',
            bottom: '50px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 20px',
            backgroundColor: '#007BFF',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            cursor: 'pointer',
            zIndex: 20,
          }}
        >
          내 주변 매물 보기
        </button>
      </div>
    </div>
  );
}

export default App;
