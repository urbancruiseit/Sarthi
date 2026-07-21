import axios from "axios";

const BASE_URL =
  process.env.ETIMEOFFICE_BASE_URL || "https://api.etimeoffice.com/api";

const getAuthHeader = () => {
  const corporateId = process.env.ETIMEOFFICE_CORPORATE_ID;
  const username = process.env.ETIMEOFFICE_USERNAME;
  const password = process.env.ETIMEOFFICE_PASSWORD;

  const raw = `${corporateId}:${username}:${password}:True`;
  const encoded = Buffer.from(raw).toString("base64");

  return `Basic ${encoded}`;
};

export const getLatestPunches = async (lastRecord) => {
  try {
    const response = await axios.get(`${BASE_URL}/DownloadLastPunchData`, {
      params: {
        Empcode: "ALL",
        LastRecord: lastRecord,
      },
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/json",
      },
    });

    const data = response.data;
    console.log(data);
    if (data.Error) {
      throw new Error(data.Msg || "etimeoffice API returned an error");
    }

    return data;
  } catch (err) {
    if (err.response) {
      // API ne HTTP error status diya (400/401/404/500)
      console.error(
        `[etimeoffice] API error ${err.response.status}:`,
        err.response.data,
      );
    } else {
      console.error("[etimeoffice] Request failed:", err.message);
    }
    throw err;
  }
};
