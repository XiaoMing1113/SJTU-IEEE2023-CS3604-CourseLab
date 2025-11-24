import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { searchTrains } from '../services/api';
import './SearchResultsPage.css';

const SearchResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // --- 核心状态 ---
  const [trains, setTrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- 搜索条件状态 ---
  // 从URL参数或location state获取搜索条件
  const searchParams = new URLSearchParams(location.search);
  const [searchConditions, setSearchConditions] = useState({
    from: searchParams.get('from') || location.state?.from || '上海',
    to: searchParams.get('to') || location.state?.to || '北京',
    date: searchParams.get('date') || location.state?.date || new Date().toISOString().split('T')[0]
  });

  // --- 日期导航数据 ---
  const [dateNavList, setDateNavList] = useState([]);

  // --- 初始化逻辑 ---
  useEffect(() => {
    generateDateList(searchConditions.date);
    fetchTrains();
  }, [searchConditions]); // 当搜索条件(包含日期)变化时执行

  // --- 生成日期导航条 ---
  const generateDateList = (currentDateStr) => {
    const dates = [];
    const baseDate = new Date(currentDateStr);
    // 生成当前日期往后几天的列表
    for (let i = 0; i < 7; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const month = d.getMonth() + 1;
      const day = d.getDate();
      const weekMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      dates.push({
        fullDate: dateStr,
        display: `${month}-${day}`,
        week: weekMap[d.getDay()],
        isCurrent: i === 0 // 简单的逻辑：第一个是当前选中的
      });
    }
    setDateNavList(dates);
  };

  // --- API 请求逻辑 (保留你原有的逻辑) ---
  const fetchTrains = async () => {
    setLoading(true);
    setError(null);
    try {
      // 这里保留你原本的 API 调用参数构建逻辑
      const params = {
        from: searchConditions.from,
        to: searchConditions.to,
        date: searchConditions.date
      };

      const result = await searchTrains(params);

      // 保留你原本的数据清洗逻辑，这非常重要
      const list = Array.isArray(result) ? result : result?.data?.trains || [];
      const normalized = list.map(t => {
        // 如果数据结构需要映射 (你原本的逻辑)
        if (t.seatTypes && !t.seats) {
          const seatsObj = {};
          t.seatTypes.forEach(s => {
            const map = {
              '商务座': 'businessClass', 'business': 'businessClass',
              '一等座': 'firstClass', 'first': 'firstClass',
              '二等座': 'secondClass', 'second': 'secondClass',
              '软卧': 'softSleeper', 'soft_sleeper': 'softSleeper',
              '硬卧': 'hardSleeper', 'hard_sleeper': 'hardSleeper',
              '硬座': 'hardSeat', 'hard_seat': 'hardSeat',
              '无座': 'noSeat', 'no_seat': 'noSeat'
            };
            const key = map[s.type] || s.type;
            // 这里的 available 逻辑保留
            seatsObj[key] = {
              available: s.available ?? s.count ?? 0,
              price: s.price
            };
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
      setError('查询失败，请稍后重试'); // 简化报错信息
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- 交互处理 ---
  const handleSwap = () => {
    setSearchConditions(prev => ({ ...prev, from: prev.to, to: prev.from }));
  };

  const handleDateChange = (newDate) => {
    setSearchConditions(prev => ({ ...prev, date: newDate }));
  };

  const handleBooking = (train) => {
    navigate('/booking', { state: { train, searchConditions } });
  };

  // --- 辅助函数：渲染余票 (核心 UI 逻辑) ---
  // 12306 逻辑： >20 显示“有”，=0 显示“无”/“候补”，否则显示数字
  const renderTicketCell = (seatData) => {
    if (!seatData) return <td className="cell-empty">--</td>;

    const count = seatData.available;

    if (count === 0 || count === '无') {
      return <td className="cell-none">无</td>;
    } else if (count >= 20 || count === '有') {
      return <td className="cell-available">有</td>;
    } else {
      return <td className="cell-number">{count}</td>; // 余票紧张，显示数字
    }
  };

  return (
    <div className="search-results-page">

      {/* 1. 顶部紧凑搜索栏 */}
      <div className="quick-search-bar">
        <div className="search-wrapper">
          <div className="input-group">
            <label>出发地</label>
            <input
              value={searchConditions.from}
              onChange={(e) => setSearchConditions({ ...searchConditions, from: e.target.value })}
            />
          </div>
          <button className="btn-swap" onClick={handleSwap}>⇌</button>
          <div className="input-group">
            <label>目的地</label>
            <input
              value={searchConditions.to}
              onChange={(e) => setSearchConditions({ ...searchConditions, to: e.target.value })}
            />
          </div>
          <div className="input-group">
            <label>出发日</label>
            <input
              type="date"
              value={searchConditions.date}
              onChange={(e) => setSearchConditions({ ...searchConditions, date: e.target.value })}
            />
          </div>
          <button className="btn-query" onClick={fetchTrains}>查询</button>
        </div>
      </div>

      {/* 2. 蓝色日期导航条 */}
      <div className="date-navigation">
        <div className="date-nav-wrapper">
          <div className="nav-prev"> &lt; </div>
          <div className="date-list">
            {dateNavList.map((item, idx) => (
              <div
                key={idx}
                className={`date-item ${item.isCurrent ? 'active' : ''}`}
                onClick={() => handleDateChange(item.fullDate)}
              >
                <span className="date-fmt">{item.display}</span>
                <span className="week-fmt">{item.week}</span>
              </div>
            ))}
          </div>
          <div className="nav-next"> &gt; </div>
        </div>
      </div>

      {/* 3. 核心数据表格 */}
      <div className="train-table-container">

        {/* 状态提示 */}
        <div className="table-header-info">
          {searchConditions.from} → {searchConditions.to}（{searchConditions.date}）
          共计 <strong>{trains.length}</strong> 个车次
        </div>

        {loading ? (
          <div className="loading-state">正在查询列车信息...</div>
        ) : error ? (
          <div className="error-state">{error}</div>
        ) : trains.length === 0 ? (
          <div className="empty-state">未找到符合条件的车次</div>
        ) : (
          <table className="train-table">
            <thead>
              <tr>
                <th className="col-train">车次</th>
                <th className="col-station">出发/到达车站</th>
                <th className="col-time">出发/到达时间</th>
                <th className="col-duration">历时</th>
                <th>商务座<br />特等座</th>
                <th>一等座</th>
                <th>二等座</th>
                <th>高级<br />软卧</th>
                <th>软卧<br />一等卧</th>
                <th>动卧</th>
                <th>硬卧<br />二等卧</th>
                <th>软座</th>
                <th>硬座</th>
                <th>无座</th>
                <th>其他</th>
                <th className="col-action">备注</th>
              </tr>
            </thead>
            <tbody>
              {trains.map((train, index) => (
                <tr key={train.trainNumber || index} className={index % 2 === 0 ? 'bg-even' : 'bg-odd'}>
                  {/* 车次 */}
                  <td className="cell-train-code">
                    <div className="code">{train.trainNumber}</div>
                  </td>

                  {/* 车站 */}
                  <td className="cell-stations">
                    <div><span className="icon-start">始</span> {train.departureStation}</div>
                    <div><span className="icon-end">终</span> {train.arrivalStation}</div>
                  </td>

                  {/* 时间 */}
                  <td className="cell-times">
                    <div className="time-start">{train.departureTime}</div>
                    <div className="time-end">{train.arrivalTime}</div>
                  </td>

                  {/* 历时 */}
                  <td className="cell-duration">
                    {train.duration}
                    {/* 如果有 dayDiff 可以在这里加 */}
                  </td>

                  {/* 动态渲染席位 - 对应 12306 的列顺序 */}
                  {renderTicketCell(train.seats?.businessClass)}
                  {renderTicketCell(train.seats?.firstClass)}
                  {renderTicketCell(train.seats?.secondClass)}
                  {renderTicketCell(null)} {/* 高级软卧暂无数据 */}
                  {renderTicketCell(train.seats?.softSleeper)}
                  {renderTicketCell(null)} {/* 动卧 */}
                  {renderTicketCell(train.seats?.hardSleeper)}
                  {renderTicketCell(null)} {/* 软座 */}
                  {renderTicketCell(train.seats?.hardSeat)}
                  {renderTicketCell(train.seats?.noSeat)}
                  {renderTicketCell(null)} {/* 其他 */}

                  {/* 预订按钮 */}
                  <td className="cell-action">
                    <button className="btn-book" onClick={() => handleBooking(train)}>预订</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default SearchResultsPage;