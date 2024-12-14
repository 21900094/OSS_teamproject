import axios from "axios";
import React, { useCallback, useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import "./ThreeDayForecast.css";

const ThreeDayForecast = () => {
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("cards"); // cards | chart

  // 날짜 포맷 변환 함수
  const parseDate = (rawDate) => {
    if (!rawDate || rawDate.length !== 8) return "날짜 정보 없음";
    return `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
  };

  // 오늘, 내일, 모레 날짜 계산
  const getThreeDays = () => {
    const now = new Date();
    return Array.from({ length: 3 }, (_, i) => {
      const date = new Date(now);
      date.setDate(now.getDate() + i);
      return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
    });
  };

  // 기준 시간 계산 함수
  const getBaseTime = () => {
    const now = new Date();
    const hours = now.getHours();

    if (hours >= 2 && hours < 5) return "0200";
    if (hours >= 5 && hours < 8) return "0500";
    if (hours >= 8 && hours < 11) return "0800";
    if (hours >= 11 && hours < 14) return "1100";
    if (hours >= 14 && hours < 17) return "1400";
    if (hours >= 17 && hours < 20) return "1700";
    if (hours >= 20 && hours < 23) return "2000";
    return "2300";
  };

  // 응답 데이터를 병합하는 함수
  const mergeResponses = (responses) => {
    const allItems = responses.flatMap((res) => res.data.response?.body?.items?.item || []);
    const groupedData = allItems.reduce((acc, item) => {
      const dateTimeKey = `${item.fcstDate}-${item.fcstTime}`;
      if (!acc[dateTimeKey]) {
        acc[dateTimeKey] = {
          date: parseDate(item.fcstDate),
          time: item.fcstTime.slice(0, 2) + ":00",
        };
      }
      acc[dateTimeKey][item.category] = item.fcstValue;
      return acc;
    }, {});
    return Object.entries(groupedData).map(([key, value]) => ({
      ...value,
      temperature: parseFloat(value.TMP) || 0,
      rainProbability: parseFloat(value.POP) || 0,
      sky: value.SKY || "-",
      rainType: value.PTY || "-",
    }));
  };

  // API 호출 함수
  const fetchForecast = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const dates = getThreeDays(); // 오늘, 내일, 모레 날짜 계산
      const baseTime = getBaseTime(); // 동적으로 기준 시간 설정
      const apiKey = process.env.REACT_APP_WEATHER_API_KEY;
      const apiUrl = `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst`;

      // 디버깅용 로그
      console.log("API 요청 URL:", apiUrl);
      console.log("API 요청 날짜:", dates);
      console.log("API 요청 시간:", baseTime);

      // 3일에 대한 API 요청 생성
      const requests = dates.map((baseDate) =>
        axios.get(apiUrl, {
          params: {
            serviceKey: apiKey,
            pageNo: 1,
            numOfRows: 200,
            dataType: "JSON",
            base_date: baseDate,
            base_time: baseTime,
            nx: 60,
            ny: 127,
          },
        })
      );

      // 모든 요청 처리
      const responses = await Promise.all(requests);
      const formattedData = mergeResponses(responses);
      setForecast(formattedData);
    } catch (err) {
      console.error("Error fetching forecast:", err);
      setError("날씨 데이터를 가져오는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  // 차트 데이터 생성
  const chartData = {
    labels: forecast.map((item) => `${item.date} ${item.time}`),
    datasets: [
      {
        label: "온도 (°C)",
        data: forecast.map((item) => item.temperature),
        borderColor: "rgba(75,192,192,1)",
        backgroundColor: "rgba(75,192,192,0.2)",
        tension: 0.3,
      },
      {
        label: "강수 확률 (%)",
        data: forecast.map((item) => item.rainProbability),
        borderColor: "rgba(54,162,235,1)",
        backgroundColor: "rgba(54,162,235,0.2)",
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="three-day-forecast-container">
      <h1 className="three-day-header">오늘 예보</h1>
      {loading ? (
        <p className="loading">로딩 중...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <>
          <div className="tabs">
            <button onClick={() => setActiveTab("cards")} className={activeTab === "cards" ? "active" : ""}>
              카드 보기
            </button>
            <button onClick={() => setActiveTab("chart")} className={activeTab === "chart" ? "active" : ""}>
              차트 보기
            </button>
          </div>
          {activeTab === "cards" ? (
            <div className="forecast-cards">
              {forecast.map((item, index) => (
                <div key={index} className="forecast-card">
                  <h3>{item.date}</h3>
                  <p>시간: {item.time}</p>
                  <p>온도: {item.temperature}°C</p>
                  <p>강수 확률: {item.rainProbability}%</p>
                  <p>하늘 상태: {item.sky}</p>
                  <p>강수 형태: {item.rainType}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="chart-container">
              <Line data={chartData} options={{ responsive: true, plugins: { legend: { position: "top" } } }} />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ThreeDayForecast;
