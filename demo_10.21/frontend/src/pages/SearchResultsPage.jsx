import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { searchTrains } from '../services/api';
import './SearchResults.css';

const SearchResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [trains, setTrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    trainType: 'all',
    departureTime: 'all',
    arrivalTime: 'all'
  });
  const [sortBy, setSortBy] = useState('departure');

  // 从URL参数或location state获取搜索条件
  const searchParams = new URLSearchParams(location.search);
  const [searchConditions, setSearchConditions] = useState({
    from: searchParams.get('from') || location.state?.from || '',
    to: searchParams.get('to') || location.state?.to || '',
    date: searchParams.get('date') || location.state?.date || ''
  });

  useEffect(() => {
    fetchTrains();
  }, [searchConditions, filters, sortBy]);

  const fetchTrains = async () => {
    setLoading(true);
    setError(null);
    try {
      const today = new Date();
      const isoDate = today.toISOString().slice(0,10);
      const params = {
        ...searchConditions,
        date: searchConditions.date || isoDate,
        trainType: filters.trainType === 'all' ? undefined : filters.trainType,
        departureTime: filters.departureTime === 'all' ? undefined : filters.departureTime,
        sortBy
      };
      const result = await searchTrains(params);
      // API 返回可能是数组或包含 data.trains
      const list = Array.isArray(result) ? result : result?.data?.trains || [];
      const normalized = list.map(t => {
        if (t.seatTypes && !t.seats) {
          const seatsObj = {};
          t.seatTypes.forEach(s => {
            const map = {
              '商务座': 'businessClass', 'business': 'businessClass',
              '一等座': 'firstClass', 'first': 'firstClass',
              '二等座': 'secondClass', 'second': 'secondClass',
              '软卧': 'softSleeper', 'soft_sleeper': 'softSleeper',
              '硬卧': 'hardSleeper', 'hard_sleeper': 'hardSleeper',
              '硬座': 'hardSeat', 'hard_seat': 'hardSeat'
            };
            const key = map[s.type] || s.type;
            seatsObj[key] = { available: s.available ?? s.count ?? 0, price: s.price ?? (key === 'businessClass' ? 1748 : key === 'firstClass' ? 933 : key === 'secondClass' ? 553 : key === 'softSleeper' ? 243 : key === 'hardSleeper' ? 156 : key === 'hardSeat' ? 89 : 100) };
          });
          return {
            trainNumber: t.trainNumber,
            departureStation: t.from || t.departureStation,
            arrivalStation: t.to || t.arrivalStation,
            departureTime: t.departureTime,
            arrivalTime: t.arrivalTime,
            duration: t.duration,
            seats: seatsObj
          };
        }
        return t;
      });
      setTrains(normalized);
    } catch (err) {
      setError(err?.toString?.() || String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchTrains();
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleSortChange = (sortType) => {
    setSortBy(sortType);
  };

  const handleBooking = (train) => {
    // 跳转到订票页面
    console.log('点击预订', train.trainNumber);
    navigate('/booking', { state: { train, searchConditions } });
  };

  const swapStations = () => {
    setSearchConditions(prev => ({
      ...prev,
      from: prev.to,
      to: prev.from
    }));
  };

  // 获取座位显示样式
  const getSeatClass = (seatInfo) => {
    if (seatInfo === '--' || seatInfo === '无') {
      return 'seat-none';
    } else if (seatInfo === '有') {
      return 'seat-available';
    } else if (typeof seatInfo === 'string' && !isNaN(seatInfo)) {
      const num = parseInt(seatInfo);
      return num <= 5 ? 'seat-few' : 'seat-available';
    }
    return 'seat-available';
  };

  return (
    <div className="search-results-container">
      {/* 顶部导航栏 */}
      <div className="top-nav">
        <div className="nav-content">
          <div className="logo">
            <div className="logo-icon">中</div>
            中国铁路12306
          </div>
          <div className="nav-links">
            <a href="#" className="nav-link">车票预订</a>
            <a href="#" className="nav-link">餐饮特产</a>
            <a href="#" className="nav-link">客运服务</a>
            <a href="#" className="nav-link">铁路货运</a>
            <a href="#" className="nav-link">信息查询</a>
            <a href="#" className="nav-link">铁路资讯</a>
            <a href="#" className="nav-link">English</a>
          </div>
        </div>
      </div>

      {/* 搜索条件栏 */}
      <div className="search-bar">
        <div className="search-content">
          <div className="search-form">
            <div className="search-group">
              <label>出发地</label>
              <input
                type="text"
                className="search-input"
                value={searchConditions.from}
                onChange={(e) => setSearchConditions(prev => ({ ...prev, from: e.target.value }))}
                placeholder="出发地"
              />
            </div>
            <button className="swap-btn" onClick={swapStations}>⇄</button>
            <div className="search-group">
              <label>目的地</label>
              <input
                type="text"
                className="search-input"
                value={searchConditions.to}
                onChange={(e) => setSearchConditions(prev => ({ ...prev, to: e.target.value }))}
                placeholder="目的地"
              />
            </div>
            <div className="search-group">
              <label>出发日</label>
              <input
                type="date"
                className="search-input"
                value={searchConditions.date}
                onChange={(e) => setSearchConditions(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <button className="search-btn" onClick={handleSearch}>查询</button>
          </div>
        </div>
      </div>

      {/* 筛选和排序栏 */}
      <div className="filter-bar">
        <div className="filter-content">
          <div className="filter-left">
            <div className="filter-group">
              <span className="filter-label">车次类型:</span>
              <div className="filter-options">
                <span 
                  className={`filter-option ${filters.trainType === 'all' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('trainType', 'all')}
                >
                  全部
                </span>
                <span 
                  className={`filter-option ${filters.trainType === 'G' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('trainType', 'G')}
                >
                  高速
                </span>
                <span 
                  className={`filter-option ${filters.trainType === 'D' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('trainType', 'D')}
                >
                  动车
                </span>
                <span 
                  className={`filter-option ${filters.trainType === 'Z' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('trainType', 'Z')}
                >
                  直达
                </span>
                <span 
                  className={`filter-option ${filters.trainType === 'T' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('trainType', 'T')}
                >
                  特快
                </span>
                <span 
                  className={`filter-option ${filters.trainType === 'K' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('trainType', 'K')}
                >
                  快速
                </span>
              </div>
            </div>
            <div className="filter-group">
              <span className="filter-label">出发时间:</span>
              <div className="filter-options">
                <span 
                  className={`filter-option ${filters.departureTime === 'all' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('departureTime', 'all')}
                >
                  全部
                </span>
                <span 
                  className={`filter-option ${filters.departureTime === '06-12' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('departureTime', '06-12')}
                >
                  06:00-12:00
                </span>
                <span 
                  className={`filter-option ${filters.departureTime === '12-18' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('departureTime', '12-18')}
                >
                  12:00-18:00
                </span>
                <span 
                  className={`filter-option ${filters.departureTime === '18-24' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('departureTime', '18-24')}
                >
                  18:00-24:00
                </span>
                <span 
                  className={`filter-option ${filters.departureTime === '00-06' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('departureTime', '00-06')}
                >
                  00:00-06:00
                </span>
              </div>
            </div>
          </div>
          <div className="sort-options">
            <a 
              href="#" 
              className={`sort-option ${sortBy === 'departure' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); handleSortChange('departure'); }}
            >
              出发时间
            </a>
            <a 
              href="#" 
              className={`sort-option ${sortBy === 'arrival' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); handleSortChange('arrival'); }}
            >
              到达时间
            </a>
            <a 
              href="#" 
              className={`sort-option ${sortBy === 'duration' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); handleSortChange('duration'); }}
            >
              历时
            </a>
          </div>
        </div>
      </div>

      {/* 车次列表 */}
      <div className="results-container">
        {!loading && !error && (
          <div className="results-summary">
            <span>{searchConditions.from}</span>
            <span> → </span>
            <span>{searchConditions.to}</span>
            <span> · </span>
            <span>{searchConditions.date}</span>
          </div>
        )}
        {loading && (
          <div className="loading">
            <span className="loading-text">正在搜索列车信息...</span>
          </div>
        )}

        {error && (
          <div className="error">
            <div>搜索失败：{error}</div>
            <button className="retry-btn" onClick={fetchTrains}>重新搜索</button>
          </div>
        )}

        {!loading && !error && trains.length === 0 && (
          <div className="no-results">
            <h3>未找到符合条件的列车</h3>
            <p>请尝试修改搜索条件</p>
          </div>
        )}

        {!loading && !error && trains.length > 0 && (
          <>
            <div className="results-header">
              <div>车次</div>
              <div>出发站</div>
              <div>到达站</div>
              <div>历时</div>
              <div>商务</div>
              <div>一等</div>
              <div>二等</div>
              <div>硬卧</div>
              <div>软卧</div>
              <div>硬座</div>
              <div>无座</div>
              <div>操作</div>
            </div>
            {/* 已移除中间的刷新按钮，若需刷新可使用顶部“查询” */}
            <div className="train-list">
              {trains.map((train, idx) => (
                <div key={train.trainNumber + idx} className="train-item">
                  <div className="train-number">{train.trainNumber}</div>
                  <div className="station-info">
                    <div className="station-name">{train.departureStation}</div>
                    <div className="station-time">{train.departureTime}</div>
                  </div>
                  <div className="station-info">
                    <div className="station-name">{train.arrivalStation}</div>
                    <div className="station-time">{train.arrivalTime}</div>
                  </div>
                  <div className="duration">{train.duration}</div>
                  <div className="seat-block">
                    <div className="seat-type">商务座</div>
                    <div className="seat-price">{`¥${train.seats?.businessClass?.price ?? ''}`}</div>
                    <div className="seat-available">{train.seats?.businessClass?.available > 0 ? `余${train.seats.businessClass.available}张` : '无票'}</div>
                  </div>
                  <div className="seat-block">
                    <div className="seat-type">一等座</div>
                    <div className="seat-price">{`¥${train.seats?.firstClass?.price ?? ''}`}</div>
                    <div className="seat-available">{train.seats?.firstClass?.available > 0 ? `余${train.seats.firstClass.available}张` : '无票'}</div>
                  </div>
                  <div className="seat-block">
                    <div className="seat-type">二等座</div>
                    <div className="seat-price">{`¥${train.seats?.secondClass?.price ?? ''}`}</div>
                    <div className="seat-available">{train.seats?.secondClass?.available > 0 ? `余${train.seats.secondClass.available}张` : '无票'}</div>
                  </div>
                  <button 
                    className="book-btn"
                    onClick={() => handleBooking(train)}
                  >
                    预订
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SearchResultsPage;
