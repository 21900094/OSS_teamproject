import axios from "axios";
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import React, { useCallback, useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  WiCloud,
  WiDaySunny,
  WiRain,
  WiSnow,
  WiThunderstorm,
} from "react-icons/wi";
import "./ShortTermForecast.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ShortTermForecast = () => {
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("cards");

  const toggleMode = () => setDarkMode(!darkMode);

  const skyMapping = {
    1: { label: "맑음", icon: <WiDaySunny size={32} /> },
    3: { label: "구름 많음", icon: <WiCloud size={32} /> },
    4: { label: "흐림", icon: <WiCloud size={32} /> },
  };

  const ptyMapping = {
    0: { label: "없음", icon: null },
    1: { label: "비", icon: <WiRain size={32} /> },
    2: { label: "비/눈", icon: <WiSnow size={32} /> },
    3: { label: "눈", icon: <WiSnow size={32} /> },
    4: { label: "소나기", icon: <WiThunderstorm size={32} /> },
  };

  const getBaseDateTime = () => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();

    if (minutes < 40) hours -= 1;

    const validHours = [2, 5, 8, 11, 14, 17, 20, 23];
    const baseTime = validHours.reduce((prev, curr) => (hours >= curr ? curr : prev), 23);
    if (hours < 2) now.setDate(now.getDate() - 1);

    const baseDate = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    return {
      date: baseDate,
      time: `${String(baseTime).padStart(2, "0")}00`,
    };
  };

  const fetchForecast = useCallback(async () => {
    setLoading(true);
    setError(null);
  
    const { date, time } = getBaseDateTime();
    const apiKey = process.env.REACT_APP_WEATHER_API_KEY;
    const endpoint = process.env.REACT_APP_WEATHER_API_ENDPOINT;
  
    const apiUrl = `${endpoint}/getUltraSrtFcst?serviceKey=${apiKey}&pageNo=1&numOfRows=60&dataType=JSON&base_date=${date}&base_time=${time}&nx=60&ny=127`;
  
    try {
      const response = await axios.get(apiUrl);
  
      console.log("API Response:", response.data); // API 응답 로깅
  
      if (response.data.response.body.items) {
        const items = response.data.response.body.items.item;
  
        console.log("Filtered Items:", items); // 필터링된 데이터 로깅
  
        const filteredItems = items.filter((item) => ["T1H", "POP", "SKY", "PTY"].includes(item.category));
        const groupedByTime = filteredItems.reduce((acc, item) => {
          if (!acc[item.fcstTime]) acc[item.fcstTime] = {};
          acc[item.fcstTime][item.category] = item.fcstValue;
          return acc;
        }, {});
  
        const parsedData = Object.entries(groupedByTime).map(([time, values]) => ({
          time: `${time.slice(0, 2)}:00`,
          temperature: parseFloat(values.T1H || "0"),
          rainProbability: parseFloat(values.POP || "0"),
          sky: skyMapping[values.SKY] || skyMapping[4],
          rainType: ptyMapping[values.PTY] || ptyMapping[0],
        }));
  
        console.log("Parsed Data:", parsedData); // 최종 데이터 로깅
  
        setForecast(parsedData);
        prepareChartData(parsedData);
        calculateSummary(parsedData);
      } else {
        setError("데이터를 가져올 수 없습니다.");
      }
    } catch (err) {
      console.error("Error fetching forecast:", err);
      setError("API 요청에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);
  

  const prepareChartData = (data) => {
    const labels = data.map((item) => item.time);
    const temperatures = data.map((item) => item.temperature);
    const rainProbabilities = data.map((item) => item.rainProbability);

    setChartData({
      labels,
      datasets: [
        {
          label: "온도 (°C)",
          data: temperatures,
          borderColor: "rgba(255, 99, 132, 1)",
          backgroundColor: "rgba(255, 99, 132, 0.2)",
        },
        {
          label: "강수 확률 (%)",
          data: rainProbabilities,
          borderColor: "rgba(54, 162, 235, 1)",
          backgroundColor: "rgba(54, 162, 235, 0.2)",
        },
      ],
    });
  };

  const calculateSummary = (data) => {
    const avgTemp = (data.reduce((sum, item) => sum + item.temperature, 0) / data.length).toFixed(1);
    const avgRainProb = (data.reduce((sum, item) => sum + item.rainProbability, 0) / data.length).toFixed(1);
    setSummary({ avgTemp, avgRainProb });
  };

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  const getChartOptions = (darkMode) => ({
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: darkMode ? "#ffffff" : "#000000",
        },
      },
      title: {
        display: true,
        text: "6시간 초단기 예보",
        color: darkMode ? "#ffffff" : "#000000",
      },
    },
    scales: {
      x: {
        ticks: {
          color: darkMode ? "#ffffff" : "#000000",
        },
        grid: {
          color: darkMode ? "#555555" : "#dddddd",
        },
      },
      y: {
        ticks: {
          color: darkMode ? "#ffffff" : "#000000",
        },
        grid: {
          color: darkMode ? "#555555" : "#dddddd",
        },
      },
    },
  });

  return (
    <div className={`short-term-forecast-container ${darkMode ? "dark-mode" : ""}`}>
      <button onClick={toggleMode} className="mode-toggle-button">
        {darkMode ? "🌞 라이트 모드" : "🌙 다크 모드"}
      </button>
      <h1 className="forecast-header">6시간 초단기 예보</h1>
      {summary && (
        <div className="forecast-summary">
          <p>평균 온도: {summary.avgTemp}°C</p>
          <p>평균 강수 확률: {summary.avgRainProb}%</p>
        </div>
      )}
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
                  <h3>{item.time}</h3>
                  <p>온도: {item.temperature}°C</p>
                  <p>강수 확률: {item.rainProbability}%</p>
                  <p>하늘 상태: {item.sky.label} {item.sky.icon}</p>
                  <p>강수 형태: {item.rainType.label} {item.rainType.icon}</p>
                </div>
              ))}
            </div>
          ) : (
            chartData && <Line data={chartData} options={getChartOptions(darkMode)} />
          )}
        </>
      )}
    </div>
  );
};

export default ShortTermForecast;
