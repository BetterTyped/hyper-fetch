export const getGoogleSheetsData = async () => {
  const response = await fetch("https://docs.google.com/spreadsheets/d/1-234567890/export?format=csv");
  const data = await response.text();
  return data;
};
