import React, { useState } from 'react';
// AppBar 관련 import 제거
// import { AppBar, Toolbar, Typography, IconButton } from '@mui/material';
// import MenuIcon from '@mui/icons-material/Menu';
// import NotificationsIcon from '@mui/icons-material/Notifications';
// import AccountCircleIcon from '@mui/icons-material/AccountCircle';

function Header() {
  const [searchQuery, setSearchQuery] = useState('');  // 검색어 상태 관리

  // 검색 버튼 클릭 시 호출되는 함수
  const handleSearch = () => {
    console.log('검색어:', searchQuery);  // 검색어 출력 (나중에 실제 검색 로직으로 변경 가능)
  };

  return (
    <div>
      {/* 상단 검색창 + 버튼 */}
      <div style={{
        position: 'absolute',
        top: '20px',  // 상단바가 없으므로 위치 조정 (80px에서 20px로 변경)
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',  // 검색창과 버튼을 가로로 배치
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: '5px 10px',
        borderRadius: '25px',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
        zIndex: 10
      }}>
        {/* 검색창 (input) */}
        <input
          type="text"
          placeholder="오피스텔 검색"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            border: 'none',
            outline: 'none',
            padding: '10px 20px',
            borderRadius: '20px',
            width: '250px',  // 너비 조정
            fontSize: '16px',  // 폰트 크기
          }}
        />

        {/* 검색 버튼 */}
        <button
          onClick={handleSearch}
          style={{
            padding: '8px 15px',
            marginLeft: '10px',
            border: 'none',
            backgroundColor: '#007BFF',  // 파란색 배경
            color: 'white',  // 글자 색
            width: '65px',
            borderRadius: '20px',
            cursor: 'pointer',  // 마우스 포인터 모양
          }}
        >
          검색
        </button>
      </div>

      {/* 상단바 컴포넌트 제거 */}
      {/* AppBar 부분을 완전히 제거 */}
    </div>
  );
}

export default Header;
