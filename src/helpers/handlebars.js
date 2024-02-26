const timeago = require('timeago.js');

timeago.register('daysOnly', (number, index, totalSec) => {
  const days = Math.round(totalSec / 60 / 60 / 24);
  return [`Venció hace ${days} días`, `Quedan ${days} días`];
});

// FORMAT UTILITIES

const timeagoFormat = (savedTimestamp) => {
  return timeago().format(savedTimestamp, 'daysOnly');
};

const formatCurrency = value => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return formatter.format(value);
}

const formatNumber = value => {
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return formatter.format(value);
}

const formatTime = value => {
  const date = value ? new Date(value) : new Date()
  date.setHours(date.getHours() - 5)
  const options = { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true };
  const formattedDate = date.toLocaleString('es-ES', options).replace(',', ' - ');

  return formattedDate

}

const formatDate = value => {
  const date = value ? new Date(value) : new Date()
  date.setHours(date.getHours() - 5)
  const options = { year: 'numeric', day: '2-digit', month: '2-digit' };
  const formattedDate = date.toLocaleDateString('es-ES', options).replace(/\//g, '-');

  return formattedDate
}


module.exports = {
  formatCurrency,
  formatDate,
  formatTime,
  formatNumber,
  timeagoFormat
};