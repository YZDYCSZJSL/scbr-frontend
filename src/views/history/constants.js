export const formatScore = (value) => {
  if (value === undefined || value === null || value === '') return '-'
  const num = Number(value)
  return Number.isFinite(num) ? num.toFixed(1) : '-'
}

export const toNumber = (value, defaultValue = 0) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : defaultValue
}
