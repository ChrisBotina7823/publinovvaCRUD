const bcrypt = require('bcryptjs');

const helpers = {};

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

module.exports = helpers;
