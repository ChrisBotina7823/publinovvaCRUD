const bcrypt = require('bcryptjs');

const helpers = {};

const hour = 60*60*1000

const utc_offset = 5*hour

helpers.encryptPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  return hash;
};

helpers.matchPassword = async (password, savedPassword) => {
  try {
    return await bcrypt.compare(password, savedPassword);
  } catch (e) {
    console.log(e)
  }
};

helpers.formatDecimal = (number) => {
  console.log(`number is ${number}`)
  if(number == '') return 0;
  let decimal = parseFloat(number.replace(/[^\d.]/g, ''))
  // console.log(decimal == NaN)
  if(isNaN(decimal)) {
    // console.log(`Failed to parse ${number}`)
    return 0;
  }
  // console.log(decimal)
  return decimal
}

helpers.formatDate = (timestamp, offset = 0) => {
  // console.log(timestamp)
  return new Date(timestamp - utc_offset + offset )
}

helpers.unformatDate = (date) => {
  let current_date = new Date()
  date = new Date(date)
  date.setHours(current_date.getHours()+5)
  let year = date.getUTCFullYear();
  let month = (date.getUTCMonth() + 1).toString().padStart(2, '0'); // los meses empiezan desde 0 en JavaScript
  let day = date.getUTCDate().toString().padStart(2, '0');
  let hours = date.getUTCHours().toString().padStart(2, '0');
  let minutes = date.getUTCMinutes().toString().padStart(2, '0');
  let seconds = date.getUTCSeconds().toString().padStart(2, '0');

  let mysqlDatetime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`; // crea una cadena en el formato "YYYY-MM-DD hh:mm:ss"

  console.log(mysqlDatetime)

  return mysqlDatetime

}

module.exports = helpers;
