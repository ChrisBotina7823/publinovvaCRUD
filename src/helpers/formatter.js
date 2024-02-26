const hour = 60 * 60 * 1000
const utc_offset = 5 * hour

const formatDecimal = (number) => {
  if (number == '') return 0;
  let decimal = parseFloat(number.replace(/[^\d.]/g, ''))
  if (isNaN(decimal)) return 0;
  return decimal
}

const formatDate = (timestamp, offset = 0) => {
  return new Date(timestamp - utc_offset + offset)
}

const unformatDate = (date) => {
  let current_date = new Date()
  date = new Date(date)
  date.setHours(current_date.getHours() + 5)
  let year = date.getUTCFullYear();
  let month = (date.getUTCMonth() + 1).toString().padStart(2, '0'); // los meses empiezan desde 0 en JavaScript
  let day = date.getUTCDate().toString().padStart(2, '0');
  let hours = date.getUTCHours().toString().padStart(2, '0');
  let minutes = date.getUTCMinutes().toString().padStart(2, '0');
  let seconds = date.getUTCSeconds().toString().padStart(2, '0');
  let mysqlDatetime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`; // crea una cadena en el formato "YYYY-MM-DD hh:mm:ss"
  return mysqlDatetime
}

const calculateLastPay = (unformattedDate) => {
  let date = formatDate(unformattedDate)
  let year = date.getFullYear();
  let month = (date.getMonth() + 1).toString().padStart(2, '0'); // los meses empiezan desde 0 en JavaScript
  let day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

module.exports = {
  formatDate,
  formatDecimal,
  unformatDate,
  calculateLastPay
}
