const timeago = require('timeago.js');
const timeagoInstance = timeago();

const helpers = {};

helpers.timeago = (savedTimestamp) => {
    return timeagoInstance.format(savedTimestamp);
};

helpers.formatCurrency = value => {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    
      return formatter.format(value);
  }
  
  helpers.formatNumber = value => {
    const formatter = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    
      return formatter.format(value);
  }
  
  helpers.formatTime = value => {
    const date = value ? new Date(value) : new Date()
    date.setHours( date.getHours() - 5 )
    const options = { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit', hour12: true };
    const formattedDate = date.toLocaleString('es-ES', options).replace(',', ' - ');
  
    return formattedDate
  
  }

module.exports = helpers;