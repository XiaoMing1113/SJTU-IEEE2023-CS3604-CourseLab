import React, { useState, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { createOrder } from '../services/api'
import './BookingPage.css'

const BookingPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { train, searchParams } = location.state || {}
  
  const [passengers, setPassengers] = useState([
    {
      name: '',
      idNumber: '',
      seatType: 'second'
    }
  ])
  const [errorModal, setErrorModal] = useState('')

  const seatOptions = useMemo(() => {
    const seats = train?.seats || {}
    return [
      { key: 'secondClass', label: '二等座', value: 'second', price: seats?.secondClass?.price ?? 553, available: seats?.secondClass?.available ?? 0 },
      { key: 'firstClass', label: '一等座', value: 'first', price: seats?.firstClass?.price ?? 933, available: seats?.firstClass?.available ?? 0 },
      { key: 'businessClass', label: '商务座', value: 'business', price: seats?.businessClass?.price ?? 1748, available: seats?.businessClass?.available ?? 0 }
    ]
  }, [train])

  const totalPrice = useMemo(() => {
    return passengers.reduce((sum, p) => {
      const opt = seatOptions.find(s => s.value === p.seatType)
      return sum + (opt?.price || 0)
    }, 0)
  }, [passengers, seatOptions])

  const handlePassengerChange = (index, field, value) => {
    // TODO: 实现乘客信息修改逻辑
    const updatedPassengers = [...passengers]
    updatedPassengers[index][field] = value
    setPassengers(updatedPassengers)
  }

  const addPassenger = () => {
    // TODO: 实现添加乘客逻辑
    setPassengers([...passengers, {
      name: '',
      idNumber: '',
      seatType: 'second'
    }])
  }

  const removePassenger = (index) => {
    // TODO: 实现删除乘客逻辑
    if (passengers.length > 1) {
      setPassengers(passengers.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async () => {
    // 简单校验
    for (const p of passengers) {
      if (!p.name || !p.idNumber || !p.seatType) {
        setErrorModal('请完整填写乘客信息')
        return
      }
    }

    const payload = {
      trainNumber: train?.trainNumber || 'G1',
      date: searchParams?.date || '2024-10-20',
      from: searchParams?.from || '北京南',
      to: searchParams?.to || '上海虹桥',
      passengers
    }

    try {
      const res = await createOrder(payload)
      if (res?.success) {
        navigate('/my-orders')
      } else {
        setErrorModal(res?.message || '创建订单失败')
      }
    } catch (e) {
      setErrorModal(e?.toString?.() || '创建订单失败')
    }
  }

  return (
    <div className="booking-page">
      <div className="train-summary">
        <div className="summary-top">
          <div className="date">{searchParams?.date || '2024-10-20'}</div>
          <div className="train">{train?.trainNumber || 'G1'}次 {searchParams?.from || '北京南站'}（{train?.departureTime || '08:00'}开）→ {searchParams?.to || '上海虹桥'}（{train?.arrivalTime || '12:30'}到）</div>
        </div>
        <div className="seat-stats">
          {seatOptions.map(opt => (
            <div key={opt.key} className={`seat-stat ${opt.available > 0 ? 'available' : 'none'}`}>
              <span className="seat-name">{opt.label}</span>
              <span className="seat-price">¥{opt.price}</span>
              <span className="seat-available">{opt.available > 0 ? `${opt.available}张` : '无票'}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="passenger-section">
        <div className="section-title">乘客信息</div>
        {passengers.map((passenger, index) => (
          <div key={index} className="passenger-form">
            <div className="form-row">
              <div className="form-group narrow">
                <label>票种</label>
                <select className="ticket-type-select" disabled value="adult">
                  <option value="adult">成人票</option>
                </select>
              </div>
              <div className="form-group narrow">
                <label>席别</label>
                <select className="seat-select"
                  value={passenger.seatType}
                  onChange={(e) => handlePassengerChange(index, 'seatType', e.target.value)}
                >
                  {seatOptions.map(opt => (
                    <option key={opt.key} value={opt.value} disabled={opt.available <= 0}>
                      {opt.label}（¥{opt.price}）{opt.available <= 0 ? ' - 无票' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group large">
                <label>姓名</label>
                <input
                  type="text"
                  value={passenger.name}
                  onChange={(e) => handlePassengerChange(index, 'name', e.target.value)}
                  placeholder="请输入乘客姓名"
                  required
                />
              </div>
              <div className="form-group large">
                <label>证件类型</label>
                <select disabled value="idcard">
                  <option value="idcard">居民身份证</option>
                </select>
              </div>
              <div className="form-group xlarge">
                <label>证件号码</label>
                <input
                  type="text"
                  value={passenger.idNumber}
                  onChange={(e) => handlePassengerChange(index, 'idNumber', e.target.value)}
                  placeholder="请输入身份证号"
                  required
                />
              </div>
              {passengers.length > 1 && (
                <button type="button" onClick={() => removePassenger(index)} className="remove-passenger-btn">删除</button>
              )}
            </div>
          </div>
        ))}
        <div className="actions-row">
          <button type="button" onClick={addPassenger} className="add-passenger-btn">添加乘客</button>
        </div>
        <div className="tips-box">
          <div className="tips-title">温馨提示：</div>
          <ul>
            <li>实名制购票请填写乘车人真实姓名与身份证号。</li>
            <li>席别按余票情况选择，无票席别不可选。</li>
          </ul>
        </div>
      </div>

      <div className="booking-summary">
        <div className="total-price">总价：¥{totalPrice}</div>
        <div className="summary-actions">
          <button onClick={() => navigate(-1)} className="secondary-btn">上一步</button>
          <button onClick={handleSubmit} className="submit-order-btn">提交订单</button>
        </div>
      </div>
      {errorModal && (
        <div className="booking-modal-overlay" onClick={() => setErrorModal('')}>
          <div className="booking-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="booking-modal-title">提交失败</div>
            <div className="booking-modal-content">{errorModal}</div>
            <div className="booking-modal-actions">
              <button className="secondary-btn" onClick={() => setErrorModal('')}>我知道了</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BookingPage
