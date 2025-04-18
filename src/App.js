import React, { useEffect, useState, useRef } from 'react';
import { FiHome, FiSearch, FiMapPin, FiBarChart2, FiFilter, FiHeart, FiUser, FiChevronDown, FiX, FiCheck, FiArrowUp, FiArrowDown, FiInfo, FiDollarSign, FiTrendingUp } from 'react-icons/fi';
// 또는 다른 아이콘 세트에서 가져오기
import { BiLineChart, BiCoinStack } from 'react-icons/bi';



// 고급스러운 컬러 팔레트 설정
const COLORS = {
  primary: '#3B82F6', // 메인 컬러 (블루)
  secondary: '#4F46E5', // 강조 컬러 (인디고)
  background: '#F9FAFB', // 배경색
  cardBg: '#FFFFFF', // 카드 배경
  text: '#1F2937', // 기본 텍스트
  textLight: '#6B7280', // 보조 텍스트
  border: '#E5E7EB', // 경계선
  success: '#10B981', // 긍정적 변화
  danger: '#EF4444', // 부정적 변화
  shadow: 'rgba(0, 0, 0, 0.08)', // 그림자
};

// API 기본 URL 설정
const API_BASE_URL = 'http://wrt.p2.1209.kr:48081';

// 임시 데이터 (API가 실패할 경우 사용)
const FALLBACK_DATA = {
  "buildings": []
};

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('map');
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    priceRange: [0, 50000],
    sizeRange: [10, 200],
    yearRange: [2000, 2025],
    areaTypes: [],
    options: []
  });
  const [showBuildingInfo, setShowBuildingInfo] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  
  // 부동산 통계 데이터
  const [marketStats, setMarketStats] = useState({
    monthly: 2.3,
    yearly: 5.7,
    activeListings: 27
  });

  // 네이버 지도 API 초기화
  useEffect(() => {
    const initializeMap = () => {
      try {
        const map = new window.naver.maps.Map('map', {
          center: new window.naver.maps.LatLng(37.5665, 126.9780),
          zoom: 13,
          mapTypeControl: false,
          scaleControl: false,
          logoControl: false,
          mapDataControl: false,
          zoomControl: true,
          zoomControlOptions: {
            style: window.naver.maps.ZoomControlStyle.SMALL,
            position: window.naver.maps.Position.RIGHT_BOTTOM
          }
        });
        
        mapRef.current = map;

        // 지도 이동 완료 이벤트 설정
        window.naver.maps.Event.addListener(map, 'idle', () => {
          fetchBuildingsInView(map);
        });
        
        // 초기 데이터 로드
        fetchBuildingsInView(map);
      } catch (error) {
        console.error('지도 초기화 중 오류 발생:', error);
      }
    };
    
    // 네이버 지도 API가 로드되었는지 확인
    if (window.naver && window.naver.maps) {
      initializeMap();
    } else {
      const script = document.createElement('script');
      script.src = 'https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=YOUR_CLIENT_ID_HERE';
      script.async = true;
      script.onload = initializeMap;
      script.onerror = () => console.error('네이버 지도 API 스크립트 로드 실패');
      document.head.appendChild(script);
    }
    
    // 컴포넌트 언마운트 시 정리
    return () => clearMarkers();
  }, []);

  // 마커 정리 함수
  const clearMarkers = () => {
    if (markersRef.current.length > 0) {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    }
  };

  // 지도 영역 내 건물 정보 가져오기
  const fetchBuildingsInView = async (map) => {
    if (!map) return;
    
    try {
      setLoading(true);
      
      // 지도 경계 구하기
      const bounds = map.getBounds();
      const ne = bounds.getNE();
      const sw = bounds.getSW();
      
      // API 호출
      const response = await fetch(
        `/api/buildings?lat1=${sw.lat()}&lat2=${ne.lat()}&lng1=${sw.lng()}&lng2=${ne.lng()}`
      );
      
      if (!response.ok) {
        throw new Error(`서버 응답 오류 (${response.status})`);
      }
      
      const data = await response.json();
      
      if (data.status === 'success') {
        if (data.buildings && data.buildings.length > 0) {
          setBuildings(data.buildings);
          displayBuildingMarkers(data.buildings, map);
        } else {
          setBuildings(FALLBACK_DATA.buildings);
          displayBuildingMarkers(FALLBACK_DATA.buildings, map);
        }
      } else {
        setError('데이터를 불러오는데 실패했습니다');
        setBuildings(FALLBACK_DATA.buildings);
        displayBuildingMarkers(FALLBACK_DATA.buildings, map);
      }
    } catch (err) {
      setError('서버 연결에 문제가 있습니다');
      setBuildings(FALLBACK_DATA.buildings);
      displayBuildingMarkers(FALLBACK_DATA.buildings, map);
    } finally {
      setLoading(false);
    }
  };
  
  // 검색 기능
  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    // 검색어에 따라 다른 함수 호출
    if (searchQuery.includes('부천')) {
      handleBucheonSearch();
    } else if (searchQuery.includes('영종')) {
      handleYeongjongSearch(); 
    } else {
      performSearch(searchQuery);
    }
  };
  
  // 일반 검색 수행
  const performSearch = async (query) => {
    if (!mapRef.current) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // 검색 API 호출
      const response = await fetch(
        `/api/search?query=${encodeURIComponent(query)}`
      );
      
      if (!response.ok) {
        throw new Error(`검색 API 오류 (${response.status})`);
      }
      
      const data = await response.json();
      
      if (data.status === 'success' && data.buildings && data.buildings.length > 0) {
        setBuildings(data.buildings);
        
        // 마커 표시 및 지도 조정
        displayBuildingMarkers(data.buildings, mapRef.current);
        
        // 검색 결과가 여러 개라면 모든 마커가 보이도록 줌 조정
        if (data.buildings.length > 1) {
          const bounds = new window.naver.maps.LatLngBounds();
          data.buildings.forEach(building => {
            bounds.extend(new window.naver.maps.LatLng(
              parseFloat(building.Latitude),
              parseFloat(building.Longitude)
            ));
          });
          mapRef.current.fitBounds(bounds);
        } else {
          // 결과가 하나면 해당 위치로 중심 이동
          mapRef.current.setCenter(new window.naver.maps.LatLng(
            parseFloat(data.buildings[0].Latitude),
            parseFloat(data.buildings[0].Longitude)
          ));
          mapRef.current.setZoom(15);
        }
      } else {
        setBuildings(FALLBACK_DATA.buildings);
        displayBuildingMarkers(FALLBACK_DATA.buildings, mapRef.current);
        alert('검색 결과가 없습니다');
      }
    } catch (err) {
      setError('검색 중 오류가 발생했습니다');
      setBuildings(FALLBACK_DATA.buildings);
      displayBuildingMarkers(FALLBACK_DATA.buildings, mapRef.current);
    } finally {
      setLoading(false);
    }
  };
  
  // 부천 검색 핸들러
  const handleBucheonSearch = () => {
    performSearch('부천');
  };
  
  // 영종 검색 핸들러
  const handleYeongjongSearch = () => {
    performSearch('영종');
  };
  
  // 건물 마커 표시
  const displayBuildingMarkers = (buildingData, map) => {
    if (!map || !buildingData) return;
    
    // 기존 마커 제거
    clearMarkers();
    
    // 새 마커 배열
    const newMarkers = [];
    
    // 각 건물마다 마커 생성
    buildingData.forEach(building => {
      try {
        const lat = parseFloat(building.Latitude);
        const lng = parseFloat(building.Longitude);
        
        if (isNaN(lat) || isNaN(lng)) return;
        
        // 가격 정보 포맷팅 (없으면 임의 생성)
        const price = building.price || `${Math.floor(Math.random() * 20) + 3}억 ${Math.floor(Math.random() * 9) + 1}천`;
        
        // 건물 위치에 마커 생성 - 세련된 스타일 마커
        const marker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(lat, lng),
          map: map,
          title: building.BuildingName,
          icon: {
            content: `
              <div style="
                display: flex;
                align-items: center;
                position: relative;
                padding: 6px 10px;
                background-color: rgba(59, 130, 246, 0.9);
                color: white;
                border-radius: 6px;
                font-weight: 600;
                font-size: 13px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                min-width: 70px;
                text-align: center;
                backdrop-filter: blur(4px);
              ">
                <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 110px;">${price}</span>
                <div style="
                  position: absolute;
                  bottom: -6px;
                  left: 50%;
                  transform: translateX(-50%);
                  width: 0;
                  height: 0;
                  border-left: 6px solid transparent;
                  border-right: 6px solid transparent;
                  border-top: 6px solid rgba(59, 130, 246, 0.9);
                "></div>
              </div>
            `,
            anchor: new window.naver.maps.Point(45, 32)
          }
        });
        
        // 마커 클릭 이벤트
        window.naver.maps.Event.addListener(marker, 'click', () => {
          // 클릭한 건물로 지도 중심 이동
          map.setCenter(new window.naver.maps.LatLng(lat, lng));
          // 상세 정보 표시
          setSelectedBuilding(building);
          setShowBuildingInfo(true);
        });
        
        newMarkers.push(marker);
      } catch (err) {
        console.error('마커 생성 중 오류:', err);
      }
    });
    
    // 마커 배열 업데이트
    markersRef.current = newMarkers;
  };
  
  // 내 주변 버튼 핸들러
  const handleMyLocation = () => {
    if (!mapRef.current) return;
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          mapRef.current.setCenter(new window.naver.maps.LatLng(latitude, longitude));
          
          // 현재 위치 마커
          const locationMarker = new window.naver.maps.Marker({
            position: new window.naver.maps.LatLng(latitude, longitude),
            map: mapRef.current,
            icon: {
              content: `
                <div style="
                  width: 22px;
                  height: 22px;
                  background-color: ${COLORS.primary};
                  border-radius: 50%;
                  border: 3px solid white;
                  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
                  display: flex;
                  justify-content: center;
                  align-items: center;
                ">
                  <div style="
                    width: 8px;
                    height: 8px;
                    background-color: white;
                    border-radius: 50%;
                  "></div>
                </div>
              `,
              anchor: new window.naver.maps.Point(11, 11)
            }
          });
          
          // 잠시 후 위치 마커 제거
          setTimeout(() => locationMarker.setMap(null), 5000);
        },
        (error) => {
          alert('현재 위치를 가져오는데 실패했습니다. 권한을 확인해주세요.');
        }
      );
    } else {
      alert('이 브라우저는 위치 정보를 지원하지 않습니다.');
    }
  };

  // 탭 변경 핸들러
  const handleTabChange = (tab) => {
    setSelectedTab(tab);
  };

  // 필터 선택 핸들러
  const handleFilterChange = (type, value) => {
    setFilters({
      ...filters,
      [type]: value
    });
  };

  // 가격 포맷 함수
  const formatPrice = (price) => {
    if (!price) return '';
    if (typeof price === 'string') return price;
    if (price >= 10000) {
      return `${Math.floor(price / 10000)}억 ${price % 10000 > 0 ? `${price % 10000}만` : ''}`;
    }
    return `${price}만`;
  };

  // 사용자 표시형 평수 변환
  const formatSize = (size) => {
    if (!size) return '';
    if (typeof size === 'string') {
      if (size.includes('m²')) {
        const m2 = parseFloat(size);
        return `${Math.round(m2 * 0.3025)}평 (${size})`;
      }
      return size;
    }
    return `${size}평`;
  };

  return (
    <div style={{ 
      position: 'relative', 
      width: '100vw', 
      height: '100vh', 
      fontFamily: '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif',
      backgroundColor: COLORS.background,
      color: COLORS.text,
      overflow: 'hidden'
    }}>
      {/* 지도 영역 */}
      <div 
        id="map" 
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          top: 0,
          left: 0,
          zIndex: 1,
        }} 
      />

      {/* 상단 검색바 (현대적 디자인) */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        width: '90%',
        maxWidth: '500px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '4px 8px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        transition: 'all 0.3s ease',
        zIndex: 10,
        border: '1px solid #f0f0f0'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          flex: 1,
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          padding: '8px 12px',
          margin: '4px'
        }}>
          <FiSearch style={{ color: '#555', marginRight: '10px', fontSize: '18px' }} />
          <input
            type="text"
            placeholder="지역, 단지명, 매물번호 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            style={{
              border: 'none',
              outline: 'none',
              padding: '4px 0',
              width: '100%',
              fontSize: '15px',
              backgroundColor: 'transparent',
              color: '#333',
            }}
          />
          {searchQuery && (
            <FiX 
              style={{ 
                color: '#aaa', 
                cursor: 'pointer',
                fontSize: '18px',
                marginLeft: '4px'
              }} 
              onClick={() => setSearchQuery('')}
            />
          )}
        </div>
        <button
          onClick={handleSearch}
          style={{
            backgroundColor: '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 16px',
            margin: '4px',
            fontSize: '15px',
            fontWeight: '500',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(59, 130, 246, 0.25)',
            transition: 'all 0.2s ease',
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3B82F6'}
        >
          검색
        </button>
      </div>

      {/* 필터 버튼 */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        style={{
          position: 'absolute',
          top: '90px',
          right: '20px',
          zIndex: 10,
          backgroundColor: 'white',
          color: COLORS.text,
          border: 'none',
          borderRadius: '50%',
          width: '46px',
          height: '46px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
      >
        <FiFilter size={20} color={COLORS.primary} />
      </button>

      {/* 필터 패널 (세련된 스타일) */}
      {showFilters && (
        <div style={{
          position: 'absolute',
          top: '70px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          maxWidth: '400px',
          backgroundColor: COLORS.cardBg,
          boxShadow: '0 4px 25px rgba(0, 0, 0, 0.1)',
          borderRadius: '16px',
          padding: '24px',
          zIndex: 20,
          maxHeight: '70%',
          overflowY: 'auto'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', letterSpacing: '-0.01em' }}>
              매물 필터
            </h3>
            <button
              onClick={() => setShowFilters(false)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <FiX size={20} color={COLORS.text} />
            </button>
          </div>
          
          {/* 가격 범위 */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '15px', 
              fontWeight: '600', 
              marginBottom: '12px', 
              color: COLORS.text 
            }}>
              가격 범위
            </label>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '10px',
              fontSize: '14px',
              color: COLORS.textLight
            }}>
              <span>{formatPrice(filters.priceRange[0])}</span>
              <span>{formatPrice(filters.priceRange[1])}</span>
            </div>
            <input
              type="range"
              min="0"
              max="50000"
              value={filters.priceRange[1]}
              onChange={(e) => handleFilterChange('priceRange', [filters.priceRange[0], parseInt(e.target.value)])}
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                appearance: 'none',
                background: `linear-gradient(to right, ${COLORS.primary} 0%, ${COLORS.primary} ${(filters.priceRange[1] - filters.priceRange[0]) / 500}%, #e5e7eb ${(filters.priceRange[1] - filters.priceRange[0]) / 500}%, #e5e7eb 100%)`,
                outline: 'none'
              }}
            />
          </div>
          
          {/* 평수 범위 */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '15px', 
              fontWeight: '600', 
              marginBottom: '12px', 
              color: COLORS.text 
            }}>
              평수 범위
            </label>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '10px',
              fontSize: '14px',
              color: COLORS.textLight
            }}>
              <span>{filters.sizeRange[0]}평</span>
              <span>{filters.sizeRange[1]}평</span>
            </div>
            <input
              type="range"
              min="10"
              max="200"
              value={filters.sizeRange[1]}
              onChange={(e) => handleFilterChange('sizeRange', [filters.sizeRange[0], parseInt(e.target.value)])}
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                appearance: 'none',
                background: `linear-gradient(to right, ${COLORS.primary} 0%, ${COLORS.primary} ${(filters.sizeRange[1] - filters.sizeRange[0]) / 1.9}%, #e5e7eb ${(filters.sizeRange[1] - filters.sizeRange[0]) / 1.9}%, #e5e7eb 100%)`,
                outline: 'none'
              }}
            />
          </div>
          
          {/* 추가 옵션 (세부 필터) */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '15px', 
              fontWeight: '600', 
              marginBottom: '12px', 
              color: COLORS.text 
            }}>
              추가 옵션
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {['역세권', '신축', '주차', '테라스', '반려동물', '풀옵션', '남향'].map((option) => (
                <div
                  key={option}
                  onClick={() => {
                    const options = filters.options.includes(option)
                      ? filters.options.filter(o => o !== option)
                      : [...filters.options, option];
                    handleFilterChange('options', options);
                  }}
                  style={{
                    padding: '9px 14px',
                    borderRadius: '24px',
                    border: `1px solid ${filters.options.includes(option) ? COLORS.primary : '#E5E7EB'}`,
                    backgroundColor: filters.options.includes(option) ? `rgba(59, 130, 246, 0.1)` : 'white',
                    color: filters.options.includes(option) ? COLORS.primary : COLORS.text,
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {filters.options.includes(option) && <FiCheck size={14} />}
                  {option}
                </div>
              ))}
            </div>
          </div>
          
          {/* 적용 버튼 */}
          <button
            onClick={() => setShowFilters(false)}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              backgroundColor: COLORS.primary,
              color: 'white',
              border: 'none',
              fontWeight: '600',
              fontSize: '16px',
              cursor: 'pointer',
              marginTop: '10px',
              boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3B82F6'}
          >
            필터 적용하기
          </button>
        </div>
      )}

      {/* 인기 검색 바로가기 */}
      <div style={{
        position: 'absolute',
        bottom: '240px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        justifyContent: 'center',
        gap: '10px',
        zIndex: 10,
        width: '90%',
        overflowX: 'auto',
        paddingBottom: '5px',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}>
        <button
          type="button"
          onClick={handleBucheonSearch}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            color: COLORS.text,
            border: 'none',
            borderRadius: '24px',
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backdropFilter: 'blur(8px)',
          }}
        >
          <FiMapPin size={14} />
          부천
        </button>
        <button
          type="button"
          onClick={handleYeongjongSearch}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            color: COLORS.text,
            border: 'none',
            borderRadius: '24px',
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backdropFilter: 'blur(8px)',
          }}
        >
          <FiMapPin size={14} />
          영종
        </button>
        <button
          type="button"
          onClick={() => performSearch('서울')}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            color: COLORS.text,
            border: 'none',
            borderRadius: '24px',
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backdropFilter: 'blur(8px)',
          }}
        >
          <FiMapPin size={14} />
          서울
        </button>
        <button
          type="button"
          onClick={() => performSearch('강남')}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            color: COLORS.text,
            border: 'none',
            borderRadius: '24px',
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backdropFilter: 'blur(8px)',
          }}
        >
          <FiMapPin size={14} />
          강남
        </button>
      </div>

      {/* 내 주변 버튼 (강조된 디자인) */}
      <button 
        type="button"
        onClick={handleMyLocation}
        style={{
          position: 'absolute',
          bottom: '180px',
          right: '20px',
          backgroundColor: 'white',
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          border: 'none',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'pointer',
          zIndex: 20,
          transition: 'all 0.2s ease',
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <FiMapPin size={22} color={COLORS.primary} />
      </button>

      {/* 부동산 시장 지표 패널 (세련된 디자인) */}
      <div style={{
        position: 'absolute',
        bottom: '170px',
        left: '20px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
        zIndex: 10,
        maxWidth: '180px',
        backdropFilter: 'blur(8px)',
      }}>
        <h4 style={{ 
          fontSize: '14px', 
          fontWeight: '700', 
          margin: '0 0 12px 0',
          color: '#1F2937',
          letterSpacing: '-0.01em',
        }}>
          부동산 시장 동향
        </h4>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          fontSize: '13px',
          fontWeight: '500',
          marginBottom: '8px',
        }}>
          <span style={{ color: COLORS.textLight }}>매매가 변동</span>
          <span style={{ 
            color: marketStats.monthly > 0 ? COLORS.success : COLORS.danger,
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            fontWeight: '600',
          }}>
            {marketStats.monthly > 0 ? <FiArrowUp size={12} /> : <FiArrowDown size={12} />}
            {Math.abs(marketStats.monthly)}%
          </span>
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          fontSize: '13px',
          fontWeight: '500',
        }}>
          <span style={{ color: COLORS.textLight }}>활성 매물</span>
          <span style={{ fontWeight: '600' }}>{marketStats.activeListings}개</span>
        </div>
      </div>

      {/* 건물 목록 표시 패널 (세련된 디자인) */}
      <div style={{
        display: selectedTab === 'map' ? 'block' : 'none',
        position: 'absolute',
        bottom: '70px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderRadius: '20px 20px 0 0',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.12)',
        zIndex: 20,
        maxHeight: '40%',
        overflowY: 'auto',
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{ 
          padding: '20px 20px 16px',
          borderBottom: `1px solid ${COLORS.border}`,
          position: 'sticky',
          top: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          borderRadius: '20px 20px 0 0',
          zIndex: 1,
          backdropFilter: 'blur(20px)',
        }}>
          {/* 손잡이 디자인 */}
          <div style={{ 
            width: '48px', 
            height: '5px', 
            backgroundColor: '#DFE3E8', 
            borderRadius: '10px', 
            margin: '-5px auto 16px',
            opacity: 0.8,
          }}></div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ 
              margin: 0, 
              fontSize: '19px', 
              fontWeight: '700',
              letterSpacing: '-0.02em',
            }}>
              {loading ? '로딩 중...' : `매물 정보 (${buildings.length})`}
            </h3>
            {error && <span style={{ 
              color: COLORS.danger, 
              fontSize: '13px',
              fontWeight: '500',
            }}>{error}</span>}
          </div>
          
          {/* 부가 정보 */}
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            marginTop: '8px',
            fontSize: '13px',
            color: COLORS.textLight,
            fontWeight: '500',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FiInfo size={12} />
              최근 30일 거래 {Math.floor(Math.random() * 10) + 1}건
            </span>
          </div>
        </div>
        
        {/* 건물 카드 목록 */}
        <div style={{ padding: '8px 20px 20px' }}>
          {loading ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 20px',
              color: COLORS.textLight,
            }}>
              <div style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                border: `3px solid ${COLORS.primary}`,
                borderTopColor: 'transparent',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px'
              }}></div>
              <style>
                {`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}
              </style>
              <span style={{ 
                fontSize: '15px',
                fontWeight: '500',
              }}>데이터를 불러오는 중...</span>
            </div>
          ) : buildings.length > 0 ? (
            buildings.map((item, index) => (
              <div 
                key={item.BuildingId} 
                style={{
                  padding: '18px',
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  marginTop: '14px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                  border: `1px solid ${COLORS.border}`,
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => {
                  if (mapRef.current) {
                    mapRef.current.setCenter(new window.naver.maps.LatLng(
                      parseFloat(item.Latitude),
                      parseFloat(item.Longitude)
                    ));
                    setSelectedBuilding(item);
                    setShowBuildingInfo(true);
                  }
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.08)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ 
                      fontWeight: '700', 
                      fontSize: '17px', 
                      color: COLORS.text,
                      display: 'block', 
                      marginBottom: '6px',
                      letterSpacing: '-0.02em',
                    }}>
                      {item.BuildingName}
                    </span>
                    <span style={{ 
                      color: COLORS.textLight, 
                      fontSize: '14px', 
                      display: 'block', 
                      marginBottom: '10px',
                      fontWeight: '500',
                    }}>
                      {item.BuildingAddress}
                    </span>
                  </div>
                </div>
                
                {/* 추가 정보 */}
                <div style={{ 
                  display: 'flex', 
                  gap: '10px', 
                  marginTop: '8px',
                  fontSize: '13px',
                }}>
                  <span style={{ 
                    backgroundColor: '#F3F4F6', 
                    padding: '6px 10px', 
                    borderRadius: '6px',
                    color: COLORS.textLight,
                    fontWeight: '600',
                  }}>
                    {Math.floor(Math.random() * 20) + 15}평
                  </span>
                  <span style={{ 
                    backgroundColor: '#F3F4F6', 
                    padding: '6px 10px', 
                    borderRadius: '6px',
                    color: COLORS.textLight,
                    fontWeight: '600',
                  }}>
                    {Math.floor(Math.random() * 30) + 1990}년
                  </span>
                  <span style={{ 
                    backgroundColor: `rgba(59, 130, 246, 0.12)`, 
                    padding: '6px 10px', 
                    borderRadius: '6px',
                    color: COLORS.primary,
                    fontWeight: '600',
                  }}>
                    {Math.floor(Math.random() * 20) + 3}억 {Math.floor(Math.random() * 9) + 1}천
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 20px', 
              color: COLORS.textLight,
              fontWeight: '500',
              fontSize: '15px'
            }}>
              이 지역에 표시할 건물이 없습니다.<br/>
              다른 지역을 탐색하거나 검색해보세요.
            </div>
          )}
        </div>
      </div>

      {/* 건물 상세 정보 모달 */}
      {showBuildingInfo && selectedBuilding && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 50,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backdropFilter: 'blur(4px)',
        }} onClick={() => setShowBuildingInfo(false)}>
          <div style={{
            width: '90%',
            maxWidth: '400px',
            maxHeight: '80%',
            overflowY: 'auto',
            backgroundColor: COLORS.cardBg,
            borderRadius: '20px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            padding: '24px',
            position: 'relative'
          }} onClick={e => e.stopPropagation()}>
            <button
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                backgroundColor: 'rgba(243, 244, 246, 0.8)',
                border: 'none',
                color: COLORS.text,
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              onClick={() => setShowBuildingInfo(false)}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(243, 244, 246, 0.8)'}
            >
              <FiX size={20} />
            </button>
            
            <h2 style={{ 
              marginTop: '0', 
              marginBottom: '20px', 
              fontSize: '22px', 
              fontWeight: '700',
              letterSpacing: '-0.02em',
            }}>
              {selectedBuilding.BuildingName}
            </h2>
            
            {/* 가격 및 면적 정보 */}
            <div style={{ 
              display: 'flex', 
              marginBottom: '16px',
              fontSize: '20px',
              fontWeight: '700',
              color: COLORS.primary,
              letterSpacing: '-0.02em',
            }}>
              {Math.floor(Math.random() * 20) + 3}억 {Math.floor(Math.random() * 9) + 1}천만원
            </div>
            
            {/* 주소 정보 */}
            <div style={{ 
              marginBottom: '24px',
              fontSize: '15px',
              color: COLORS.textLight,
              fontWeight: '500',
              lineHeight: '1.5',
            }}>
              {selectedBuilding.BuildingAddress}
            </div>
            
            {/* 상세 정보 - 표 형태 */}
            <div style={{ 
              marginTop: '24px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '14px'
            }}>
              <div style={{ 
                borderRadius: '12px', 
                padding: '16px', 
                backgroundColor: '#F9FAFB'
              }}>
                <div style={{ 
                  fontSize: '13px', 
                  color: COLORS.textLight, 
                  marginBottom: '6px',
                  fontWeight: '500',
                }}>
                  건물 유형
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>
                  아파트
                </div>
              </div>
              
              <div style={{ 
                borderRadius: '12px', 
                padding: '16px', 
                backgroundColor: '#F9FAFB'
              }}>
                <div style={{ 
                  fontSize: '13px', 
                  color: COLORS.textLight, 
                  marginBottom: '6px',
                  fontWeight: '500',
                }}>
                  평수
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>
                  {Math.floor(Math.random() * 20) + 15}평
                </div>
              </div>
              
              <div style={{ 
                borderRadius: '12px', 
                padding: '16px', 
                backgroundColor: '#F9FAFB'
              }}>
                <div style={{ 
                  fontSize: '13px', 
                  color: COLORS.textLight, 
                  marginBottom: '6px',
                  fontWeight: '500',
                }}>
                  건축년도
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>
                  {Math.floor(Math.random() * 30) + 1990}년
                </div>
              </div>
              
              <div style={{ 
                borderRadius: '12px', 
                padding: '16px', 
                backgroundColor: '#F9FAFB'
              }}>
                <div style={{ 
                  fontSize: '13px', 
                  color: COLORS.textLight, 
                  marginBottom: '6px',
                  fontWeight: '500',
                }}>
                  최근 거래
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>
                  {Math.floor(Math.random() * 10) + 1}건
                </div>
              </div>
            </div>
            
            {/* 버튼 그룹 */}
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              marginTop: '28px' 
            }}>
              <button
                style={{
                  flex: 1,
                  padding: '16px 10px',
                  borderRadius: '12px',
                  backgroundColor: '#F3F4F6',
                  color: COLORS.text,
                  border: 'none',
                  fontWeight: '600',
                  fontSize: '15px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#E5E7EB'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
              >
                <FiHeart size={18} color={COLORS.primary} />
                관심 등록
              </button>
              
              <button
                style={{
                  flex: 1,
                  padding: '16px 10px',
                  borderRadius: '12px',
                  backgroundColor: COLORS.primary,
                  color: 'white',
                  border: 'none',
                  fontWeight: '600',
                  fontSize: '15px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3B82F6'}
              >
                문의하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 하단 네비게이션 바 - 레이아웃 유지, 아이콘만 변경 */}
<div style={{
  position: 'fixed',
  bottom: 0,
  left: 0,
  width: '100%',
  display: 'flex',
  justifyContent: 'space-around',
  backgroundColor: 'rgba(255, 255, 255, 0.98)',
  backdropFilter: 'blur(20px)',
  borderTop: '1px solid rgba(229, 231, 235, 0.8)',
  paddingTop: '12px',
  paddingBottom: '16px',
  zIndex: 30,
  boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.06)',
}}>
  {/* 시황 - 아이콘만 변경 */}
  <div 
    onClick={() => handleTabChange('market')}
    style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      width: '25%',
      position: 'relative',
      cursor: 'pointer',
      transition: 'transform 0.2s ease',
    }}
    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
  >
    <div style={{
      width: '48px',
      height: '48px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: '12px',
      backgroundColor: selectedTab === 'market' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
      transition: 'all 0.3s ease',
    }}>
      <FiTrendingUp style={{ // FiBarChart2에서 FiTrendingUp으로 변경
        fontSize: '22px', 
        color: selectedTab === 'market' ? '#3B82F6' : '#64748B',
        transition: 'all 0.3s ease'
      }} />
    </div>
    <span style={{ 
      fontSize: '12px', 
      marginTop: '6px',
      color: selectedTab === 'market' ? '#3B82F6' : '#64748B',
      fontWeight: selectedTab === 'market' ? '600' : '500',
      letterSpacing: '-0.02em',
      transition: 'all 0.3s ease'
    }}>시황</span>
    {selectedTab === 'market' && (
      <div style={{
        position: 'absolute',
        top: '-6px',
        width: '4px',
        height: '4px',
        borderRadius: '50%',
        backgroundColor: '#3B82F6',
        transition: 'all 0.3s ease'
      }}></div>
    )}
  </div>
  
  {/* 투자+ - 아이콘만 변경 */}
  <div 
    onClick={() => handleTabChange('invest')}
    style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      width: '25%',
      position: 'relative',
      cursor: 'pointer',
      transition: 'transform 0.2s ease',
    }}
    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
  >
    <div style={{
      width: '48px',
      height: '48px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: '12px',
      backgroundColor: selectedTab === 'invest' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
      transition: 'all 0.3s ease',
    }}>
      <FiDollarSign style={{ // FiBarChart2에서 FiDollarSign으로 변경
        fontSize: '22px', 
        color: selectedTab === 'invest' ? '#3B82F6' : '#64748B',
        transition: 'all 0.3s ease'
      }} />
    </div>
    <span style={{ 
      fontSize: '12px', 
      marginTop: '6px',
      color: selectedTab === 'invest' ? '#3B82F6' : '#64748B',
      fontWeight: selectedTab === 'invest' ? '600' : '500',
      letterSpacing: '-0.02em',
      transition: 'all 0.3s ease'
    }}>투자+</span>
    {selectedTab === 'invest' && (
      <div style={{
        position: 'absolute',
        top: '-6px',
        width: '4px',
        height: '4px',
        borderRadius: '50%',
        backgroundColor: '#3B82F6',
        transition: 'all 0.3s ease'
      }}></div>
    )}
  </div>
  
  {/* 지도 탭 - 변경 없음 */}
  <div 
    onClick={() => handleTabChange('map')}
    style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      width: '25%',
      position: 'relative',
      cursor: 'pointer',
      transition: 'transform 0.2s ease',
    }}
    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
  >
    <div style={{
      width: '48px',
      height: '48px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: '12px',
      backgroundColor: selectedTab === 'map' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
      transition: 'all 0.3s ease',
    }}>
      <FiMapPin style={{ 
        fontSize: '22px', 
        color: selectedTab === 'map' ? '#3B82F6' : '#64748B',
        transition: 'all 0.3s ease'
      }} />
    </div>
    <span style={{ 
      fontSize: '12px', 
      marginTop: '6px',
      color: selectedTab === 'map' ? '#3B82F6' : '#64748B',
      fontWeight: selectedTab === 'map' ? '600' : '500',
      letterSpacing: '-0.02em',
      transition: 'all 0.3s ease'
    }}>지도</span>
    {selectedTab === 'map' && (
      <div style={{
        position: 'absolute',
        top: '-6px',
        width: '4px',
        height: '4px',
        borderRadius: '50%',
        backgroundColor: '#3B82F6',
        transition: 'all 0.3s ease'
      }}></div>
    )}
  </div>
  
  {/* 내 정보 탭 - 변경 없음 */}
  <div 
    onClick={() => handleTabChange('profile')}
    style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      width: '25%',
      position: 'relative',
      cursor: 'pointer',
      transition: 'transform 0.2s ease',
    }}
    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
  >
    <div style={{
      width: '48px',
      height: '48px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: '12px',
      backgroundColor: selectedTab === 'profile' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
      transition: 'all 0.3s ease',
    }}>
      <FiUser style={{ 
        fontSize: '22px', 
        color: selectedTab === 'profile' ? '#3B82F6' : '#64748B',
        transition: 'all 0.3s ease'
      }} />
    </div>
    <span style={{ 
      fontSize: '12px', 
      marginTop: '6px',
      color: selectedTab === 'profile' ? '#3B82F6' : '#64748B',
      fontWeight: selectedTab === 'profile' ? '600' : '500',
      letterSpacing: '-0.02em',
      transition: 'all 0.3s ease'
    }}>내 정보</span>
    {selectedTab === 'profile' && (
      <div style={{
        position: 'absolute',
        top: '-6px',
        width: '4px',
        height: '4px',
        borderRadius: '50%',
        backgroundColor: '#3B82F6',
        transition: 'all 0.3s ease'
      }}></div>
    )}
  </div>
</div>

    </div>
  );
}

export default App;
