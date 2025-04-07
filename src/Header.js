import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu'; // 메뉴 아이콘
import NotificationsIcon from '@mui/icons-material/Notifications'; // 알림 아이콘
import AccountCircleIcon from '@mui/icons-material/AccountCircle'; // 계정 아이콘

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
        top: '80px',  // 상단바 아래로 배치 (상단바 높이를 고려하여 80px 설정)
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

      {/* 상단바 컴포넌트 */}
      <AppBar position="sticky">
        <Toolbar>
          {/* 메뉴 아이콘 */}
          <IconButton edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>

          {/* 앱 이름 */}
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            전공
          </Typography>

          {/* 알림 아이콘 */}
          <IconButton color="inherit">
            <NotificationsIcon />
          </IconButton>

          {/* 계정 아이콘 */}
          <IconButton color="inherit">
            <AccountCircleIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
    </div>
  );
}

export default Header;
