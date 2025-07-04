const timeago = require("timeago.js");

const daysLocale = (number, index, totalSec) => {
  // totalSec es el total de segundos
  const days = Math.round(totalSec / 60 / 60 / 24);
  return [`Venció hace ${days} días`, `Quedan ${days} días`];
};

// Registra tu localización personalizada
timeago.register("daysOnly", daysLocale);

const timeagoInstance = timeago();

const helpers = {};

helpers.timeago = (savedTimestamp) => {
  return timeagoInstance.format(savedTimestamp, "daysOnly");
};

helpers.formatCurrency = (value) => {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    minimumFractionDigits: 2,
  });

  return formatter.format(value);
};

helpers.formatNumber = (value) => {
  const formatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    minimumFractionDigits: 2,
  });

  return formatter.format(value);
};

helpers.formatTime = (value) => {
  const date = value ? new Date(value) : new Date();
  date.setHours(date.getHours() - 5);
  const options = {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };
  const formattedDate = date
    .toLocaleString("es-ES", options)
    .replace(",", " - ");

  return formattedDate;
};

helpers.formatDate = (value) => {
  const date = value ? new Date(value) : new Date();
  // date.setHours(date.getHours() - 5);
  const options = { year: "numeric", day: "2-digit", month: "2-digit" };
  const formattedDate = date
    .toLocaleDateString("es-ES", options)
    .replace(/\//g, "-");

  return formattedDate;
};

helpers.formatDateForInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return date.toISOString().split("T")[0]; // Returns date in YYYY-MM-DD format
};

module.exports = helpers;
