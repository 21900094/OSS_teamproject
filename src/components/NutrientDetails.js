import axios from "axios";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const NutrientDetails = () => {
  const { foodCode } = useParams();
  const [nutrientDetails, setNutrientDetails] = useState([]);

  useEffect(() => {
    const fetchNutrientDetails = async () => {
      try {
        const response = await axios.get(
          `http://apis.data.go.kr/1390802/AgriFood/MzenFoodNutri/getKoreanFoodIdntList`,
          {
            params: {
              serviceKey: process.env.REACT_APP_API_KEY,
              food_Code: foodCode,
              pageNo: 1,
              numOfRows: 1,
            },
          }
        );

        const parser = new DOMParser();
        const xml = parser.parseFromString(response.data, "application/xml");
        const items = Array.from(xml.getElementsByTagName("item"));

        const data = items.map((item) => ({
          foodName: item.getElementsByTagName("food_Name")[0]?.textContent,
          energy: item.getElementsByTagName("energy_Qy")[0]?.textContent,
          protein: item.getElementsByTagName("prot_Qy")[0]?.textContent,
          carbohydrate: item
            .getElementsByTagName("carbohydrate_Qy")[0]
            ?.textContent,
        }));

        setNutrientDetails(data[0]);
      } catch (error) {
        console.error("Error fetching nutrient details:", error);
      }
    };

    fetchNutrientDetails();
  }, [foodCode]);

  return (
    <div style={{ padding: "20px" }}>
      <h1>영양소 상세 정보</h1>
      {nutrientDetails ? (
        <div>
          <p>음식 이름: {nutrientDetails.foodName}</p>
          <p>에너지: {nutrientDetails.energy} kcal</p>
          <p>단백질: {nutrientDetails.protein} g</p>
          <p>탄수화물: {nutrientDetails.carbohydrate} g</p>
        </div>
      ) : (
        <p>데이터를 불러오는 중입니다...</p>
      )}
    </div>
  );
};

export default NutrientDetails;