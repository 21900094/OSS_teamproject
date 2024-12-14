import axios from "axios";
import React, { useEffect, useState } from "react";
import "./RealTimeWeather.css";

const RealTimeWeather = () => {
  const [forecast, setForecast] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [calculatedTime, setCalculatedTime] = useState("");
  const [warning, setWarning] = useState("");

  const categoryMapping = {
    TMP: "온도 (°C)",
    UUU: "동서바람 성분 (m/s)",
    VVV: "남북바람 성분 (m/s)",
    VEC: "풍향 (deg)",
    WSD: "풍속 (m/s)",
    SKY: "하늘 상태",
    PTY: "강수 형태",
    POP: "강수 확률 (%)",
    PCP: "강수량 (mm)",
  };

  const skyMapping = {
    1: "맑음",
    3: "구름 많음",
    4: "흐림",
  };

  const ptyMapping = {
    0: "없음",
    1: "비",
    2: "비/눈",
    3: "눈",
    4: "소나기",
  };

  // 가장 가까운 base_time 계산
  const getClosestBaseTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = now.getHours();
    const minutes = now.getMinutes();

    // 제공 가능한 base_time 목록
    const baseTimes = [2, 5, 8, 11, 14, 17, 20, 23];
    let closestBaseTime = baseTimes.reduce((prev, curr) => (hours >= curr ? curr : prev), 23);

    // base_time이 미래일 경우 이전 날짜로 설정
    if (hours < 2 || (hours === 2 && minutes < 30)) {
      closestBaseTime = 23;
      now.setDate(now.getDate() - 1);
    }

    const baseTime = String(closestBaseTime).padStart(2, "0") + "00";
    const baseDate = `${year}${month}${day}`;
    return { baseDate, baseTime };
  };

  useEffect(() => {
    const { baseDate, baseTime } = getClosestBaseTime();
    setDate(baseDate);
    setTime(baseTime);
    setCalculatedTime(`발표 기준 시간: ${baseDate} ${baseTime}`);
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setWarning("");

    const apiKey = process.env.REACT_APP_WEATHER_API_KEY;
    const endpoint = process.env.REACT_APP_WEATHER_API_ENDPOINT;
    const apiUrl = `${endpoint}/getVilageFcst?serviceKey=${apiKey}&pageNo=1&numOfRows=200&dataType=JSON&base_date=${date}&base_time=${time}&nx=60&ny=127`;

    try {
      const response = await axios.get(apiUrl);
      const data = response.data.response.body.items.item;

      if (!data || !data.length) {
        setWarning("현재 입력한 시간대는 조회할 수 없는 시간입니다. 가까운 시간대로 다시 시도해보세요.");
        setForecast({});
      } else {
        // 데이터를 category별로 그룹화
        const groupedData = data.reduce((acc, item) => {
          const category = item.category;
          acc[category] = {
            value: item.fcstValue,
            date: item.fcstDate,
            time: item.fcstTime,
          };
          return acc;
        }, {});
        setForecast(groupedData);
      }
    } catch (err) {
      setError("날씨 데이터를 가져오는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="weather-container">
      <h1 className="title">🌤️ 실시간 날씨 정보</h1>
      <button className="home-button">
        <a href="/">메인 페이지로 이동</a>
      </button>
      <div className="form-container">
        <label>
          날짜 (YYYYMMDD):
          <input
            type="text"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            placeholder="예: 20241212"
          />
        </label>
        <label>
          시간 (HHMM):
          <input
            type="text"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            placeholder="예: 1200"
          />
        </label>
        <button onClick={handleSearch} disabled={loading} className="search-button">
          조회
        </button>
      </div>
      {calculatedTime && <p className="info">{calculatedTime}</p>}
      {warning && <p className="warning">{warning}</p>}
      {loading && <p className="loading">Loading...</p>}
      {error && <p className="error">{error}</p>}
      <div className="forecast-grid">
        {Object.entries(forecast).map(([key, item], index) => {
          let value = item.value;

          if (key === "SKY") {
            value = skyMapping[item.value] || "알 수 없음";
          } else if (key === "PTY") {
            value = ptyMapping[item.value] || "알 수 없음";
          }

          return (
            <div key={index} className="forecast-card">
              <h3>{categoryMapping[key] || key}</h3>
              <p>
                <strong>{value}</strong>
              </p>
              <p>
                ({item.date} {item.time})
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RealTimeWeather;
