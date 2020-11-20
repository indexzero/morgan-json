
function integer(value) {
  const type = typeof value;

  if (type === 'string') {
    return parseInt(value, 10);
  }

  if (type !== 'number') {
    return null;
  }
  
  return value;
}

function float(value) {
  const type = typeof value;

  if (type === 'string') {
    return parseFloat(value);
  }

  if (type !== 'number') {
    return null;
  }
  
  return value;
}

module.exports = {
  integer,
  float
}
