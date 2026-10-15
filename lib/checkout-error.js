export function getCheckoutFailure(error, fallback) {
  const message = typeof error?.message === 'string' ? error.message : ''
  if (/^Failed query:/i.test(message)) {
    return { message: '暂时无法处理结账，请稍后重试。', status: 500, internal: true }
  }

  return {
    message: message || fallback,
    status: Number(error?.status) || 400,
    internal: false,
  }
}
